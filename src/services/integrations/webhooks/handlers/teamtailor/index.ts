import { WebhookHandler } from "../../types";
import { apiClient } from "@/services/api";

/**
 * TeamTailor Job Application Created Handler
 */
export const handleJobApplicationCreated: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      data: {
        id: string;
        type: string;
        attributes: {
          "created-at": string;
          "updated-at": string;
          "rejected-at"?: string;
          "referring-url"?: string;
          "referring-site"?: string;
          "sourced": boolean;
        };
        relationships: {
          candidate: { data: { id: string; type: string } };
          job: { data: { id: string; type: string } };
          stage?: { data: { id: string; type: string } };
        };
      };
    };

    // Store application event
    await apiClient.datastoreCreate({
      identifier: "recruitment_application_events",
      action: "create",
      data: {
        app_id: "recruitment_application_events",
        record_id: `app_event_${event.id}`,
        event_type: "application_created",
        application_id: payload.data.id,
        candidate_id: payload.data.relationships.candidate.data.id,
        job_id: payload.data.relationships.job.data.id,
        stage_id: payload.data.relationships.stage?.data.id,
        created_at: payload.data.attributes["created-at"],
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Job application created event processed",
      data: { applicationId: payload.data.id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process application created event",
      retryable: true,
    };
  }
};

/**
 * TeamTailor Job Published Handler
 */
export const handleJobPublished: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      data: {
        id: string;
        type: string;
        attributes: {
          name: string;
          status: string;
          "created-at": string;
          "updated-at": string;
          "published-at": string;
        };
      };
    };

    // Update job status in datastore
    await apiClient.datastoreCreate({
      identifier: "recruitment_job_events",
      action: "create",
      data: {
        app_id: "recruitment_job_events",
        record_id: `job_event_${event.id}`,
        event_type: "job_published",
        job_id: payload.data.id,
        job_name: payload.data.attributes.name,
        status: payload.data.attributes.status,
        published_at: payload.data.attributes["published-at"],
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Job published event processed",
      data: { jobId: payload.data.id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process job published event",
      retryable: true,
    };
  }
};

/**
 * TeamTailor Job Archived Handler
 */
export const handleJobArchived: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      data: {
        id: string;
        type: string;
        attributes: {
          name: string;
          status: string;
          "archived-at": string;
        };
      };
    };

    // Update job status in datastore
    await apiClient.datastoreCreate({
      identifier: "recruitment_job_events",
      action: "create",
      data: {
        app_id: "recruitment_job_events",
        record_id: `job_event_${event.id}`,
        event_type: "job_archived",
        job_id: payload.data.id,
        job_name: payload.data.attributes.name,
        status: payload.data.attributes.status,
        archived_at: payload.data.attributes["archived-at"],
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Job archived event processed",
      data: { jobId: payload.data.id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process job archived event",
      retryable: true,
    };
  }
};

/**
 * TeamTailor Candidate Stage Changed Handler
 */
export const handleCandidateStageChanged: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      data: {
        id: string;
        type: string;
        attributes: {
          "moved-at": string;
        };
        relationships: {
          candidate: { data: { id: string; type: string } };
          "from-stage": { data: { id: string; type: string } };
          "to-stage": { data: { id: string; type: string } };
          job: { data: { id: string; type: string } };
        };
      };
    };

    // Store stage change event
    await apiClient.datastoreCreate({
      identifier: "recruitment_stage_events",
      action: "create",
      data: {
        app_id: "recruitment_stage_events",
        record_id: `stage_event_${event.id}`,
        event_type: "stage_changed",
        candidate_id: payload.data.relationships.candidate.data.id,
        job_id: payload.data.relationships.job.data.id,
        from_stage_id: payload.data.relationships["from-stage"].data.id,
        to_stage_id: payload.data.relationships["to-stage"].data.id,
        moved_at: payload.data.attributes["moved-at"],
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Candidate stage changed event processed",
      data: {
        candidateId: payload.data.relationships.candidate.data.id,
        fromStage: payload.data.relationships["from-stage"].data.id,
        toStage: payload.data.relationships["to-stage"].data.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process stage changed event",
      retryable: true,
    };
  }
};

/**
 * Export all TeamTailor handlers
 */
export const teamTailorHandlers = {
  "job.application_created": handleJobApplicationCreated,
  "job.published": handleJobPublished,
  "job.archived": handleJobArchived,
  "candidate.stage_changed": handleCandidateStageChanged,
};