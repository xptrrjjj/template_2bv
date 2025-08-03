import {
  WebhookEvent,
  WebhookHandler,
  WebhookHandlerResponse,
  ProviderEventMapping,
} from "../types";
import { WEBHOOK_ERROR_MESSAGES, PROCESSING_CONFIG } from "../constants";

/**
 * Webhook Router Service
 * Routes webhook events to appropriate handlers
 */
export class WebhookRouter {
  private readonly handlers: Map<string, WebhookHandler>;
  private readonly eventMappings: Map<string, ProviderEventMapping>;
  private readonly fallbackHandlers: Map<string, WebhookHandler>;

  constructor() {
    this.handlers = new Map();
    this.eventMappings = new Map();
    this.fallbackHandlers = new Map();
  }

  /**
   * Register a webhook handler
   */
  registerHandler(
    handlerKey: string,
    handler: WebhookHandler
  ): void {
    this.handlers.set(handlerKey, handler);
  }

  /**
   * Register multiple handlers
   */
  registerHandlers(handlers: Record<string, WebhookHandler>): void {
    Object.entries(handlers).forEach(([key, handler]) => {
      this.registerHandler(key, handler);
    });
  }

  /**
   * Register event mapping
   */
  registerEventMapping(mapping: ProviderEventMapping): void {
    const key = this.getEventKey(mapping.provider, mapping.externalEvent);
    this.eventMappings.set(key, mapping);
  }

  /**
   * Register fallback handler for provider
   */
  registerFallbackHandler(
    provider: string,
    handler: WebhookHandler
  ): void {
    this.fallbackHandlers.set(provider, handler);
  }

  /**
   * Route webhook event to appropriate handler
   */
  async routeEvent(event: WebhookEvent): Promise<WebhookHandlerResponse> {
    try {
      // Get event mapping
      const eventKey = this.getEventKey(event.provider, event.eventType);
      const mapping = this.eventMappings.get(eventKey);

      if (!mapping) {
        // Try fallback handler
        const fallbackHandler = this.fallbackHandlers.get(event.provider);
        if (fallbackHandler) {
          return await this.executeHandler(fallbackHandler, event);
        }

        return {
          success: false,
          error: WEBHOOK_ERROR_MESSAGES.HANDLER_NOT_FOUND,
        };
      }

      // Get handler
      const handler = this.handlers.get(mapping.handler);
      if (!handler) {
        return {
          success: false,
          error: `Handler '${mapping.handler}' not found`,
        };
      }

      // Execute handler with timeout
      return await this.executeHandler(handler, event);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        retryable: true,
      };
    }
  }

  /**
   * Execute handler with timeout
   */
  private async executeHandler(
    handler: WebhookHandler,
    event: WebhookEvent
  ): Promise<WebhookHandlerResponse> {
    const timeoutPromise = new Promise<WebhookHandlerResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Handler execution timeout"));
      }, PROCESSING_CONFIG.processingTimeoutMs);
    });

    try {
      const result = await Promise.race([
        handler(event),
        timeoutPromise,
      ]);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Handler execution failed",
        retryable: true,
      };
    }
  }

  /**
   * Get event key for mapping
   */
  private getEventKey(provider: string, eventType: string): string {
    return `${provider}:${eventType}`;
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): Map<string, WebhookHandler> {
    return new Map(this.handlers);
  }

  /**
   * Get all event mappings
   */
  getEventMappings(): Map<string, ProviderEventMapping> {
    return new Map(this.eventMappings);
  }

  /**
   * Check if handler exists
   */
  hasHandler(handlerKey: string): boolean {
    return this.handlers.has(handlerKey);
  }

  /**
   * Check if event has mapping
   */
  hasEventMapping(provider: string, eventType: string): boolean {
    const key = this.getEventKey(provider, eventType);
    return this.eventMappings.has(key);
  }

  /**
   * Remove handler
   */
  removeHandler(handlerKey: string): boolean {
    return this.handlers.delete(handlerKey);
  }

  /**
   * Clear all handlers and mappings
   */
  clear(): void {
    this.handlers.clear();
    this.eventMappings.clear();
    this.fallbackHandlers.clear();
  }
}