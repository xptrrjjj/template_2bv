/**
 * Workflow Engine Export Barrel
 * Exports all workflow-related services and utilities
 */

// Core workflow services
export { StateManager, stateManager } from "./StateManager";
export { EntityPublishWorkflow, entityPublishWorkflow } from "./EntityPublishWorkflow";
export { ApprovalService, approvalService } from "./ApprovalService";

// Re-export entity integration service from core
export {
  EntityIntegrationService,
  entityIntegrationService,
} from "../core/EntityIntegrationService";

// Import instances for the WorkflowEngine class
import { stateManager } from "./StateManager";
import { entityPublishWorkflow } from "./EntityPublishWorkflow";
import { approvalService } from "./ApprovalService";
import { entityIntegrationService } from "../core/EntityIntegrationService";

// Types (re-exported for convenience)
export type {
  WorkflowState,
  EntityType,
  ApprovalStatus,
  Priority,
  IntegrationProvider,
  BaseEntity,
  WorkflowStateRecord,
  StateTransitionHistory,
  ApprovalRequest,
  ApprovalAction,
  EntityIntegrationRecord,
  WorkflowConfiguration,
  StateTransitionRule,
  ApprovalRule,
  EscalationRule,
  NotificationRule,
  WorkflowMetrics,
  EntityPublishingContext,
  WorkflowEvent,
  IntegrationSyncResult,
  BulkOperationResult,
  WorkflowError,
  WorkflowErrorCode,
  CreateEntityRequest,
  UpdateEntityRequest,
  StateTransitionRequest,
  ApprovalDecisionRequest,
  EntityQueryRequest,
  EntityQueryResponse,
} from "@/types/integrations";

// Workflow utilities and constants
export const WORKFLOW_STATES = {
  DRAFT: "draft" as const,
  PENDING_APPROVAL: "pending_approval" as const,
  APPROVED: "approved" as const,
  PUBLISHED: "published" as const,
  REJECTED: "rejected" as const,
  ARCHIVED: "archived" as const,
};

export const ENTITY_TYPES = {
  JOB_POSTING: "job_posting" as const,
  CANDIDATE: "candidate" as const,
  COMPANY_PROFILE: "company_profile" as const,
  USER_PROFILE: "user_profile" as const,
  CUSTOM: "custom" as const,
};

export const INTEGRATION_PROVIDERS = {
  TEAMTAILOR: "teamtailor" as const,
  GREENHOUSE: "greenhouse" as const,
  WORKDAY: "workday" as const,
  CUSTOM: "custom" as const,
};

export const APPROVAL_STATUSES = {
  PENDING: "pending" as const,
  APPROVED: "approved" as const,
  REJECTED: "rejected" as const,
};

export const PRIORITIES = {
  LOW: "low" as const,
  MEDIUM: "medium" as const,
  HIGH: "high" as const,
  URGENT: "urgent" as const,
};

/**
 * Workflow Engine Factory
 * Convenience factory for getting workflow services
 */
export class WorkflowEngine {
  private static instance: WorkflowEngine;

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  get stateManager() {
    return stateManager;
  }

  get workflowManager() {
    return entityPublishWorkflow;
  }

  get approvalService() {
    return approvalService;
  }

  get entityService() {
    return entityIntegrationService;
  }

  /**
   * Initialize workflow engine
   */
  async initialize(): Promise<void> {
    console.log("Workflow Engine initialized");
    // Any initialization logic would go here
  }

  /**
   * Shutdown workflow engine
   */
  async shutdown(): Promise<void> {
    console.log("Workflow Engine shutting down");
    // Any cleanup logic would go here
  }

  /**
   * Health check for workflow engine
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const services = {
      stateManager: true,
      workflowManager: true,
      approvalService: true,
      entityService: true,
    };

    // In a real implementation, you would check each service's health
    // For now, we'll just return healthy

    return {
      healthy: errors.length === 0,
      services,
      errors,
    };
  }
}

export const workflowEngine = WorkflowEngine.getInstance();

// Default export for the workflow engine
export default workflowEngine;
