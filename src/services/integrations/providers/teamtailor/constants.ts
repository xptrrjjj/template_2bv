/**
 * TeamTailor API Constants
 * Centralized configuration for the TeamTailor integration
 */

// API Configuration
export const TEAMTAILOR_API_CONFIG = {
  BASE_URL: "https://api.teamtailor.com/v1",
  API_VERSION: "20240101", // Updated to latest version
  USER_AGENT: "SimplyAutomate-Recruiter/1.0",
  TIMEOUT: {
    DEFAULT: 30000,
    PUBLISHING: 60000,
  },
} as const;

// API Endpoints
export const TEAMTAILOR_ENDPOINTS = {
  DEPARTMENTS: "/departments",
  LOCATIONS: "/locations",
  JOB_TEMPLATES: "/job-templates",
  STAGES: "/stages",
  JOBS: "/jobs",
} as const;

// Option Types
export const TEAMTAILOR_OPTION_TYPES = {
  DEPARTMENTS: "departments",
  LOCATIONS: "locations",
  JOB_TEMPLATES: "job-templates",
  STAGES: "stages",
  ALL: "all",
} as const;

// Job Statuses
export const TEAMTAILOR_JOB_STATUSES = {
  PUBLISHED: "published",
  DRAFT: "draft",
  ARCHIVED: "archived",
} as const;

// Employment Types
export const TEAMTAILOR_EMPLOYMENT_TYPES = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract",
  FREELANCE: "freelance",
  INTERNSHIP: "internship",
  TEMPORARY: "temporary",
} as const;

// Cache Configuration
export const TEAMTAILOR_CACHE_CONFIG = {
  departments: { ttl: 3600000, maxSize: 1000 }, // 1 hour
  locations: { ttl: 3600000, maxSize: 1000 },
  jobTemplates: { ttl: 1800000, maxSize: 500 }, // 30 minutes
  stages: { ttl: 3600000, maxSize: 200 },
} as const;

// Field Mappings
export const DEFAULT_FIELD_MAPPINGS = {
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
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_API_KEY: "Invalid API key - authentication failed",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
  API_KEY_NOT_FOUND: "API key not found in credentials",
  UNSUPPORTED_ENTITY_TYPE: (type: string) => `Unsupported entity type: ${type}`,
  UNSUPPORTED_OPTION_TYPE: (type: string) => `Unsupported option type: ${type}`,
  MISSING_REQUIRED_FIELDS: (fields: string[]) => `Missing required fields: ${fields.join(", ")}`,
  INVALID_DATE_FORMAT: "Invalid date format. Use YYYY-MM-DD",
  INVALID_STATUS: "Status must be one of: published, draft, archived",
  JOB_NAME_TOO_LONG: "Job name must be 255 characters or less",
} as const;