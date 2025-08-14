// OpenAI client configuration and connection with error handling and rate limiting
import type {
  OpenAIClient,
  OpenAIClientConfig,
  AIServiceResponse,
  AIServiceError,
  AIServiceMetrics,
  RetryConfig,
  AIErrorCode,
  ConfigValidationResult
} from './types';
import { AI_ERROR_CODES, AI_SERVICE_DEFAULTS } from './types';

// OpenAI Request Options interface - used internally for API calls
interface OpenAIRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
}

interface OpenAIAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenAIClientImpl implements OpenAIClient {
  private config: OpenAIClientConfig;
  private metrics: AIServiceMetrics;
  private retryConfig: RetryConfig;

  constructor(config: Partial<OpenAIClientConfig> = {}) {
    this.config = this.validateAndNormalizeConfig(config);
    this.retryConfig = AI_SERVICE_DEFAULTS.retryConfig;
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time_ms: 0,
      rate_limit_hits: 0,
      last_request_time: 0
    };
  }

  private validateAndNormalizeConfig(config: Partial<OpenAIClientConfig>): OpenAIClientConfig {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`OpenAI configuration invalid: ${validation.errors.join(', ')}`);
    }

    return {
      apiKey: config.apiKey || this.getApiKeyFromEnv(),
      model: config.model || AI_SERVICE_DEFAULTS.model,
      temperature: config.temperature ?? AI_SERVICE_DEFAULTS.temperature,
      maxTokens: config.maxTokens || AI_SERVICE_DEFAULTS.maxTokens,
      timeout: config.timeout || AI_SERVICE_DEFAULTS.timeout
    };
  }

  public validateConfig(config: Partial<OpenAIClientConfig>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const apiKey = config.apiKey || this.getApiKeyFromEnv();
    if (!apiKey) {
      errors.push('API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 4096)) {
      errors.push('Max tokens must be between 1 and 4096');
    }

    if (config.timeout !== undefined && config.timeout < 1000) {
      warnings.push('Timeout less than 1 second may cause unnecessary failures');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getApiKeyFromEnv(): string {
    if (typeof window !== 'undefined') {
      // Client-side - should not access API key directly
      throw new Error('OpenAI API key should not be accessed on the client side');
    }
    
    return process.env.OPENAI_API_KEY || '';
  }

  async generateCompletion(
    prompt: string,
    options: Partial<OpenAIClientConfig> = {}
  ): Promise<AIServiceResponse<string>> {
    const startTime = Date.now();
    this.metrics.total_requests++;
    this.metrics.last_request_time = startTime;

    try {
      const requestConfig = {
        ...this.config,
        ...options
      };

      const response = await this.makeRequestWithRetry(prompt, requestConfig);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.updateMetrics(true, responseTime);

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No choices returned from OpenAI API');
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty content returned from OpenAI API');
      }

      return {
        success: true,
        data: content.trim()
      };

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.updateMetrics(false, responseTime);

      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  private async makeRequestWithRetry(
    prompt: string,
    config: OpenAIClientConfig
  ): Promise<OpenAIAPIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.max_attempts; attempt++) {
      try {
        return await this.makeRequest(prompt, config);
      } catch (error) {
        lastError = error as Error;

        // Don't retry for certain error types
        const aiError = this.handleError(error);
        if (this.shouldNotRetry(aiError.code)) {
          throw error;
        }

        // Rate limit handling
        if (aiError.code === AI_ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          this.metrics.rate_limit_hits++;
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        // Last attempt
        if (attempt === this.retryConfig.max_attempts) {
          throw error;
        }

        // Wait before retry
        const delay = this.calculateRetryDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Max retry attempts exceeded');
  }

  private async makeRequest(
    prompt: string,
    config: OpenAIClientConfig
  ): Promise<OpenAIAPIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens
        } as OpenAIRequestOptions & { messages: Array<{ role: string; content: string }> }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData: OpenAIErrorResponse = await response.json().catch(() => ({
          error: { message: 'Unknown error', type: 'unknown' }
        }));

        const errorMessage = `OpenAI API error (${response.status}): ${errorData.error.message}`;
        const error = new Error(errorMessage);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      const data: OpenAIAPIResponse = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  private shouldNotRetry(errorCode: AIErrorCode): boolean {
    const nonRetryableErrors: AIErrorCode[] = [
      AI_ERROR_CODES.CONFIGURATION_ERROR,
      AI_ERROR_CODES.API_KEY_INVALID,
      AI_ERROR_CODES.INVALID_PROMPT
    ];

    return nonRetryableErrors.includes(errorCode);
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.base_delay_ms * 
                 Math.pow(this.retryConfig.backoff_multiplier, attempt - 1);
    
    return Math.min(delay, this.retryConfig.max_delay_ms);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    if (success) {
      this.metrics.successful_requests++;
    } else {
      this.metrics.failed_requests++;
    }

    // Update average response time using exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.metrics.average_response_time_ms = 
      (alpha * responseTime) + ((1 - alpha) * this.metrics.average_response_time_ms);
  }

  private handleError(error: unknown): AIServiceError & { code: AIErrorCode } {
    if (error instanceof Error) {
      // Parse OpenAI API errors
      if (error.message.includes('401')) {
        return {
          code: AI_ERROR_CODES.API_KEY_INVALID,
          message: 'Invalid API key',
          details: error.message
        };
      }

      if (error.message.includes('429')) {
        return {
          code: AI_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded',
          details: error.message
        };
      }

      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return {
          code: AI_ERROR_CODES.REQUEST_TIMEOUT,
          message: 'Request timeout',
          details: error.message
        };
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          code: AI_ERROR_CODES.NETWORK_ERROR,
          message: 'Network error',
          details: error.message
        };
      }

      return {
        code: AI_ERROR_CODES.UNKNOWN_ERROR,
        message: error.message,
        details: error.stack
      };
    }

    return {
      code: AI_ERROR_CODES.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      details: String(error)
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.generateCompletion('Hello', {
        maxTokens: 10,
        temperature: 0
      });
      return response.success;
    } catch {
      return false;
    }
  }

  getMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }

  updateConfig(config: Partial<OpenAIClientConfig>): void {
    const newConfig = { ...this.config, ...config };
    this.config = this.validateAndNormalizeConfig(newConfig);
  }

  resetMetrics(): void {
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time_ms: 0,
      rate_limit_hits: 0,
      last_request_time: 0
    };
  }
}

// Factory function for creating OpenAI client instances
export function createOpenAIClient(config: Partial<OpenAIClientConfig> = {}): OpenAIClient {
  return new OpenAIClientImpl(config);
}

// Utility functions for configuration validation
export function validateOpenAIConfig(config: Partial<OpenAIClientConfig>): ConfigValidationResult {
  const client = new OpenAIClientImpl();
  return (client as OpenAIClientImpl).validateConfig(config);
}

export function getDefaultOpenAIConfig(): OpenAIClientConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: AI_SERVICE_DEFAULTS.model,
    temperature: AI_SERVICE_DEFAULTS.temperature,
    maxTokens: AI_SERVICE_DEFAULTS.maxTokens,
    timeout: AI_SERVICE_DEFAULTS.timeout
  };
}