/**
 * ApprovalService - Handles approval workflow logic and notifications
 * Manages approval requests, approver identification, and approval tracking
 */

import { apiClient } from "@/services/api";
import {
  ApprovalRequest,
  ApprovalAction,
  ApprovalStatus,
  Priority,
  EntityType,
  WorkflowErrorClass,
  WorkflowErrorCode,
  ApprovalDecisionRequest,
  ApprovalRule,
} from "@/types/integrations";
import { AuditAction, AuditResourceType } from "@/types/rbac";

export class ApprovalService {
  private static instance: ApprovalService;

  private constructor() {}

  public static getInstance(): ApprovalService {
    if (!ApprovalService.instance) {
      ApprovalService.instance = new ApprovalService();
    }
    return ApprovalService.instance;
  }

  /**
   * Create approval request for entity
   */
  async createApprovalRequest(
    entityId: string,
    entityType: EntityType,
    requestedBy: string,
    priority: Priority = "medium",
    approvalDeadline?: string,
    notes?: string
  ): Promise<ApprovalRequest> {
    try {
      // Get required approvers based on entity type and business rules
      const requiredApprovers = await this.getRequiredApprovers(entityType, entityId);
      const optionalApprovers = await this.getOptionalApprovers(entityType, entityId);

      if (requiredApprovers.length === 0) {
        throw new WorkflowErrorClass(
          "No required approvers found for this entity type",
          WorkflowErrorCode.INVALID_APPROVER
        );
      }

      const approvalRequest: ApprovalRequest = {
        id: `approval_${entityId}_${Date.now()}`,
        record_id: `approval_${entityId}_${Date.now()}`,
        entity_id: entityId,
        entity_type: entityType,
        requested_by: requestedBy,
        required_approvers: requiredApprovers,
        optional_approvers: optionalApprovers,
        current_approvers: [],
        status: "pending",
        priority: priority,
        approval_deadline: approvalDeadline,
        approval_notes: notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await apiClient.createRecord("approval_requests", approvalRequest as unknown as Record<string, unknown>);

      if (response.status === "error") {
        throw new Error(`Failed to create approval request: ${response.message}`);
      }

      // Notify approvers
      await this.notifyApprovers(approvalRequest.id, "approval_requested");

      // Log approval request creation
      await this.logApprovalAction(approvalRequest.id, requestedBy, "request_created", {
        required_approvers: requiredApprovers.length,
        optional_approvers: optionalApprovers.length,
        priority,
      });

      return approvalRequest;
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to create approval request: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED,
        entityId
      );
    }
  }

  /**
   * Process approval decision (approve/reject)
   */
  async processApprovalDecision(
    request: ApprovalDecisionRequest,
    approverId: string
  ): Promise<{ success: boolean; finalStatus?: ApprovalStatus; message: string }> {
    try {
      // Get approval request
      const approvalRequest = await this.getApprovalRequest(request.approval_request_id);
      if (!approvalRequest) {
        throw new WorkflowErrorClass("Approval request not found", WorkflowErrorCode.ENTITY_NOT_FOUND);
      }

      // Validate approver
      const isValidApprover = await this.validateApprover(approvalRequest, approverId);
      if (!isValidApprover.valid) {
        throw new WorkflowErrorClass(
          isValidApprover.reason || "Invalid approver",
          WorkflowErrorCode.INVALID_APPROVER
        );
      }

      // Check if already decided by this approver
      const existingAction = await this.getApprovalAction(request.approval_request_id, approverId);
      if (existingAction) {
        throw new WorkflowErrorClass(
          "Approval decision already recorded for this approver",
          WorkflowErrorCode.DUPLICATE_APPROVAL
        );
      }

      // Record approval action
      const approvalAction: ApprovalAction = {
        id: `action_${request.approval_request_id}_${approverId}_${Date.now()}`,
        record_id: `action_${request.approval_request_id}_${approverId}_${Date.now()}`,
        approval_request_id: request.approval_request_id,
        approver_id: approverId,
        action: request.action,
        notes: request.notes,
        timestamp: new Date().toISOString(),
      };

      await apiClient.createRecord("approval_actions", approvalAction as unknown as Record<string, unknown>);

      // Update approval request
      const updatedApprovers = [...approvalRequest.current_approvers];
      if (!updatedApprovers.includes(approverId)) {
        updatedApprovers.push(approverId);
      }

      // Handle rejection
      if (request.action === "reject") {
        const updatedRequest = {
          ...approvalRequest,
          status: "rejected" as ApprovalStatus,
          current_approvers: updatedApprovers,
          rejection_reason: request.notes,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };

        await apiClient.updateRecord("approval_requests", updatedRequest);

        // Notify stakeholders of rejection
        await this.notifyApprovers(request.approval_request_id, "approval_rejected");

        return {
          success: true,
          finalStatus: "rejected",
          message: "Entity has been rejected",
        };
      }

      // Handle approval - check if all required approvals are met
      const approvalStatus = await this.calculateApprovalStatus(approvalRequest, updatedApprovers);

      const updatedRequest = {
        ...approvalRequest,
        status: approvalStatus.status,
        current_approvers: updatedApprovers,
        updated_at: new Date().toISOString(),
        ...(approvalStatus.status === "approved" && { completed_at: new Date().toISOString() }),
      };

      await apiClient.updateRecord("approval_requests", updatedRequest);

      // Notify based on status
      if (approvalStatus.status === "approved") {
        await this.notifyApprovers(request.approval_request_id, "approval_completed");
      } else {
        await this.notifyApprovers(request.approval_request_id, "approval_progress");
      }

      return {
        success: true,
        finalStatus: approvalStatus.status,
        message: approvalStatus.message,
      };
    } catch (error) {
      if (error instanceof WorkflowErrorClass) {
        throw error;
      }
      throw new WorkflowErrorClass(
        `Failed to process approval decision: ${error instanceof Error ? error.message : "Unknown error"}`,
        WorkflowErrorCode.VALIDATION_FAILED
      );
    }
  }

