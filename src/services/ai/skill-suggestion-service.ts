// Skill suggestion service for generating AI-powered job requirements, qualifications, and responsibilities
// Updated to support multi-provider AI system with failover
import type {
  SkillSuggestionService,
  SkillSuggestionContext,
  SkillSuggestionRequest,
  SkillSuggestionResponse,
  GeneratedSkills,
  AIServiceResponse,
  AIServiceMetrics,
  AIServiceDependencies,
  OpenAIServiceDependencies, // Legacy support
  OpenAIClient,
  AIProvider,
  PromptManager,
  Logger,
  SuggestionType
} from './types';
import { AI_ERROR_CODES } from './types';
import {
  createPromptContext,
  getPromptForSuggestionType,
  DEFAULT_PROMPT_TEMPLATES
} from './prompt-manager';

// Support both new multi-provider and legacy OpenAI-only dependencies
type SkillSuggestionServiceDependencies = 
  | AIServiceDependencies 
  | OpenAIServiceDependencies;

interface ParsedSkillsResponse {
  requirements?: string[];
  preferred_qualifications?: string[];
  responsibilities?: string[];
}

export class SkillSuggestionServiceImpl implements SkillSuggestionService {
  private aiProvider: AIProvider;
  private promptManager: PromptManager;
  private logger?: Logger;
  private metrics: AIServiceMetrics;
  private isLegacyMode: boolean;

