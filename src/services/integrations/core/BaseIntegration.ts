import {
  IntegrationCredentials,
  ExternalOptions,
  PublishResult,
  IntegrationMetadata,
  IntegrationError,
  IntegrationErrorClass,
  IntegrationErrorType,
  RateLimitConfig,
  HealthCheckResult,
  TransformationRule,
  ProviderConfig,
} from "@/types/integrations";
import { EncryptionService } from "../utils/EncryptionService";

/**
 * Rate limiter for managing API request rates
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed based on rate limits
   * @param key - Unique key for rate limiting (e.g., user ID, IP address)
   * @returns True if request is allowed
   */
  public isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key)!;

    // Remove expired requests
    const validRequests = userRequests.filter((timestamp) => timestamp > windowStart);
    this.requests.set(key, validRequests);

    // Check if under limit
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Record this request
    validRequests.push(now);
    return true;
  }

  /**
   * Get remaining requests in current window
   * @param key - Unique key for rate limiting
   * @returns Number of remaining requests
   */
  public getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(key)) {
      return this.config.maxRequests;
    }

    const userRequests = this.requests.get(key)!;
    const validRequests = userRequests.filter((timestamp) => timestamp > windowStart);

    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  /**
   * Get time until next request is allowed
   * @param key - Unique key for rate limiting
   * @returns Milliseconds until next request is allowed, or 0 if allowed now
   */
  public getRetryAfter(key: string): number {
    if (this.isAllowed(key)) {
      return 0;
    }

    const userRequests = this.requests.get(key)!;
    if (userRequests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...userRequests);
    return Math.max(0, oldestRequest + this.config.windowMs - Date.now());
  }
}

/**
 * Abstract base class for all integration providers
 * Provides common functionality for authentication, rate limiting, error handling, and data transformation
 */
export abstract class BaseIntegration {
  protected readonly providerId: string;
  protected readonly config: ProviderConfig;
  protected readonly encryptionService: EncryptionService;
  protected readonly rateLimiter: RateLimiter;
  protected transformationRules: Map<string, TransformationRule> = new Map();

