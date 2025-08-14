/**
 * SOLID Principle Refactored TeamTailor Actions
 * 
 * This file has been refactored to follow SOLID principles:
 * - The original 600+ line monolithic file violated Single Responsibility
 * - Now split into focused domain-specific modules
 * - Each domain handles only its own operations
 * - Proper separation of concerns and maintainable code
 */

// Re-export everything from the new structured approach
export * from './teamtailor/index';

// For backward compatibility, also export individual domains
export * as ClientActions from './teamtailor/clients';
export * as JobActions from './teamtailor/jobs';
export * as CandidateActions from './teamtailor/candidates';
export * as CustomFieldActions from './teamtailor/custom-fields';
export * as LocationActions from './teamtailor/locations';
export * as UtilityActions from './teamtailor/utils';