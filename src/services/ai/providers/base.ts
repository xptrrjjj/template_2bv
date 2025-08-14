// Base AI provider interface and types for multi-provider support
import type { AIServiceResponse, AIServiceMetrics, AIServiceError } from '../types';

// Provider identification and capabilities
export interface AIProviderInfo {
  name: string;
  version: string;
  capabilities: string[];
  maxTokens: number;
  supportedModels: string[];
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  baseURL?: string;
}

// Core AI provider interface that all providers must implement
export interface AIProvider {
  readonly info: AIProviderInfo;
  
  // Core generation method
  generateCompletion(
    prompt: string,
    options?: Partial<AIProviderConfig>
  ): Promise<AIServiceResponse<string>>;
  
  // Health and status
  isHealthy(): Promise<boolean>;
  getMetrics(): AIServiceMetrics;
  
  // Configuration management
  updateConfig(config: Partial<AIProviderConfig>): void;
  validateConfig(config: Partial<AIProviderConfig>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// Provider factory interface
export interface AIProviderFactory {
  createProvider(type: string, config: AIProviderConfig): Promise<AIProvider>;
  getSupportedProviders(): string[];
  getProviderInfo(type: string): AIProviderInfo | null;
}

// Multi-provider management - extends AIProvider for drop-in compatibility
export interface AIProviderManager extends AIProvider {
  // Primary provider management
  setPrimaryProvider(provider: AIProvider): void;
  getPrimaryProvider(): AIProvider | null;
  
  // Failover providers
  addFailoverProvider(provider: AIProvider): void;
  getFailoverProviders(): AIProvider[];
  
  // Health monitoring
  checkAllProviders(): Promise<Record<string, boolean>>;
  getAggregatedMetrics(): {
    providers: Record<string, AIServiceMetrics>;
    combined: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: number;
      failoverCount: number;
    };
  };
  
  // Configuration management
  getSelectionConfig(): ProviderSelectionConfig;
}

// Provider-specific error handling
export interface ProviderError extends AIServiceError {
  provider: string;
  isRetryable: boolean;
  suggestedAction?: 'retry' | 'failover' | 'abort';
}

// Provider selection strategies
export type ProviderSelectionStrategy = 
  | 'primary-only'           // Use only primary provider
  | 'primary-with-failover'  // Try primary first, then failovers
  | 'load-balance'          // Distribute across healthy providers
  | 'fastest-first'         // Use provider with best response time
  | 'cost-optimize';        // Use most cost-effective provider

export interface ProviderSelectionConfig {
  strategy: ProviderSelectionStrategy;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  failoverThreshold: number; // Failed requests before considering unhealthy
}

// Abstract base class for AI providers
export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;
  protected metrics: AIServiceMetrics;
  
  constructor(config: AIProviderConfig) {
    this.config = config;
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time_ms: 0,
      rate_limit_hits: 0,
      last_request_time: 0
    };
  }

  abstract get info(): AIProviderInfo;
  
  abstract generateCompletion(
    prompt: string,
    options?: Partial<AIProviderConfig>
  ): Promise<AIServiceResponse<string>>;
  
  abstract isHealthy(): Promise<boolean>;
  
  getMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }
  
  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  abstract validateConfig(config: Partial<AIProviderConfig>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  protected updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.total_requests++;
    this.metrics.last_request_time = Date.now();
    
    if (success) {
      this.metrics.successful_requests++;
    } else {
      this.metrics.failed_requests++;
    }
    
    // Update average response time using exponential moving average
    const alpha = 0.1;
    this.metrics.average_response_time_ms = 
      (alpha * responseTime) + ((1 - alpha) * this.metrics.average_response_time_ms);
  }
  
  protected createProviderError(
    error: unknown, 
    isRetryable: boolean = true, 
    suggestedAction?: 'retry' | 'failover' | 'abort'
  ): ProviderError {
    const baseError = error instanceof Error ? error : new Error(String(error));
    
    return {
      code: 'PROVIDER_ERROR',
      message: baseError.message,
      details: baseError.stack,
      provider: this.info.name,
      isRetryable,
      suggestedAction
    };
  }
}

// Utility functions
export function isProviderError(error: unknown): error is ProviderError {
  return typeof error === 'object' && 
         error !== null && 
         'provider' in error && 
         'isRetryable' in error;
}

export function shouldRetryWithProvider(error: ProviderError): boolean {
  return error.isRetryable && error.suggestedAction !== 'abort';
}

export function shouldFailover(error: ProviderError): boolean {
  return error.suggestedAction === 'failover' || 
         (error.isRetryable && error.suggestedAction !== 'retry');
}

const baseProviders = {
  BaseAIProvider,
  isProviderError,
  shouldRetryWithProvider,
  shouldFailover
};

export default baseProviders;