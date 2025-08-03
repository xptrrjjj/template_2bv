/**
 * TeamTailor Integration Provider
 * Complete integration solution for TeamTailor job posting platform
 */

// Main Integration
export { TeamTailorIntegration } from "./TeamTailorIntegration";

// Services
export { TeamTailorOptionsService } from "./services/options/TeamTailorOptionsService";
export { TeamTailorPublishingService } from "./services/publishing/TeamTailorPublishingService";
export { TeamTailorMappingService } from "./services/mapping/TeamTailorMappingService";

// Utilities
export { TeamTailorApiClient } from "./api/TeamTailorApiClient";
export { ErrorFactory } from "./errors/ErrorFactory";
export { OptionsTransformer } from "./services/options/OptionsTransformer";
export { JobPayloadBuilder } from "./services/publishing/JobPayloadBuilder";
export { FieldTransformers } from "./services/mapping/FieldTransformers";
export { FieldValidator } from "./services/mapping/FieldValidator";

// Constants and Configuration
export * from "./constants";
export * from "./types";

// Re-export types for convenience
export type { TeamTailorPublishResult } from "./types";

/**
 * TeamTailor Provider Configuration
 * Default configuration for TeamTailor integration
 */
export const TEAMTAILOR_PROVIDER_CONFIG = {
  id: "teamtailor",
  name: "TeamTailor",
  displayName: "TeamTailor",
  description: "Connect with TeamTailor to publish and manage job postings",
  iconUrl: "/integrations/teamtailor-logo.svg",
  category: "job_boards",
  version: "2.0.0", // Updated version
  isActive: true,
  authType: "api_key" as const,
  authConfig: {
    apiKeyField: "apiKey",
    apiKeyLabel: "TeamTailor API Key",
    apiKeyPlaceholder: "Enter your TeamTailor API key",
    helpText: "You can find your API key in TeamTailor Settings > API",
    testConnection: true,
  },
  endpoints: {
    base: "https://api.teamtailor.com/v1",
    auth: "",
    refresh: "",
    webhook: "",
  },
  rateLimits: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  features: [
    "job_posting",
    "job_updating",
    "job_archiving",
    "options_fetching",
    "health_check",
    "bulk_operations",
  ],
  supportedEntityTypes: ["job"],
  webhookSupport: false,
  webhookEvents: [],
  fieldMappings: {
    "role.title": "job.name",
    "role.description": "job.body",
    "role.requirements": "job.requirements",
    "role.department": "job.department_id",
    "role.location": "job.location_id",
    "role.salary": "job.salary_description",
    "role.employmentType": "job.employment_type",
    "role.startDate": "job.start_date",
    "role.endDate": "job.end_date",
    "role.tags": "job.tags",
    "role.referenceNumber": "job.reference_number",
    "role.status": "job.status",
  },
  requiredScopes: [],
  optionalScopes: [],
} as const;

/**
 * TeamTailor Integration Factory
 * Creates a new TeamTailor integration instance with the default configuration
 */
export function createTeamTailorIntegration() {
  // Dynamic import to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TeamTailorIntegration } = require('./TeamTailorIntegration');
  return new TeamTailorIntegration("teamtailor", TEAMTAILOR_PROVIDER_CONFIG);
}

/**
 * Register TeamTailor provider with the IntegrationManager
 * Call this function during application initialization to make TeamTailor available
 */
export function registerTeamTailorProvider() {
  // Import here to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { IntegrationManager } = require('../../core/IntegrationManager');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TeamTailorIntegration } = require('./TeamTailorIntegration');
  
  const integrationManager = IntegrationManager.getInstance();
  
  integrationManager.registerProvider(
    TEAMTAILOR_PROVIDER_CONFIG,
    TeamTailorIntegration
  );
  
  return {
    providerId: TEAMTAILOR_PROVIDER_CONFIG.id,
    displayName: TEAMTAILOR_PROVIDER_CONFIG.displayName,
    version: TEAMTAILOR_PROVIDER_CONFIG.version,
  };
}

/**
 * Utility function to validate TeamTailor API key format
 * @param apiKey - The API key to validate
 * @returns Boolean indicating if the API key format is valid
 */
export function isValidTeamTailorApiKey(apiKey: string): boolean {
  // TeamTailor API keys are typically 40+ character alphanumeric strings
  return typeof apiKey === "string" && apiKey.length >= 32 && /^[a-zA-Z0-9]+$/.test(apiKey);
}

/**
 * Utility function to generate TeamTailor job URL from job ID
 * @param companySlug - Company slug in TeamTailor
 * @param jobId - TeamTailor job ID
 * @returns Public job URL
 */
export function generateTeamTailorJobUrl(companySlug: string, jobId: string): string {
  return `https://${companySlug}.teamtailor.com/jobs/${jobId}`;
}

/**
 * Utility function to extract job ID from TeamTailor job URL
 * @param jobUrl - TeamTailor job URL
 * @returns Job ID if found, null otherwise
 */
export function extractJobIdFromUrl(jobUrl: string): string | null {
  const match = jobUrl.match(/\/jobs\/(\d+)/);
  return match ? match[1] : null;
}