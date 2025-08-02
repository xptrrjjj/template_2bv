/**
 * Core integration infrastructure exports
 */

export { BaseIntegration } from "./BaseIntegration";
export { IntegrationManager } from "./IntegrationManager";
export { EntityIntegrationService, entityIntegrationService } from "./EntityIntegrationService";

// Re-export core types for convenience
export type {
  IntegrationCredentials,
  IntegrationMetadata,
  ConnectionStatus,
  HealthCheckResult,
  ExternalOptions,
  PublishResult,
  ProviderConfig,
  IntegrationError,
  IntegrationErrorType,
  // Workflow types
  BaseEntity,
  EntityType,
  WorkflowState,
  CreateEntityRequest,
  UpdateEntityRequest,
  EntityQueryRequest,
  EntityQueryResponse,
} from "@/types/integrations";
