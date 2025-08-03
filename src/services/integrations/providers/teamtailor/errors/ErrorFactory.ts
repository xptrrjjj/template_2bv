import { IntegrationError } from "@/types/integrations";

/**
 * Error Factory for TeamTailor Integration
 * Centralized error creation following DRY principle
 */
export class ErrorFactory {
  private static readonly PROVIDER = "teamtailor";

  /**
   * Create a rate limit error
   */
  static createRateLimitError(retryAfter: number): IntegrationError {
    return {
      name: "RateLimitError",
      message: `Rate limit exceeded. Retry after ${retryAfter}ms`,
      type: "rate_limit_error",
      retryable: true,
      metadata: {
        provider: this.PROVIDER,
        retryAfter,
      },
    };
  }

  /**
   * Create an authentication error
   */
  static createAuthenticationError(message: string): IntegrationError {
    return {
      name: "AuthenticationError",
      message,
      type: "authentication_error",
      retryable: false,
      metadata: {
        provider: this.PROVIDER,
      },
    };
  }

  /**
   * Create a validation error
   */
  static createValidationError(message: string, details?: unknown): IntegrationError {
    return {
      name: "ValidationError",
      message,
      type: "validation_error",
      retryable: false,
      metadata: {
        provider: this.PROVIDER,
        ...(details ? { details } : {}),
      },
    };
  }

  /**
   * Create a provider error
   */
  static createProviderError(
    operation: string,
    error: unknown,
    retryable: boolean = true
  ): IntegrationError {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return {
      name: "ProviderError",
      message: `TeamTailor ${operation} failed: ${message}`,
      type: "provider_error",
      retryable,
      metadata: {
        provider: this.PROVIDER,
        operation,
      },
    };
  }

  /**
   * Create a transformation error
   */
  static createTransformationError(
    operation: string,
    error: unknown
  ): IntegrationError {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return {
      name: "TransformationError",
      message: `Data transformation failed (${operation}): ${message}`,
      type: "transformation_error",
      retryable: false,
      metadata: {
        provider: this.PROVIDER,
        operation,
      },
    };
  }

  /**
   * Create an options error
   */
  static createOptionsError(
    optionType: string,
    error: unknown,
    endpoint?: string
  ): IntegrationError {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return {
      name: "OptionsError",
      message: `Failed to fetch ${optionType} from TeamTailor: ${message}`,
      type: "provider_error",
      retryable: true,
      metadata: {
        provider: this.PROVIDER,
        optionType,
        ...(endpoint && { endpoint }),
      },
    };
  }

  /**
   * Create a publish error
   */
  static createPublishError(
    operation: string,
    error: unknown,
    endpoint?: string
  ): IntegrationError {
    const message = error instanceof Error ? error.message : "Unknown error";
    const retryable = !this.isNonRetryableError(error);
    
    return {
      name: "PublishError",
      message: `TeamTailor ${operation} failed: ${message}`,
      type: "provider_error",
      retryable,
      metadata: {
        provider: this.PROVIDER,
        operation,
        ...(endpoint && { endpoint }),
      },
    };
  }

  /**
   * Check if error is non-retryable
   */
  private static isNonRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const nonRetryableMessages = [
      "authentication failed",
      "Insufficient permissions",
      "Validation error",
      "not found",
    ];
    
    return nonRetryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
}