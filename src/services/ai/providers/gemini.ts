// Google Gemini AI provider implementation
import { BaseAIProvider, type AIProviderInfo, type AIProviderConfig } from './base';
import { AI_ERROR_CODES, type AIServiceResponse, type AIServiceError } from '../types';

interface GeminiConfig extends AIProviderConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details?: unknown[];
  };
}

export class GeminiProvider extends BaseAIProvider {
  private static readonly DEFAULT_CONFIG: Omit<GeminiConfig, 'apiKey'> = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta'
  };

  constructor(config: Partial<GeminiConfig> & { apiKey: string }) {
    const fullConfig = {
      ...GeminiProvider.DEFAULT_CONFIG,
      ...config
    };
    super(fullConfig);
  }

  get info(): AIProviderInfo {
    return {
      name: 'Google Gemini',
      version: '1.5',
      capabilities: ['text-generation', 'conversation', 'code-generation'],
      maxTokens: 1048576, // Gemini 1.5 context window
      supportedModels: [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
        'gemini-1.0-pro'
      ]
    };
  }

  async generateCompletion(
    prompt: string,
    options: Partial<GeminiConfig> = {}
  ): Promise<AIServiceResponse<string>> {
    const startTime = Date.now();
    
    try {
      const requestConfig = {
        ...this.config,
        ...options
      } as GeminiConfig;

      const response = await this.makeRequest(prompt, requestConfig);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.updateMetrics(true, responseTime);

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Empty content returned from Gemini API');
      }

      const content = candidate.content.parts
        .map(part => part.text)
        .join('')
        .trim();

      if (!content) {
        throw new Error('Empty text content returned from Gemini API');
      }

      return {
        success: true,
        data: content
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
    config: GeminiConfig
  ): Promise<GeminiAPIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    try {
      const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: 0.95,
          topK: 64
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData: GeminiErrorResponse = await response.json().catch(() => ({
          error: { 
            code: response.status, 
            message: 'Unknown error', 
            status: response.statusText 
          }
        }));

        const errorMessage = `Gemini API error (${response.status}): ${errorData.error.message}`;
        const error = new Error(errorMessage);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      const data: GeminiAPIResponse = await response.json();
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
      // Parse Gemini API errors
      if (error.message.includes('400')) {
        return {
          code: AI_ERROR_CODES.INVALID_PROMPT,
          message: 'Invalid request or prompt',
          details: error.message
        };
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          code: AI_ERROR_CODES.API_KEY_INVALID,
          message: 'Invalid API key or insufficient permissions',
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

  validateConfig(config: Partial<GeminiConfig>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const apiKey = config.apiKey || this.getApiKeyFromEnv();
    if (!apiKey) {
      errors.push('API key is required. Set GEMINI_API_KEY environment variable or pass apiKey in config');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 8192)) {
      errors.push('Max tokens must be between 1 and 8192');
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
      throw new Error('Gemini API key should not be accessed on the client side');
    }
    
    return process.env.GEMINI_API_KEY || '';
  }

  updateConfig(config: Partial<GeminiConfig>): void {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`Gemini configuration invalid: ${validation.errors.join(', ')}`);
    }

    super.updateConfig(config);
  }
}

// Factory function for creating Gemini provider instances
export function createGeminiProvider(config: Partial<GeminiConfig> & { apiKey?: string } = {}): GeminiProvider {
  const apiKey = config.apiKey || (typeof window === 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  
  if (!apiKey) {
    throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or pass apiKey in config');
  }

  return new GeminiProvider({ ...config, apiKey });
}

// Utility functions
export function getDefaultGeminiConfig(): GeminiConfig {
  return {
    ...GeminiProvider['DEFAULT_CONFIG'],
    apiKey: process.env.GEMINI_API_KEY || ''
  };
}

export function validateGeminiConfig(config: Partial<GeminiConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const provider = new GeminiProvider({ 
    apiKey: config.apiKey || process.env.GEMINI_API_KEY || 'dummy' 
  });
  return provider.validateConfig(config);
}

export default GeminiProvider;