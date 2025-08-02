/**
 * EntityPublishWorkflow - Main workflow manager for entity publishing lifecycle
 * Handles state transitions, validation, and workflow orchestration
 */

import { apiClient } from "@/services/api";
import { stateManager } from "./StateManager";
import {
  WorkflowState,
  EntityType,
  BaseEntity,
  WorkflowErrorClass,
  WorkflowErrorCode,
  StateTransitionRequest,
  WorkflowConfiguration,
  StateTransitionRule,
  EntityPublishingContext,
} from "@/types/integrations";
import { AuditAction, AuditResourceType } from "@/types/rbac";

export class EntityPublishWorkflow {
  private static instance: EntityPublishWorkflow;
  private workflowConfigurations: Map<EntityType, WorkflowConfiguration> = new Map();

  private constructor() {
    this.loadWorkflowConfigurations();
  }

  public static getInstance(): EntityPublishWorkflow {
    if (!EntityPublishWorkflow.instance) {
      EntityPublishWorkflow.instance = new EntityPublishWorkflow();
    }
    return EntityPublishWorkflow.instance;
  }

  /**
   * Transition entity to new state with validation and logging
   */
  async transitionState(
    request: StateTransitionRequest,
    userId: string,
    context?: EntityPublishingContext
  ): Promise<{ success: boolean; newState: WorkflowState; message?: string }> {
    try {
      // Get current entity state
      const currentStateRecord = await stateManager.getEntityState(request.entity_id);
      if (!currentStateRecord) {
        throw new WorkflowErrorClass(
          "Entity state not found",
          WorkflowErrorCode.ENTITY_NOT_FOUND,
          request.entity_id
        );
      }

      const fromState = currentStateRecord.current_state;
      const toState = request.to_state;

      // Validate transition
      const validationResult = await this.isValidTransition(
        request.entity_id,
        fromState,
        toState,
        userId,
        context
      );

      if (!validationResult.valid) {
        throw new WorkflowErrorClass(
          validationResult.reason || "Invalid transition",
          WorkflowErrorCode.INVALID_STATE_TRANSITION,
          request.entity_id,
          { workflow_state: fromState }
        );
      }

      // Perform pre-transition actions
      await this.executePreTransitionActions(request.entity_id, fromState, toState, userId);

      // Update state
      await stateManager.updateEntityState(
        request.entity_id,
        toState,
        userId,
        request.reason,
        request.metadata
      );

      // Update entity metadata
      await this.updateEntityMetadata(request.entity_id, {
        last_workflow_action: toState,
        last_workflow_user: userId,
        last_workflow_timestamp: new Date().toISOString(),
        ...request.metadata,
      });

      // Perform post-transition actions
      await this.executePostTransitionActions(request.entity_id, fromState, toState, userId);

      // Log the transition
      await this.logStateTransition(request.entity_id, fromState, toState, userId, request.reason);

      return {
        success: true,
        newState: toState,
        message: `Successfully transitioned from ${fromState} to ${toState}`,
      };
    } catch (error) {
      await this.logFailedTransition(
        request.entity_id,
        request.to_state,
        userId,
        error instanceof Error ? error.message : "Unknown error"
      );

      if (error instanceof WorkflowErrorClass) {
        throw error;
      }

      throw new WorkflowErrorClass(
        `Transition failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED,
        request.entity_id
      );
    }
  }

  /**
   * Validate if transition is allowed considering all rules and context
   */
  async isValidTransition(
    entityId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    userId: string,
    context?: EntityPublishingContext
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Basic state machine validation
      const basicValid = await stateManager.isValidTransition(fromState, toState);
      if (!basicValid) {
        return {
          valid: false,
          reason: `Invalid state transition from ${fromState} to ${toState}`,
        };
      }

      // Get entity to determine type
      const entity = await this.getEntity(entityId);
      if (!entity) {
        return {
          valid: false,
          reason: "Entity not found",
        };
      }

      // Get workflow configuration for entity type
      const config = this.workflowConfigurations.get(entity.entity_type);
      if (!config || !config.is_active) {
        return {
          valid: false,
          reason: "Workflow not configured or disabled for this entity type",
        };
      }

      // Find applicable transition rule
      const transitionRule = config.state_transitions.find(
        (rule) => rule.from_state === fromState && rule.to_state === toState
      );

      if (!transitionRule) {
        return {
          valid: false,
          reason: "No transition rule defined for this state change",
        };
      }

      // Check permissions
      for (const permission of transitionRule.required_permissions) {
        const hasPermission = await this.checkUserPermission(userId, permission, entity);
        if (!hasPermission) {
          return {
            valid: false,
            reason: `Missing required permission: ${permission}`,
          };
        }
      }

      // Check custom conditions
      if (transitionRule.conditions) {
        const conditionResult = await this.evaluateTransitionConditions();
        if (!conditionResult.valid) {
          return {
            valid: false,
            reason: conditionResult.reason || "Transition conditions not met",
          };
        }
      }

      // Special validations for specific transitions
      const specialValidation = await this.performSpecialValidations(
        entityId,
        fromState,
        toState,
        userId,
        context
      );

      if (!specialValidation.valid) {
        return specialValidation;
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get all possible next states for an entity
   */
  async getAvailableTransitions(
    entityId: string,
    userId: string
  ): Promise<Array<{ state: WorkflowState; label: string; description?: string }>> {
    try {
      const currentStateRecord = await stateManager.getEntityState(entityId);
      if (!currentStateRecord) {
        return [];
      }

      const currentState = currentStateRecord.current_state;
      const possibleStates = stateManager.getValidNextStates(currentState);
      const availableTransitions: Array<{
        state: WorkflowState;
        label: string;
        description?: string;
      }> = [];

      for (const targetState of possibleStates) {
        const validationResult = await this.isValidTransition(
          entityId,
          currentState,
          targetState,
          userId
        );
        if (validationResult.valid) {
          availableTransitions.push({
            state: targetState,
            label: this.getStateLabel(targetState),
            description: this.getTransitionDescription(currentState, targetState),
          });
        }
      }

      return availableTransitions;
    } catch (error) {
      console.error("Error getting available transitions:", error);
      return [];
    }
  }

  /**
   * Get workflow configuration for entity type
   */
  getWorkflowConfiguration(entityType: EntityType): WorkflowConfiguration | undefined {
    return this.workflowConfigurations.get(entityType);
  }

  /**
   * Update workflow configuration
   */
  async updateWorkflowConfiguration(
    entityType: EntityType,
    config: WorkflowConfiguration,
    updatedBy: string
  ): Promise<void> {
    try {
      const configData = {
        ...config,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };

      await apiClient.updateRecord("workflow_configurations", configData);
      this.workflowConfigurations.set(entityType, config);
    } catch (error) {
      throw new WorkflowErrorClass(
        `Failed to update workflow configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED
      );
    }
  }

