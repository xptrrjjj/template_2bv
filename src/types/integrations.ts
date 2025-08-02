/**
 * Core type definitions for the integrations system
 */

// Entity publish states
export enum EntityPublishState {
  DRAFT = "draft",
  PUBLISHED = "published",
  SYNCED = "synced",
  ERROR = "error",
  ARCHIVED = "archived",
}

// Integration credentials interface
export interface IntegrationCredentials {
  id: string;
  providerId: string;
  userId: string;
  appId: string;
  encryptedData: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  expiresAt?: string;
  refreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

// External options for fetching data from integrations
export interface ExternalOptions {
  id: string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
  category?: string;
  parentId?: string;
  isActive?: boolean;
}

// Result of publishing an entity to an external system
export interface PublishResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  message?: string;
  errors?: string[];
  metadata?: Record<string, unknown>;
  retryable?: boolean;
}

// Integration metadata for tracking integration status
export interface IntegrationMetadata {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  version: string;
  status: "active" | "inactive" | "error" | "maintenance";
  configuration: Record<string, unknown>;
  healthCheck?: {
    lastChecked: string;
    status: "healthy" | "unhealthy" | "unknown";
    message?: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  features: string[];
  supportedEntityTypes: string[];
  webhookSupport: boolean;
  createdAt: string;
  updatedAt: string;
}

// Webhook event structure
export interface WebhookEvent {
  id: string;
  providerId: string;
  eventType: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  signature?: string;
  timestamp: string;
  processed: boolean;
  processedAt?: string;
  processingErrors?: string[];
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
}

// Synchronization operation tracking
export interface SyncOperation {
  id: string;
  providerId: string;
  operationType: "import" | "export" | "sync" | "webhook";
  entityType: string;
  entityId?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  progress?: {
    total: number;
    processed: number;
    errors: number;
    percentage: number;
  };
  result?: {
    success: boolean;
    entitiesProcessed: number;
    entitiesErrored: number;
    errors: string[];
    metadata: Record<string, unknown>;
  };
  configuration: Record<string, unknown>;
  createdBy: string;
  updatedAt: string;
}

// Retry queue item for failed operations
export interface RetryQueueItem {
  id: string;
  operationType: "publish" | "sync" | "webhook" | "fetch";
  providerId: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  priority: "low" | "medium" | "high" | "critical";
  maxRetries: number;
  currentRetry: number;
  nextRetryAt: string;
  lastError?: string;
  backoffMultiplier: number;
  createdAt: string;
  updatedAt: string;
}

// Provider configuration interface
export interface ProviderConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  iconUrl?: string;
  category: string;
  version: string;
  isActive: boolean;
  authType: "oauth2" | "api_key" | "basic" | "bearer" | "custom";
  authConfig: Record<string, unknown>;
  endpoints: {
    base: string;
    auth?: string;
    refresh?: string;
    webhook?: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  features: string[];
  supportedEntityTypes: string[];
  webhookSupport: boolean;
  webhookEvents: string[];
  fieldMappings: Record<string, unknown>;
  requiredScopes?: string[];
  optionalScopes?: string[];
}

// Integration connection status
export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: string;
  status: "healthy" | "unhealthy" | "unknown" | "unauthorized" | "rate_limited";
  message?: string;
  responseTime?: number;
  errorCount?: number;
  lastError?: string;
  nextHealthCheck?: string;
}

// Data transformation rule
export interface TransformationRule {
  id: string;
  name: string;
  description?: string;
  sourceField: string;
  targetField: string;
  transformationType: "direct" | "format" | "lookup" | "compute" | "conditional";
  transformationConfig: Record<string, unknown>;
  isRequired: boolean;
  defaultValue?: unknown;
  validationRules?: {
    type?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: unknown[];
  };
}

// Workflow step definition
export interface WorkflowStep {
  id: string;
  name: string;
  type: "transform" | "validate" | "publish" | "notify" | "delay" | "condition";
  configuration: Record<string, unknown>;
  order: number;
  isEnabled: boolean;
  continueOnError: boolean;
  retryConfig?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  conditions?: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than";
    value: unknown;
  }[];
}

