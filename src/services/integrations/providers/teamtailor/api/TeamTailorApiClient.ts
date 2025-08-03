import { TEAMTAILOR_API_CONFIG, ERROR_MESSAGES } from "../constants";

/**
 * TeamTailor API Client
 * Handles all HTTP communication with the TeamTailor API
 */
export class TeamTailorApiClient {
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly userAgent: string;

  constructor(
    baseUrl: string = TEAMTAILOR_API_CONFIG.BASE_URL,
    apiVersion: string = TEAMTAILOR_API_CONFIG.API_VERSION
  ) {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.userAgent = TEAMTAILOR_API_CONFIG.USER_AGENT;
  }

  /**
   * Make a GET request to the TeamTailor API
   */
  async get<T>(
    endpoint: string,
    apiKey: string,
    params?: Record<string, string>,
    timeout?: number
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const response = await this.makeRequest("GET", url, apiKey, undefined, timeout);
    return this.parseResponse<T>(response);
  }

  /**
   * Make a POST request to the TeamTailor API
   */
  async post<T>(
    endpoint: string,
    apiKey: string,
    data: unknown,
    timeout?: number
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await this.makeRequest("POST", url, apiKey, data, timeout);
    return this.parseResponse<T>(response);
  }

  /**
   * Make a PATCH request to the TeamTailor API
   */
  async patch<T>(
    endpoint: string,
    apiKey: string,
    data: unknown,
    timeout?: number
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await this.makeRequest("PATCH", url, apiKey, data, timeout);
    return this.parseResponse<T>(response);
  }

  /**
   * Make a DELETE request to the TeamTailor API
   */
  async delete(
    endpoint: string,
    apiKey: string,
    timeout?: number
  ): Promise<void> {
    const url = this.buildUrl(endpoint);
    const response = await this.makeRequest("DELETE", url, apiKey, undefined, timeout);
    
    if (!response.ok && response.status !== 404) {
      await this.handleApiError(response, "delete");
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value);
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    method: string,
    url: string,
    apiKey: string,
    data?: unknown,
    timeout: number = TEAMTAILOR_API_CONFIG.TIMEOUT.DEFAULT
  ): Promise<Response> {
    const config: RequestInit = {
      method,
      headers: this.getHeaders(apiKey),
      signal: AbortSignal.timeout(timeout),
    };

    if (data && (method === "POST" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    return fetch(url, config);
  }

  /**
   * Get request headers
   */
  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Token token=${apiKey}`,
      "X-Api-Version": this.apiVersion,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      "User-Agent": this.userAgent,
    };
  }

  /**
   * Parse API response
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      await this.handleApiError(response, "request");
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * Handle API error responses
   */
  private async handleApiError(response: Response, operation: string): Promise<never> {
    let errorMessage = `${operation} failed with status ${response.status}`;
    
    try {
      const errorData = await response.json();
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map((err: { detail?: string; title?: string }) => 
          err.detail || err.title || "Unknown error"
        );
        errorMessage = `${operation} failed: ${errorMessages.join(", ")}`;
      }
    } catch {
      // If we can't parse the error response, use the default message
    }

    // Map to specific error messages
    switch (response.status) {
      case 401:
        throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
      case 403:
        throw new Error("Insufficient permissions for this operation");
      case 422:
        throw new Error(`Validation error: ${errorMessage}`);
      case 429:
        throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      default:
        throw new Error(errorMessage);
    }
  }
}