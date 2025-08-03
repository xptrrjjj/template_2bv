import { v4 as uuidv4 } from "uuid";
import {
  WebhookEvent,
  WebhookEventStatus,
  WebhookHandlerResponse,
  WebhookProcessingOptions,
} from "../types";
import { WebhookVerifier } from "./WebhookVerifier";
import { WebhookRouter } from "./WebhookRouter";
import { WebhookStorage } from "./WebhookStorage";
import { RateLimiter } from "./RateLimiter";
import {
  WEBHOOK_ERROR_MESSAGES,
  PROCESSING_CONFIG,
  WEBHOOK_STATUS_CODES,
} from "../constants";

/**
 * Webhook Processor Service
 * Orchestrates webhook event processing
 */
export class WebhookProcessor {
  private readonly verifier: WebhookVerifier;
  private readonly router: WebhookRouter;
  private readonly storage: WebhookStorage;
  private readonly rateLimiter: RateLimiter;
  private readonly processingQueue: Map<string, Promise<WebhookHandlerResponse>>;

  constructor(
    verifier?: WebhookVerifier,
    router?: WebhookRouter,
    storage?: WebhookStorage,
    rateLimiter?: RateLimiter
  ) {
    this.verifier = verifier || new WebhookVerifier();
    this.router = router || new WebhookRouter();
    this.storage = storage || new WebhookStorage();
    this.rateLimiter = rateLimiter || new RateLimiter();
    this.processingQueue = new Map();
  }

  /**
   * Process incoming webhook event
   */
  async processWebhookEvent(
    provider: string,
    eventType: string,
    payload: unknown,
    headers: Record<string, string | string[]>,
    signature: string,
    secret: string,
    options: WebhookProcessingOptions = {}
  ): Promise<{ statusCode: number; body: unknown }> {
    try {
      // Check rate limits
      if (!this.rateLimiter.checkLimit(provider)) {
        return {
          statusCode: WEBHOOK_STATUS_CODES.RATE_LIMITED,
          body: { error: WEBHOOK_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED },
        };
      }

      // Verify signature
      const payloadString = typeof payload === "string" 
        ? payload 
        : JSON.stringify(payload);
      
      const verificationResult = await this.verifier.verifyWebhook(
        provider,
        payloadString,
        signature,
        secret
      );

      if (!verificationResult.isValid) {
        return {
          statusCode: WEBHOOK_STATUS_CODES.UNAUTHORIZED,
          body: { error: verificationResult.error },
        };
      }

      // Check if event is supported
      if (!this.verifier.isEventSupported(provider, eventType)) {
        return {
          statusCode: WEBHOOK_STATUS_CODES.BAD_REQUEST,
          body: { error: WEBHOOK_ERROR_MESSAGES.EVENT_NOT_SUPPORTED },
        };
      }

      // Create webhook event
      const event: WebhookEvent = {
        id: uuidv4(),
        provider,
        eventType,
        payload,
        headers,
        signature,
        receivedAt: new Date().toISOString(),
        status: WebhookEventStatus.PENDING,
        attempts: 0,
      };

      // Check for duplicates
      const isDuplicate = await this.storage.isDuplicate(event);
      if (isDuplicate) {
        event.status = WebhookEventStatus.DUPLICATE;
        await this.storage.saveEvent(event);
        return {
          statusCode: WEBHOOK_STATUS_CODES.OK,
          body: { message: "Duplicate event ignored" },
        };
      }

      // Store event
      await this.storage.saveEvent(event);

      // Process event
      if (options.async) {
        // Async processing
        this.processEventAsync(event, options);
        return {
          statusCode: WEBHOOK_STATUS_CODES.ACCEPTED,
          body: { message: "Event accepted for processing", eventId: event.id },
        };
      } else {
        // Sync processing
        const result = await this.processEvent(event, options);
        return {
          statusCode: result.success ? WEBHOOK_STATUS_CODES.OK : WEBHOOK_STATUS_CODES.INTERNAL_ERROR,
          body: result,
        };
      }
    } catch (error) {
      return {
        statusCode: WEBHOOK_STATUS_CODES.INTERNAL_ERROR,
        body: {
          error: error instanceof Error ? error.message : WEBHOOK_ERROR_MESSAGES.PROCESSING_FAILED,
        },
      };
    }
  }

  /**
   * Process event synchronously
   */
  private async processEvent(
    event: WebhookEvent,
    options: WebhookProcessingOptions
  ): Promise<WebhookHandlerResponse> {
    try {
      // Update status
      event.status = WebhookEventStatus.PROCESSING;
      event.attempts += 1;
      await this.storage.updateEvent(event);

      // Route to handler
      const result = await this.router.routeEvent(event);

      // Update event based on result
      if (result.success) {
        event.status = WebhookEventStatus.PROCESSED;
        event.processedAt = new Date().toISOString();
      } else {
        event.status = WebhookEventStatus.FAILED;
        event.lastError = result.error;

        // Retry if configured
        if (options.retryOnFailure && result.retryable && event.attempts < PROCESSING_CONFIG.maxRetries) {
          await this.scheduleRetry(event, options);
        }
      }

      await this.storage.updateEvent(event);
      return result;
    } catch (error) {
      event.status = WebhookEventStatus.FAILED;
      event.lastError = error instanceof Error ? error.message : "Unknown error";
      await this.storage.updateEvent(event);

      return {
        success: false,
        error: event.lastError,
        retryable: true,
      };
    }
  }

  /**
   * Process event asynchronously
   */
  private async processEventAsync(
    event: WebhookEvent,
    options: WebhookProcessingOptions
  ): Promise<void> {
    // Check if already processing
    if (this.processingQueue.has(event.id)) {
      return;
    }

    const processingPromise = this.processEvent(event, options);
    this.processingQueue.set(event.id, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.processingQueue.delete(event.id);
    }
  }

  /**
   * Schedule event retry
   */
  private async scheduleRetry(
    event: WebhookEvent,
    options: WebhookProcessingOptions
  ): Promise<void> {
    const delay = options.retryDelay || PROCESSING_CONFIG.retryDelayMs;
    
    setTimeout(async () => {
      await this.processEvent(event, options);
    }, delay * event.attempts);
  }

  /**
   * Reprocess failed events
   */
  async reprocessFailedEvents(
    provider?: string,
    limit: number = 100
  ): Promise<{ processed: number; failed: number }> {
    const failedEvents = await this.storage.getFailedEvents(provider, limit);
    let processed = 0;
    let failed = 0;

    for (const event of failedEvents) {
      const result = await this.processEvent(event, { retryOnFailure: false });
      if (result.success) {
        processed++;
      } else {
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(provider?: string): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
    duplicate: number;
  }> {
    return this.storage.getEventStats(provider);
  }

  /**
   * Clean up old events
   */
  async cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    return this.storage.deleteEventsOlderThan(cutoffDate.toISOString());
  }
}