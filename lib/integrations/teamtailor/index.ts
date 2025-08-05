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

// Job operations (to be implemented)
// export * from './endpoints/jobs';

// Candidate operations (to be implemented)
// export * from './endpoints/candidates';

// Custom field operations (to be implemented)
// export * from './endpoints/custom-fields';