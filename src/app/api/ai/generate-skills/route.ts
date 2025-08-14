// API route for generating AI-powered job skills with multi-provider support
import { NextRequest, NextResponse } from 'next/server';
import { createAIServicesWithLogging, validateAIEnvironment, createSkillSuggestionContext, checkAIServicesHealth } from '@/services/ai';
import type { SkillSuggestionContext } from '@/services/ai';

interface GenerateSkillsRequest {
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

export async function POST(request: NextRequest) {
  try {
    // Validate environment
    const envValidation = validateAIEnvironment();
    if (!envValidation.isValid) {
      return NextResponse.json(
        { error: 'AI service not properly configured', details: envValidation.errors },
        { status: 500 }
      );
    }

    // Parse request body
    const body: GenerateSkillsRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof GenerateSkillsRequest)[] = [
      'title', 'level', 'department', 'employment_type', 'location', 
      'location_type', 'desired_minimum_years_experience', 'currency', 'company_name', 'contract_duration'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create AI services with multi-provider support
    const aiServices = await createAIServicesWithLogging({
      // Auto-configure from environment variables
      // Will use OPENAI_API_KEY and/or GEMINI_API_KEY
      // Provider preference set by AI_PREFERRED_PROVIDER
    });

    // Create suggestion context
    const context: SkillSuggestionContext = createSkillSuggestionContext(
      {
        title: body.title,
        level: body.level,
        department: body.department,
        employment_type: body.employment_type,
        location: body.location,
        location_type: body.location_type,
        desired_minimum_years_experience: body.desired_minimum_years_experience,
        currency: body.currency,
        target_budget_usd: body.target_budget_usd,
        time_zone: body.time_zone,
        contract_duration: body.contract_duration
      },
      body.company_name
    );

    // Generate skills with multi-provider failover
    const result = await aiServices.skillSuggestionService.generateSkills(context);

    if (!result.success) {
      console.error('Failed to generate skills:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to generate skills', 
          details: result.error?.message,
          code: result.error?.code
        },
        { status: 500 }
      );
    }

    // Get comprehensive metrics from all providers
    const allMetrics = aiServices.providerManager 
      ? aiServices.providerManager.getAggregatedMetrics()
      : { combined: aiServices.skillSuggestionService.getMetrics() };

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString(),
        service_metrics: allMetrics,
        provider_info: aiServices.providerManager ? {
          primary: aiServices.providerManager.getPrimaryProvider()?.info.name,
          failovers: aiServices.providerManager.getFailoverProviders().map(p => p.info.name)
        } : { legacy: 'openai' }
      }
    });

  } catch (error) {
    console.error('Error in generate-skills API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check endpoint with multi-provider status
export async function GET() {
  try {
    const envValidation = validateAIEnvironment();
    
    if (!envValidation.isValid) {
      return NextResponse.json({
        healthy: false,
        environment: envValidation,
        ai_services: { available: false }
      }, { status: 503 });
    }

    const aiServices = await createAIServicesWithLogging();
    const healthStatus = await checkAIServicesHealth(aiServices);

    return NextResponse.json({
      healthy: healthStatus.overall,
      environment: envValidation,
      ai_services: {
        available: true,
        healthy: healthStatus.overall,
        providers: healthStatus.providers || {},
        skill_suggestion_service: healthStatus.skillSuggestionService,
        metrics: aiServices.providerManager 
          ? aiServices.providerManager.getAggregatedMetrics()
          : aiServices.skillSuggestionService.getMetrics()
      },
      provider_info: aiServices.providerManager ? {
        primary: aiServices.providerManager.getPrimaryProvider()?.info.name,
        failovers: aiServices.providerManager.getFailoverProviders().map(p => p.info.name),
        strategy: aiServices.providerManager.getSelectionConfig().strategy
      } : { legacy: 'openai' }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}