  constructor(dependencies: SkillSuggestionServiceDependencies) {
    // Support both new multi-provider and legacy OpenAI-only modes
    if ('aiProvider' in dependencies) {
      this.aiProvider = dependencies.aiProvider;
      this.isLegacyMode = false;
    } else {
      // Legacy mode - wrap OpenAI client to match AIProvider interface
      this.aiProvider = this.wrapLegacyOpenAIClient(dependencies.openaiClient);
      this.isLegacyMode = true;
    }
    
    this.promptManager = dependencies.promptManager;
    this.logger = dependencies.logger;
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time_ms: 0,
      rate_limit_hits: 0,
      last_request_time: 0
    };
  }
  
  // Legacy support: wrap OpenAI client to match AIProvider interface
  private wrapLegacyOpenAIClient(openaiClient: OpenAIClient): AIProvider {
    return {
      generateCompletion: (prompt: string, options?: Record<string, unknown>) => 
        openaiClient.generateCompletion(prompt, options),
      isHealthy: () => openaiClient.isHealthy(),
      getMetrics: () => openaiClient.getMetrics()
    };
  }

  async generateSkills(context: SkillSuggestionContext): Promise<AIServiceResponse<GeneratedSkills>> {
    const startTime = Date.now();
    this.metrics.total_requests++;
    this.metrics.last_request_time = startTime;

    this.logger?.info('Generating comprehensive skills', { context });

    try {
      // Use comprehensive prompt to generate all skill types at once
      const promptContext = createPromptContext(context);
      const compiledPrompt = this.promptManager.compilePrompt(
        DEFAULT_PROMPT_TEMPLATES.COMPREHENSIVE_SKILLS,
        promptContext
      );

      this.logger?.debug('Compiled prompt', { 
        templateId: compiledPrompt.template_id,
        variablesUsed: compiledPrompt.variables_used 
      });

      const response = await this.aiProvider.generateCompletion(compiledPrompt.content, {
        temperature: 0.7,
        maxTokens: 2000
      });

      if (!response.success || !response.data) {
        this.updateMetrics(false, Date.now() - startTime);
        return {
          success: false,
          error: response.error || {
            code: AI_ERROR_CODES.UNKNOWN_ERROR,
            message: 'Failed to generate skills'
          }
        };
      }

      const parsedSkills = this.parseSkillsResponse(response.data);
      
      if (!this.validateParsedSkills(parsedSkills)) {
        this.updateMetrics(false, Date.now() - startTime);
        return {
          success: false,
          error: {
            code: AI_ERROR_CODES.PARSING_ERROR,
            message: 'Invalid response format from AI service'
          }
        };
      }

      const generatedSkills: GeneratedSkills = {
        requirements: parsedSkills.requirements || [],
        preferred_qualifications: parsedSkills.preferred_qualifications || [],
        responsibilities: parsedSkills.responsibilities || [],
        metadata: {
          generated_at: new Date().toISOString(),
          confidence_scores: {
            requirements: this.calculateConfidence(parsedSkills.requirements || []),
            preferred_qualifications: this.calculateConfidence(parsedSkills.preferred_qualifications || []),
            responsibilities: this.calculateConfidence(parsedSkills.responsibilities || [])
          },
          model_used: this.isLegacyMode ? 'gpt-4o-mini' : 'multi-provider'
        }
      };

      this.updateMetrics(true, Date.now() - startTime);
      this.logger?.info('Successfully generated comprehensive skills', {
        requirementsCount: generatedSkills.requirements.length,
        qualificationsCount: generatedSkills.preferred_qualifications.length,
        responsibilitiesCount: generatedSkills.responsibilities.length
      });

      return {
        success: true,
        data: generatedSkills
      };

    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      this.logger?.error('Error generating skills', error as Error, { context });

      return {
        success: false,
        error: {
          code: AI_ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async generateByType(request: SkillSuggestionRequest): Promise<AIServiceResponse<SkillSuggestionResponse>> {
    const startTime = Date.now();
    this.metrics.total_requests++;
    this.metrics.last_request_time = startTime;

    this.logger?.info('Generating skills by type', { type: request.type, context: request.context });

    try {
      const templateId = getPromptForSuggestionType(request.type);
      const promptContext = createPromptContext(request.context);
      
      const compiledPrompt = this.promptManager.compilePrompt(templateId, promptContext);

      this.logger?.debug('Compiled prompt for type generation', {
        type: request.type,
        templateId: compiledPrompt.template_id,
        variablesUsed: compiledPrompt.variables_used
      });

      const response = await this.aiProvider.generateCompletion(compiledPrompt.content, {
        temperature: 0.7,
        maxTokens: 1000
      });

      if (!response.success || !response.data) {
        this.updateMetrics(false, Date.now() - startTime);
        return {
          success: false,
          error: response.error || {
            code: AI_ERROR_CODES.UNKNOWN_ERROR,
            message: `Failed to generate ${request.type}`
          }
        };
      }

      const suggestions = this.parseArrayResponse(response.data);
      
      if (!suggestions || suggestions.length === 0) {
        this.updateMetrics(false, Date.now() - startTime);
        return {
          success: false,
          error: {
            code: AI_ERROR_CODES.PARSING_ERROR,
            message: 'No valid suggestions received from AI service'
          }
        };
      }

      // Filter out existing suggestions if provided
      const filteredSuggestions = request.existing 
        ? suggestions.filter(s => !request.existing!.includes(s))
        : suggestions;

      // Limit results if count is specified
      const finalSuggestions = request.count 
        ? filteredSuggestions.slice(0, request.count)
        : filteredSuggestions;

      const skillSuggestionResponse: SkillSuggestionResponse = {
        suggestions: finalSuggestions,
        confidence: this.calculateConfidence(finalSuggestions),
        reasoning: this.generateReasoning(request.type, request.context)
      };

      this.updateMetrics(true, Date.now() - startTime);
      this.logger?.info('Successfully generated skills by type', {
        type: request.type,
        suggestionsCount: finalSuggestions.length,
        confidence: skillSuggestionResponse.confidence
      });

      return {
        success: true,
        data: skillSuggestionResponse
      };

    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      this.logger?.error('Error generating skills by type', error as Error, { 
        type: request.type, 
        context: request.context 
      });

      return {
        success: false,
        error: {
          code: AI_ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  private parseSkillsResponse(response: string): ParsedSkillsResponse {
    try {
      // Remove any markdown formatting or extra text
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON structure');
      }

      return parsed as ParsedSkillsResponse;
    } catch (error) {
      this.logger?.warn('Failed to parse comprehensive skills response', { response, error });
      throw new Error(`Failed to parse skills response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  private parseArrayResponse(response: string): string[] | null {
    try {
      // Remove any markdown formatting or extra text
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.filter((item): item is string => 
        typeof item === 'string' && item.trim().length > 0
      );
    } catch (error) {
      this.logger?.warn('Failed to parse array response', { response, error });
      return null;
    }
  }

  private validateParsedSkills(skills: ParsedSkillsResponse): boolean {
    const hasRequirements = Boolean(skills.requirements && Array.isArray(skills.requirements) && skills.requirements.length > 0);
    const hasQualifications = Boolean(skills.preferred_qualifications && Array.isArray(skills.preferred_qualifications) && skills.preferred_qualifications.length > 0);
    const hasResponsibilities = Boolean(skills.responsibilities && Array.isArray(skills.responsibilities) && skills.responsibilities.length > 0);
    
    return hasRequirements || hasQualifications || hasResponsibilities;
  }

  private calculateConfidence(suggestions: string[]): number {
    // Simple confidence calculation based on suggestion quality indicators
    if (suggestions.length === 0) return 0;

    let qualityScore = 0;
    
    for (const suggestion of suggestions) {
      let itemScore = 0.5; // Base score

      // Length check - not too short or too long
      if (suggestion.length >= 20 && suggestion.length <= 200) {
        itemScore += 0.2;
      }

      // Specificity indicators
      if (suggestion.includes('experience') || suggestion.includes('years')) {
        itemScore += 0.1;
      }

      if (suggestion.match(/\b\d+\b/)) { // Contains numbers
        itemScore += 0.1;
      }

      // Technical terms (basic check)
      if (suggestion.match(/\b(API|framework|language|tool|platform|system)\b/i)) {
        itemScore += 0.1;
      }

      qualityScore += Math.min(itemScore, 1.0);
    }

    return Math.min(qualityScore / suggestions.length, 1.0);
  }

  private generateReasoning(type: SuggestionType, context: SkillSuggestionContext): string {
    const level = context.level.toLowerCase();
    const department = context.department.toLowerCase();
    
    const reasoningMap: Record<SuggestionType, string> = {
      requirements: `Generated essential requirements for a ${level} ${context.title} role in ${department}, considering ${context.desired_minimum_years_experience} years minimum experience and ${context.location_type} work arrangement.`,
      preferred_qualifications: `Identified valuable additional qualifications that would distinguish candidates for this ${level} position, focusing on skills that complement the core requirements.`,
      responsibilities: `Outlined key day-to-day activities and accountabilities appropriate for a ${level} ${context.title}, considering team dynamics and departmental objectives.`
    };

    return reasoningMap[type];
  }

  private updateMetrics(success: boolean, responseTime: number): void {
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

  async isHealthy(): Promise<boolean> {
    try {
      return await this.aiProvider.isHealthy();
    } catch {
      return false;
    }
  }

  getMetrics(): AIServiceMetrics {
    const providerMetrics = this.aiProvider.getMetrics();
    
    return {
      ...this.metrics,
      rate_limit_hits: providerMetrics.rate_limit_hits
    };
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

// Factory function for creating skill suggestion service instances
export function createSkillSuggestionService(
  dependencies: SkillSuggestionServiceDependencies
): SkillSuggestionService {
  return new SkillSuggestionServiceImpl(dependencies);
}

// Legacy factory function for backward compatibility
export function createLegacySkillSuggestionService(
  dependencies: OpenAIServiceDependencies
): SkillSuggestionService {
  return new SkillSuggestionServiceImpl(dependencies);
}

// Utility functions for skill suggestion
export function validateSkillSuggestionContext(context: SkillSuggestionContext): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!context.title?.trim()) {
    errors.push('Job title is required');
  }

  if (!context.level?.trim()) {
    errors.push('Job level is required');
  }

  if (!context.department?.trim()) {
    errors.push('Department is required');
  }

  if (!context.company_name?.trim()) {
    errors.push('Company name is required');
  }

  if (context.desired_minimum_years_experience < 0) {
    errors.push('Minimum years experience must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createSkillSuggestionRequest(
  context: SkillSuggestionContext,
  type: SuggestionType,
  options: {
    count?: number;
    existing?: string[];
  } = {}
): SkillSuggestionRequest {
  return {
    context,
    type,
    count: options.count,
    existing: options.existing
  };
}