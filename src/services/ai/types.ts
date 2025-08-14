// AI service type definitions for multi-provider AI integration
import type { JobRoleWizardStage2 } from '@/types/job-roles';

// Base AI service types
export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AIServiceError;
}

// OpenAI specific types
export interface OpenAIClientConfig extends AIServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
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

// Skill suggestion types
export interface SkillSuggestionContext {
  title: string;
  level: string;
  department: string;
  employment_type: string;
  location: string;
  location_type: 'remote' | 'hybrid' | 'on-site';
  desired_minimum_years_experience: number;
  currency: string;
  target_budget_usd?: number;
  company_name: string;
  time_zone?: string;
  contract_duration: string;
}

export type SuggestionType = 'requirements' | 'preferred_qualifications' | 'responsibilities';

export interface SkillSuggestionRequest {
  context: SkillSuggestionContext;
  type: SuggestionType;
  count?: number;
  existing?: string[];
}

export interface SkillSuggestionResponse {
  suggestions: string[];
  confidence: number;
  reasoning?: string;
}

export interface GeneratedSkills {
  requirements: string[];
  preferred_qualifications: string[];
  responsibilities: string[];
  metadata: {
    generated_at: string;
    confidence_scores: Record<SuggestionType, number>;
    model_used: string;
  };
}

// Prompt template types
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  version: string;
}

export interface PromptContext {
  [key: string]: string | number | boolean | undefined;
}

export interface CompiledPrompt {
  content: string;
  variables_used: string[];
  template_id: string;
}

// Rate limiting and error recovery types
export interface RateLimitInfo {
  requests_remaining: number;
  reset_time: number;
  retry_after?: number;
}

export interface RetryConfig {
  max_attempts: number;
  base_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
}

export interface AIServiceMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time_ms: number;
  rate_limit_hits: number;
  last_request_time: number;
}

// Multi-provider service dependency injection types
export interface AIServiceDependencies {
  aiProvider: AIProvider;
  promptManager: PromptManager;
  logger?: Logger;
}

// Legacy OpenAI specific dependencies (for backward compatibility)
export interface OpenAIServiceDependencies {
  openaiClient: OpenAIClient;
  promptManager: PromptManager;
  logger?: Logger;
}

// New provider interface
export interface AIProvider {
  generateCompletion(prompt: string, options?: Record<string, unknown>): Promise<AIServiceResponse<string>>;
  isHealthy(): Promise<boolean>;
  getMetrics(): AIServiceMetrics;
}

export interface OpenAIClient {
  generateCompletion(prompt: string, options?: Partial<OpenAIClientConfig>): Promise<AIServiceResponse<string>>;
  isHealthy(): Promise<boolean>;
  getMetrics(): AIServiceMetrics;
}

export interface PromptManager {
  getTemplate(id: string): PromptTemplate | null;
  compilePrompt(templateId: string, context: PromptContext): CompiledPrompt;
  listTemplates(): PromptTemplate[];
  validateTemplate(template: PromptTemplate): boolean;
}

export interface Logger {
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, error?: Error, context?: unknown): void;
  debug(message: string, context?: unknown): void;
}

// Skill suggestion service interface
export interface SkillSuggestionService {
  generateSkills(context: SkillSuggestionContext): Promise<AIServiceResponse<GeneratedSkills>>;
  generateByType(request: SkillSuggestionRequest): Promise<AIServiceResponse<SkillSuggestionResponse>>;
  isHealthy(): Promise<boolean>;
  getMetrics(): AIServiceMetrics;
}

// Configuration validation types
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Error codes for consistent error handling across all providers
export const AI_ERROR_CODES = {
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  API_KEY_INVALID: 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  INVALID_PROMPT: 'INVALID_PROMPT',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_FAILOVER: 'PROVIDER_FAILOVER',
  ALL_PROVIDERS_FAILED: 'ALL_PROVIDERS_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type AIErrorCode = typeof AI_ERROR_CODES[keyof typeof AI_ERROR_CODES];

// Default configuration values for multi-provider support
export const AI_SERVICE_DEFAULTS = {
  // OpenAI defaults
  openai: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000
  },
  // Gemini defaults
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000
  },
  // Common defaults
  model: 'gpt-4o-mini', // Legacy support
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
  retryConfig: {
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 10000,
    backoff_multiplier: 2
  },
  // Provider selection
  providerStrategy: 'primary-with-failover' as const,
  preferredProvider: 'openai' as const
} as const;

