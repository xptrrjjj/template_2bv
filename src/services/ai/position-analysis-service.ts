// Position Analysis Service - Comprehensive market insights using multiple AI providers
import type {
  BasicInfoContext,
  PositionAnalysisService,
  PositionAnalysisRequest,
  PositionAnalysisResponse,
  ProviderAnalysisResult,
  MarketRateAnalysis,
  TalentAvailabilityData,
  CostSavingsAnalysis,
  AIServiceResponse,
  AIServiceMetrics,
  AIServiceError,
  AIProvider
} from './types';

import { AI_ERROR_CODES } from './types';
import { buildPositionAnalysisPrompt, getPositionAnalysisContext } from '@/prompts/position-analysis';
import { createAIProviderManager, createProvidersFromEnvironment, createAIProviderFactory } from './providers/factory';
import type { AIProviderManager } from './providers/base';

export class PositionAnalysisServiceImpl implements PositionAnalysisService {
  private providerManager: AIProviderManager;
  private initialized = false;

  constructor(providerManager?: AIProviderManager) {
    this.providerManager = providerManager || createAIProviderManager({
      strategy: 'primary-with-failover',
      maxRetries: 2,
      retryDelay: 1000,
      healthCheckInterval: 300000, // 5 minutes
      failoverThreshold: 3
    });
  }