  constructor(providerId: string, config: ProviderConfig) {
    this.providerId = providerId;
    this.config = config;
    this.encryptionService = EncryptionService.getInstance();
    this.rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: config.rateLimits.requestsPerMinute,
      strategy: "sliding_window",
      skipWhenLimited: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });
  }

  /**
   * Abstract method to fetch external options (e.g., departments, locations, job boards)
   * Must be implemented by each integration provider
   */
  public abstract fetchOptions(
    credentials: IntegrationCredentials,
    optionType: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]>;

  /**
   * Abstract method to publish an entity to the external system
   * Must be implemented by each integration provider
   */
  public abstract publishEntity(
    credentials: IntegrationCredentials,
    entityType: string,
    entityData: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<PublishResult>;

  /**
   * Abstract method to refresh authentication tokens
   * Must be implemented by each integration provider
   */
  public abstract refreshToken(
    credentials: IntegrationCredentials
  ): Promise<IntegrationCredentials>;

  /**
   * Get provider configuration
   */
  public getConfig(): ProviderConfig {
    return { ...this.config };
  }

  /**
   * Get provider metadata
   */
  public getMetadata(): IntegrationMetadata {
    return {
      id: `${this.providerId}-${Date.now()}`,
      providerId: this.providerId,
      name: this.config.displayName,
      description: this.config.description,
      version: this.config.version,
      status: this.config.isActive ? "active" : "inactive",
      configuration: this.config.authConfig,
      rateLimits: this.config.rateLimits,
      features: this.config.features,
      supportedEntityTypes: this.config.supportedEntityTypes,
      webhookSupport: this.config.webhookSupport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check connection status and health of the integration
   */
  public async checkHealth(credentials: IntegrationCredentials): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult["checks"] = [];

    try {
      // Check credentials encryption
      checks.push(await this.checkCredentialsHealth(credentials));

      // Check rate limiting
      checks.push(this.checkRateLimitHealth(credentials.userId));

      // Check connection to external service
      checks.push(await this.checkConnectionHealth(credentials));

      const responseTime = Date.now() - startTime;
      const failedChecks = checks.filter((check) => check.status === "fail");
      const warnChecks = checks.filter((check) => check.status === "warn");

      let status: HealthCheckResult["status"] = "healthy";
      if (failedChecks.length > 0) {
        status = "unhealthy";
      } else if (warnChecks.length > 0) {
        status = "degraded";
      }

      return {
        status,
        responseTime,
        checks,
        timestamp: new Date().toISOString(),
        message:
          status === "healthy"
            ? "All checks passed"
            : `${failedChecks.length} failed, ${warnChecks.length} warnings`,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        checks: [
          ...checks,
          {
            name: "health_check_execution",
            status: "fail",
            message: error instanceof Error ? error.message : "Unknown error",
            duration: Date.now() - startTime,
          },
        ],
        timestamp: new Date().toISOString(),
        message: "Health check failed to execute",
      };
    }
  }

  /**
   * Check if credentials are valid and properly encrypted
   */
  protected async checkCredentialsHealth(
    credentials: IntegrationCredentials
  ): Promise<HealthCheckResult["checks"][0]> {
    const startTime = Date.now();

    try {
      // Verify credentials are not expired
      if (credentials.expiresAt) {
        const expiresAt = new Date(credentials.expiresAt);
        if (expiresAt <= new Date()) {
          return {
            name: "credentials_expiry",
            status: "fail",
            message: "Credentials have expired",
            duration: Date.now() - startTime,
          };
        }

        // Warn if expiring soon (within 24 hours)
        const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilExpiry < 24) {
          return {
            name: "credentials_expiry",
            status: "warn",
            message: `Credentials expire in ${Math.round(hoursUntilExpiry)} hours`,
            duration: Date.now() - startTime,
          };
        }
      }

      // Verify encryption integrity
      try {
        this.decryptCredentials(credentials);
      } catch {
        return {
          name: "credentials_encryption",
          status: "fail",
          message: "Failed to decrypt credentials",
          duration: Date.now() - startTime,
        };
      }

      return {
        name: "credentials_validation",
        status: "pass",
        message: "Credentials are valid and properly encrypted",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: "credentials_validation",
        status: "fail",
        message: error instanceof Error ? error.message : "Unknown credentials error",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check rate limiting status
   */
  protected checkRateLimitHealth(userId: string): HealthCheckResult["checks"][0] {
    const startTime = Date.now();

    try {
      const remaining = this.rateLimiter.getRemainingRequests(userId);
      const total = this.config.rateLimits.requestsPerMinute;
      const usagePercent = ((total - remaining) / total) * 100;

      let status: "pass" | "warn" | "fail" = "pass";
      let message = `${remaining}/${total} requests remaining`;

      if (remaining === 0) {
        status = "fail";
        message = "Rate limit exceeded";
      } else if (usagePercent > 80) {
        status = "warn";
        message = `High usage: ${Math.round(usagePercent)}% of rate limit used`;
      }

      return {
        name: "rate_limiting",
        status,
        message,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: "rate_limiting",
        status: "fail",
        message: error instanceof Error ? error.message : "Rate limit check failed",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check connection to external service
   * Can be overridden by specific integrations for custom health checks
   */
  protected async checkConnectionHealth(
    credentials: IntegrationCredentials
  ): Promise<HealthCheckResult["checks"][0]> {
    const startTime = Date.now();

    try {
      // Default implementation: try to fetch a simple option to test connectivity
      await this.fetchOptions(credentials, "health_check", { limit: 1 });

      return {
        name: "external_connection",
        status: "pass",
        message: "Successfully connected to external service",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const integrationError = error as IntegrationError;
      let status: "fail" | "warn" = "fail";

      // Some errors might be warnings rather than failures
      if (integrationError.type === "rate_limit_error") {
        status = "warn";
      }

      return {
        name: "external_connection",
        status,
        message: integrationError.message || "Connection test failed",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Decrypt credentials data
   */
  protected decryptCredentials<T = Record<string, unknown>>(
    credentials: IntegrationCredentials
  ): T {
    try {
      return this.encryptionService.decryptObject<T>(credentials.encryptedData);
    } catch {
      throw this.createIntegrationError(
        "authentication_error",
        "Failed to decrypt credentials",
        false,
        { credentialsId: credentials.id }
      );
    }
  }

  /**
   * Encrypt credentials data
   */
  protected encryptCredentials(data: Record<string, unknown>): string {
    try {
      return this.encryptionService.encryptObject(data);
    } catch {
      throw this.createIntegrationError(
        "configuration_error",
        "Failed to encrypt credentials",
        false,
        { operation: "encrypt_credentials" }
      );
    }
  }

  /**
   * Check rate limits before making requests
   */
  protected checkRateLimit(userId: string): void {
    if (!this.rateLimiter.isAllowed(userId)) {
      const retryAfter = this.rateLimiter.getRetryAfter(userId);
      throw this.createIntegrationError(
        "rate_limit_error",
        `Rate limit exceeded. Retry after ${retryAfter}ms`,
        true,
        { retryAfter, userId }
      );
    }
  }

  /**
   * Transform data using configured transformation rules
   */
  protected transformData(
    data: Record<string, unknown>,
    entityType: string,
    direction: "inbound" | "outbound" = "outbound"
  ): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const rule of this.transformationRules.values()) {
      const ruleId = rule.id;
      if (!ruleId.startsWith(`${entityType}_${direction}_`)) {
        continue;
      }

      try {
        const sourceValue = this.getNestedValue(data, rule.sourceField);
        const transformedValue = this.applyTransformation(sourceValue, rule);

        if (transformedValue !== undefined) {
          this.setNestedValue(transformed, rule.targetField, transformedValue);
        } else if (rule.isRequired && rule.defaultValue !== undefined) {
          this.setNestedValue(transformed, rule.targetField, rule.defaultValue);
        }
      } catch (error) {
        if (rule.isRequired) {
          throw this.createIntegrationError(
            "transformation_error",
            `Required field transformation failed: ${rule.targetField}`,
            false,
            {
              rule: rule.id,
              sourceField: rule.sourceField,
              error: error instanceof Error ? error.message : "Unknown error",
            }
          );
        }
        // Continue with optional field transformation failures
      }
    }

    return { ...data, ...transformed };
  }

  /**
   * Apply a single transformation rule to a value
   */
  private applyTransformation(value: unknown, rule: TransformationRule): unknown {
    if (value === null || value === undefined) {
      return rule.defaultValue;
    }

    switch (rule.transformationType) {
      case "direct":
        return value;

      case "format":
        if (rule.transformationConfig.format && typeof value === "string") {
          // Simple string formatting - can be extended for more complex cases
          return rule.transformationConfig.format.toString().replace("{value}", value);
        }
        return value;

      case "lookup":
        if (rule.transformationConfig.lookupTable) {
          const lookupTable = rule.transformationConfig.lookupTable as Record<string, unknown>;
          return lookupTable[String(value)] || rule.defaultValue || value;
        }
        return value;

      case "compute":
        // Basic computed transformations - can be extended for more complex logic
        if (rule.transformationConfig.expression === "uppercase" && typeof value === "string") {
          return value.toUpperCase();
        }
        if (rule.transformationConfig.expression === "lowercase" && typeof value === "string") {
          return value.toLowerCase();
        }
        return value;

      case "conditional":
        if (
          rule.transformationConfig.condition &&
          rule.transformationConfig.trueValue &&
          rule.transformationConfig.falseValue
        ) {
          // Simple condition evaluation - can be extended for more complex conditions
          const condition = rule.transformationConfig.condition as {
            field: string;
            operator: string;
            value: unknown;
          };
          const conditionResult = this.evaluateCondition(value, condition);
          return conditionResult
            ? rule.transformationConfig.trueValue
            : rule.transformationConfig.falseValue;
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Evaluate a simple condition
   */
  private evaluateCondition(
    value: unknown,
    condition: { field: string; operator: string; value: unknown }
  ): boolean {
    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return typeof value === "string" && value.includes(String(condition.value));
      case "not_contains":
        return typeof value === "string" && !value.includes(String(condition.value));
      case "greater_than":
        return (
          typeof value === "number" &&
          typeof condition.value === "number" &&
          value > condition.value
        );
      case "less_than":
        return (
          typeof value === "number" &&
          typeof condition.value === "number" &&
          value < condition.value
        );
      default:
        return false;
    }
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current: unknown, key: string) => {
      return current && typeof current === "object" && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }

  /**
   * Set a nested value in an object using dot notation
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;

    let current = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[lastKey] = value;
  }

  /**
   * Create a standardized integration error
   */
  protected createIntegrationError(
    type: IntegrationErrorType,
    message: string,
    retryable: boolean,
    metadata?: Record<string, unknown>
  ): IntegrationErrorClass {
    return new IntegrationErrorClass(message, type, retryable, {
      providerId: this.providerId,
      metadata: {
        timestamp: new Date().toISOString(),
        providerId: this.providerId,
        ...metadata,
      },
    });
  }

  /**
   * Add transformation rule
   */
  public addTransformationRule(rule: TransformationRule): void {
    this.transformationRules.set(rule.id, rule);
  }

  /**
   * Remove transformation rule
   */
  public removeTransformationRule(ruleId: string): void {
    this.transformationRules.delete(ruleId);
  }

  /**
   * Get all transformation rules
   */
  public getTransformationRules(): TransformationRule[] {
    return Array.from(this.transformationRules.values());
  }

  /**
   * Validate entity data against the provider's requirements
   */
  protected validateEntityData(entityType: string, data: Record<string, unknown>): void {
    // Basic validation - can be extended by specific integrations
    if (!entityType || typeof entityType !== "string") {
      throw this.createIntegrationError(
        "validation_error",
        "Entity type is required and must be a string",
        false,
        { entityType, data }
      );
    }

    if (!data || typeof data !== "object") {
      throw this.createIntegrationError(
        "validation_error",
        "Entity data is required and must be an object",
        false,
        { entityType, data }
      );
    }

    if (!this.config.supportedEntityTypes.includes(entityType)) {
      throw this.createIntegrationError(
        "validation_error",
        `Entity type '${entityType}' is not supported by this integration`,
        false,
        { entityType, supportedTypes: this.config.supportedEntityTypes }
      );
    }
  }

  /**
   * Make an HTTP request with proper error handling and rate limiting
   */
  protected async makeRequest<T>(
    credentials: IntegrationCredentials,
    method: string,
    endpoint: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    this.checkRateLimit(credentials.userId);

    const url = `${this.config.endpoints.base}${endpoint}`;
    const timeout = options.timeout || 30000;

    const decryptedCredentials = this.decryptCredentials(credentials);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `antd-recruiter-integration/${this.config.version}`,
          ...this.buildAuthHeaders(decryptedCredentials),
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.handleHttpError(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.createIntegrationError(
          "timeout_error",
          `Request timeout after ${timeout}ms`,
          true,
          { url, method, timeout }
        );
      }

      if (error instanceof IntegrationErrorClass) {
        throw error;
      }

      throw this.createIntegrationError(
        "network_error",
        `Network request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        true,
        { url, method, error: error instanceof Error ? error.message : "Unknown error" }
      );
    }
  }

  /**
   * Build authentication headers based on the provider's auth type
   */
  protected buildAuthHeaders(credentials: Record<string, unknown>): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.config.authType) {
      case "bearer":
        if (credentials.accessToken) {
          headers.Authorization = `Bearer ${credentials.accessToken}`;
        }
        break;

      case "api_key":
        if (credentials.apiKey) {
          headers[(this.config.authConfig.headerName as string) || "X-API-Key"] = String(
            credentials.apiKey
          );
        }
        break;

      case "basic":
        if (credentials.username && credentials.password) {
          const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString(
            "base64"
          );
          headers.Authorization = `Basic ${encoded}`;
        }
        break;

      case "oauth2":
        if (credentials.accessToken) {
          headers.Authorization = `Bearer ${credentials.accessToken}`;
        }
        break;
    }

    return headers;
  }

  /**
   * Handle HTTP errors and convert them to IntegrationErrors
   */
  protected async handleHttpError(response: Response): Promise<IntegrationErrorClass> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorType: IntegrationErrorType = "provider_error";
    let retryable = false;

    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    switch (response.status) {
      case 401:
        errorType = "authentication_error";
        retryable = false;
        break;
      case 403:
        errorType = "authorization_error";
        retryable = false;
        break;
      case 429:
        errorType = "rate_limit_error";
        retryable = true;
        break;
      case 400:
        errorType = "validation_error";
        retryable = false;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = "provider_error";
        retryable = true;
        break;
      default:
        errorType = "unknown_error";
        retryable = response.status >= 500;
    }

    return this.createIntegrationError(errorType, errorMessage, retryable, {
      statusCode: response.status,
      response: response.statusText,
    });
  }
}
