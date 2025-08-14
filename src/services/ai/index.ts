// Clean exports for AI service infrastructure
// This module provides a comprehensive AI service layer with multi-provider support

// Type definitions
export type {
  // Core service types
  AIServiceConfig,
  AIServiceError,
  AIServiceResponse,
  OpenAIClientConfig,
  OpenAIResponse,
  
  // Multi-provider types
  ProviderConfig,
  MultiProviderConfig,
  AIEnvironmentConfig,
  AIProvider,
  
  // Skill suggestion types
  SkillSuggestionContext,
  SkillSuggestionRequest,
  SkillSuggestionResponse,
  SuggestionType,
  GeneratedSkills,
  
  // Position analysis types
  MarketRateData,
  MarketRateAnalysis,
  TalentAvailabilityData,
  CostSavingsAnalysis,
  ProviderAnalysisResult,
  PositionAnalysis,
  PositionAnalysisRequest,
  PositionAnalysisResponse,
  PositionAnalysisService,
  
  // Prompt management types
  PromptTemplate,
  PromptContext,
  CompiledPrompt,
  
  // Service interfaces
  OpenAIClient,
  PromptManager,
  SkillSuggestionService,
  Logger,
  
  // Utility types
  AIServiceMetrics,
  RateLimitInfo,
  RetryConfig,
  ConfigValidationResult,
  BasicInfoContext,
  AIErrorCode
} from './types';

// Constants and enums
export { AI_ERROR_CODES, AI_SERVICE_DEFAULTS } from './types';

// Multi-provider system exports
export type {
  AIProvider as BaseAIProvider,
  AIProviderInfo,
  AIProviderConfig as BaseAIProviderConfig,
  AIProviderFactory,
  AIProviderManager,
  ProviderSelectionStrategy,
  ProviderSelectionConfig
} from './providers';

export {
  createAIProviderFactory,
  createAIProviderManager,
  createProvidersFromEnvironment,
  createOpenAIProvider,
  createGeminiProvider,
  OpenAIProvider,
  GeminiProvider
} from './providers';

// OpenAI client
export {
  createOpenAIClient,
  validateOpenAIConfig,
  getDefaultOpenAIConfig,
  OpenAIClientImpl
} from './openai-client';

// Prompt management (updated with new structured prompts)
export {
  createPromptManager,
  createSkillSuggestionContext,
  getPromptForSuggestionType,
  createPromptContext,
  createEnhancedPromptContext,
  validateTemplateVariables,
  DEFAULT_PROMPT_TEMPLATES,
  PromptManagerImpl
} from './prompt-manager';

// New structured prompt system
export {
  SKILL_GENERATION_TEMPLATES,
  JOB_DESCRIPTION_TEMPLATES,
  REQUIREMENTS_ANALYSIS_TEMPLATES,
  POSITION_ANALYSIS_TEMPLATES,
  MARKET_RATE_ANALYSIS_TEMPLATES,
  TALENT_AVAILABILITY_TEMPLATES,
  ROLE_PITCH_TEMPLATES,
  COST_ANALYSIS_TEMPLATES,
  buildContextualSkillPrompt,
  buildPositionAnalysisPrompt,
  getExperienceLevelContext,
  getDepartmentContext,
  getPositionAnalysisContext
} from '../../prompts';

// Skill suggestion service
export {
  createSkillSuggestionService,
  validateSkillSuggestionContext,
  createSkillSuggestionRequest,
  SkillSuggestionServiceImpl
} from './skill-suggestion-service';

// Position analysis service
export {
  createPositionAnalysisService,
  getPositionAnalysisService,
  resetPositionAnalysisService,
  PositionAnalysisServiceImpl
} from './position-analysis-service';

// Multi-provider convenience factory functions
export async function createAIServices(config: {
  providers?: import('./types').MultiProviderConfig;
  legacyOpenAI?: Partial<import('./types').OpenAIClientConfig>;
} = {}) {
  const { createAIProviderManager, createProvidersFromEnvironment } = await import('./providers');
  const { createPromptManager } = await import('./prompt-manager');
  const { createSkillSuggestionService } = await import('./skill-suggestion-service');
  
  // Create provider manager
  const providerManager = createAIProviderManager({
    strategy: config.providers?.strategy || 'primary-with-failover',
    maxRetries: config.providers?.maxRetries || 3
  });
  
  // Set up providers from environment or config
  if (config.providers) {
    const { createAIProviderFactory } = await import('./providers');
    const factory = createAIProviderFactory();
    
    const primaryProvider = await factory.createProvider(
      config.providers.primary.type,
      config.providers.primary
    );
    providerManager.setPrimaryProvider(primaryProvider);
    
    if (config.providers.failovers) {
      for (const failoverConfig of config.providers.failovers) {
        const failoverProvider = await factory.createProvider(
          failoverConfig.type,
          failoverConfig
        );
        providerManager.addFailoverProvider(failoverProvider);
      }
    }
  } else {
    // Auto-setup from environment
    const { primary, failovers } = await createProvidersFromEnvironment();
    if (primary) {
      providerManager.setPrimaryProvider(primary);
      failovers.forEach(provider => providerManager.addFailoverProvider(provider));
    } else if (config.legacyOpenAI) {
      // Fallback to legacy OpenAI setup
      const { createOpenAIClient } = await import('./openai-client');
      const openaiClient = createOpenAIClient(config.legacyOpenAI);
      const promptManager = createPromptManager();
      const skillSuggestionService = createSkillSuggestionService({
        openaiClient,
        promptManager
      });
      return {
        openaiClient,
        promptManager,
        skillSuggestionService,
        providerManager: null // Legacy mode
      };
    }
  }
  
  const promptManager = createPromptManager();
  const skillSuggestionService = createSkillSuggestionService({
    aiProvider: providerManager,
    promptManager
  });

  return {
    providerManager,
    promptManager,
    skillSuggestionService,
    // Legacy compatibility
    openaiClient: providerManager.getPrimaryProvider(),
  };
}