  /**
   * Get required approvers for entity type
   */
  async getRequiredApprovers(entityType: EntityType, entityId?: string): Promise<string[]> {
    try {
      // Get approval rules for entity type
      const approvalRules = await this.getApprovalRules(entityType);

      if (approvalRules.length === 0) {
        return [];
      }

      const approvers: Set<string> = new Set();

      for (const rule of approvalRules) {
        // Get users with required roles
        const roleApprovers = await this.getUsersWithRoles(rule.required_approver_roles);
        roleApprovers.forEach((approver) => approvers.add(approver));
      }

      // Convert to array and apply any entity-specific filtering
      let approverList = Array.from(approvers);

      // Apply business logic filtering (e.g., exclude entity creator, apply hierarchy rules)
      if (entityId) {
        approverList = await this.filterApproversForEntity(approverList, entityId);
      }

      return approverList;
    } catch (error) {
      console.error("Error getting required approvers:", error);
      return [];
    }
  }

  /**
   * Get optional approvers for entity type
   */
  async getOptionalApprovers(entityType: EntityType, entityId?: string): Promise<string[]> {
    try {
      const approvalRules = await this.getApprovalRules(entityType);
      const approvers: Set<string> = new Set();

      for (const rule of approvalRules) {
        if (rule.optional_approver_roles) {
          const roleApprovers = await this.getUsersWithRoles(rule.optional_approver_roles);
          roleApprovers.forEach((approver) => approvers.add(approver));
        }
      }

      let approverList = Array.from(approvers);

      if (entityId) {
        approverList = await this.filterApproversForEntity(approverList, entityId);
      }

      return approverList;
    } catch (error) {
      console.error("Error getting optional approvers:", error);
      return [];
    }
  }

  /**
   * Notify approvers about approval events
   */
  async notifyApprovers(
    approvalRequestId: string,
    eventType:
      | "approval_requested"
      | "approval_progress"
      | "approval_completed"
      | "approval_rejected"
      | "escalation"
  ): Promise<void> {
    try {
      const approvalRequest = await this.getApprovalRequest(approvalRequestId);
      if (!approvalRequest) {
        return;
      }

      // Determine notification recipients based on event type
      let recipients: string[] = [];

      switch (eventType) {
        case "approval_requested":
          recipients = [
            ...approvalRequest.required_approvers,
            ...approvalRequest.optional_approvers,
          ];
          break;
        case "approval_progress":
          recipients = approvalRequest.required_approvers.filter(
            (approver) => !approvalRequest.current_approvers.includes(approver)
          );
          break;
        case "approval_completed":
        case "approval_rejected":
          recipients = [approvalRequest.requested_by, ...approvalRequest.current_approvers];
          break;
        case "escalation":
          recipients = await this.getEscalationRecipients(approvalRequest);
          break;
      }

      // Send notifications (this would integrate with notification system)
      for (const recipient of recipients) {
        await this.sendNotification(recipient, eventType, approvalRequest);
      }
    } catch (error) {
      console.error("Error notifying approvers:", error);
    }
  }

  /**
   * Get approval request by ID
   */
  async getApprovalRequest(approvalRequestId: string): Promise<ApprovalRequest | null> {
    try {
      const response = await apiClient.getRecords("approval_requests", { id: approvalRequestId });
      return (response.data?.[0] as ApprovalRequest) || null;
    } catch {
      return null;
    }
  }

