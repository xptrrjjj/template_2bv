import { createHash } from "crypto";
import { apiClient } from "@/services/api";
import {
  WebhookEvent,
  WebhookEventStatus,
  WebhookAnalytics,
} from "../types";
import { PROCESSING_CONFIG } from "../constants";

/**
 * Webhook Storage Service
 * Handles persistence and retrieval of webhook events
 */
export class WebhookStorage {
  private readonly appId = "webhook_events";
  private readonly analyticsAppId = "webhook_analytics";

  /**
   * Save webhook event to datastore
   */
  async saveEvent(event: WebhookEvent): Promise<void> {
    try {
      await apiClient.datastoreCreate({
        identifier: this.appId,
        action: "create",
        data: {
          app_id: this.appId,
          record_id: event.id,
          ...event,
        },
      });

      // Update analytics
      await this.updateAnalytics(event.provider, event.status);
    } catch (error) {
      console.error("Failed to save webhook event:", error);
      throw error;
    }
  }

  /**
   * Update webhook event
   */
  async updateEvent(event: WebhookEvent): Promise<void> {
    try {
      await apiClient.datastoreCreate({
        identifier: this.appId,
        action: "update",
        data: {
          record_id: event.id,
          ...event,
          updated_at: new Date().toISOString(),
        },
      });

      // Update analytics
      await this.updateAnalytics(event.provider, event.status);
    } catch (error) {
      console.error("Failed to update webhook event:", error);
      throw error;
    }
  }

  /**
   * Get webhook event by ID
   */
  async getEvent(eventId: string): Promise<WebhookEvent | null> {
    try {
      const response = await apiClient.datastoreRetrieve({
        identifier: this.appId,
        filters: {
          record_id: eventId,
        },
      });

      if (response.data && response.data.length > 0) {
        return response.data[0] as WebhookEvent;
      }
      return null;
    } catch (error) {
      console.error("Failed to retrieve webhook event:", error);
      return null;
    }
  }

  /**
   * Check if event is duplicate
   */
  async isDuplicate(event: WebhookEvent): Promise<boolean> {
    try {
      // Create event hash
      const eventHash = this.createEventHash(event);
      
      // Check for recent events with same hash
      const cutoffTime = new Date();
      cutoffTime.setMilliseconds(
        cutoffTime.getMilliseconds() - PROCESSING_CONFIG.deduplicationWindowMs
      );

      const response = await apiClient.datastoreRetrieve({
        identifier: this.appId,
        filters: {
          provider: event.provider,
          eventType: event.eventType,
          receivedAt: { $gt: cutoffTime.toISOString() },
        },
      });

      if (!response.data || response.data.length === 0) {
        return false;
      }

      // Check for matching hash
      return (response.data as WebhookEvent[]).some((existingEvent: WebhookEvent) => {
        const existingHash = this.createEventHash(existingEvent);
        return existingHash === eventHash;
      });
    } catch (error) {
      console.error("Failed to check for duplicate:", error);
      return false;
    }
  }