  /**
   * Execute automatic transitions based on rules
   */
  async processAutomaticTransitions(): Promise<void> {
    try {
      for (const [entityType, config] of this.workflowConfigurations) {
        if (!config.is_active) continue;

        // Find automatic transition rules
        const autoRules = config.state_transitions.filter((rule) => rule.is_automatic);

        for (const rule of autoRules) {
          await this.processAutomaticTransitionsForRule(rule, entityType);
        }
      }
    } catch (error) {
      console.error("Error processing automatic transitions:", error);
    }
  }

  /**
   * Get workflow metrics for entity type
   */
  async getWorkflowMetrics(entityType?: EntityType): Promise<{
    totalEntities: number;
    stateDistribution: Record<WorkflowState, number>;
    averageTransitionTime: number;
    bottleneckStates: WorkflowState[];
  }> {
    try {
      const stateDistribution = await stateManager.getStateDistribution(entityType);
      const totalEntities = Object.values(stateDistribution).reduce((sum, count) => sum + count, 0);

      // Calculate average transition time (simplified)
      const averageTransitionTime = await this.calculateAverageTransitionTime();

      // Identify bottleneck states (states with high entity counts and low transition rates)
      const bottleneckStates = await this.identifyBottleneckStates(stateDistribution);

      return {
        totalEntities,
        stateDistribution,
        averageTransitionTime,
        bottleneckStates,
      };
    } catch (error) {
      console.error("Error getting workflow metrics:", error);
      return {
        totalEntities: 0,
        stateDistribution: {
          draft: 0,
          pending_approval: 0,
          approved: 0,
          published: 0,
          rejected: 0,
          archived: 0,
        },
        averageTransitionTime: 0,
        bottleneckStates: [],
      };
    }
  }

