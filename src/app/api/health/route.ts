import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check information
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
      },
      services: await checkServices()
    };

    // Determine overall health status
    const allServicesHealthy = Object.values(health.services).every(
      (service: any) => service.status === 'healthy'
    );

    const statusCode = allServicesHealthy ? 200 : 503;
    const overallStatus = allServicesHealthy ? 'healthy' : 'unhealthy';

    return NextResponse.json(
      { ...health, status: overallStatus },
      { 
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

async function checkServices() {
  const services = {
    database: await checkDatabaseHealth(),
    ai_services: await checkAIServicesHealth(),
    external_apis: await checkExternalAPIsHealth(),
    auth: await checkAuthHealth()
  };

  return services;
}

async function checkDatabaseHealth() {
  try {
    // Check if API base URL is configured
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      return {
        status: 'warning',
        message: 'API base URL not configured',
        lastCheck: new Date().toISOString()
      };
    }

    // Simple connectivity check (you can enhance this with actual API call)
    const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    }).catch(() => null);

    return {
      status: response ? 'healthy' : 'unhealthy',
      message: response ? 'Database connection successful' : 'Database connection failed',
      lastCheck: new Date().toISOString(),
      responseTime: response ? 'OK' : 'Failed'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkAIServicesHealth() {
  const aiServices = [];

  // Check OpenAI
  if (process.env.OPENAI_API_KEY) {
    aiServices.push({
      name: 'OpenAI',
      configured: true,
      status: 'configured'
    });
  }

  // Check Gemini
  if (process.env.GEMINI_API_KEY) {
    aiServices.push({
      name: 'Gemini',
      configured: true,
      status: 'configured'
    });
  }

  return {
    status: aiServices.length > 0 ? 'healthy' : 'warning',
    message: aiServices.length > 0 ? 'AI services configured' : 'No AI services configured',
    services: aiServices,
    lastCheck: new Date().toISOString()
  };
}

async function checkExternalAPIsHealth() {
  const apis = [];

  // Check TestDome API
  if (process.env.TESTDOME_API_KEY) {
    apis.push({
      name: 'TestDome',
      configured: true,
      status: 'configured'
    });
  }

  // Check TeamTailor API
  if (process.env.TEAMTAILOR_API_KEY) {
    apis.push({
      name: 'TeamTailor',
      configured: true,
      status: 'configured'
    });
  }

  return {
    status: apis.length > 0 ? 'healthy' : 'warning',
    message: `${apis.length} external APIs configured`,
    apis: apis,
    lastCheck: new Date().toISOString()
  };
}

async function checkAuthHealth() {
  try {
    const azureConfigured = !!(
      process.env.NEXT_PUBLIC_AZURE_CLIENT_ID && 
      process.env.NEXT_PUBLIC_AZURE_TENANT_ID
    );

    return {
      status: azureConfigured ? 'healthy' : 'warning',
      message: azureConfigured ? 'Azure AD authentication configured' : 'Azure AD not fully configured',
      azure_ad: azureConfigured,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Auth health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastCheck: new Date().toISOString()
    };
  }
}