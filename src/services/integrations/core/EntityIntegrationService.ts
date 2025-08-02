/**
 * EntityIntegrationService - Core service for entity CRUD operations with workflow integration
 * Manages entity lifecycle, workflow triggers, and integration with external systems
 */

import { apiClient } from "@/services/api";
import { stateManager } from "../workflows/StateManager";
import { entityPublishWorkflow } from "../workflows/EntityPublishWorkflow";
import { approvalService } from "../workflows/ApprovalService";
import {
  BaseEntity,
  WorkflowState,
  WorkflowErrorClass,
  WorkflowErrorCode,
  CreateEntityRequest,
  UpdateEntityRequest,
  EntityQueryRequest,
  EntityQueryResponse,
  EntityIntegrationRecord,
  IntegrationProvider,
  IntegrationSyncResult,
  BulkOperationResult,
  Priority,
} from "@/types/integrations";
import { AuditAction, AuditResourceType } from "@/types/rbac";

export class EntityIntegrationService {
  private static instance: EntityIntegrationService;

  private constructor() {}

  public static getInstance(): EntityIntegrationService {
    if (!EntityIntegrationService.instance) {
      EntityIntegrationService.instance = new EntityIntegrationService();
    }
    return EntityIntegrationService.instance;
  }

  /**
   * Create new entity with workflow integration
   */
  async createEntityWithIntegration(
    request: CreateEntityRequest,
    createdBy: string,
    integrationProviders: IntegrationProvider[] = []
  ): Promise<BaseEntity> {
    try {
      // Generate entity ID
      const entityId = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create base entity
      const entity: BaseEntity = {
        id: entityId,
        record_id: entityId,
        entity_type: request.entity_type,
        title: request.title,
        description: request.description,
        metadata: {
          ...request.metadata,
          workflow_enabled: true,
          integration_providers: integrationProviders,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: createdBy,
      };

      // Save entity to datastore
      const response = await apiClient.createRecord("entities", entity as unknown as Record<string, unknown>);
      if (response.status === "error") {
        throw new Error(`Failed to create entity: ${response.message}`);
      }

      // Initialize workflow state
      const initialState = request.initial_state || "draft";
      await stateManager.initializeEntityState(
        entityId,
        request.entity_type,
        initialState,
        createdBy,
        { entity_creation: true }
      );

      // Set up integrations if specified
      if (integrationProviders.length > 0) {
        await this.setupEntityIntegrations(entityId, integrationProviders, createdBy);
      }

      // Log entity creation
      await this.logEntityAction(entityId, createdBy, "entity_created", {
        entity_type: request.entity_type,
        initial_state: initialState,
        integration_providers: integrationProviders,
      });

      return entity;
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to create entity: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED
      );
    }
  }

