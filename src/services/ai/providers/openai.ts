// OpenAI provider implementation using the new provider interface
import { BaseAIProvider, type AIProviderInfo, type AIProviderConfig } from './base';
import { AI_ERROR_CODES, AI_SERVICE_DEFAULTS, type AIServiceResponse, type AIServiceError } from '../types';

interface OpenAIConfig extends AIProviderConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
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

export class OpenAIProvider extends BaseAIProvider {
  private static readonly DEFAULT_CONFIG: Omit<OpenAIConfig, 'apiKey'> = {
    model: AI_SERVICE_DEFAULTS.model,
    temperature: AI_SERVICE_DEFAULTS.temperature,
    maxTokens: AI_SERVICE_DEFAULTS.maxTokens,
    timeout: AI_SERVICE_DEFAULTS.timeout,
    baseURL: 'https://api.openai.com/v1'
  };

  constructor(config: Partial<OpenAIConfig> & { apiKey: string }) {
    const fullConfig = {
      ...OpenAIProvider.DEFAULT_CONFIG,
      ...config
    };
    super(fullConfig);
  }

  get info(): AIProviderInfo {
    return {
      name: 'OpenAI',
      version: 'v1',
      capabilities: ['text-generation', 'conversation', 'code-generation', 'reasoning'],
      maxTokens: 128000, // GPT-4 turbo context window
      supportedModels: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ]
    };
  }

  async generateCompletion(
    prompt: string,
    options: Partial<OpenAIConfig> = {}
  ): Promise<AIServiceResponse<string>> {
    const startTime = Date.now();
    
    try {
      const requestConfig = {
        ...this.config,
        ...options
      } as OpenAIConfig;

      const response = await this.makeRequest(prompt, requestConfig);
      
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

  private async makeRequest(
    prompt: string,
    config: OpenAIConfig
  ): Promise<OpenAIAPIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(`${config.baseURL}/chat/completions`, {
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
        }),
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

  private handleError(error: unknown): AIServiceError {
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

  validateConfig(config: Partial<OpenAIConfig>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
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

    if (config.model && !this.info.supportedModels.includes(config.model)) {
      warnings.push(`Model ${config.model} may not be supported. Supported models: ${this.info.supportedModels.join(', ')}`);
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

  updateConfig(config: Partial<OpenAIConfig>): void {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`OpenAI configuration invalid: ${validation.errors.join(', ')}`);
    }

    super.updateConfig(config);
  }
}

// Factory function for creating OpenAI provider instances
export function createOpenAIProvider(config: Partial<OpenAIConfig> & { apiKey?: string } = {}): OpenAIProvider {
  const apiKey = config.apiKey || (typeof window === 'undefined' ? process.env.OPENAI_API_KEY : undefined);
  
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config');
  }

  return new OpenAIProvider({ ...config, apiKey });
}

// Utility functions
export function getDefaultOpenAIConfig(): OpenAIConfig {
  return {
    ...OpenAIProvider['DEFAULT_CONFIG'],
    apiKey: process.env.OPENAI_API_KEY || ''
  };
}

export function validateOpenAIConfig(config: Partial<OpenAIConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const provider = new OpenAIProvider({ 
    apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'dummy' 
  });
  return provider.validateConfig(config);
}

export default OpenAIProvider;