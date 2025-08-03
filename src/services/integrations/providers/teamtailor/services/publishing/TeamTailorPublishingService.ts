import { BaseService } from "../BaseService";
import { JobPayloadBuilder } from "./JobPayloadBuilder";
import { TEAMTAILOR_ENDPOINTS, TEAMTAILOR_API_CONFIG } from "../../constants";
import {
  TeamTailorPublishResult,
  TeamTailorSingleResponse,
  TeamTailorJob,
} from "../../types";

/**
 * TeamTailor Publishing Service
 * Handles job publishing, updating, and archiving operations
 */
export class TeamTailorPublishingService extends BaseService {
  constructor() {
    super(undefined, TEAMTAILOR_API_CONFIG.TIMEOUT.PUBLISHING);
  }

  /**
   * Publish a job to TeamTailor
   */
  async publishJob(
    apiKey: string,
    jobData: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Record<string, unknown>
  ): Promise<TeamTailorPublishResult> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("publishJob", async () => {
      const payload = JobPayloadBuilder.buildJobPayload(jobData);
      const response = await this.apiClient.post<TeamTailorSingleResponse<TeamTailorJob>>(
        TEAMTAILOR_ENDPOINTS.JOBS,
        apiKey,
        payload,
        this.defaultTimeout
      );

      return this.transformPublishResult(response.data);
    });
  }

  /**
   * Update an existing job in TeamTailor
   */
  async updateJob(
    apiKey: string,
    jobId: string,
    jobData: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Record<string, unknown>
  ): Promise<TeamTailorPublishResult> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("updateJob", async () => {
      const payload = JobPayloadBuilder.buildJobPayload(jobData);
      const endpoint = `${TEAMTAILOR_ENDPOINTS.JOBS}/${jobId}`;
      
      const response = await this.apiClient.patch<TeamTailorSingleResponse<TeamTailorJob>>(
        endpoint,
        apiKey,
        payload,
        this.defaultTimeout
      );

      return this.transformPublishResult(response.data);
    });
  }

  /**
   * Archive a job in TeamTailor
   */
  async archiveJob(apiKey: string, jobId: string): Promise<void> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("archiveJob", async () => {
      const payload = JobPayloadBuilder.buildArchivePayload();
      const endpoint = `${TEAMTAILOR_ENDPOINTS.JOBS}/${jobId}`;
      
      await this.apiClient.patch(endpoint, apiKey, payload, this.defaultTimeout);
    });
  }

  /**
   * Delete a job from TeamTailor
   */
  async deleteJob(apiKey: string, jobId: string): Promise<void> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("deleteJob", async () => {
      const endpoint = `${TEAMTAILOR_ENDPOINTS.JOBS}/${jobId}`;
      await this.apiClient.delete(endpoint, apiKey, this.defaultTimeout);
    });
  }

  /**
   * Get job status from TeamTailor
   */
  async getJobStatus(
    apiKey: string,
    jobId: string
  ): Promise<{ status: string; publishedAt?: string; archivedAt?: string }> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("getJobStatus", async () => {
      const endpoint = `${TEAMTAILOR_ENDPOINTS.JOBS}/${jobId}`;
      
      try {
        const response = await this.apiClient.get<TeamTailorSingleResponse<TeamTailorJob>>(
          endpoint,
          apiKey,
          undefined,
          this.defaultTimeout
        );

        const job = response.data;
        return {
          status: job.attributes.status,
          publishedAt: job.attributes["created-at"],
          archivedAt: job.attributes.status === "archived" 
            ? job.attributes["updated-at"] 
            : undefined,
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          return { status: "not_found" };
        }
        throw error;
      }
    });
  }

  /**
   * Transform API response to publish result
   */
  private transformPublishResult(job: TeamTailorJob): TeamTailorPublishResult {
    return {
      externalId: job.id,
      externalUrl: job.attributes["apply-url"] || "",
      metadata: {
        status: job.attributes.status,
        createdAt: job.attributes["created-at"],
        updatedAt: job.attributes["updated-at"],
        referenceNumber: job.attributes["reference-number"],
      },
    };
  }
}