/**
 * StateManager - Handles workflow state persistence and transitions
 * Manages state persistence to datastore via apiClient
 * Validates state transitions and maintains state history
 */

import { apiClient } from "@/services/api";
import {
  WorkflowState,
  WorkflowStateRecord,
  StateTransitionHistory,
  EntityType,
  WorkflowErrorClass,
  WorkflowErrorCode,
  StateTransitionRule,
} from "@/types/integrations";

export class StateManager {
  private static instance: StateManager;

  // Valid state transition matrix
  private readonly stateTransitions: Record<WorkflowState, WorkflowState[]> = {
    draft: ["pending_approval", "archived"],
    pending_approval: ["approved", "rejected", "draft"],
    approved: ["published", "draft"],
    published: ["archived"],
    rejected: ["draft", "archived"],
    archived: [],
  };

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Initialize state record for a new entity
   */
  async initializeEntityState(
    entityId: string,
    entityType: EntityType,
    initialState: WorkflowState = "draft",
    createdBy: string,
    metadata: Record<string, unknown> = {}
  ): Promise<WorkflowStateRecord> {
    try {
      const stateRecord: WorkflowStateRecord = {
        id: `state_${entityId}`,
        record_id: `state_${entityId}`,
        entity_id: entityId,
        entity_type: entityType,
        current_state: initialState,
        previous_state: undefined,
        state_metadata: metadata,
        transitions_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: createdBy,
      };

      const response = await apiClient.createRecord("workflow_states", stateRecord as unknown as Record<string, unknown>);

      if (response.status === "error") {
        throw new Error(`Failed to initialize entity state: ${response.message}`);
      }

      // Create initial state history entry
      await this.createTransitionHistory(
        entityId,
        null,
        initialState,
        "Entity initialized",
        createdBy,
        metadata
      );

      return stateRecord;
    } catch (error) {
      throw new WorkflowErrorClass(
        `Failed to initialize state for entity ${entityId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED,
        entityId,
        { workflow_state: initialState }
      );
    }
  }

  /**
   * Get current state of an entity
   */
  async getEntityState(entityId: string): Promise<WorkflowStateRecord | null> {
    try {
      const response = await apiClient.getRecords("workflow_states", { entity_id: entityId });
      return (response.data?.[0] as WorkflowStateRecord) || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update entity state with validation
   */
  async updateEntityState(
    entityId: string,
    newState: WorkflowState,
    updatedBy: string,
    reason?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<WorkflowStateRecord> {
    try {
      const currentStateRecord = await this.getEntityState(entityId);

      if (!currentStateRecord) {
        throw new WorkflowErrorClass(
          "Entity state not found",
          WorkflowErrorCode.ENTITY_NOT_FOUND,
          entityId
        );
      }

      // Validate transition
      const isValid = await this.isValidTransition(currentStateRecord.current_state, newState);
      if (!isValid) {
        throw new WorkflowErrorClass(
          `Invalid state transition from ${currentStateRecord.current_state} to ${newState}`,
          WorkflowErrorCode.INVALID_STATE_TRANSITION,
          entityId,
          { workflow_state: currentStateRecord.current_state }
        );
      }

      // Update state record
      const updatedStateRecord: WorkflowStateRecord = {
        ...currentStateRecord,
        previous_state: currentStateRecord.current_state,
        current_state: newState,
        state_metadata: { ...currentStateRecord.state_metadata, ...metadata },
        transitions_count: currentStateRecord.transitions_count + 1,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };

      const response = await apiClient.updateRecord("workflow_states", updatedStateRecord as unknown as Record<string, unknown>);

      if (response.status === "error") {
        throw new Error(`Failed to update entity state: ${response.message}`);
      }

      // Create transition history entry
      await this.createTransitionHistory(
        entityId,
        currentStateRecord.current_state,
        newState,
        reason || "State transition",
        updatedBy,
        metadata
      );

      return updatedStateRecord;
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to update state for entity ${entityId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED,
        entityId
      );
    }
  }

  /**
   * Validate if a state transition is allowed
   */
  async isValidTransition(fromState: WorkflowState, toState: WorkflowState): Promise<boolean> {
    const allowedTransitions = this.stateTransitions[fromState];
    return allowedTransitions.includes(toState);
  }

  /**
   * Get all valid next states for current state
   */
  getValidNextStates(currentState: WorkflowState): WorkflowState[] {
    return this.stateTransitions[currentState] || [];
  }

  /**
   * Get state transition history for an entity
   */
  async getStateHistory(
    entityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<StateTransitionHistory[]> {
    try {
      const response = await apiClient.getRecords("workflow_state_history", {
        entity_id: entityId,
        limit,
        offset,
      });
      return (response.data as StateTransitionHistory[]) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get entities by state
   */
  async getEntitiesByState(
    state: WorkflowState,
    entityType?: EntityType,
    limit: number = 100,
    offset: number = 0
  ): Promise<WorkflowStateRecord[]> {
    try {
      const filters: Record<string, unknown> = { current_state: state };
      if (entityType) {
        filters.entity_type = entityType;
      }

      const response = await apiClient.getRecords("workflow_states", {
        ...filters,
        limit,
        offset,
      });
      return (response.data as WorkflowStateRecord[]) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get state distribution metrics
   */
  async getStateDistribution(entityType?: EntityType): Promise<Record<WorkflowState, number>> {
    try {
      const filters: Record<string, unknown> = {};
      if (entityType) {
        filters.entity_type = entityType;
      }

      const response = await apiClient.getRecords("workflow_states", filters);
      const states = response.data || [];

      const distribution: Record<WorkflowState, number> = {
        draft: 0,
        pending_approval: 0,
        approved: 0,
        published: 0,
        rejected: 0,
        archived: 0,
      };

      (states as WorkflowStateRecord[]).forEach((stateRecord: WorkflowStateRecord) => {
        distribution[stateRecord.current_state]++;
      });

      return distribution;
    } catch {
      return {
        draft: 0,
        pending_approval: 0,
        approved: 0,
        published: 0,
        rejected: 0,
        archived: 0,
      };
    }
  }

  /**
   * Create state transition history entry
   */
  private async createTransitionHistory(
    entityId: string,
    fromState: WorkflowState | null,
    toState: WorkflowState,
    reason: string,
    triggeredBy: string,
    metadata: Record<string, unknown> = {}
  ): Promise<StateTransitionHistory> {
    const historyEntry: StateTransitionHistory = {
      id: `transition_${entityId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      record_id: `transition_${entityId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity_id: entityId,
      from_state: fromState,
      to_state: toState,
      transition_reason: reason,
      transition_metadata: metadata,
      triggered_by: triggeredBy,
      timestamp: new Date().toISOString(),
      is_valid: true,
      validation_errors: [],
    };

    try {
      await apiClient.createRecord("workflow_state_history", historyEntry as unknown as Record<string, unknown>);
      return historyEntry;
    } catch (error) {
      // Log error but don't fail the state transition
      console.error("Failed to create transition history:", error);
      return historyEntry;
    }
  }

  /**
   * Validate state transition with custom rules
   */
  async validateTransitionWithRules(
    entityId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    userId: string,
    rules: StateTransitionRule[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic state transition validation
    const basicValid = await this.isValidTransition(fromState, toState);
    if (!basicValid) {
      errors.push(`Invalid state transition from ${fromState} to ${toState}`);
    }

    // Find applicable rule
    const applicableRule = rules.find(
      (rule) => rule.from_state === fromState && rule.to_state === toState
    );

    if (applicableRule) {
      // Check permissions
      for (const permission of applicableRule.required_permissions) {
        // This would integrate with RBAC system
        // For now, we'll just validate the format
        if (!permission || typeof permission !== "string") {
          errors.push(`Invalid permission requirement: ${permission}`);
        }
      }

      // Check conditions
      if (applicableRule.conditions) {
        // Custom condition validation logic would go here
        // This could include business rules, entity-specific validations, etc.
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Batch update states for multiple entities
   */
  async batchUpdateStates(
    updates: Array<{
      entityId: string;
      newState: WorkflowState;
      reason?: string;
      metadata?: Record<string, unknown>;
    }>,
    updatedBy: string
  ): Promise<{
    successful: string[];
    failed: Array<{ entityId: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];

    for (const update of updates) {
      try {
        await this.updateEntityState(
          update.entityId,
          update.newState,
          updatedBy,
          update.reason,
          update.metadata
        );
        successful.push(update.entityId);
      } catch (error) {
        failed.push({
          entityId: update.entityId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Archive old state records
   */
  async archiveOldStates(olderThanDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const response = await apiClient.getRecords("workflow_states", {
        current_state: "archived",
        updated_before: cutoffDate.toISOString(),
      });

      const oldStates = response.data || [];
      let archivedCount = 0;

      for (const state of oldStates) {
        try {
          await apiClient.deleteRecord("workflow_states", (state as WorkflowStateRecord).record_id);
          archivedCount++;
        } catch (error) {
          console.error(`Failed to archive state ${(state as WorkflowStateRecord).record_id}:`, error);
        }
      }

      return archivedCount;
    } catch (error) {
      console.error("Failed to archive old states:", error);
      return 0;
    }
  }
}

export const stateManager = StateManager.getInstance();
