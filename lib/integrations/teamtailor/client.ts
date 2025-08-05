/**
 * Core HTTP client for TeamTailor API integration
 * Handles all HTTP requests with authentication, rate limiting, and error handling
 */

import { teamTailorConfig, getApiHeaders, buildUrl, TeamTailorConfig } from './config';
import { getRateLimiter, TeamTailorRateLimiter } from './utils/rate-limiter';
import { 
  createErrorFromResponse, 
  isRetryableError, 
  getRetryDelay,
  NetworkError,
  TimeoutError,
  ConfigurationError
} from './errors';
import { TeamTailorPaginatedResponse, PaginationOptions, PaginationConfig } from './types';
import { fetchAllPages } from './pagination';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  maxRetries?: number;
  priority?: number;
}

export class TeamTailorClient {
  private config: TeamTailorConfig;
  private rateLimiter: TeamTailorRateLimiter;
  
  constructor(config?: Partial<TeamTailorConfig>) {
    this.config = { ...teamTailorConfig, ...config };
    
    // Validate configuration
    if (!this.config.apiKey) {
      throw new ConfigurationError('TeamTailor API key is required', ['apiKey']);
    }
    
    this.rateLimiter = getRateLimiter(this.config.rateLimitPerSecond * 10);
  }
  
  /**
   * Perform a GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }
  
  /**
   * Perform a POST request
   */
  async post<T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }
  
  /**
   * Perform a PATCH request
   */
  async patch<T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }
  
  /**
   * Perform a DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
  
  /**
   * Perform a paginated GET request that automatically fetches all pages
   * This is a convenience method that uses the pagination utility
   */
  async getAllPaginated<T>(
    endpoint: string, 
    options?: PaginationOptions & { paginationConfig?: PaginationConfig }
  ): Promise<T[]> {
    return fetchAllPages<T>(this, endpoint, options);
  }
  
  /**
   * Core request method with rate limiting and retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;
    const timeout = options?.timeout ?? this.config.requestTimeout;
    const priority = options?.priority ?? 0;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute request with rate limiting
        const response = await this.rateLimiter.executeRequest(
          () => this.executeRequest(method, endpoint, data, options, timeout),
          priority
        );
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!isRetryableError(error as Error) || attempt === maxRetries) {
          throw error;
        }
        
        // Calculate retry delay
        const delay = getRetryDelay(error as Error, attempt, this.config.retryDelay);
        await this.delay(delay);
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after all retries');
  }
  
  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions,
    timeout?: number
  ): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const headers = getApiHeaders(options?.headers);
    
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: timeout ? AbortSignal.timeout(timeout) : undefined,
    };
    
    // Add body for requests that support it
    if (data && ['POST', 'PATCH', 'PUT'].includes(method)) {
      requestOptions.body = JSON.stringify({
        data: {
          type: this.getResourceType(endpoint),
          attributes: data,
        }
      });
    }
    
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const error = await createErrorFromResponse(response, `${method} ${endpoint}`);
        throw error;
      }
      
      // Handle empty responses (like DELETE)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }
      
      const responseData = await response.json();
      return responseData as T;
      
    } catch (error) {
      // Handle fetch errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(
            `Request timeout after ${timeout}ms`,
            timeout!,
            `${method} ${endpoint}`
          );
        }
        
        if (error.message.includes('fetch')) {
          throw new NetworkError(
            'Network request failed',
            error,
            `${method} ${endpoint}`
          );
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Extract resource type from endpoint
   * e.g., "/v1/clients" -> "clients"
   */
  private getResourceType(endpoint: string): string {
    const parts = endpoint.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    
    // Remove ID if present (e.g., "clients/123" -> "clients")
    const resourceType = lastPart.split('/')[0];
    
    // Handle singular/plural conversions if needed
    return resourceType;
  }
  
  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get rate limiter status
   */
  getRateLimiterStatus() {
    return this.rateLimiter.getStatus();
  }
  
  /**
   * Build headers for a request
   */
  buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return getApiHeaders(customHeaders);
  }
  
  /**
   * Build full URL for a request
   */
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    return buildUrl(endpoint, params);
  }
}

// Export singleton instance
export const teamTailorClient = new TeamTailorClient();