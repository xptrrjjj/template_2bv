/**
 * Webhook System Constants
 */

import { WebhookSecurityConfig } from "./types";

// Webhook Providers
export const WEBHOOK_PROVIDERS = {
  TEAMTAILOR: "teamtailor",
  SALESFORCE: "salesforce",
  CHECKR: "checkr",
} as const;

// TeamTailor Webhook Events
export const TEAMTAILOR_WEBHOOK_EVENTS = {
  JOB_APPLICATION_CREATED: "job.application_created",
  JOB_PUBLISHED: "job.published",
  JOB_ARCHIVED: "job.archived",
  CANDIDATE_STAGE_CHANGED: "candidate.stage_changed",
} as const;

// Salesforce Webhook Events
export const SALESFORCE_WEBHOOK_EVENTS = {
  CONTACT_UPDATED: "contact.updated",
  OPPORTUNITY_CREATED: "opportunity.created",
  LEAD_CONVERTED: "lead.converted",
} as const;

// Checkr Webhook Events
export const CHECKR_WEBHOOK_EVENTS = {
  REPORT_COMPLETED: "report.completed",
  REPORT_DISPUTED: "report.disputed",
} as const;

// Webhook Headers
export const WEBHOOK_HEADERS = {
  TEAMTAILOR_SIGNATURE: "X-TeamTailor-Signature",
  SALESFORCE_SIGNATURE: "X-Salesforce-Signature",
  CHECKR_SIGNATURE: "X-Checkr-Signature",
  CONTENT_TYPE: "Content-Type",
  USER_AGENT: "User-Agent",
} as const;

// Security Configuration
export const DEFAULT_SECURITY_CONFIG: WebhookSecurityConfig = {
  maxPayloadSize: 5 * 1024 * 1024, // 5MB
  requireHttps: true,
  validateContentType: true,
};

// Rate Limiting
export const DEFAULT_RATE_LIMITS = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  windowSizeMs: 60000, // 1 minute
} as const;

// Processing Configuration
export const PROCESSING_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 5000,
  processingTimeoutMs: 30000,
  deduplicationWindowMs: 300000, // 5 minutes
} as const;

// Error Messages
export const WEBHOOK_ERROR_MESSAGES = {
  INVALID_SIGNATURE: "Invalid webhook signature",
  PROVIDER_NOT_FOUND: "Webhook provider not found",
  EVENT_NOT_SUPPORTED: "Event type not supported",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
  PAYLOAD_TOO_LARGE: "Payload size exceeds limit",
  PROCESSING_FAILED: "Failed to process webhook event",
  HANDLER_NOT_FOUND: "No handler found for event",
  INVALID_CONTENT_TYPE: "Invalid content type",
  HTTPS_REQUIRED: "HTTPS is required for webhook endpoints",
} as const;

// HTTP Status Codes
export const WEBHOOK_STATUS_CODES = {
  OK: 200,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;