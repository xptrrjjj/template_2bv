// API route for comprehensive position analysis with market insights
import { NextRequest, NextResponse } from 'next/server';
import { getPositionAnalysisService } from '@/services/ai/position-analysis-service';
import type { PositionAnalysisRequest, BasicInfoContext } from '@/services/ai/types';

interface AnalyzePositionRequest {
  // Job data
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
  
  // Analysis options
  specialInstructions?: string;
  includeMarketRates?: boolean;
  includeTalentAvailability?: boolean;
  includeJobDescription?: boolean;
  includeRolePitch?: boolean;
  includeCostSavings?: boolean;
  
  // Cost savings data (required if includeCostSavings is true)
  costSavingsData?: {
    usa_rate_min: number;
    usa_rate_max: number;
    ph_rate_min: number;
    ph_rate_max: number;
    markup_percentage: number;
    exchange_rate?: number;
  };
}

interface AnalyzePositionResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
  code?: string;
  partial_results?: any;
  provider_errors?: Record<string, any>;
  metadata?: {
    timestamp: string;
    service_metrics: any;
    analysis_duration_ms: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzePositionResponse>> {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body: AnalyzePositionRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof AnalyzePositionRequest)[] = [
      'title', 'level', 'department', 'employment_type', 'location', 
      'location_type', 'desired_minimum_years_experience', 'currency', 
      'company_name', 'contract_duration'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false,
            error: `Missing required field: ${field}`,
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
    }

    // Validate cost savings requirements
    if (body.includeCostSavings && !body.costSavingsData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cost savings data is required when includeCostSavings is true',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Create job data context
    const jobData: BasicInfoContext = {
      title: body.title,
      level: body.level as any, // Type assertion for wizard compatibility
      department: body.department,
      employment_type: body.employment_type as any, // Type assertion for wizard compatibility
      location: body.location,
      location_type: body.location_type,
      desired_minimum_years_experience: body.desired_minimum_years_experience,
      currency: body.currency,
      target_budget_usd: body.target_budget_usd,
      time_zone: body.time_zone,
      contract_duration: body.contract_duration,
      company_name: body.company_name
    };

    // Create analysis request
    const analysisRequest: PositionAnalysisRequest = {
      jobData,
      specialInstructions: body.specialInstructions,
      includeMarketRates: body.includeMarketRates,
      includeTalentAvailability: body.includeTalentAvailability,
      includeJobDescription: body.includeJobDescription,
      includeRolePitch: body.includeRolePitch,
      includeCostSavings: body.includeCostSavings,
      costSavingsData: body.costSavingsData ? {
        usa_rate_min: body.costSavingsData.usa_rate_min,
        usa_rate_max: body.costSavingsData.usa_rate_max,
        ph_rate_min: body.costSavingsData.ph_rate_min,
        ph_rate_max: body.costSavingsData.ph_rate_max,
        markup_percentage: body.costSavingsData.markup_percentage,
        exchange_rate: body.costSavingsData.exchange_rate || 56
      } : undefined
    };

    // Get position analysis service
    const positionAnalysisService = getPositionAnalysisService();

    // Perform comprehensive analysis
    const result = await positionAnalysisService.analyzePosition(analysisRequest);
    const endTime = Date.now();

    if (!result.success) {
      console.error('Position analysis failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to analyze position',
        details: result.error?.message,
        code: result.error?.code,
        partial_results: result.partial_results,
        provider_errors: result.provider_errors,
        metadata: {
          timestamp: new Date().toISOString(),
          service_metrics: positionAnalysisService.getMetrics(),
          analysis_duration_ms: endTime - startTime
        }
      }, { status: 500 });
    }

    // Return successful result
    return NextResponse.json({
      success: true,
      data: result.data,
      partial_results: result.partial_results,
      provider_errors: result.provider_errors,
      metadata: {
        timestamp: new Date().toISOString(),
        service_metrics: positionAnalysisService.getMetrics(),
        analysis_duration_ms: endTime - startTime
      }
    });

  } catch (error) {
    const endTime = Date.now();
    console.error('Error in analyze-position API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR',
      metadata: {
        timestamp: new Date().toISOString(),
        service_metrics: null,
        analysis_duration_ms: endTime - startTime
      }
    }, { status: 500 });
  }
}