  /**
   * Get failed events
   */
  async getFailedEvents(
    provider?: string,
    limit: number = 100
  ): Promise<WebhookEvent[]> {
    try {
      const filters: Record<string, unknown> = {
        status: WebhookEventStatus.FAILED,
        attempts: { $lt: PROCESSING_CONFIG.maxRetries },
      };

      if (provider) {
        filters.provider = provider;
      }

      const response = await apiClient.datastoreRetrieve({
        identifier: this.appId,
        filters,
      });

      const events = (response.data as WebhookEvent[]) || [];
      return events.slice(0, limit); // Apply limit client-side
    } catch (error) {
      console.error("Failed to get failed events:", error);
      return [];
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(provider?: string): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
    duplicate: number;
  }> {
    try {
      const baseFilters = provider ? { provider } : {};

      const [pending, processing, processed, failed, duplicate] = await Promise.all([
        this.countEvents({ ...baseFilters, status: WebhookEventStatus.PENDING }),
        this.countEvents({ ...baseFilters, status: WebhookEventStatus.PROCESSING }),
        this.countEvents({ ...baseFilters, status: WebhookEventStatus.PROCESSED }),
        this.countEvents({ ...baseFilters, status: WebhookEventStatus.FAILED }),
        this.countEvents({ ...baseFilters, status: WebhookEventStatus.DUPLICATE }),
      ]);

      return { pending, processing, processed, failed, duplicate };
    } catch (error) {
      console.error("Failed to get event stats:", error);
      return { pending: 0, processing: 0, processed: 0, failed: 0, duplicate: 0 };
    }
  }

  /**
   * Delete events older than specified date
   */
  async deleteEventsOlderThan(cutoffDate: string): Promise<number> {
    try {
      const response = await apiClient.datastoreRetrieve({
        identifier: this.appId,
        filters: {
          receivedAt: { $lt: cutoffDate },
        },
      });

      if (!response.data || response.data.length === 0) {
        return 0;
      }

      let deleted = 0;
      for (const event of response.data) {
        try {
          await apiClient.datastoreCreate({
            identifier: this.appId,
            action: "delete",
            data: { record_id: (event as { record_id: string }).record_id },
          });
          deleted++;
        } catch (error) {
          console.error(`Failed to delete event ${(event as { record_id: string }).record_id}:`, error);
        }
      }

      return deleted;
    } catch (error) {
      console.error("Failed to delete old events:", error);
      return 0;
    }
  }

  /**
   * Get webhook analytics
   */
  async getAnalytics(provider?: string): Promise<WebhookAnalytics[]> {
    try {
      const filters = provider ? { provider } : {};

      const response = await apiClient.datastoreRetrieve({
        identifier: this.analyticsAppId,
        filters,
      });

      return (response.data as WebhookAnalytics[]) || [];
    } catch (error) {
      console.error("Failed to get analytics:", error);
      return [];
    }
  }

  /**
   * Create event hash for deduplication
   */
  private createEventHash(event: Partial<WebhookEvent>): string {
    const data = {
      provider: event.provider,
      eventType: event.eventType,
      payload: event.payload,
    };

    return createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  /**
   * Count events matching filters
   */
  private async countEvents(filters: Record<string, unknown>): Promise<number> {
    try {
      const response = await apiClient.datastoreRetrieve({
        identifier: this.appId,
        filters,
      });

      return response.data?.length || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Update analytics
   */
  private async updateAnalytics(
    provider: string,
    status: WebhookEventStatus
  ): Promise<void> {
    try {
      const analyticsId = `analytics_${provider}`;
      
      // Get existing analytics
      const existing = await apiClient.datastoreRetrieve({
        identifier: this.analyticsAppId,
        filters: {
          record_id: analyticsId,
        },
      });

      const existingAnalytics = existing.data?.[0] as Record<string, unknown> | undefined;
      const currentAnalytics: Record<string, unknown> = existingAnalytics ? { ...existingAnalytics } : {
        app_id: this.analyticsAppId,
        record_id: analyticsId,
        provider,
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        averageProcessingTime: 0,
      };

      // Update counters
      (currentAnalytics.totalEvents as number) += 1;
      if (status === WebhookEventStatus.PROCESSED) {
        (currentAnalytics.successfulEvents as number) += 1;
      } else if (status === WebhookEventStatus.FAILED) {
        (currentAnalytics.failedEvents as number) += 1;
      }
      currentAnalytics.lastEventAt = new Date().toISOString();

      // Save updated analytics
      await apiClient.datastoreCreate({
        identifier: this.analyticsAppId,
        action: existing.data && existing.data.length > 0 ? "update" : "create",
        data: currentAnalytics,
      });
    } catch (error) {
      console.error("Failed to update analytics:", error);
    }
  }
}