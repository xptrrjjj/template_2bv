/**
 * Webhook System Type Definitions
 */

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  payload: unknown;
  headers: Record<string, string | string[]>;
  signature?: string;
  receivedAt: string;
  processedAt?: string;
  status: WebhookEventStatus;
  attempts: number;
  lastError?: string;
  metadata?: Record<string, unknown>;
}

// Webhook Event Status
export enum WebhookEventStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PROCESSED = "processed",
  FAILED = "failed",
  INVALID = "invalid",
  DUPLICATE = "duplicate",
}

// Webhook Handler Response
export interface WebhookHandlerResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
  retryable?: boolean;
}

// Webhook Handler Function
export type WebhookHandler = (
  event: WebhookEvent
) => Promise<WebhookHandlerResponse>;

// Webhook Verification Result
export interface WebhookVerificationResult {
  isValid: boolean;
  provider: string;
  error?: string;
}

// Provider Webhook Config
export interface ProviderWebhookConfig {
  provider: string;
  signatureHeader: string;
  signatureAlgorithm: "hmac-sha256" | "hmac-sha1" | "custom";
  verificationMethod: (
    payload: string | Buffer,
    signature: string,
    secret: string
  ) => boolean;
  supportedEvents: string[];
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

// Webhook Route Params
export interface WebhookRouteParams {
  provider: string;
  event: string;
}

// Webhook Processing Options
export interface WebhookProcessingOptions {
  async?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// Provider Event Mapping
export interface ProviderEventMapping {
  provider: string;
  externalEvent: string;
  internalEvent: string;
  handler: string;
}

// Webhook Security Config
export interface WebhookSecurityConfig {
  ipAllowlist?: string[];
  maxPayloadSize: number;
  requireHttps: boolean;
  validateContentType: boolean;
}

// Rate Limit State
export interface RateLimitState {
  provider: string;
  requests: number[];
  windowStart: number;
}

// Webhook Analytics
export interface WebhookAnalytics {
  provider: string;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  lastEventAt?: string;
}