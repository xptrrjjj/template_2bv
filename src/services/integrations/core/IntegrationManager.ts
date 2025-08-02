import {
  IntegrationCredentials,
  IntegrationMetadata,
  ProviderConfig,
  HealthCheckResult,
  ExternalOptions,
  PublishResult,
} from "@/types/integrations";
import { BaseIntegration } from "./BaseIntegration";
import { EncryptionService } from "../utils/EncryptionService";
import { apiClient } from "@/services/api";

/**
 * Registry entry for integration providers
 */
interface ProviderRegistryEntry {
  config: ProviderConfig;
  integrationClass: new (providerId: string, config: ProviderConfig) => BaseIntegration;
  instance?: BaseIntegration;
}

/**
 * Integration Manager handles provider registry, instance management, and credential operations
 */
export class IntegrationManager {
  private static instance: IntegrationManager;
  private providers: Map<string, ProviderRegistryEntry> = new Map();
  private integrationInstances: Map<string, BaseIntegration> = new Map();
  private encryptionService: EncryptionService;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  /**
   * Get singleton instance of IntegrationManager
   */
  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  /**
   * Register a provider with the integration manager
   * @param config - Provider configuration
   * @param integrationClass - Integration class constructor
   */
  public registerProvider(
    config: ProviderConfig,
    integrationClass: new (providerId: string, config: ProviderConfig) => BaseIntegration
  ): void {
    if (this.providers.has(config.id)) {
      throw new Error(`Provider ${config.id} is already registered`);
    }

    this.providers.set(config.id, {
      config,
      integrationClass,
    });

    console.log(`Provider ${config.id} (${config.displayName}) registered successfully`);
  }