  /**
   * Update entity with validation and workflow considerations
   */
  async updateEntity(
    entityId: string,
    updates: UpdateEntityRequest,
    updatedBy: string
  ): Promise<BaseEntity> {
    try {
      // Get current entity
      const currentEntity = await this.getEntity(entityId);
      if (!currentEntity) {
        throw new WorkflowErrorClass("Entity not found", WorkflowErrorCode.ENTITY_NOT_FOUND, entityId);
      }

      // Check if entity can be updated in current state
      const currentState = await stateManager.getEntityState(entityId);
      if (currentState && !this.canUpdateInState(currentState.current_state)) {
        throw new WorkflowErrorClass(
          `Cannot update entity in ${currentState.current_state} state`,
          WorkflowErrorCode.INVALID_STATE_TRANSITION,
          entityId,
          {
            workflow_state: currentState.current_state
          }
        );
      }

      // Create updated entity
      const updatedEntity: BaseEntity = {
        ...currentEntity,
        title: updates.title || currentEntity.title,
        description: updates.description || currentEntity.description,
        metadata: {
          ...currentEntity.metadata,
          ...updates.metadata,
        },
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };

      // Save updated entity
      const response = await apiClient.updateRecord("entities", updatedEntity as unknown as Record<string, unknown>);
      if (response.status === "error") {
        throw new Error(`Failed to update entity: ${response.message}`);
      }

      // Log entity update
      await this.logEntityAction(entityId, updatedBy, "entity_updated", {
        updates: Object.keys(updates),
        previous_title: currentEntity.title,
      });

      return updatedEntity;
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to update entity: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED,
        entityId
      );
    }
  }

  /**
   * Submit entity for approval workflow
   */
  async submitForApproval(
    entityId: string,
    submittedBy: string,
    priority: Priority = "medium",
    approvalNotes?: string
  ): Promise<{ success: boolean; approvalRequestId?: string; message: string }> {
    try {
      // Get entity
      const entity = await this.getEntity(entityId);
      if (!entity) {
        throw new WorkflowErrorClass("Entity not found", WorkflowErrorCode.ENTITY_NOT_FOUND, entityId);
      }

      // Check current state
      const currentState = await stateManager.getEntityState(entityId);
      if (!currentState) {
        throw new WorkflowErrorClass(
          "Entity state not found",
          WorkflowErrorCode.ENTITY_NOT_FOUND,
          entityId
        );
      }

      // Validate that entity can be submitted for approval
      if (currentState.current_state !== "draft") {
        throw new WorkflowErrorClass(
          `Cannot submit for approval from ${currentState.current_state} state`,
          WorkflowErrorCode.INVALID_STATE_TRANSITION,
          entityId,
          {
            workflow_state: currentState.current_state
          }
        );
      }

      // Transition to pending_approval state
      await entityPublishWorkflow.transitionState(
        {
          entity_id: entityId,
          to_state: "pending_approval",
          reason: "Submitted for approval",
          metadata: { submitted_by: submittedBy, priority },
        },
        submittedBy
      );

      // Create approval request
      const approvalRequest = await approvalService.createApprovalRequest(
        entityId,
        entity.entity_type,
        submittedBy,
        priority,
        undefined, // no deadline for now
        approvalNotes
      );

      return {
        success: true,
        approvalRequestId: approvalRequest.id,
        message: "Entity successfully submitted for approval",
      };
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to submit for approval: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED,
        entityId
      );
    }
  }

  /**
   * Approve entity and handle workflow progression
   */
  async approveEntity(
    approvalRequestId: string,
    approverId: string,
    notes?: string
  ): Promise<{ success: boolean; entityId: string; newState: WorkflowState; message: string }> {
    try {
      // Process approval decision
      const approvalResult = await approvalService.processApprovalDecision(
        {
          approval_request_id: approvalRequestId,
          action: "approve",
          notes,
        },
        approverId
      );

      // Get the approval request to find entity
      const approvalRequest = await approvalService.getApprovalRequest(approvalRequestId);
      if (!approvalRequest) {
        throw new WorkflowErrorClass("Approval request not found", WorkflowErrorCode.ENTITY_NOT_FOUND);
      }

      let newState: WorkflowState = "pending_approval";

      // If approval is complete, transition to approved state
      if (approvalResult.finalStatus === "approved") {
        const transitionResult = await entityPublishWorkflow.transitionState(
          {
            entity_id: approvalRequest.entity_id,
            to_state: "approved",
            reason: "Approval completed",
            metadata: { approved_by: approverId, approval_notes: notes },
          },
          approverId
        );

        newState = transitionResult.newState;
      }

      return {
        success: true,
        entityId: approvalRequest.entity_id,
        newState,
        message: approvalResult.message,
      };
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to approve entity: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED
      );
    }
  }

  /**
   * Reject entity and handle workflow
   */
  async rejectEntity(
    approvalRequestId: string,
    rejectorId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; entityId: string; message: string }> {
    try {
      // Process rejection decision
      await approvalService.processApprovalDecision(
        {
          approval_request_id: approvalRequestId,
          action: "reject",
          notes: rejectionReason,
        },
        rejectorId
      );

      // Get the approval request to find entity
      const approvalRequest = await approvalService.getApprovalRequest(approvalRequestId);
      if (!approvalRequest) {
        throw new WorkflowErrorClass("Approval request not found", WorkflowErrorCode.ENTITY_NOT_FOUND);
      }

      // Transition to rejected state
      await entityPublishWorkflow.transitionState(
        {
          entity_id: approvalRequest.entity_id,
          to_state: "rejected",
          reason: "Entity rejected",
          metadata: { rejected_by: rejectorId, rejection_reason: rejectionReason },
        },
        rejectorId
      );

      return {
        success: true,
        entityId: approvalRequest.entity_id,
        message: "Entity has been rejected",
      };
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to reject entity: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED
      );
    }
  }

  /**
   * Publish entity with integration sync and error handling
   */
  async publishEntity(
    entityId: string,
    publishedBy: string,
    targetProviders?: IntegrationProvider[]
  ): Promise<{ success: boolean; syncResults: IntegrationSyncResult[]; errors: string[] }> {
    const syncResults: IntegrationSyncResult[] = [];
    const errors: string[] = [];

    try {
      // Get entity
      const entity = await this.getEntity(entityId);
      if (!entity) {
        throw new WorkflowErrorClass("Entity not found", WorkflowErrorCode.ENTITY_NOT_FOUND, entityId);
      }

      // Check current state - must be approved
      const currentState = await stateManager.getEntityState(entityId);
      if (!currentState || currentState.current_state !== "approved") {
        throw new WorkflowErrorClass(
          "Entity must be approved before publishing",
          WorkflowErrorCode.INVALID_STATE_TRANSITION,
          entityId,
          {
            workflow_state: currentState?.current_state
          }
        );
      }

      // Get integration providers
      const providers =
        targetProviders || (entity.metadata.integration_providers as IntegrationProvider[]) || [];

      // Sync with each provider
      for (const provider of providers) {
        try {
          const syncResult = await this.syncEntityWithProvider(entityId, provider);
          syncResults.push(syncResult);
        } catch (error) {
          const errorMessage = `Failed to sync with ${provider}: ${error instanceof Error ? error.message : "Unknown error"}`;
          errors.push(errorMessage);

          syncResults.push({
            provider,
            entity_id: entityId,
            success: false,
            error_message: errorMessage,
            sync_timestamp: new Date().toISOString(),
            metadata: {},
          });
        }
      }

      // Check if any syncs were successful
      const hasSuccessfulSync = syncResults.some((result) => result.success);

      if (hasSuccessfulSync || providers.length === 0) {
        // Transition to published state
        await entityPublishWorkflow.transitionState(
          {
            entity_id: entityId,
            to_state: "published",
            reason: "Entity published",
            metadata: {
              published_by: publishedBy,
              sync_results: syncResults.length,
              successful_syncs: syncResults.filter((r) => r.success).length,
              failed_syncs: syncResults.filter((r) => !r.success).length,
            },
          },
          publishedBy
        );

        return {
          success: true,
          syncResults,
          errors,
        };
      } else {
        // All syncs failed - don't transition state
        errors.push("All integration syncs failed - entity not published");
        return {
          success: false,
          syncResults,
          errors,
        };
      }
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to publish entity: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.INTEGRATION_FAILURE,
        entityId
      );
    }
  }

  /**
   * Get entity by ID
   */
  async getEntity(entityId: string): Promise<BaseEntity | null> {
    try {
      const response = await apiClient.getRecords("entities", { id: entityId });
      return (response.data?.[0] as BaseEntity) || null;
    } catch {
      return null;
    }
  }

  /**
   * Query entities with filters
   */
  async queryEntities(request: EntityQueryRequest): Promise<EntityQueryResponse> {
    try {
      const filters: Record<string, unknown> = {};

      if (request.entity_type) filters.entity_type = request.entity_type;
      if (request.created_by) filters.created_by = request.created_by;
      if (request.created_after) filters.created_after = request.created_after;
      if (request.created_before) filters.created_before = request.created_before;

      // If state filter is specified, we need to join with workflow states
      if (request.state) {
        const stateRecords = await stateManager.getEntitiesByState(
          request.state,
          request.entity_type,
          request.limit,
          request.offset
        );

        const entityIds = stateRecords.map((sr) => sr.entity_id);
        if (entityIds.length === 0) {
          return { entities: [], total_count: 0, has_more: false };
        }

        filters.id_in = entityIds;
      }

      const response = await apiClient.getRecords("entities", {
        ...filters,
        limit: request.limit || 50,
        offset: request.offset || 0,
      });

      const entities = (response.data as BaseEntity[]) || [];
      const totalCount = entities.length; // DatastoreResponse doesn't have total_count
      const hasMore = entities.length === (request.limit || 50); // Has more if we got the full limit

      return {
        entities,
        total_count: totalCount,
        has_more: hasMore,
      };
    } catch {
      return { entities: [], total_count: 0, has_more: false };
    }
  }

  /**
   * Get entity state information
   */
  async getEntityStateInfo(entityId: string): Promise<{
    entity: BaseEntity | null;
    state: WorkflowState | null;
    availableTransitions: Array<{ state: WorkflowState; label: string; description?: string }>;
    pendingApprovals: number;
  }> {
    try {
      const [entity, stateRecord, pendingApprovals] = await Promise.all([
        this.getEntity(entityId),
        stateManager.getEntityState(entityId),
        approvalService.getApprovalRequestsForEntity(entityId),
      ]);

      let availableTransitions: Array<{
        state: WorkflowState;
        label: string;
        description?: string;
      }> = [];

      if (entity && stateRecord) {
        // This would need the userId to check permissions
        // For now, return empty array - should be called with userId in real implementation
        availableTransitions = [];
      }

      return {
        entity,
        state: stateRecord?.current_state || null,
        availableTransitions,
        pendingApprovals: pendingApprovals.filter((req) => req.status === "pending").length,
      };
    } catch {
      return {
        entity: null,
        state: null,
        availableTransitions: [],
        pendingApprovals: 0,
      };
    }
  }

  /**
   * Bulk operations on entities
   */
  async bulkPublishEntities(
    entityIds: string[],
    publishedBy: string
  ): Promise<BulkOperationResult> {
    const startTime = new Date().toISOString();
    const successful: string[] = [];
    const failed: Array<{ entity_id: string; error: string }> = [];

    for (const entityId of entityIds) {
      try {
        await this.publishEntity(entityId, publishedBy);
        successful.push(entityId);
      } catch (error) {
        failed.push({
          entity_id: entityId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      operation: "publish",
      total_entities: entityIds.length,
      successful_entities: successful,
      failed_entities: failed,
      started_at: startTime,
      completed_at: new Date().toISOString(),
      triggered_by: publishedBy,
    };
  }

  /**
   * Archive entity
   */
  async archiveEntity(entityId: string, archivedBy: string, reason?: string): Promise<void> {
    await entityPublishWorkflow.transitionState(
      {
        entity_id: entityId,
        to_state: "archived",
        reason: reason || "Entity archived",
        metadata: { archived_by: archivedBy },
      },
      archivedBy
    );
  }

  // Private helper methods

  private canUpdateInState(state: WorkflowState): boolean {
    // Allow updates in draft and rejected states
    return ["draft", "rejected"].includes(state);
  }

  private async setupEntityIntegrations(
    entityId: string,
    providers: IntegrationProvider[],
    createdBy: string
  ): Promise<void> {
    for (const provider of providers) {
      try {
        const integrationRecord: EntityIntegrationRecord = {
          id: `integration_${entityId}_${provider}`,
          record_id: `integration_${entityId}_${provider}`,
          entity_id: entityId,
          provider,
          integration_status: "pending",
          sync_metadata: { created_by: createdBy },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await apiClient.createRecord("entity_integrations", integrationRecord as unknown as Record<string, unknown>);
      } catch (error) {
        console.error(`Failed to setup integration for ${provider}:`, error);
      }
    }
  }

  private async syncEntityWithProvider(
    entityId: string,
    provider: IntegrationProvider
  ): Promise<IntegrationSyncResult> {
    try {
      // This would integrate with specific provider adapters
      // For now, simulate a successful sync

      const syncResult: IntegrationSyncResult = {
        provider,
        entity_id: entityId,
        success: true,
        external_id: `${provider}_${entityId}_${Date.now()}`,
        sync_timestamp: new Date().toISOString(),
        metadata: { sync_method: "api" },
      };

      // Update integration record
      await apiClient.updateRecord("entity_integrations", {
        record_id: `integration_${entityId}_${provider}`,
        integration_status: "synced",
        external_id: syncResult.external_id,
        last_sync_at: syncResult.sync_timestamp,
        sync_metadata: syncResult.metadata,
        updated_at: new Date().toISOString(),
      });

      return syncResult;
    } catch (error) {
      throw new Error(
        `Sync failed with ${provider}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private async logEntityAction(
    entityId: string,
    userId: string,
    action: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await apiClient.createAuditLog({
        user_id: userId, // Use correct property name
        action: action as AuditAction, // Cast to AuditAction - entity actions may not be in the enum
        resource_type: "entity" as AuditResourceType, // Cast to AuditResourceType - entity may not be in the enum
        resource_id: entityId,
        details,
      });
    } catch (error) {
      console.error("Failed to log entity action:", error);
    }
  }
}

export const entityIntegrationService = EntityIntegrationService.getInstance();