// Provider configuration types
export interface ProviderConfig {
  type: 'openai' | 'gemini';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface MultiProviderConfig {
  primary: ProviderConfig;
  failovers?: ProviderConfig[];
  strategy?: 'primary-only' | 'primary-with-failover' | 'load-balance' | 'fastest-first' | 'cost-optimize';
  maxRetries?: number;
  retryDelay?: number;
}

// Environment configuration
export interface AIEnvironmentConfig {
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PREFERRED_PROVIDER?: 'openai' | 'gemini';
  AI_PROVIDER_STRATEGY?: 'primary-only' | 'primary-with-failover' | 'load-balance';
  AI_MAX_RETRIES?: number;
}

// Context extraction utility type
export type BasicInfoContext = Pick<
  JobRoleWizardStage2,
  | 'title'
  | 'level'
  | 'department'
  | 'employment_type'
  | 'location'
  | 'location_type'
  | 'desired_minimum_years_experience'
  | 'currency'
  | 'target_budget_usd'
  | 'time_zone'
  | 'contract_duration'
> & {
  company_name: string;
};

// Position Analysis Types
export interface MarketRateData {
  min: number;
  max: number;
  currency: string;
  monthly?: boolean;
  factors?: string[];
  regional_variations?: Record<string, { min: number; max: number }>;
}

export interface MarketRateAnalysis {
  philippines: MarketRateData;
  usa: MarketRateData;
  confidence: 'high' | 'medium' | 'low';
  methodology?: string;
  market_insights?: string[];
  last_updated?: string;
}

export interface TalentAvailabilityData {
  score: number; // 1-10 scale
  availability: 'abundant' | 'moderate' | 'limited' | 'scarce';
  insights: string[];
  sources: string[];
  challenges?: string[];
  recommendations?: string[];
  hiring_timeline?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CostSavingsAnalysis {
  annual_savings: {
    amount_usd: number;
    percentage: number;
    breakdown: {
      salary_savings: number;
      overhead_savings: number;
      total_savings: number;
    };
  };
  three_year_projection: {
    total_savings: number;
    year_1: number;
    year_2: number;
    year_3: number;
  };
  cost_breakdown: {
    usa_annual_cost: number;
    ph_annual_cost_usd: number;
    company_rate_usd: number;
  };
  roi_metrics: {
    roi_percentage: number;
    payback_period_months: number;
    net_present_value: number;
  };
  risk_analysis: string[];
  assumptions: string[];
}

export interface ProviderAnalysisResult<T> {
  openai: T;
  gemini: T;
}

export interface PositionAnalysis {
  marketRates: ProviderAnalysisResult<MarketRateAnalysis>;
  talentAvailability: ProviderAnalysisResult<TalentAvailabilityData>;
  jobDescription: ProviderAnalysisResult<string>;
  rolePitch: ProviderAnalysisResult<string>;
  costSavings?: CostSavingsAnalysis; // Optional, calculated separately
  metadata: {
    generated_at: string;
    job_id?: string;
    special_instructions?: string;
    analysis_version: string;
  };
}

export interface PositionAnalysisRequest {
  jobData: BasicInfoContext;
  specialInstructions?: string;
  includeMarketRates?: boolean;
  includeTalentAvailability?: boolean;
  includeJobDescription?: boolean;
  includeRolePitch?: boolean;
  includeCostSavings?: boolean;
  costSavingsData?: {
    usa_rate_min: number;
    usa_rate_max: number;
    ph_rate_min: number;
    ph_rate_max: number;
    markup_percentage: number;
    exchange_rate: number;
  };
}

export interface PositionAnalysisResponse {
  success: boolean;
  data?: PositionAnalysis;
  error?: AIServiceError;
  partial_results?: Partial<PositionAnalysis>;
  provider_errors?: Record<string, AIServiceError>;
}

// Position Analysis Service Interface
export interface PositionAnalysisService {
  analyzeMarketRates(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<MarketRateAnalysis>>>;
  
  assessTalentAvailability(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<TalentAvailabilityData>>>;
  
  generateJobDescription(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<string>>>;
  
  generateRolePitch(
    jobData: BasicInfoContext,
    specialInstructions?: string
  ): Promise<AIServiceResponse<ProviderAnalysisResult<string>>>;
  
  calculateCostSavings(
    usaRateMin: number,
    usaRateMax: number,
    phRateMin: number,
    phRateMax: number,
    markupPercentage: number,
    exchangeRate?: number
  ): Promise<AIServiceResponse<CostSavingsAnalysis>>;
  
  analyzePosition(
    request: PositionAnalysisRequest
  ): Promise<PositionAnalysisResponse>;
  
  isHealthy(): Promise<boolean>;
  getMetrics(): AIServiceMetrics;
}