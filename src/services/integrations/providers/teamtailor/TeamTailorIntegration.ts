import {
  IntegrationCredentials,
  ExternalOptions,
  PublishResult,
  ProviderConfig,
  HealthCheckResult,
} from "@/types/integrations";
import { BaseIntegration } from "../../core/BaseIntegration";
import { TeamTailorOptionsService } from "./services/options/TeamTailorOptionsService";
import { TeamTailorPublishingService } from "./services/publishing/TeamTailorPublishingService";
import { TeamTailorMappingService } from "./services/mapping/TeamTailorMappingService";
import { ErrorFactory } from "./errors/ErrorFactory";
import { ERROR_MESSAGES, TEAMTAILOR_API_CONFIG } from "./constants";

/**
 * TeamTailor Integration Provider
 * Handles job posting, options fetching, and data synchronization with TeamTailor API
 */
export class TeamTailorIntegration extends BaseIntegration {
  private readonly optionsService: TeamTailorOptionsService;
  private readonly publishingService: TeamTailorPublishingService;
  private readonly mappingService: TeamTailorMappingService;

  constructor(providerId: string, config: ProviderConfig) {
    super(providerId, config);
    this.optionsService = new TeamTailorOptionsService();
    this.publishingService = new TeamTailorPublishingService();
    this.mappingService = new TeamTailorMappingService();
  }

  /**
   * Fetch external options from TeamTailor API
   */
  public async fetchOptions(
    credentials: IntegrationCredentials,
    optionType: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    try {
      // Check rate limits
      if (!this.rateLimiter.isAllowed(credentials.userId)) {
        const retryAfter = this.rateLimiter.getRetryAfter(credentials.userId);
        throw ErrorFactory.createRateLimitError(retryAfter);
      }

      // Decrypt API key
      const apiKey = await this.getApiKey(credentials);

      // Fetch options based on type
      switch (optionType) {
        case "departments":
          return await this.optionsService.fetchDepartments(apiKey, filters);
        case "locations":
          return await this.optionsService.fetchLocations(apiKey, filters);
        case "job-templates":
          return await this.optionsService.fetchJobTemplates(apiKey, filters);
        case "stages":
          return await this.optionsService.fetchHiringStages(apiKey, filters);
        case "all":
          return await this.optionsService.fetchAllOptions(apiKey, filters);
        default:
          throw ErrorFactory.createValidationError(
            ERROR_MESSAGES.UNSUPPORTED_OPTION_TYPE(optionType)
          );
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "IntegrationError") {
        throw error;
      }
      throw ErrorFactory.createProviderError(`fetchOptions:${optionType}`, error);
    }
  }