  /**
   * Get approval requests for entity
   */
  async getApprovalRequestsForEntity(entityId: string): Promise<ApprovalRequest[]> {
    try {
      const response = await apiClient.getRecords("approval_requests", { entity_id: entityId });
      return (response.data as ApprovalRequest[]) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get pending approval requests for user
   */
  async getPendingApprovalsForUser(userId: string): Promise<ApprovalRequest[]> {
    try {
      const response = await apiClient.getRecords("approval_requests", { status: "pending" });
      const allRequests = response.data || [];

      // Filter requests where user is a required or optional approver and hasn't acted yet
      return (allRequests as ApprovalRequest[]).filter((request: ApprovalRequest) => {
        const isApprover =
          request.required_approvers.includes(userId) ||
          request.optional_approvers.includes(userId);
        const hasAlreadyActed = request.current_approvers.includes(userId);
        return isApprover && !hasAlreadyActed;
      });
    } catch {
      return [];
    }
  }

  /**
   * Get approval history for entity
   */
  async getApprovalHistory(
    entityId: string
  ): Promise<Array<ApprovalRequest & { actions: ApprovalAction[] }>> {
    try {
      const requests = await this.getApprovalRequestsForEntity(entityId);
      const history = [];

      for (const request of requests) {
        const actions = await this.getApprovalActionsForRequest(request.id);
        history.push({ ...request, actions });
      }

      return history.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Handle approval timeouts and escalations
   */
  async processApprovalTimeouts(): Promise<void> {
    try {
      const response = await apiClient.getRecords("approval_requests", { status: "pending" });
      const pendingRequests = response.data || [];

      for (const request of pendingRequests) {
        await this.checkAndHandleTimeout(request as ApprovalRequest);
      }
    } catch (error) {
      console.error("Error processing approval timeouts:", error);
    }
  }

  /**
   * Reject approval with reason
   */
  async rejectApproval(
    approvalRequestId: string,
    approverId: string,
    reason: string
  ): Promise<void> {
    await this.processApprovalDecision(
      {
        approval_request_id: approvalRequestId,
        action: "reject",
        notes: reason,
      },
      approverId
    );
  }

  // Private helper methods

  private async getApprovalRules(entityType: EntityType): Promise<ApprovalRule[]> {
    try {
      const response = await apiClient.getRecords("workflow_configurations", {
        entity_type: entityType,
      });
      const config = response.data?.[0] as Record<string, unknown>;
      return (config?.approval_rules as ApprovalRule[]) || [];
    } catch {
      return [];
    }
  }

  private async getUsersWithRoles(roles: string[]): Promise<string[]> {
    try {
      const users: string[] = [];

      for (const role of roles) {
        const response = await apiClient.getRecords("rbac_users");
        const allUsers = response.data || [];

        // Find users with this role (global or app-specific)
        const usersWithRole = (allUsers as Array<Record<string, unknown>>).filter(
          (user: Record<string, unknown>) =>
            (user.global_roles as string[])?.includes(role) ||
            Object.values((user.app_roles as Record<string, string[]>) || {})
              .flat()
              .includes(role)
        );

        usersWithRole.forEach((user: Record<string, unknown>) => {
          if (!users.includes(user.microsoft_oid as string)) {
            users.push(user.microsoft_oid as string);
          }
        });
      }

      return users;
    } catch {
      return [];
    }
  }

  private async filterApproversForEntity(approvers: string[], entityId: string): Promise<string[]> {
    try {
      // Get entity to check creator
      const response = await apiClient.getRecords("entities", { id: entityId });
      const entity = response.data?.[0] as Record<string, unknown>;

      if (entity && entity.created_by) {
        // Exclude entity creator from approvers
        return approvers.filter((approver) => approver !== entity.created_by);
      }

      return approvers;
    } catch {
      return approvers;
    }
  }

  private async validateApprover(
    approvalRequest: ApprovalRequest,
    approverId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check if approver is in required or optional approvers list
    const isRequiredApprover = approvalRequest.required_approvers.includes(approverId);
    const isOptionalApprover = approvalRequest.optional_approvers.includes(approverId);

    if (!isRequiredApprover && !isOptionalApprover) {
      return {
        valid: false,
        reason: "User is not authorized to approve this request",
      };
    }

    // Check if request is still pending
    if (approvalRequest.status !== "pending") {
      return {
        valid: false,
        reason: "Approval request is no longer pending",
      };
    }

    // Check if deadline has passed
    if (approvalRequest.approval_deadline) {
      const deadline = new Date(approvalRequest.approval_deadline);
      if (new Date() > deadline) {
        return {
          valid: false,
          reason: "Approval deadline has passed",
        };
      }
    }

    return { valid: true };
  }

  private async getApprovalAction(
    approvalRequestId: string,
    approverId: string
  ): Promise<ApprovalAction | null> {
    try {
      const response = await apiClient.getRecords("approval_actions", {
        approval_request_id: approvalRequestId,
        approver_id: approverId,
      });
      return (response.data?.[0] as ApprovalAction) || null;
    } catch {
      return null;
    }
  }

  private async getApprovalActionsForRequest(approvalRequestId: string): Promise<ApprovalAction[]> {
    try {
      const response = await apiClient.getRecords("approval_actions", {
        approval_request_id: approvalRequestId,
      });
      return (response.data as ApprovalAction[]) || [];
    } catch {
      return [];
    }
  }

  private async calculateApprovalStatus(
    approvalRequest: ApprovalRequest,
    currentApprovers: string[]
  ): Promise<{ status: ApprovalStatus; message: string }> {
    // Get approval rules to determine requirements
    const rules = await this.getApprovalRules(approvalRequest.entity_type);

    if (rules.length === 0) {
      // If no rules defined, require at least one required approver
      const hasRequiredApproval = approvalRequest.required_approvers.some((approver) =>
        currentApprovers.includes(approver)
      );

      return {
        status: hasRequiredApproval ? "approved" : "pending",
        message: hasRequiredApproval
          ? "All required approvals received"
          : "Waiting for required approvals",
      };
    }

    // Check if minimum required approvers have approved
    const rule = rules[0]; // Simplified - take first rule
    const requiredApprovalCount =
      rule.required_approver_count || approvalRequest.required_approvers.length;
    const approvedRequiredCount = currentApprovers.filter((approver) =>
      approvalRequest.required_approvers.includes(approver)
    ).length;

    if (approvedRequiredCount >= requiredApprovalCount) {
      return {
        status: "approved",
        message: "All required approvals received",
      };
    }

    return {
      status: "pending",
      message: `${approvedRequiredCount}/${requiredApprovalCount} required approvals received`,
    };
  }

  private async sendNotification(
    recipient: string,
    eventType: string,
    approvalRequest: ApprovalRequest
  ): Promise<void> {
    // This would integrate with a notification service
    console.log(`Notification: ${eventType} for approval ${approvalRequest.id} to ${recipient}`);

    // Log notification for audit trail
    try {
      await apiClient.createAuditLog({
        user_id: "system",
        action: "notification_sent" as AuditAction,
        resource_type: "approval_request" as AuditResourceType,
        resource_id: approvalRequest.id,
        details: {
          recipient,
          event_type: eventType,
          entity_id: approvalRequest.entity_id,
        },
      });
    } catch (error) {
      console.error("Failed to log notification:", error);
    }
  }

  private async getEscalationRecipients(approvalRequest: ApprovalRequest): Promise<string[]> {
    // Get escalation rules and determine recipients
    const rules = await this.getApprovalRules(approvalRequest.entity_type);
    const escalationRecipients: string[] = [];

    for (const rule of rules) {
      if (rule.escalation_rules) {
        for (const escalationRule of rule.escalation_rules) {
          const roleUsers = await this.getUsersWithRoles(escalationRule.escalate_to_roles);
          escalationRecipients.push(...roleUsers);
        }
      }
    }

    return [...new Set(escalationRecipients)]; // Remove duplicates
  }

  private async checkAndHandleTimeout(approvalRequest: ApprovalRequest): Promise<void> {
    if (!approvalRequest.approval_deadline) {
      return;
    }

    const deadline = new Date(approvalRequest.approval_deadline);
    const now = new Date();

    if (now > deadline) {
      // Handle timeout
      const updatedRequest = {
        ...approvalRequest,
        status: "rejected" as ApprovalStatus,
        rejection_reason: "Approval timeout exceeded",
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      await apiClient.updateRecord("approval_requests", updatedRequest);

      // Notify stakeholders
      await this.notifyApprovers(approvalRequest.id, "approval_rejected");

      // Log timeout
      await this.logApprovalAction(approvalRequest.id, "system", "timeout", {
        deadline: deadline.toISOString(),
        timeout_at: now.toISOString(),
      });
    }
  }

  private async logApprovalAction(
    approvalRequestId: string,
    userId: string,
    action: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await apiClient.createAuditLog({
        user_id: userId,
        action: action as AuditAction,
        resource_type: "approval_request" as AuditResourceType,
        resource_id: approvalRequestId,
        details,
      });
    } catch (error) {
      console.error("Failed to log approval action:", error);
    }
  }
}

export const approvalService = ApprovalService.getInstance();