  /**
   * Initialize the service with environment-based providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { primary, failovers } = await createProvidersFromEnvironment();
      
      if (primary) {
        this.providerManager.setPrimaryProvider(primary);
      }
      
      failovers.forEach(provider => {
        this.providerManager.addFailoverProvider(provider);
      });

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize position analysis service: ${error}`);
    }
  }

  /**
   * Analyze market rates using both OpenAI and Gemini
   */
  async analyzeMarketRates(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<MarketRateAnalysis>>> {
    try {
      await this.initialize();
      const context = getPositionAnalysisContext(jobData, specialInstructions);
      const prompt = buildPositionAnalysisPrompt('MARKET_RATES', context);

      const results = await this.runWithBothProviders<MarketRateAnalysis>(prompt, 'market_rates');
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleServiceError(error, 'analyzeMarketRates');
    }
  }

  /**
   * Assess talent availability using both providers
   */
  async assessTalentAvailability(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<TalentAvailabilityData>>> {
    try {
      await this.initialize();
      const context = getPositionAnalysisContext(jobData, specialInstructions);
      const prompt = buildPositionAnalysisPrompt('TALENT_POOL', context);

      const results = await this.runWithBothProviders<TalentAvailabilityData>(prompt, 'talent_availability');
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleServiceError(error, 'assessTalentAvailability');
    }
  }

  /**
   * Generate professional job description using both providers
   */
  async generateJobDescription(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<string>>> {
    try {
      await this.initialize();
      const context = getPositionAnalysisContext(jobData, specialInstructions);
      const prompt = buildPositionAnalysisPrompt('PROFESSIONAL_JD', context);

      const results = await this.runWithBothProviders<string>(prompt, 'job_description');
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleServiceError(error, 'generateJobDescription');
    }
  }

  /**
   * Generate role pitch for stakeholders using both providers
   */
  async generateRolePitch(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<string>>> {
    try {
      await this.initialize();
      const context = getPositionAnalysisContext(jobData, specialInstructions);
      const prompt = buildPositionAnalysisPrompt('STAKEHOLDER_PITCH', context);

      const results = await this.runWithBothProviders<string>(prompt, 'role_pitch');
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleServiceError(error, 'generateRolePitch');
    }
  }

  /**
   * Calculate cost savings analysis
   */
  async calculateCostSavings(
    usaRateMin: number,
    usaRateMax: number,
    phRateMin: number,
    phRateMax: number,
    markupPercentage: number,
    exchangeRate: number = 56 // Default PHP to USD exchange rate
  ): Promise<AIServiceResponse<CostSavingsAnalysis>> {
    try {
      await this.initialize();
      
      const context = {
        usa_rate_min: usaRateMin,
        usa_rate_max: usaRateMax,
        ph_rate_min: phRateMin,
        ph_rate_max: phRateMax,
        markup_percentage: markupPercentage,
        exchange_rate: exchangeRate,
        special_instructions: 'Calculate comprehensive cost savings analysis'
      };

      const prompt = buildPositionAnalysisPrompt('SAVINGS_ANALYSIS', context);
      const result = await this.providerManager.generateCompletion(prompt);

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to generate cost savings analysis');
      }

      const analysisData = this.parseJSONResponse<CostSavingsAnalysis>(result.data, 'cost_savings');
      
      return {
        success: true,
        data: analysisData
      };
    } catch (error) {
      return this.handleServiceError(error, 'calculateCostSavings');
    }
  }

  /**
   * Comprehensive position analysis using all available insights
   */
  async analyzePosition(request: PositionAnalysisRequest): Promise<PositionAnalysisResponse> {
    const results: Partial<any> = {};
    const errors: Record<string, AIServiceError> = {};

    try {
      await this.initialize();

      // Parallel execution of all requested analyses
      const analysisPromises: Promise<void>[] = [];

      if (request.includeMarketRates !== false) {
        analysisPromises.push(
          this.analyzeMarketRates(request.jobData, request.specialInstructions)
            .then(result => {
              if (result.success) {
                results.marketRates = result.data;
              } else if (result.error) {
                errors.marketRates = result.error;
              }
            })
            .catch(error => {
              errors.marketRates = this.createServiceError('analyzeMarketRates', error);
            })
        );
      }

      if (request.includeTalentAvailability !== false) {
        analysisPromises.push(
          this.assessTalentAvailability(request.jobData, request.specialInstructions)
            .then(result => {
              if (result.success) {
                results.talentAvailability = result.data;
              } else if (result.error) {
                errors.talentAvailability = result.error;
              }
            })
            .catch(error => {
              errors.talentAvailability = this.createServiceError('assessTalentAvailability', error);
            })
        );
      }

      if (request.includeJobDescription !== false) {
        analysisPromises.push(
          this.generateJobDescription(request.jobData, request.specialInstructions)
            .then(result => {
              if (result.success) {
                results.jobDescription = result.data;
              } else if (result.error) {
                errors.jobDescription = result.error;
              }
            })
            .catch(error => {
              errors.jobDescription = this.createServiceError('generateJobDescription', error);
            })
        );
      }

      if (request.includeRolePitch !== false) {
        analysisPromises.push(
          this.generateRolePitch(request.jobData, request.specialInstructions)
            .then(result => {
              if (result.success) {
                results.rolePitch = result.data;
              } else if (result.error) {
                errors.rolePitch = result.error;
              }
            })
            .catch(error => {
              errors.rolePitch = this.createServiceError('generateRolePitch', error);
            })
        );
      }

      if (request.includeCostSavings && request.costSavingsData) {
        const { usa_rate_min, usa_rate_max, ph_rate_min, ph_rate_max, markup_percentage, exchange_rate } = request.costSavingsData;
        analysisPromises.push(
          this.calculateCostSavings(usa_rate_min, usa_rate_max, ph_rate_min, ph_rate_max, markup_percentage, exchange_rate)
            .then(result => {
              if (result.success) {
                results.costSavings = result.data;
              } else if (result.error) {
                errors.costSavings = result.error;
              }
            })
            .catch(error => {
              errors.costSavings = this.createServiceError('calculateCostSavings', error);
            })
        );
      }

      // Wait for all analyses to complete
      await Promise.all(analysisPromises);

      // Check if we have any successful results
      const hasResults = Object.keys(results).length > 0;
      const hasErrors = Object.keys(errors).length > 0;

      if (hasResults) {
        return {
          success: true,
          data: {
            marketRates: results.marketRates || ({} as any),
            talentAvailability: results.talentAvailability || ({} as any),
            jobDescription: results.jobDescription || ({} as any),
            rolePitch: results.rolePitch || ({} as any),
            costSavings: results.costSavings,
            ...results,
            metadata: {
              generated_at: new Date().toISOString(),
              special_instructions: request.specialInstructions,
              analysis_version: '1.0.0'
            }
          },
          partial_results: hasErrors ? results : undefined,
          provider_errors: hasErrors ? errors : undefined
        };
      } else {
        return {
          success: false,
          error: {
            code: AI_ERROR_CODES.ALL_PROVIDERS_FAILED,
            message: 'All position analysis operations failed'
          },
          provider_errors: errors
        };
      }
    } catch (error) {
      return {
        success: false,
        error: this.createServiceError('analyzePosition', error),
        provider_errors: errors
      };
    }
  }

  /**
   * Run analysis with both OpenAI and Gemini providers
   */
  private async runWithBothProviders<T>(
    prompt: string,
    analysisType: string
  ): Promise<ProviderAnalysisResult<T>> {
    const results: Partial<ProviderAnalysisResult<T>> = {};
    const errors: string[] = [];

    try {
      // Get all available providers
      const primaryProvider = this.providerManager.getPrimaryProvider();
      const failoverProviders = this.providerManager.getFailoverProviders();
      const allProviders = [primaryProvider, ...failoverProviders].filter(Boolean) as AIProvider[];

      // Find OpenAI and Gemini providers
      const openaiProvider = allProviders.find(p => 'info' in p && (p.info as any)?.name?.toLowerCase().includes('openai'));
      const geminiProvider = allProviders.find(p => 'info' in p && (p.info as any)?.name?.toLowerCase().includes('gemini'));

      // Run with OpenAI
      if (openaiProvider) {
        try {
          const openaiResult = await openaiProvider.generateCompletion(prompt);
          if (openaiResult.success && openaiResult.data) {
            if (analysisType === 'market_rates' || analysisType === 'talent_availability') {
              results.openai = this.parseJSONResponse<T>(openaiResult.data, analysisType);
            } else {
              results.openai = openaiResult.data as T;
            }
          } else {
            errors.push(`OpenAI failed: ${openaiResult.error?.message || 'Unknown error'}`);
          }
        } catch (error) {
          errors.push(`OpenAI error: ${error}`);
        }
      }

      // Run with Gemini
      if (geminiProvider) {
        try {
          const geminiResult = await geminiProvider.generateCompletion(prompt);
          if (geminiResult.success && geminiResult.data) {
            if (analysisType === 'market_rates' || analysisType === 'talent_availability') {
              results.gemini = this.parseJSONResponse<T>(geminiResult.data, analysisType);
            } else {
              results.gemini = geminiResult.data as T;
            }
          } else {
            errors.push(`Gemini failed: ${geminiResult.error?.message || 'Unknown error'}`);
          }
        } catch (error) {
          errors.push(`Gemini error: ${error}`);
        }
      }

      // Check if we have at least one successful result
      if (results.openai || results.gemini) {
        return results as ProviderAnalysisResult<T>;
      } else {
        throw new Error(`All providers failed for ${analysisType}: ${errors.join(', ')}`);
      }
    } catch (error) {
      throw new Error(`Provider execution failed for ${analysisType}: ${error}`);
    }
  }

  /**
   * Parse JSON response from AI providers
   */
  private parseJSONResponse<T>(response: string, context: string): T {
    try {
      // Extract JSON from response if it's wrapped in markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      
      // Clean up the JSON string
      const cleanedJsonString = jsonString
        .replace(/^\s*\/\/.*$/gm, '') // Remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .trim();

      return JSON.parse(cleanedJsonString);
    } catch (error) {
      console.warn(`Failed to parse JSON response for ${context}:`, error);
      console.warn('Response was:', response);
      throw new Error(`Invalid JSON response for ${context}: ${error}`);
    }
  }

  /**
   * Handle service errors consistently
   */
  private handleServiceError(
    error: unknown,
    method: string
  ): AIServiceResponse<never> {
    const serviceError = this.createServiceError(method, error);
    return {
      success: false,
      error: serviceError
    };
  }

  /**
   * Create consistent service errors
   */
  private createServiceError(method: string, error: unknown): AIServiceError {
    const message = error instanceof Error ? error.message : String(error);
    
    return {
      code: AI_ERROR_CODES.SERVICE_UNAVAILABLE,
      message: `Position analysis service error in ${method}: ${message}`,
      details: error instanceof Error ? error.stack : error
    };
  }

  /**
   * Health check for the service
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.initialize();
      return await this.providerManager.isHealthy();
    } catch {
      return false;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics(): AIServiceMetrics {
    if (!this.initialized) {
      return {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        average_response_time_ms: 0,
        rate_limit_hits: 0,
        last_request_time: 0
      };
    }
    
    return this.providerManager.getMetrics();
  }
}

// Factory function for creating position analysis service
export function createPositionAnalysisService(
  providerManager?: AIProviderManager
): PositionAnalysisService {
  return new PositionAnalysisServiceImpl(providerManager);
}

// Singleton instance for application use
let serviceInstance: PositionAnalysisService | null = null;

/**
 * Get singleton instance of position analysis service
 */
export function getPositionAnalysisService(): PositionAnalysisService {
  if (!serviceInstance) {
    serviceInstance = createPositionAnalysisService();
  }
  return serviceInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetPositionAnalysisService(): void {
  serviceInstance = null;
}

export default {
  PositionAnalysisServiceImpl,
  createPositionAnalysisService,
  getPositionAnalysisService,
  resetPositionAnalysisService
};