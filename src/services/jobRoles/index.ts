// SOLID Principle: Dependency Injection Container
import { JobRoleRepository } from './repository';
import { JobRoleValidationService } from './validation';
import { JobRoleStatisticsService } from './statistics';

// Create instances with proper dependency injection
const repository = new JobRoleRepository();
const validationService = new JobRoleValidationService();
const statisticsService = new JobRoleStatisticsService(repository);

// Export configured instances (Singleton pattern for consistency)
export const jobRoleRepository = repository;
export const jobRoleValidationService = validationService;
export const jobRoleStatisticsService = statisticsService;

// Export interfaces for dependency injection testing
export type {
  IJobRoleRepository,
  IJobRoleValidationService,
  IJobRoleStatisticsService,
  ITeamTailorIntegrationService
} from './interfaces';

// Export classes for direct instantiation if needed
export { JobRoleRepository } from './repository';
export { JobRoleValidationService } from './validation';
export { JobRoleStatisticsService } from './statistics';

// Legacy compatibility - keep the old service working
// export { jobRoleService } from '../jobRoles';

// Re-export types
export type * from './interfaces';