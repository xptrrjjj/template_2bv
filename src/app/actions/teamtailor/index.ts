/**
 * SOLID Principle: Interface Segregation & Dependency Inversion
 * TeamTailor Actions - Facade pattern providing unified access to all TeamTailor operations
 * 
 * This index file follows SOLID principles:
 * - Single Responsibility: Acts as a facade/entry point
 * - Open/Closed: Extensible by adding new domain modules
 * - Interface Segregation: Each domain has focused exports
 * - Dependency Inversion: Consumers depend on this abstraction, not concrete implementations
 */

// Client operations (fully implemented)
export * from './clients';

// Job operations (placeholder implementations)
export * from './jobs';

// Candidate operations (placeholder implementations) 
export * from './candidates';

// Custom field operations (placeholder implementations)
export * from './custom-fields';

// Location operations (placeholder implementations)
export * from './locations';

// Department operations (fully implemented)
export * from './departments';

// Utility operations
export * from './utils';

// Re-export types for convenience (only what's actually available)
export type {
  ClientPayload,
  ClientOption,
  ClientRequestOptions,
  DepartmentPayload,
  DepartmentOption,
  DepartmentRequestOptions
} from '@/lib/integrations/teamtailor';

// TODO: Uncomment when implementations are ready
/*
export type {
  JobPayload,
  JobOption,
  JobTemplate,
  JobRequestOptions,
  CandidatePayload,
  CandidateOption,
  CandidateRequestOptions,
  CustomFieldPayload,
  CustomFieldOption,
  CustomFieldRequestOptions,
  JobApplication
} from '@/lib/integrations/teamtailor';
*/