// Integration workflow definition
export interface IntegrationWorkflow {
  id: string;
  name: string;
  description?: string;
  providerId: string;
  entityType: string;
  trigger: "manual" | "automatic" | "scheduled" | "webhook";
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStep[];
  isActive: boolean;
  lastExecuted?: string;
  executionCount: number;
  successCount: number;
  errorCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Audit log entry for integration operations
export interface IntegrationAuditLog {
  id: string;
  providerId: string;
  operationType: string;
  entityType?: string;
  entityId?: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  result: "success" | "failure" | "partial";
  errorMessage?: string;
  duration?: number;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  strategy: "fixed_window" | "sliding_window" | "token_bucket";
  skipWhenLimited: boolean;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (context: Record<string, unknown>) => string;
}

// Error types for integrations
export type IntegrationErrorType =
  | "authentication_error"
  | "authorization_error"
  | "rate_limit_error"
  | "network_error"
  | "validation_error"
  | "transformation_error"
  | "provider_error"
  | "configuration_error"
  | "timeout_error"
  | "unknown_error";

// Integration error interface
export interface IntegrationError extends Error {
  type: IntegrationErrorType;
  providerId?: string;
  entityId?: string;
  retryable: boolean;
  statusCode?: number;
  response?: unknown;
  metadata?: Record<string, unknown>;
}

// Integration error class
export class IntegrationErrorClass extends Error implements IntegrationError {
  public type: IntegrationErrorType;
  public providerId?: string;
  public entityId?: string;
  public retryable: boolean;
  public statusCode?: number;
  public response?: unknown;
  public metadata?: Record<string, unknown>;

