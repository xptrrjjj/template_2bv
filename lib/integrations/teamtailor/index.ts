/**
 * Public API for TeamTailor integration
 * Re-exports all public functions and types
 */

// Types
export * from './types';

// Errors
export { 
  TeamTailorError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  PaginationError,
  NetworkError,
  TimeoutError,
  ConfigurationError
} from './errors';

// Client operations
export {
  getAllClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientsByStatus,
  searchClientsByName,
  getClientByExternalId,
  getClientsPage
} from './endpoints/clients';

// Job operations (placeholder implementations)
export {
  getAllJobs,
  createJob,
  createJobFromTemplate
} from './endpoints/jobs';

// Candidate operations (placeholder implementations)
export {
  getAllCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateApplications
} from './endpoints/candidates';

// Custom field operations (placeholder implementations)
export {
  getAllCustomFields,
  getCustomField,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  validateCustomFieldValue
} from './endpoints/custom-fields';

// Department operations
export {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from './endpoints/departments';