  /**
   * Unregister a provider
   * @param providerId - Provider ID to unregister
   */
  public unregisterProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} is not registered`);
    }

    // Clean up instance if it exists
    if (this.integrationInstances.has(providerId)) {
      this.integrationInstances.delete(providerId);
    }

    this.providers.delete(providerId);
    console.log(`Provider ${providerId} unregistered successfully`);
  }

  /**
   * Get all registered providers
   */
  public getRegisteredProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).map((entry) => entry.config);
  }

  /**
   * Get active providers only
   */
  public getActiveProviders(): ProviderConfig[] {
    return this.getRegisteredProviders().filter((config) => config.isActive);
  }

  /**
   * Get provider configuration by ID
   */
  public getProviderConfig(providerId: string): ProviderConfig | null {
    const entry = this.providers.get(providerId);
    return entry ? entry.config : null;
  }

  /**
   * Get integration instance for a provider
   * Creates a new instance if it doesn't exist
   */
  public getIntegration(providerId: string): BaseIntegration {
    // Return existing instance if available
    if (this.integrationInstances.has(providerId)) {
      return this.integrationInstances.get(providerId)!;
    }

    // Get provider registry entry
    const entry = this.providers.get(providerId);
    if (!entry) {
      throw new Error(`Provider ${providerId} is not registered`);
    }

    if (!entry.config.isActive) {
      throw new Error(`Provider ${providerId} is not active`);
    }

    // Create new instance
    const integration = new entry.integrationClass(providerId, entry.config);
    this.integrationInstances.set(providerId, integration);

    return integration;
  }

  /**
   * Store encrypted credentials for a user and provider
   */
  public async storeCredentials(
    providerId: string,
    userId: string,
    appId: string,
    credentialsData: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<IntegrationCredentials> {
    try {
      const provider = this.getProviderConfig(providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }

      // Encrypt the credentials
      const encryptedData = this.encryptionService.encryptObject(credentialsData);

      // Create credentials record
      const credentials: IntegrationCredentials = {
        id: this.generateCredentialsId(providerId, userId, appId),
        providerId,
        userId,
        appId,
        encryptedData,
        metadata: metadata || {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in datastore
      await apiClient.createRecord("integration_credentials", {
        ...credentials,
        record_id: credentials.id,
      });

      console.log(`Credentials stored for provider ${providerId}, user ${userId}`);
      return credentials;
    } catch (error) {
      console.error("Failed to store credentials:", error);
      throw error;
    }
  }

  /**
   * Retrieve credentials for a user and provider
   */
  public async getCredentials(
    providerId: string,
    userId: string,
    appId: string
  ): Promise<IntegrationCredentials | null> {
    try {
      const credentialsId = this.generateCredentialsId(providerId, userId, appId);
      const response = await apiClient.getRecords("integration_credentials", {
        record_id: credentialsId,
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const credentialsData = response.data[0] as Record<string, unknown>;

      // Map datastore record to credentials interface
      const credentials: IntegrationCredentials = {
        id: credentialsData.record_id as string,
        providerId: credentialsData.providerId as string,
        userId: credentialsData.userId as string,
        appId: credentialsData.appId as string,
        encryptedData: credentialsData.encryptedData as string,
        metadata: (credentialsData.metadata as Record<string, unknown>) || {},
        isActive: credentialsData.isActive as boolean,
        expiresAt: credentialsData.expiresAt as string | undefined,
        refreshToken: credentialsData.refreshToken as string | undefined,
        createdAt: credentialsData.createdAt as string,
        updatedAt: credentialsData.updatedAt as string,
      };

      return credentials;
    } catch (error) {
      console.error("Failed to retrieve credentials:", error);
      return null;
    }
  }

  /**
   * Update existing credentials
   */
  public async updateCredentials(
    credentialsId: string,
    updates: Partial<
      Omit<IntegrationCredentials, "id" | "providerId" | "userId" | "appId" | "createdAt">
    >
  ): Promise<IntegrationCredentials> {
    try {
      // Get existing credentials
      const response = await apiClient.getRecords("integration_credentials", {
        record_id: credentialsId,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`Credentials ${credentialsId} not found`);
      }

      const existing = response.data[0] as Record<string, unknown>;

      // Prepare update data
      const updateData = {
        record_id: credentialsId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update in datastore
      await apiClient.updateRecord("integration_credentials", updateData);

      // Return updated credentials
      const updatedCredentials: IntegrationCredentials = {
        id: existing.record_id as string,
        providerId: existing.providerId as string,
        userId: existing.userId as string,
        appId: existing.appId as string,
        encryptedData: (updates.encryptedData || existing.encryptedData) as string,
        metadata: (updates.metadata || existing.metadata || {}) as Record<string, unknown>,
        isActive:
          updates.isActive !== undefined ? updates.isActive : (existing.isActive as boolean),
        expiresAt: updates.expiresAt || (existing.expiresAt as string | undefined),
        refreshToken: updates.refreshToken || (existing.refreshToken as string | undefined),
        createdAt: existing.createdAt as string,
        updatedAt: updateData.updatedAt,
      };

      console.log(`Credentials ${credentialsId} updated successfully`);
      return updatedCredentials;
    } catch (error) {
      console.error("Failed to update credentials:", error);
      throw error;
    }
  }

  /**
   * Delete credentials
   */
  public async deleteCredentials(credentialsId: string): Promise<void> {
    try {
      await apiClient.deleteRecord("integration_credentials", credentialsId);
      console.log(`Credentials ${credentialsId} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete credentials:", error);
      throw error;
    }
  }

  /**
   * Get all credentials for a user across all providers
   */
  public async getUserCredentials(
    userId: string,
    appId: string
  ): Promise<IntegrationCredentials[]> {
    try {
      const response = await apiClient.getRecords("integration_credentials", {
        userId,
        appId,
      });

      if (!response.data) {
        return [];
      }

      return response.data.map((data) => {
        const record = data as Record<string, unknown>;
        return {
          id: record.record_id as string,
          providerId: record.providerId as string,
          userId: record.userId as string,
          appId: record.appId as string,
          encryptedData: record.encryptedData as string,
          metadata: (record.metadata as Record<string, unknown>) || {},
          isActive: record.isActive as boolean,
          expiresAt: record.expiresAt as string | undefined,
          refreshToken: record.refreshToken as string | undefined,
          createdAt: record.createdAt as string,
          updatedAt: record.updatedAt as string,
        };
      });
    } catch (error) {
      console.error("Failed to get user credentials:", error);
      return [];
    }
  }

  /**
   * Check health of an integration
   */
  public async checkIntegrationHealth(
    providerId: string,
    userId: string,
    appId: string
  ): Promise<HealthCheckResult> {
    try {
      const integration = this.getIntegration(providerId);
      const credentials = await this.getCredentials(providerId, userId, appId);

      if (!credentials) {
        return {
          status: "unhealthy",
          message: "No credentials found",
          checks: [
            {
              name: "credentials_exist",
              status: "fail",
              message: "No credentials configured for this integration",
            },
          ],
          timestamp: new Date().toISOString(),
        };
      }

      return await integration.checkHealth(credentials);
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        checks: [
          {
            name: "integration_health",
            status: "fail",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch external options through an integration
   */
  public async fetchExternalOptions(
    providerId: string,
    userId: string,
    appId: string,
    optionType: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    try {
      const integration = this.getIntegration(providerId);
      const credentials = await this.getCredentials(providerId, userId, appId);

      if (!credentials) {
        throw new Error("No credentials found for this integration");
      }

      if (!credentials.isActive) {
        throw new Error("Integration credentials are inactive");
      }

      return await integration.fetchOptions(credentials, optionType, filters);
    } catch (error) {
      console.error(`Failed to fetch external options for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Publish an entity through an integration
   */
  public async publishEntity(
    providerId: string,
    userId: string,
    appId: string,
    entityType: string,
    entityData: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<PublishResult> {
    try {
      const integration = this.getIntegration(providerId);
      const credentials = await this.getCredentials(providerId, userId, appId);

      if (!credentials) {
        throw new Error("No credentials found for this integration");
      }

      if (!credentials.isActive) {
        throw new Error("Integration credentials are inactive");
      }

      const result = await integration.publishEntity(credentials, entityType, entityData, options);

      // Log the operation
      await this.logOperation(providerId, userId, "publish", entityType, result.success);

      return result;
    } catch (error) {
      console.error(`Failed to publish entity to ${providerId}:`, error);

      // Log the failed operation
      await this.logOperation(providerId, userId, "publish", entityType, false);

      throw error;
    }
  }

  /**
   * Refresh credentials using the integration's refresh method
   */
  public async refreshCredentials(
    providerId: string,
    userId: string,
    appId: string
  ): Promise<IntegrationCredentials> {
    try {
      const integration = this.getIntegration(providerId);
      const credentials = await this.getCredentials(providerId, userId, appId);

      if (!credentials) {
        throw new Error("No credentials found for this integration");
      }

      const refreshedCredentials = await integration.refreshToken(credentials);

      // Update the stored credentials
      await this.updateCredentials(credentials.id, {
        encryptedData: refreshedCredentials.encryptedData,
        expiresAt: refreshedCredentials.expiresAt,
        refreshToken: refreshedCredentials.refreshToken,
        metadata: refreshedCredentials.metadata,
      });

      console.log(`Credentials refreshed for provider ${providerId}, user ${userId}`);
      return refreshedCredentials;
    } catch (error) {
      console.error(`Failed to refresh credentials for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get integration metadata for all registered providers
   */
  public getIntegrationsMetadata(): IntegrationMetadata[] {
    return Array.from(this.providers.values()).map((entry) => {
      try {
        const integration = this.getIntegration(entry.config.id);
        return integration.getMetadata();
      } catch {
        // Return basic metadata if instance creation fails
        return {
          id: `${entry.config.id}-${Date.now()}`,
          providerId: entry.config.id,
          name: entry.config.displayName,
          description: entry.config.description,
          version: entry.config.version,
          status: entry.config.isActive ? "active" : "inactive",
          configuration: entry.config.authConfig,
          rateLimits: entry.config.rateLimits,
          features: entry.config.features,
          supportedEntityTypes: entry.config.supportedEntityTypes,
          webhookSupport: entry.config.webhookSupport,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });
  }

  /**
   * Check if provider supports a specific feature
   */
  public supportsFeature(providerId: string, feature: string): boolean {
    const config = this.getProviderConfig(providerId);
    return config ? config.features.includes(feature) : false;
  }

  /**
   * Check if provider supports a specific entity type
   */
  public supportsEntityType(providerId: string, entityType: string): boolean {
    const config = this.getProviderConfig(providerId);
    return config ? config.supportedEntityTypes.includes(entityType) : false;
  }

  /**
   * Generate a unique credentials ID
   */
  private generateCredentialsId(providerId: string, userId: string, appId: string): string {
    const combined = `${providerId}_${userId}_${appId}`;
    return this.encryptionService.hashValue(combined).replace(/[+/=]/g, "").substring(0, 32);
  }

  /**
   * Log integration operation for audit purposes
   */
  private async logOperation(
    providerId: string,
    userId: string,
    operation: string,
    entityType: string,
    success: boolean
  ): Promise<void> {
    try {
      const logEntry = {
        record_id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerId,
        userId,
        operation,
        entityType,
        success,
        timestamp: new Date().toISOString(),
      };

      await apiClient.createRecord("integration_audit_logs", logEntry);
    } catch (error) {
      console.error("Failed to log integration operation:", error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get system health status across all integrations
   */
  public async getSystemHealth(): Promise<{
    healthy: boolean;
    totalProviders: number;
    activeProviders: number;
    unhealthyProviders: string[];
    lastChecked: string;
  }> {
    const providers = this.getRegisteredProviders();
    const activeProviders = providers.filter((p) => p.isActive);
    const unhealthyProviders: string[] = [];

    // For system health, we only check if providers are registered and active
    // Individual user health checks should be done separately
    for (const provider of activeProviders) {
      try {
        this.getIntegration(provider.id);
      } catch {
        unhealthyProviders.push(provider.id);
      }
    }

    return {
      healthy: unhealthyProviders.length === 0,
      totalProviders: providers.length,
      activeProviders: activeProviders.length,
      unhealthyProviders,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Clean up inactive integration instances
   */
  public cleanupInstances(): void {
    const activeProviderIds = this.getActiveProviders().map((p) => p.id);

    for (const providerId of this.integrationInstances.keys()) {
      if (!activeProviderIds.includes(providerId)) {
        this.integrationInstances.delete(providerId);
        console.log(`Cleaned up inactive integration instance: ${providerId}`);
      }
    }
  }
}