// Legacy factory function for backward compatibility
export async function createLegacyAIServices(config: Partial<import('./types').OpenAIClientConfig> = {}) {
  const { createOpenAIClient } = await import('./openai-client');
  const { createPromptManager } = await import('./prompt-manager');
  const { createSkillSuggestionService } = await import('./skill-suggestion-service');
  
  const openaiClient = createOpenAIClient(config);
  const promptManager = createPromptManager();
  
  const skillSuggestionService = createSkillSuggestionService({
    openaiClient,
    promptManager
  });

  return {
    openaiClient,
    promptManager,
    skillSuggestionService
  };
}

// Health check utility for multi-provider services
export async function checkAIServicesHealth(services: Awaited<ReturnType<typeof createAIServices>>): Promise<{
  providers?: Record<string, boolean>;
  openaiClient?: boolean; // Legacy compatibility
  skillSuggestionService: boolean;
  overall: boolean;
}> {
  let providersHealth: Record<string, boolean> = {};
  let legacyOpenaiHealth = false;
  
  // Check provider manager health if available
  if (services.providerManager) {
    providersHealth = await services.providerManager.checkAllProviders();
  } else if (services.openaiClient && 'isHealthy' in services.openaiClient) {
    // Legacy mode
    const health = await Promise.allSettled([services.openaiClient.isHealthy()]);
    legacyOpenaiHealth = health[0].status === 'fulfilled' && health[0].value;
  }
  
  // Check skill suggestion service
  const [skillServiceHealth] = await Promise.allSettled([
    services.skillSuggestionService.isHealthy()
  ]);
  const skillSuggestionServiceHealthy = skillServiceHealth.status === 'fulfilled' && skillServiceHealth.value;
  
  const hasHealthyProviders = Object.values(providersHealth).some(healthy => healthy) || legacyOpenaiHealth;
  
  return {
    ...(Object.keys(providersHealth).length > 0 ? { providers: providersHealth } : {}),
    ...(legacyOpenaiHealth ? { openaiClient: legacyOpenaiHealth } : {}),
    skillSuggestionService: skillSuggestionServiceHealthy,
    overall: hasHealthyProviders && skillSuggestionServiceHealthy
  };
}

// Metrics aggregation utility for multi-provider services
export function getAIServicesMetrics(services: Awaited<ReturnType<typeof createAIServices>>): {
  providers?: Record<string, import('./types').AIServiceMetrics>;
  openaiClient?: import('./types').AIServiceMetrics; // Legacy
  skillSuggestionService: import('./types').AIServiceMetrics;
  combined: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    rateLimitHits: number;
    failoverCount?: number;
  };
} {
  const skillServiceMetrics = services.skillSuggestionService.getMetrics();
  let providerMetrics: Record<string, import('./types').AIServiceMetrics> = {};
  let legacyOpenaiMetrics: import('./types').AIServiceMetrics | undefined;
  let failoverCount = 0;
  
  if (services.providerManager) {
    const aggregated = services.providerManager.getAggregatedMetrics();
    providerMetrics = aggregated.providers;
    failoverCount = aggregated.combined.failoverCount;
  } else if (services.openaiClient && 'getMetrics' in services.openaiClient) {
    legacyOpenaiMetrics = services.openaiClient.getMetrics();
  }
  
  // Calculate combined metrics
  const allMetrics = Object.values(providerMetrics).concat(
    legacyOpenaiMetrics ? [legacyOpenaiMetrics] : []
  ).concat([skillServiceMetrics]);
  
  const totalRequests = allMetrics.reduce((sum, metrics) => sum + metrics.total_requests, 0);
  const totalSuccessful = allMetrics.reduce((sum, metrics) => sum + metrics.successful_requests, 0);
  const successRate = totalRequests > 0 ? totalSuccessful / totalRequests : 0;
  
  const weightedResponseTime = totalRequests > 0 
    ? allMetrics.reduce((sum, metrics) => 
        sum + (metrics.average_response_time_ms * metrics.total_requests), 0
      ) / totalRequests
    : 0;
  
  const rateLimitHits = allMetrics.reduce((sum, metrics) => sum + metrics.rate_limit_hits, 0);

  return {
    ...(Object.keys(providerMetrics).length > 0 ? { providers: providerMetrics } : {}),
    ...(legacyOpenaiMetrics ? { openaiClient: legacyOpenaiMetrics } : {}),
    skillSuggestionService: skillServiceMetrics,
    combined: {
      totalRequests,
      successRate,
      averageResponseTime: weightedResponseTime,
      rateLimitHits,
      ...(failoverCount > 0 ? { failoverCount } : {})
    }
  };
}