  // Private helper methods

  private async loadWorkflowConfigurations(): Promise<void> {
    try {
      const response = await apiClient.getRecords("workflow_configurations");
      const configs = response.data || [];

      for (const config of configs) {
        this.workflowConfigurations.set((config as WorkflowConfiguration).entity_type, config as WorkflowConfiguration);
      }
    } catch (error) {
      console.error("Failed to load workflow configurations:", error);
    }
  }

  private async getEntity(entityId: string): Promise<BaseEntity | null> {
    try {
      const response = await apiClient.getRecords("entities", { id: entityId });
      return (response.data?.[0] as BaseEntity) || null;
    } catch {
      return null;
    }
  }

  private async checkUserPermission(
    userId: string,
    permission: string,
    entity: BaseEntity
  ): Promise<boolean> {
    try {
      // This would integrate with the RBAC system
      const permissionCheck = await apiClient.checkPermission({
        userId,
        resource: entity.entity_type,
        action: permission.split(".").pop() || permission,
        appId: "integrations",
      });

      return permissionCheck.granted;
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  }

  private async evaluateTransitionConditions(): Promise<{ valid: boolean; reason?: string }> {
    // This would implement custom business logic evaluation
    // For now, return true as conditions are entity-specific
    return { valid: true };
  }

  private async performSpecialValidations(
    entityId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    userId: string,
    context?: EntityPublishingContext
  ): Promise<{ valid: boolean; reason?: string }> {
    // Special validation for publish transition
    if (toState === "published") {
      // Check if entity has required integrations
      if (context?.integration_requirements?.length) {
        const hasRequiredIntegrations = await this.validateRequiredIntegrations(
          entityId,
          context.integration_requirements
        );
        if (!hasRequiredIntegrations) {
          return {
            valid: false,
            reason: "Required integrations not configured",
          };
        }
      }
    }

    // Special validation for approval transition
    if (toState === "pending_approval") {
      // Check if there are available approvers
      const hasAvailableApprovers = await this.validateAvailableApprovers();
      if (!hasAvailableApprovers) {
        return {
          valid: false,
          reason: "No available approvers found",
        };
      }
    }

    return { valid: true };
  }

  private async executePreTransitionActions(
    entityId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    userId: string
  ): Promise<void> {
    // Pre-transition hooks - can be extended for specific business logic
    console.log(`Pre-transition: ${entityId} from ${fromState} to ${toState} by ${userId}`);
  }

  private async executePostTransitionActions(
    entityId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    userId: string
  ): Promise<void> {
    // Post-transition hooks - can be extended for specific business logic
    console.log(`Post-transition: ${entityId} from ${fromState} to ${toState} by ${userId}`);
  }

  private async updateEntityMetadata(
    entityId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const entity = await this.getEntity(entityId);
      if (entity) {
        const updatedMetadata = {
          ...entity.metadata,
          ...metadata,
        };

        await apiClient.updateRecord("entities", {
          id: entityId,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to update entity metadata:", error);
    }
  }

  private async logStateTransition(
    entityId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      await apiClient.createAuditLog({
        user_id: userId,
        action: "state_transition" as AuditAction,
        resource_type: "entity" as AuditResourceType,
        resource_id: entityId,
        details: {
          from_state: fromState,
          to_state: toState,
          reason,
        },
      });
    } catch (error) {
      console.error("Failed to log state transition:", error);
    }
  }

  private async logFailedTransition(
    entityId: string,
    attemptedState: WorkflowState,
    userId: string,
    error: string
  ): Promise<void> {
    try {
      await apiClient.createAuditLog({
        user_id: userId,
        action: "failed_state_transition" as AuditAction,
        resource_type: "entity" as AuditResourceType,
        resource_id: entityId,
        details: {
          attempted_state: attemptedState,
          error,
        },
      });
    } catch (auditError) {
      console.error("Failed to log failed transition:", auditError);
    }
  }

  private getStateLabel(state: WorkflowState): string {
    const labels: Record<WorkflowState, string> = {
      draft: "Draft",
      pending_approval: "Pending Approval",
      approved: "Approved",
      published: "Published",
      rejected: "Rejected",
      archived: "Archived",
    };
    return labels[state];
  }

  private getTransitionDescription(fromState: WorkflowState, toState: WorkflowState): string {
    return `Transition from ${this.getStateLabel(fromState)} to ${this.getStateLabel(toState)}`;
  }

  private async processAutomaticTransitionsForRule(
    rule: StateTransitionRule,
    entityType: EntityType
  ): Promise<void> {
    if (!rule.auto_transition_delay) return;

    try {
      // Find entities eligible for automatic transition
      const eligibleEntities = await stateManager.getEntitiesByState(rule.from_state!, entityType);

      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - rule.auto_transition_delay);

      for (const stateRecord of eligibleEntities) {
        const updatedAt = new Date(stateRecord.updated_at);
        if (updatedAt <= cutoffTime) {
          try {
            await this.transitionState(
              {
                entity_id: stateRecord.entity_id,
                to_state: rule.to_state,
                reason: "Automatic transition",
                metadata: { auto_transition: true },
              },
              "system"
            );
          } catch (error) {
            console.error(`Failed automatic transition for ${stateRecord.entity_id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error processing automatic transitions for rule:", error);
    }
  }

  private async calculateAverageTransitionTime(): Promise<number> {
    // Simplified calculation - in real implementation would analyze transition history
    return 60; // placeholder: 60 minutes
  }

  private async identifyBottleneckStates(
    stateDistribution: Record<WorkflowState, number>
  ): Promise<WorkflowState[]> {
    const bottlenecks: WorkflowState[] = [];
    const total = Object.values(stateDistribution).reduce((sum, count) => sum + count, 0);

    // Identify states with high percentage of entities
    Object.entries(stateDistribution).forEach(([state, count]) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      if (percentage > 25 && state !== "published" && state !== "archived") {
        bottlenecks.push(state as WorkflowState);
      }
    });

    return bottlenecks;
  }

  private async validateRequiredIntegrations(
    entityId: string,
    requiredProviders: string[]
  ): Promise<boolean> {
    try {
      const response = await apiClient.getRecords("entity_integrations", { entity_id: entityId });
      const integrations = response.data || [];

      const configuredProviders = (integrations as Array<Record<string, unknown>>)
        .filter(
          (integration: Record<string, unknown>) => integration.integration_status === "synced"
        )
        .map((integration: Record<string, unknown>) => integration.provider);

      return requiredProviders.every((provider) => configuredProviders.includes(provider));
    } catch {
      return false;
    }
  }

  private async validateAvailableApprovers(): Promise<boolean> {
    // This would check if there are users with approval permissions
    // For now, return true as a placeholder
    return true;
  }
}

export const entityPublishWorkflow = EntityPublishWorkflow.getInstance();
