/**
 * Webhook System Public API
 * Exports all webhook system components
 */

// Services
export { WebhookVerifier } from "./services/WebhookVerifier";
export { WebhookProcessor } from "./services/WebhookProcessor";
export { WebhookRouter } from "./services/WebhookRouter";
export { WebhookStorage } from "./services/WebhookStorage";
export { RateLimiter } from "./services/RateLimiter";

// Types
export * from "./types";

// Constants
export * from "./constants";

// Handlers
export { teamTailorHandlers } from "./handlers/teamtailor";
export { salesforceHandlers } from "./handlers/salesforce";
export { checkrHandlers } from "./handlers/checkr";

// Webhook System Manager
import { WebhookVerifier } from "./services/WebhookVerifier";
import { WebhookProcessor } from "./services/WebhookProcessor";
import { WebhookRouter } from "./services/WebhookRouter";
import { WebhookStorage } from "./services/WebhookStorage";
import { RateLimiter } from "./services/RateLimiter";
import { WebhookHandler, WebhookAnalytics } from "./types";

/**
 * Webhook System Manager
 * Singleton manager for the webhook system
 */
export class WebhookSystem {
  private static instance: WebhookSystem;
  
  public readonly verifier: WebhookVerifier;
  public readonly processor: WebhookProcessor;
  public readonly router: WebhookRouter;
  public readonly storage: WebhookStorage;
  public readonly rateLimiter: RateLimiter;

  private constructor() {
    this.verifier = new WebhookVerifier();
    this.router = new WebhookRouter();
    this.storage = new WebhookStorage();
    this.rateLimiter = new RateLimiter();
    this.processor = new WebhookProcessor(
      this.verifier,
      this.router,
      this.storage,
      this.rateLimiter
    );
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebhookSystem {
    if (!WebhookSystem.instance) {
      WebhookSystem.instance = new WebhookSystem();
    }
    return WebhookSystem.instance;
  }

  /**
   * Initialize webhook system with handlers
   */
  initialize(handlers: Record<string, Record<string, WebhookHandler>>): void {
    // Register all handlers
    Object.entries(handlers).forEach(([provider, providerHandlers]) => {
      Object.entries(providerHandlers).forEach(([eventType, handler]) => {
        const handlerKey = `${provider}:${eventType}`;
        this.router.registerHandler(handlerKey, handler);
        this.router.registerEventMapping({
          provider,
          externalEvent: eventType,
          internalEvent: eventType,
          handler: handlerKey,
        });
      });
    });
  }

  /**
   * Process webhook event
   */
  async processEvent(
    provider: string,
    eventType: string,
    payload: unknown,
    headers: Record<string, string | string[]>,
    signature: string,
    secret: string,
    options?: {
      async?: boolean;
      retryOnFailure?: boolean;
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<{ statusCode: number; body: unknown }> {
    return this.processor.processWebhookEvent(
      provider,
      eventType,
      payload,
      headers,
      signature,
      secret,
      options
    );
  }

  /**
   * Get system statistics
   */
  async getStatistics(provider?: string): Promise<{
    events: {
      pending: number;
      processing: number;
      processed: number;
      failed: number;
      duplicate: number;
    };
    analytics: WebhookAnalytics[];
    rateLimits: Array<{
      provider: string;
      requests: number[];
      windowStart: number;
    }>;
  }> {
    const [eventStats, analytics, rateLimitState] = await Promise.all([
      this.processor.getProcessingStats(provider),
      this.storage.getAnalytics(provider),
      Promise.resolve(this.rateLimiter.getState()),
    ]);

    return {
      events: eventStats,
      analytics,
          rateLimits: Array.from(rateLimitState.entries()).map(([key, value]) => ({
      ...value,
      provider: key,
    })),
    };
  }

  /**
   * Reprocess failed events
   */
  async reprocessFailedEvents(
    provider?: string,
    limit?: number
  ): Promise<{ processed: number; failed: number }> {
    return this.processor.reprocessFailedEvents(provider, limit);
  }

  /**
   * Clean up old events
   */
  async cleanup(daysToKeep?: number): Promise<number> {
    return this.processor.cleanupOldEvents(daysToKeep);
  }
}

// Export singleton instance
export const webhookSystem = WebhookSystem.getInstance();