import { TeamTailorApiClient } from "../api/TeamTailorApiClient";
import { ErrorFactory } from "../errors/ErrorFactory";
import { TEAMTAILOR_API_CONFIG } from "../constants";

/**
 * Base Service for TeamTailor Integration
 * Provides common functionality for all services (DRY principle)
 */
export abstract class BaseService {
  protected readonly apiClient: TeamTailorApiClient;
  protected readonly defaultTimeout: number;

  constructor(
    apiClient?: TeamTailorApiClient,
    defaultTimeout?: number
  ) {
    this.apiClient = apiClient || new TeamTailorApiClient();
    this.defaultTimeout = defaultTimeout || TEAMTAILOR_API_CONFIG.TIMEOUT.DEFAULT;
  }

  /**
   * Execute an API operation with error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      throw ErrorFactory.createProviderError(operation, error);
    }
  }

  /**
   * Validate API key
   */
  protected validateApiKey(apiKey: string | undefined): asserts apiKey is string {
    if (!apiKey) {
      throw ErrorFactory.createAuthenticationError("API key not found in credentials");
    }
  }
}