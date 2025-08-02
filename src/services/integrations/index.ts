/**
 * Main integrations system exports
 *
 * This module provides the core infrastructure for building and managing
 * integrations with external systems in the antd-recruiter application.
 */

// Core infrastructure
export * from "./core";
export * from "./utils";

// Types and interfaces
export * from "@/types/integrations";

// Convenience re-exports for commonly used components
export { IntegrationManager } from "./core/IntegrationManager";
export { BaseIntegration } from "./core/BaseIntegration";
export { EncryptionService } from "./utils/EncryptionService";