  /**
   * Publish an entity (role/job) to TeamTailor
   */
  public async publishEntity(
    credentials: IntegrationCredentials,
    entityType: string,
    entityData: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<PublishResult> {
    try {
      if (entityType !== "job") {
        throw ErrorFactory.createValidationError(
          ERROR_MESSAGES.UNSUPPORTED_ENTITY_TYPE(entityType)
        );
      }

      // Check rate limits
      if (!this.rateLimiter.isAllowed(credentials.userId)) {
        const retryAfter = this.rateLimiter.getRetryAfter(credentials.userId);
        throw ErrorFactory.createRateLimitError(retryAfter);
      }

      // Decrypt API key
      const apiKey = await this.getApiKey(credentials);

      // Transform data to TeamTailor format
      const transformedData = this.mappingService.transformRoleToTeamTailorJob(entityData, options);

      // Validate required fields
      this.mappingService.validateRequiredFields(transformedData);

      // Publish to TeamTailor
      const publishResult = await this.publishingService.publishJob(apiKey, transformedData, options);

      return {
        success: true,
        externalId: publishResult.externalId,
        externalUrl: publishResult.externalUrl,
        metadata: {
          ...publishResult.metadata,
          publishedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "IntegrationError") {
        throw error;
      }
      throw ErrorFactory.createProviderError("publishEntity", error);
    }
  }

  /**
   * Refresh authentication tokens (TeamTailor uses API keys, so this is a no-op)
   */
  public async refreshToken(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
    // TeamTailor uses API keys which don't expire, so return credentials unchanged
    return credentials;
  }

  /**
   * Perform health check on TeamTailor API connection
   */
  public async healthCheck(credentials: IntegrationCredentials): Promise<HealthCheckResult> {
    try {
      const apiKey = await this.getApiKey(credentials);

      // Test API connection by fetching a small amount of data
      const response = await fetch(
        `${TEAMTAILOR_API_CONFIG.BASE_URL}/departments?page[size]=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Token token=${apiKey}`,
            "X-Api-Version": TEAMTAILOR_API_CONFIG.API_VERSION,
            Accept: "application/vnd.api+json",
          },
        }
      );

      if (response.ok) {
        return {
          status: "healthy",
          message: "TeamTailor API connection successful",
          checks: [{
            name: "api_connection",
            status: "pass",
            message: "API connection successful"
          }],
          timestamp: new Date().toISOString(),
        };
      } else if (response.status === 401) {
        return {
          status: "unhealthy",
          message: ERROR_MESSAGES.INVALID_API_KEY,
          checks: [{
            name: "authentication",
            status: "fail",
            message: ERROR_MESSAGES.INVALID_API_KEY
          }],
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          status: "unhealthy",
          message: `TeamTailor API returned status ${response.status}`,
          checks: [{
            name: "api_response",
            status: "fail",
            message: `TeamTailor API returned status ${response.status}`
          }],
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        checks: [{
          name: "health_check",
          status: "fail",
          message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`
        }],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update a published job in TeamTailor
   */
  public async updateEntity(
    credentials: IntegrationCredentials,
    externalId: string,
    entityData: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<PublishResult> {
    try {
      // Check rate limits
      if (!this.rateLimiter.isAllowed(credentials.userId)) {
        const retryAfter = this.rateLimiter.getRetryAfter(credentials.userId);
        throw ErrorFactory.createRateLimitError(retryAfter);
      }

      // Decrypt API key
      const apiKey = await this.getApiKey(credentials);

      // Transform data to TeamTailor format
      const transformedData = this.mappingService.transformRoleToTeamTailorJob(entityData, options);

      // Update job in TeamTailor
      const updateResult = await this.publishingService.updateJob(
        apiKey,
        externalId,
        transformedData,
        options
      );

      return {
        success: true,
        externalId: updateResult.externalId,
        externalUrl: updateResult.externalUrl,
        metadata: {
          ...updateResult.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "IntegrationError") {
        throw error;
      }
      throw ErrorFactory.createProviderError("updateEntity", error);
    }
  }

  /**
   * Archive/unpublish a job in TeamTailor
   */
  public async archiveEntity(
    credentials: IntegrationCredentials,
    externalId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check rate limits
      if (!this.rateLimiter.isAllowed(credentials.userId)) {
        const retryAfter = this.rateLimiter.getRetryAfter(credentials.userId);
        throw ErrorFactory.createRateLimitError(retryAfter);
      }

      // Decrypt API key
      const apiKey = await this.getApiKey(credentials);

      // Archive job in TeamTailor
      await this.publishingService.archiveJob(apiKey, externalId);

      return {
        success: true,
        message: "Job successfully archived in TeamTailor",
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "IntegrationError") {
        throw error;
      }
      throw ErrorFactory.createProviderError("archiveEntity", error);
    }
  }

  /**
   * Get decrypted API key from credentials
   */
  private async getApiKey(credentials: IntegrationCredentials): Promise<string> {
    const decryptedCredentials = this.encryptionService.decryptObject(credentials.encryptedData);
    const apiKey = decryptedCredentials.apiKey as string;

    if (!apiKey) {
      throw ErrorFactory.createAuthenticationError(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
}