// Health check endpoint for position analysis service
export async function GET(): Promise<NextResponse> {
  try {
    const positionAnalysisService = getPositionAnalysisService();
    const isHealthy = await positionAnalysisService.isHealthy();
    const metrics = positionAnalysisService.getMetrics();

    if (!isHealthy) {
      return NextResponse.json({
        healthy: false,
        service: 'position-analysis',
        error: 'Service is not healthy',
        metrics
      }, { status: 503 });
    }

    return NextResponse.json({
      healthy: true,
      service: 'position-analysis',
      capabilities: [
        'market-rate-analysis',
        'talent-availability-assessment',
        'job-description-generation',
        'role-pitch-generation',
        'cost-savings-calculation'
      ],
      supported_providers: ['openai', 'gemini'],
      metrics,
      endpoints: {
        analyze: '/api/ai/analyze-position (POST)',
        health: '/api/ai/analyze-position (GET)'
      },
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Position analysis health check error:', error);
    return NextResponse.json({
      healthy: false,
      service: 'position-analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Quick analysis endpoint for individual components
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const analysisType = url.searchParams.get('type');
    
    if (!analysisType) {
      return NextResponse.json({
        success: false,
        error: 'Analysis type parameter is required',
        supported_types: ['market-rates', 'talent-availability', 'job-description', 'role-pitch', 'cost-savings']
      }, { status: 400 });
    }

    const body = await request.json();
    const positionAnalysisService = getPositionAnalysisService();

    // Create job data context
    const jobData: BasicInfoContext = {
      title: body.title,
      level: body.level as any, // Type assertion for wizard compatibility
      department: body.department,
      employment_type: body.employment_type as any, // Type assertion for wizard compatibility
      location: body.location,
      location_type: body.location_type,
      desired_minimum_years_experience: body.desired_minimum_years_experience,
      currency: body.currency,
      target_budget_usd: body.target_budget_usd,
      time_zone: body.time_zone,
      contract_duration: body.contract_duration,
      company_name: body.company_name
    };

    let result;

    switch (analysisType) {
      case 'market-rates':
        result = await positionAnalysisService.analyzeMarketRates(jobData, body.specialInstructions);
        break;
      
      case 'talent-availability':
        result = await positionAnalysisService.assessTalentAvailability(jobData, body.specialInstructions);
        break;
      
      case 'job-description':
        result = await positionAnalysisService.generateJobDescription(jobData, body.specialInstructions);
        break;
      
      case 'role-pitch':
        result = await positionAnalysisService.generateRolePitch(jobData, body.specialInstructions);
        break;
      
      case 'cost-savings':
        if (!body.costSavingsData) {
          return NextResponse.json({
            success: false,
            error: 'Cost savings data is required for cost-savings analysis'
          }, { status: 400 });
        }
        
        result = await positionAnalysisService.calculateCostSavings(
          body.costSavingsData.usa_rate_min,
          body.costSavingsData.usa_rate_max,
          body.costSavingsData.ph_rate_min,
          body.costSavingsData.ph_rate_max,
          body.costSavingsData.markup_percentage,
          body.costSavingsData.exchange_rate || 56
        );
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported analysis type: ${analysisType}`,
          supported_types: ['market-rates', 'talent-availability', 'job-description', 'role-pitch', 'cost-savings']
        }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to perform ${analysisType} analysis`,
        details: result.error?.message,
        code: result.error?.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      type: analysisType,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString(),
        analysis_type: analysisType
      }
    });

  } catch (error) {
    console.error('Error in quick analysis endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}