import { WebhookHandler } from "../../types";
import { apiClient } from "@/services/api";

/**
 * Salesforce Contact Updated Handler
 */
export const handleContactUpdated: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      Id: string;
      Name: string;
      Email: string;
      Phone?: string;
      Title?: string;
      AccountId?: string;
      LastModifiedDate: string;
      ModifiedById: string;
    };

    // Store contact update event
    await apiClient.datastoreCreate({
      identifier: "crm_contact_events",
      action: "create",
      data: {
        app_id: "crm_contact_events",
        record_id: `contact_event_${event.id}`,
        event_type: "contact_updated",
        contact_id: payload.Id,
        contact_name: payload.Name,
        contact_email: payload.Email,
        contact_phone: payload.Phone,
        contact_title: payload.Title,
        account_id: payload.AccountId,
        modified_at: payload.LastModifiedDate,
        modified_by: payload.ModifiedById,
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Contact updated event processed",
      data: { contactId: payload.Id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process contact updated event",
      retryable: true,
    };
  }
};

/**
 * Salesforce Opportunity Created Handler
 */
export const handleOpportunityCreated: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      Id: string;
      Name: string;
      AccountId: string;
      Amount?: number;
      CloseDate: string;
      StageName: string;
      Probability?: number;
      OwnerId: string;
      CreatedDate: string;
      CreatedById: string;
    };

    // Store opportunity creation event
    await apiClient.datastoreCreate({
      identifier: "crm_opportunity_events",
      action: "create",
      data: {
        app_id: "crm_opportunity_events",
        record_id: `opp_event_${event.id}`,
        event_type: "opportunity_created",
        opportunity_id: payload.Id,
        opportunity_name: payload.Name,
        account_id: payload.AccountId,
        amount: payload.Amount,
        close_date: payload.CloseDate,
        stage: payload.StageName,
        probability: payload.Probability,
        owner_id: payload.OwnerId,
        created_at: payload.CreatedDate,
        created_by: payload.CreatedById,
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Opportunity created event processed",
      data: { opportunityId: payload.Id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process opportunity created event",
      retryable: true,
    };
  }
};

/**
 * Salesforce Lead Converted Handler
 */
export const handleLeadConverted: WebhookHandler = async (event) => {
  try {
    const payload = event.payload as {
      LeadId: string;
      ConvertedContactId: string;
      ConvertedAccountId: string;
      ConvertedOpportunityId?: string;
      ConvertedDate: string;
      ConvertedById: string;
    };

    // Store lead conversion event
    await apiClient.datastoreCreate({
      identifier: "crm_lead_events",
      action: "create",
      data: {
        app_id: "crm_lead_events",
        record_id: `lead_event_${event.id}`,
        event_type: "lead_converted",
        lead_id: payload.LeadId,
        contact_id: payload.ConvertedContactId,
        account_id: payload.ConvertedAccountId,
        opportunity_id: payload.ConvertedOpportunityId,
        converted_at: payload.ConvertedDate,
        converted_by: payload.ConvertedById,
        webhook_event_id: event.id,
        provider: event.provider,
      },
    });

    return {
      success: true,
      message: "Lead converted event processed",
      data: {
        leadId: payload.LeadId,
        contactId: payload.ConvertedContactId,
        accountId: payload.ConvertedAccountId,
        opportunityId: payload.ConvertedOpportunityId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process lead converted event",
      retryable: true,
    };
  }
};

/**
 * Export all Salesforce handlers
 */
export const salesforceHandlers = {
  "contact.updated": handleContactUpdated,
  "opportunity.created": handleOpportunityCreated,
  "lead.converted": handleLeadConverted,
};