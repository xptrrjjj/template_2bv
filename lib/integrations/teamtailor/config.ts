/**
 * Configuration module for TeamTailor integration
 * Validates environment variables and provides typed configuration
 */

import { z } from 'zod';

// Environment validation schema
const teamTailorConfigSchema = z.object({
  apiKey: z.string().min(1, "TeamTailor API key is required"),
  apiVersion: z.string().default("20240404"),
  baseUrl: z.string().url().default("https://api.teamtailor.com"),
  rateLimitPerSecond: z.number().default(5), // 50 per 10 seconds = 5 per second
  maxPageSize: z.number().max(30).default(30), // TeamTailor max page size
  defaultPageSize: z.number().default(30), // Use max for efficiency
  requestTimeout: z.number().default(30000), // 30 seconds
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000), // 1 second base delay
});

export type TeamTailorConfig = z.infer<typeof teamTailorConfigSchema>;

// Validate and create configuration from environment variables
function createConfig(): TeamTailorConfig {
  try {
    const config = teamTailorConfigSchema.parse({
      apiKey: process.env.TEAMTAILOR_API_KEY,
      apiVersion: process.env.TEAMTAILOR_API_VERSION,
      baseUrl: process.env.TEAMTAILOR_BASE_URL,
      rateLimitPerSecond: process.env.TEAMTAILOR_RATE_LIMIT_PER_SECOND 
        ? parseInt(process.env.TEAMTAILOR_RATE_LIMIT_PER_SECOND, 10) 
        : undefined,
      maxPageSize: process.env.TEAMTAILOR_MAX_PAGE_SIZE
        ? parseInt(process.env.TEAMTAILOR_MAX_PAGE_SIZE, 10)
        : undefined,
      defaultPageSize: process.env.TEAMTAILOR_DEFAULT_PAGE_SIZE
        ? parseInt(process.env.TEAMTAILOR_DEFAULT_PAGE_SIZE, 10)
        : undefined,
      requestTimeout: process.env.TEAMTAILOR_REQUEST_TIMEOUT
        ? parseInt(process.env.TEAMTAILOR_REQUEST_TIMEOUT, 10)
        : undefined,
      maxRetries: process.env.TEAMTAILOR_MAX_RETRIES
        ? parseInt(process.env.TEAMTAILOR_MAX_RETRIES, 10)
        : undefined,
      retryDelay: process.env.TEAMTAILOR_RETRY_DELAY
        ? parseInt(process.env.TEAMTAILOR_RETRY_DELAY, 10)
        : undefined,
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`TeamTailor configuration validation failed: ${issues}`);
    }
    throw error;
  }
}

// Export singleton configuration
export const teamTailorConfig = createConfig();

// Helper to get headers for API requests
export function getApiHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return {
    'Authorization': `Token token=${teamTailorConfig.apiKey}`,
    'X-Api-Version': teamTailorConfig.apiVersion,
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    ...customHeaders,
  };
}

// Helper to build full URL
export function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const url = new URL(endpoint, teamTailorConfig.baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          // Handle nested params like page[size]
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (nestedValue !== undefined && nestedValue !== null) {
              url.searchParams.append(`${key}[${nestedKey}]`, String(nestedValue));
            }
          });
        } else if (Array.isArray(value)) {
          // Handle array params like include=department,locations
          url.searchParams.append(key, value.join(','));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }
  
  return url.toString();
}