  constructor(
    message: string,
    type: IntegrationErrorType,
    retryable: boolean = false,
    options?: {
      providerId?: string;
      entityId?: string;
      statusCode?: number;
      response?: unknown;
      metadata?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.type = type;
    this.retryable = retryable;
    this.providerId = options?.providerId;
    this.entityId = options?.entityId;
    this.statusCode = options?.statusCode;
    this.response = options?.response;
    this.metadata = options?.metadata;
  }
}

// Health check result
export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  responseTime?: number;
  checks: {
    name: string;
    status: "pass" | "fail" | "warn";
    message?: string;
    duration?: number;
  }[];
  timestamp: string;
}

// ========================================
// WORKFLOW ENGINE TYPES (Task 02)
// ========================================

// Workflow States
export type WorkflowState =
  | "draft"
  | "pending_approval"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

// Entity Types
export type EntityType =
  | "job_posting"
  | "candidate"
  | "company_profile"
  | "user_profile"
  | "custom";

// Approval Status
export type ApprovalStatus = "pending" | "approved" | "rejected";

// Priority Levels
export type Priority = "low" | "medium" | "high" | "urgent";

// Integration Provider Types
export type IntegrationProvider = "teamtailor" | "greenhouse" | "workday" | "custom";

/**
 * Base Entity Interface
 * All entities in the workflow system extend this interface
 */
export interface BaseEntity {
  id: string;
  record_id: string;
  entity_type: EntityType;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

/**
 * Workflow State Record
 * Tracks the current state and history of an entity in the workflow
 */
export interface WorkflowStateRecord {
  id: string;
  record_id: string;
  entity_id: string;
  entity_type: EntityType;
  current_state: WorkflowState;
  previous_state?: WorkflowState;
  state_metadata: Record<string, unknown>;
  transitions_count: number;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

/**
 * State Transition History
 * Records all state transitions for audit and tracking
 */
export interface StateTransitionHistory {
  id: string;
  record_id: string;
  entity_id: string;
  from_state: WorkflowState | null;
  to_state: WorkflowState;
  transition_reason?: string;
  transition_metadata: Record<string, unknown>;
  triggered_by: string;
  timestamp: string;
  is_valid: boolean;
  validation_errors?: string[];
}

/**
 * Approval Request
 * Represents a pending approval request in the workflow
 */
export interface ApprovalRequest {
  id: string;
  record_id: string;
  entity_id: string;
  entity_type: EntityType;
  requested_by: string;
  required_approvers: string[];
  optional_approvers: string[];
  current_approvers: string[];
  status: ApprovalStatus;
  priority: Priority;
  approval_deadline?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Approval Action
 * Records individual approval/rejection actions
 */
export interface ApprovalAction {
  id: string;
  record_id: string;
  approval_request_id: string;
  approver_id: string;
  action: "approve" | "reject" | "delegate";
  notes?: string;
  delegated_to?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Entity Integration Record
 * Tracks integration status with external systems
 */
export interface EntityIntegrationRecord {
  id: string;
  record_id: string;
  entity_id: string;
  provider: IntegrationProvider;
  external_id?: string;
  integration_status: "pending" | "synced" | "failed" | "disabled";
  last_sync_at?: string;
  sync_errors?: string[];
  sync_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Workflow Configuration
 * Defines workflow rules and constraints
 */
export interface WorkflowConfiguration {
  id: string;
  record_id: string;
  entity_type: EntityType;
  name: string;
  description?: string;
  state_transitions: StateTransitionRule[];
  approval_rules: ApprovalRule[];
  notification_rules: NotificationRule[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * State Transition Rule
 * Defines valid state transitions and their conditions
 */
export interface StateTransitionRule {
  from_state: WorkflowState | null; // null means initial state
  to_state: WorkflowState;
  required_permissions: string[];
  conditions?: Record<string, unknown>;
  is_automatic?: boolean;
  auto_transition_delay?: number; // minutes
}

/**
 * Approval Rule
 * Defines approval requirements for workflow transitions
 */
export interface ApprovalRule {
  from_state: WorkflowState;
  to_state: WorkflowState;
  required_approver_count: number;
  required_approver_roles: string[];
  optional_approver_roles: string[];
  approval_timeout?: number; // minutes
  escalation_rules?: EscalationRule[];
}

/**
 * Escalation Rule
 * Defines escalation behavior for approvals
 */
export interface EscalationRule {
  timeout_minutes: number;
  escalate_to_roles: string[];
  notification_template: string;
  is_final_escalation: boolean;
}

/**
 * Notification Rule
 * Defines when and how to send notifications
 */
export interface NotificationRule {
  trigger_event:
    | "state_change"
    | "approval_request"
    | "approval_granted"
    | "approval_rejected"
    | "escalation";
  from_state?: WorkflowState;
  to_state?: WorkflowState;
  recipient_roles: string[];
  notification_method: "email" | "in_app" | "both";
  template_id: string;
  delay_minutes?: number;
}

/**
 * Workflow Metrics
 * Performance and analytics data for workflows
 */
export interface WorkflowMetrics {
  entity_type: EntityType;
  total_entities: number;
  state_distribution: Record<WorkflowState, number>;
  average_approval_time: number; // minutes
  approval_success_rate: number; // percentage
  bottleneck_states: WorkflowState[];
  generated_at: string;
}

/**
 * Entity Publishing Context
 * Additional context needed for entity publishing decisions
 */
export interface EntityPublishingContext {
  entity_id: string;
  user_id: string;
  user_permissions: string[];
  integration_requirements: IntegrationProvider[];
  business_rules: Record<string, unknown>;
  external_dependencies: string[];
}

/**
 * Workflow Event
 * Generic event structure for workflow system events
 */
export interface WorkflowEvent {
  id: string;
  event_type: string;
  entity_id: string;
  entity_type: EntityType;
  event_data: Record<string, unknown>;
  triggered_by: string;
  timestamp: string;
  processed: boolean;
  processing_errors?: string[];
}

/**
 * Integration Sync Result
 * Result of syncing an entity with external systems
 */
export interface IntegrationSyncResult {
  provider: IntegrationProvider;
  entity_id: string;
  success: boolean;
  external_id?: string;
  error_message?: string;
  sync_timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Bulk Operation Result
 * Result of bulk operations on entities
 */
export interface BulkOperationResult {
  operation: "publish" | "approve" | "reject" | "archive";
  total_entities: number;
  successful_entities: string[];
  failed_entities: Array<{
    entity_id: string;
    error: string;
  }>;
  started_at: string;
  completed_at: string;
  triggered_by: string;
}

// Error Types
export interface WorkflowError extends Error {
  code: WorkflowErrorCode;
  entity_id?: string;
  workflow_state?: WorkflowState;
  context?: Record<string, unknown>;
}

export enum WorkflowErrorCode {
  INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND",
  INTEGRATION_FAILURE = "INTEGRATION_FAILURE",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  WORKFLOW_DISABLED = "WORKFLOW_DISABLED",
  APPROVAL_TIMEOUT = "APPROVAL_TIMEOUT",
  DUPLICATE_APPROVAL = "DUPLICATE_APPROVAL",
  INVALID_APPROVER = "INVALID_APPROVER",
}

// Workflow error class
export class WorkflowErrorClass extends Error implements WorkflowError {
  public code: WorkflowErrorCode;
  public entity_id?: string;
  public workflow_state?: WorkflowState;
  public context?: Record<string, unknown>;

  constructor(
    message: string,
    code: WorkflowErrorCode,
    entity_id?: string,
    options?: {
      workflow_state?: WorkflowState;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
    this.entity_id = entity_id;
    this.workflow_state = options?.workflow_state;
    this.context = options?.context;
  }
}

// Request/Response Types
export interface CreateEntityRequest {
  entity_type: EntityType;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  initial_state?: WorkflowState;
}

export interface UpdateEntityRequest {
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface StateTransitionRequest {
  entity_id: string;
  to_state: WorkflowState;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalDecisionRequest {
  approval_request_id: string;
  action: "approve" | "reject";
  notes?: string;
}

export interface EntityQueryRequest {
  entity_type?: EntityType;
  state?: WorkflowState;
  created_by?: string;
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface EntityQueryResponse {
  entities: BaseEntity[];
  total_count: number;
  has_more: boolean;
}