// Default logger implementation for services that need logging
export class ConsoleLogger {
  info(message: string, context?: unknown): void {
    console.log(`[AI Service] INFO: ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }

  warn(message: string, context?: unknown): void {
    console.warn(`[AI Service] WARN: ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }

  error(message: string, error?: Error, context?: unknown): void {
    console.error(`[AI Service] ERROR: ${message}`, error?.message || '', context ? JSON.stringify(context, null, 2) : '');
    if (error?.stack) {
      console.error(error.stack);
    }
  }

  debug(message: string, context?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AI Service] DEBUG: ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }
}

// Enhanced factory function with logging for multi-provider
export async function createAIServicesWithLogging(
  config: {
    providers?: import('./types').MultiProviderConfig;
    legacyOpenAI?: Partial<import('./types').OpenAIClientConfig>;
  } = {},
  logger?: import('./types').Logger
) {
  const aiLogger = logger || new ConsoleLogger();
  const services = await createAIServices(config);
  
  // If we have a provider manager, pass the logger to skill suggestion service
  if (services.providerManager) {
    const { createSkillSuggestionService } = await import('./skill-suggestion-service');
    const skillSuggestionServiceWithLogger = createSkillSuggestionService({
      aiProvider: services.providerManager,
      promptManager: services.promptManager,
      logger: aiLogger
    });
    
    return {
      ...services,
      skillSuggestionService: skillSuggestionServiceWithLogger,
      logger: aiLogger
    };
  }
  
  // Legacy mode
  return {
    ...services,
    logger: aiLogger
  };
}

// Environment variable validation utility for multi-provider support
export function validateAIEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availableProviders: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const availableProviders: string[] = [];

  // Check for OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    if (process.env.OPENAI_API_KEY.length < 20) {
      warnings.push('OPENAI_API_KEY appears to be too short');
    } else {
      availableProviders.push('openai');
    }
  }
  
  // Check for Gemini API key
  if (process.env.GEMINI_API_KEY) {
    if (process.env.GEMINI_API_KEY.length < 20) {
      warnings.push('GEMINI_API_KEY appears to be too short');
    } else {
      availableProviders.push('gemini');
    }
  }
  
  // At least one provider should be available
  if (availableProviders.length === 0) {
    errors.push('No AI provider API keys found. Set OPENAI_API_KEY or GEMINI_API_KEY environment variables');
  }
  
  // Check provider preference
  if (process.env.AI_PREFERRED_PROVIDER) {
    const preferred = process.env.AI_PREFERRED_PROVIDER.toLowerCase();
    if (!['openai', 'gemini'].includes(preferred)) {
      warnings.push(`AI_PREFERRED_PROVIDER should be 'openai' or 'gemini', got '${preferred}'`);
    } else if (!availableProviders.includes(preferred)) {
      warnings.push(`Preferred provider '${preferred}' is not available (missing API key)`);
    }
  }

  // Check Node.js version for fetch support
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  if (majorVersion < 18) {
    warnings.push('Node.js 18+ recommended for better fetch support');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    availableProviders
  };
}

// Usage examples and documentation
export const USAGE_EXAMPLES = {
  basicSetup: `
    import { createAIServices } from '@/services/ai';
    
    const aiServices = createAIServices({
      model: 'gpt-4o-mini',
      temperature: 0.7
    });
  `,
  
  skillGeneration: `
    import { createSkillSuggestionContext } from '@/services/ai';
    
    const context = createSkillSuggestionContext(basicInfoData, companyName);
    const result = await aiServices.skillSuggestionService.generateSkills(context);
    
    if (result.success) {
      const { requirements, preferred_qualifications, responsibilities } = result.data;
      // Use the generated skills
    }
  `,
  
  healthCheck: `
    import { checkAIServicesHealth } from '@/services/ai';
    
    const health = await checkAIServicesHealth(aiServices);
    console.log('AI Services Health:', health);
  `
} as const;

const aiServices = {
  createAIServices,
  createLegacyAIServices,
  createAIServicesWithLogging,
  checkAIServicesHealth,
  getAIServicesMetrics,
  validateAIEnvironment,
  ConsoleLogger,
  USAGE_EXAMPLES
};

export default aiServices;