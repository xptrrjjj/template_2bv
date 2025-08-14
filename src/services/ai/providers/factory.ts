// AI provider factory and manager for multi-provider support with failover
import type { 
  AIProvider, 
  AIProviderFactory, 
  AIProviderManager, 
  AIProviderConfig, 
  AIProviderInfo,
  ProviderSelectionConfig,
  ProviderError
} from './base';
import { isProviderError, shouldFailover } from './base';
import { OpenAIProvider, createOpenAIProvider } from './openai';
import { GeminiProvider, createGeminiProvider } from './gemini';
import { AI_ERROR_CODES, type AIServiceResponse, type AIServiceMetrics } from '../types';

// Supported provider types
export type SupportedProviderType = 'openai' | 'gemini';

// Provider factory implementation
export class AIProviderFactoryImpl implements AIProviderFactory {
  async createProvider(type: string, config: AIProviderConfig): Promise<AIProvider> {
    switch (type.toLowerCase()) {
      case 'openai':
        return createOpenAIProvider(config);
      
      case 'gemini':
        return createGeminiProvider(config);
      
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  getSupportedProviders(): string[] {
    return ['openai', 'gemini'];
  }

  getProviderInfo(type: string): AIProviderInfo | null {
    switch (type.toLowerCase()) {
      case 'openai':
        // Create a temporary instance to get info
        try {
          const provider = new OpenAIProvider({ apiKey: 'dummy' });
          return provider.info;
        } catch {
          return null;
        }
      
      case 'gemini':
        try {
          const provider = new GeminiProvider({ apiKey: 'dummy' });
          return provider.info;
        } catch {
          return null;
        }
      
      default:
        return null;
    }
  }
}

// Provider manager implementation with failover support
export class AIProviderManagerImpl implements AIProviderManager {
  private primaryProvider: AIProvider | null = null;
  private failoverProviders: AIProvider[] = [];
  private selectionConfig: ProviderSelectionConfig;
  private healthStatus: Map<string, boolean> = new Map();
  private failureCount: Map<string, number> = new Map();

  // AIProvider interface implementation
  readonly info: AIProviderInfo = {
    name: 'AI Provider Manager',
    version: '1.0.0',
    capabilities: ['text-completion', 'multi-provider', 'failover'],
    maxTokens: 4000,
    supportedModels: ['gpt-4o-mini', 'gpt-4', 'gemini-1.5-flash', 'gemini-pro']
  };

  constructor(selectionConfig: Partial<ProviderSelectionConfig> = {}) {
    this.selectionConfig = {
      strategy: 'primary-with-failover',
      maxRetries: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000,
      failoverThreshold: 3,
      ...selectionConfig
    };

    // Start health check interval
    this.startHealthChecking();
  }

  setPrimaryProvider(provider: AIProvider): void {
    this.primaryProvider = provider;
    this.healthStatus.set(provider.info.name, true);
    this.failureCount.set(provider.info.name, 0);
  }

  getPrimaryProvider(): AIProvider | null {
    return this.primaryProvider;
  }

  addFailoverProvider(provider: AIProvider): void {
    this.failoverProviders.push(provider);
    this.healthStatus.set(provider.info.name, true);
    this.failureCount.set(provider.info.name, 0);
  }

  getFailoverProviders(): AIProvider[] {
    return [...this.failoverProviders];
  }

  async generateCompletion(
    prompt: string,
    options: Partial<AIProviderConfig> = {}
  ): Promise<AIServiceResponse<string>> {
    const providers = this.getProvidersInOrder();
    
    if (providers.length === 0) {
      return {
        success: false,
        error: {
          code: AI_ERROR_CODES.CONFIGURATION_ERROR,
          message: 'No AI providers configured'
        }
      };
    }

    let lastError: ProviderError | null = null;

    for (const provider of providers) {
      // Skip unhealthy providers
      if (!this.isProviderHealthy(provider)) {
        continue;
      }

      try {
        const result = await this.executeWithRetry(provider, prompt, options);
        
        if (result.success) {
          // Reset failure count on success
          this.failureCount.set(provider.info.name, 0);
          return result;
        }

        if (isProviderError(result.error)) {
          lastError = result.error;
          this.recordFailure(provider);

          // If this provider suggests not to failover, stop here
          if (!shouldFailover(lastError)) {
            break;
          }
        }

      } catch (error) {
        this.recordFailure(provider);
        lastError = {
          code: AI_ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
          provider: provider.info.name,
          isRetryable: true,
          suggestedAction: 'failover'
        };
      }
    }

    return {
      success: false,
      error: lastError || {
        code: AI_ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'All AI providers failed or are unavailable'
      }
    };
  }

  private async executeWithRetry(
    provider: AIProvider,
    prompt: string,
    options: Partial<AIProviderConfig>
  ): Promise<AIServiceResponse<string>> {
    let lastError: ProviderError | Error | null = null;

    for (let attempt = 1; attempt <= this.selectionConfig.maxRetries; attempt++) {
      try {
        const result = await provider.generateCompletion(prompt, options);
        
        if (result.success) {
          return result;
        }

        if (isProviderError(result.error)) {
          lastError = result.error;
        } else {
          lastError = new Error('Unknown error');
        }

        // If this is a non-retryable error, don't retry
        if (isProviderError(result.error) && !result.error.isRetryable) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.selectionConfig.maxRetries) {
          await this.sleep(this.selectionConfig.retryDelay * attempt);
        }

      } catch (error) {
        lastError = error as Error;
        
        // Wait before retry (except on last attempt)
        if (attempt < this.selectionConfig.maxRetries) {
          await this.sleep(this.selectionConfig.retryDelay * attempt);
        }
      }
    }

    return {
      success: false,
      error: isProviderError(lastError) ? lastError : {
        code: AI_ERROR_CODES.UNKNOWN_ERROR,
        message: lastError instanceof Error ? lastError.message : String(lastError)
      }
    };
  }

  private getProvidersInOrder(): AIProvider[] {
    const allProviders = [
      ...(this.primaryProvider ? [this.primaryProvider] : []),
      ...this.failoverProviders
    ];

    switch (this.selectionConfig.strategy) {
      case 'primary-only':
        return this.primaryProvider ? [this.primaryProvider] : [];

      case 'primary-with-failover':
        return allProviders;

      case 'load-balance':
        return this.shuffleArray([...allProviders]);

      case 'fastest-first':
        return allProviders.sort((a, b) => 
          a.getMetrics().average_response_time_ms - b.getMetrics().average_response_time_ms
        );

      case 'cost-optimize':
        // Simple cost heuristic: Gemini is generally cheaper than OpenAI
        return allProviders.sort((a, b) => {
          const aCost = a.info.name.toLowerCase().includes('gemini') ? 1 : 2;
          const bCost = b.info.name.toLowerCase().includes('gemini') ? 1 : 2;
          return aCost - bCost;
        });

      default:
        return allProviders;
    }
  }

  private isProviderHealthy(provider: AIProvider): boolean {
    const health = this.healthStatus.get(provider.info.name);
    const failures = this.failureCount.get(provider.info.name) || 0;
    
    return health !== false && failures < this.selectionConfig.failoverThreshold;
  }

  private recordFailure(provider: AIProvider): void {
    const currentCount = this.failureCount.get(provider.info.name) || 0;
    this.failureCount.set(provider.info.name, currentCount + 1);

    // Mark as unhealthy if threshold exceeded
    if (currentCount + 1 >= this.selectionConfig.failoverThreshold) {
      this.healthStatus.set(provider.info.name, false);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkAllProviders(): Promise<Record<string, boolean>> {
    const allProviders = [
      ...(this.primaryProvider ? [this.primaryProvider] : []),
      ...this.failoverProviders
    ];

    const healthChecks = await Promise.allSettled(
      allProviders.map(provider => provider.isHealthy())
    );

    const results: Record<string, boolean> = {};
    
    allProviders.forEach((provider, index) => {
      const check = healthChecks[index];
      const isHealthy = check.status === 'fulfilled' && check.value;
      
      results[provider.info.name] = isHealthy;
      this.healthStatus.set(provider.info.name, isHealthy);
      
      // Reset failure count if healthy
      if (isHealthy) {
        this.failureCount.set(provider.info.name, 0);
      }
    });

    return results;
  }

  getAggregatedMetrics(): {
    providers: Record<string, AIServiceMetrics>;
    combined: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: number;
      failoverCount: number;
    };
  } {
    const allProviders = [
      ...(this.primaryProvider ? [this.primaryProvider] : []),
      ...this.failoverProviders
    ];

    const providerMetrics: Record<string, AIServiceMetrics> = {};
    let totalRequests = 0;
    let totalSuccessful = 0;
    let weightedResponseTime = 0;
    let failoverCount = 0;

    allProviders.forEach(provider => {
      const metrics = provider.getMetrics();
      providerMetrics[provider.info.name] = metrics;
      
      totalRequests += metrics.total_requests;
      totalSuccessful += metrics.successful_requests;
      
      if (metrics.total_requests > 0) {
        weightedResponseTime += 
          (metrics.average_response_time_ms * metrics.total_requests);
      }
      
      const failures = this.failureCount.get(provider.info.name) || 0;
      failoverCount += failures;
    });

    const averageResponseTime = totalRequests > 0 
      ? weightedResponseTime / totalRequests 
      : 0;
    
    const successRate = totalRequests > 0 
      ? totalSuccessful / totalRequests 
      : 0;

    return {
      providers: providerMetrics,
      combined: {
        totalRequests,
        successRate,
        averageResponseTime,
        failoverCount
      }
    };
  }

  private startHealthChecking(): void {
    setInterval(async () => {
      try {
        await this.checkAllProviders();
      } catch (error) {
        console.warn('Health check failed:', error);
      }
    }, this.selectionConfig.healthCheckInterval);
  }

  // Configuration management
  updateSelectionConfig(config: Partial<ProviderSelectionConfig>): void {
    this.selectionConfig = { ...this.selectionConfig, ...config };
  }

  getSelectionConfig(): ProviderSelectionConfig {
    return { ...this.selectionConfig };
  }
  
  // Implement AIProvider interface methods for easy drop-in replacement
  async isHealthy(): Promise<boolean> {
    const healthStatus = await this.checkAllProviders();
    return Object.values(healthStatus).some(healthy => healthy);
  }
  
  getMetrics(): AIServiceMetrics {
    const aggregated = this.getAggregatedMetrics();
    const providerMetrics = Object.values(aggregated.providers);
    
    return {
      total_requests: aggregated.combined.totalRequests,
      successful_requests: Math.round(aggregated.combined.totalRequests * aggregated.combined.successRate),
      failed_requests: aggregated.combined.totalRequests - Math.round(aggregated.combined.totalRequests * aggregated.combined.successRate),
      average_response_time_ms: aggregated.combined.averageResponseTime,
      rate_limit_hits: 0, // Aggregated separately in combined metrics
      last_request_time: providerMetrics.length > 0 
        ? Math.max(...providerMetrics.map(p => p.last_request_time))
        : 0
    };
  }

  // Provider management utilities
  removeProvider(providerName: string): boolean {
    if (this.primaryProvider?.info.name === providerName) {
      this.primaryProvider = null;
      this.healthStatus.delete(providerName);
      this.failureCount.delete(providerName);
      return true;
    }

    const index = this.failoverProviders.findIndex(p => p.info.name === providerName);
    if (index !== -1) {
      this.failoverProviders.splice(index, 1);
      this.healthStatus.delete(providerName);
      this.failureCount.delete(providerName);
      return true;
    }

    return false;
  }

  clearFailureHistory(): void {
    this.failureCount.clear();
    // Reset all providers to healthy
    for (const [name] of this.healthStatus) {
      this.healthStatus.set(name, true);
    }
  }

  // AIProvider interface methods
  updateConfig(config: Partial<AIProviderConfig>): void {
    // Update all managed providers with the new config
    if (this.primaryProvider) {
      this.primaryProvider.updateConfig(config);
    }
    this.failoverProviders.forEach(provider => {
      provider.updateConfig(config);
    });
  }

  validateConfig(config: Partial<AIProviderConfig>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate the config against all available providers
    const allProviders = [
      ...(this.primaryProvider ? [this.primaryProvider] : []),
      ...this.failoverProviders
    ];

    if (allProviders.length === 0) {
      errors.push('No providers available for config validation');
      return { isValid: false, errors, warnings };
    }

    // Use the primary provider's validation logic
    const primaryValidation = allProviders[0].validateConfig(config);
    
    return {
      isValid: primaryValidation.isValid,
      errors: primaryValidation.errors,
      warnings: primaryValidation.warnings
    };
  }
}

// Factory functions
export function createAIProviderFactory(): AIProviderFactory {
  return new AIProviderFactoryImpl();
}

export function createAIProviderManager(
  config: Partial<ProviderSelectionConfig> = {}
): AIProviderManager {
  return new AIProviderManagerImpl(config);
}

// Utility function for environment-based provider setup
export async function createProvidersFromEnvironment(
  factory: AIProviderFactory = createAIProviderFactory()
): Promise<{
  primary: AIProvider | null;
  failovers: AIProvider[];
}> {
  const providers: AIProvider[] = [];
  
  // Try to create OpenAI provider
  try {
    if (typeof window === 'undefined' && process.env.OPENAI_API_KEY) {
      const openaiProvider = await factory.createProvider('openai', {
        apiKey: process.env.OPENAI_API_KEY
      });
      providers.push(openaiProvider);
    }
  } catch (error) {
    console.warn('Failed to create OpenAI provider:', error);
  }

  // Try to create Gemini provider
  try {
    if (typeof window === 'undefined' && process.env.GEMINI_API_KEY) {
      const geminiProvider = await factory.createProvider('gemini', {
        apiKey: process.env.GEMINI_API_KEY
      });
      providers.push(geminiProvider);
    }
  } catch (error) {
    console.warn('Failed to create Gemini provider:', error);
  }

  // Determine primary provider based on environment variable or default ordering
  const preferredProvider = process.env.AI_PREFERRED_PROVIDER?.toLowerCase();
  let primary: AIProvider | null = null;
  const failovers: AIProvider[] = [];

  if (preferredProvider && providers.find(p => p.info.name.toLowerCase().includes(preferredProvider))) {
    const preferredIndex = providers.findIndex(p => 
      p.info.name.toLowerCase().includes(preferredProvider)
    );
    primary = providers[preferredIndex];
    failovers.push(...providers.filter((_, index) => index !== preferredIndex));
  } else if (providers.length > 0) {
    // Default: OpenAI first if available, then Gemini
    const openaiIndex = providers.findIndex(p => p.info.name.toLowerCase().includes('openai'));
    if (openaiIndex !== -1) {
      primary = providers[openaiIndex];
      failovers.push(...providers.filter((_, index) => index !== openaiIndex));
    } else {
      primary = providers[0];
      failovers.push(...providers.slice(1));
    }
  }

  return { primary, failovers };
}

const providerFactory = {
  AIProviderFactoryImpl,
  AIProviderManagerImpl,
  createAIProviderFactory,
  createAIProviderManager,
  createProvidersFromEnvironment
};

export default providerFactory;