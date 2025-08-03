import { WebhookHandler } from "../../types";
import { apiClient } from "@/services/api";

/**
 * Checkr Report Completed Handler
 */
export const handleReportCompleted: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      id: string;
      object: string;
      type: string;
      created_at: string;
      data: {
        object: {
          id: string;
          object: string;
          uri: string;
          status: string;
          created_at: string;
          completed_at: string;
          turnaround_time: number;
          package: string;
          candidate_id: string;
          ssn_trace_id?: string;
          sex_offender_search_id?: string;
          national_criminal_search_id?: string;
          county_criminal_search_ids?: string[];
          motor_vehicle_report_id?: string;
          state_criminal_search_ids?: string[];
          document_ids?: string[];
          geo_ids?: string[];
          tags?: string[];
          adjudication?: string;
          adverse_items?: unknown[];
        };
      };
    };

    const report = payload.data.object;

    // Store report completion event
    await apiClient.datastoreCreate({
      identifier: "background_check_events",
      action: "create",
      data: {
        app_id: "background_check_events",
        record_id: `bg_event_${event.id}`,
        event_type: "report_completed",
        report_id: report.id,
        candidate_id: report.candidate_id,
        status: report.status,
        package: report.package,
        completed_at: report.completed_at,
        turnaround_time: report.turnaround_time,
        adjudication: report.adjudication,
        has_adverse_items: (report.adverse_items?.length || 0) > 0,
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    // If there are adverse items, store them separately
    if (report.adverse_items && report.adverse_items.length > 0) {
      for (const item of report.adverse_items) {
        const adverseItem = item as {
          id: string;
          type: string;
          status: string;
          description: string;
        };
        
        await apiClient.datastoreCreate({
          identifier: "background_check_adverse_items",
          action: "create",
          data: {
            app_id: "background_check_adverse_items",
            record_id: `adverse_item_${report.id}_${adverseItem.id}`,
            report_id: report.id,
            candidate_id: report.candidate_id,
            item_id: adverseItem.id,
            item_type: adverseItem.type,
            item_status: adverseItem.status,
            item_description: adverseItem.description,
            created_at: new Date().toISOString(),
          },
        });
      }
    }

    return {
      success: true,
      message: "Report completed event processed",
      data: {
        reportId: report.id,
        candidateId: report.candidate_id,
        status: report.status,
        hasAdverseItems: (report.adverse_items?.length || 0) > 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process report completed event",
      retryable: true,
    };
  }
};

/**
 * Checkr Report Disputed Handler
 */
export const handleReportDisputed: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      id: string;
      object: string;
      type: string;
      created_at: string;
      data: {
        object: {
          id: string;
          object: string;
          uri: string;
          status: string;
          report_id: string;
          candidate_id: string;
          dispute_reason: string;
          dispute_explanation?: string;
          created_at: string;
          resolved_at?: string;
          resolution?: string;
        };
      };
    };

    const dispute = payload.data.object;

    // Store dispute event
    await apiClient.datastoreCreate({
      identifier: "background_check_disputes",
      action: "create",
      data: {
        app_id: "background_check_disputes",
        record_id: `dispute_${event.id}`,
        event_type: "report_disputed",
        dispute_id: dispute.id,
        report_id: dispute.report_id,
        candidate_id: dispute.candidate_id,
        status: dispute.status,
        reason: dispute.dispute_reason,
        explanation: dispute.dispute_explanation,
        created_at: dispute.created_at,
        resolved_at: dispute.resolved_at,
        resolution: dispute.resolution,
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    // Update the original report status
    await apiClient.datastoreCreate({
      identifier: "background_check_events",
      action: "update",
      data: {
        report_id: dispute.report_id,
        dispute_status: "active",
        dispute_id: dispute.id,
        updated_at: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Report disputed event processed",
      data: {
        disputeId: dispute.id,
        reportId: dispute.report_id,
        candidateId: dispute.candidate_id,
        reason: dispute.dispute_reason,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process report disputed event",
      retryable: true,
    };
  }
};

/**
 * Export all Checkr handlers
 */
export const checkrHandlers = {
  "report.completed": handleReportCompleted,
  "report.disputed": handleReportDisputed,
};