// SOLID Principle: Interface Segregation - Define focused interfaces
import type {
  JobRole,
  JobRoleWithStats,
  CreateJobRoleForm,
  UpdateJobRoleForm,
  JobRoleWizardData,
  JobRoleStatistics,
  JobRoleStatus
} from '@/types/job-roles';
export interface IJobRoleRepository {
  getAllJobRoles(): Promise<JobRoleWithStats[]>;
  getJobRole(id: string): Promise<JobRole | null>;
  createJobRole(data: CreateJobRoleForm, createdBy: string): Promise<JobRole>;
  updateJobRole(id: string, data: UpdateJobRoleForm, updatedBy: string): Promise<JobRole>;
  deleteJobRole(id: string): Promise<void>;
}

export interface IJobRoleValidationService {
  validateCreateForm(data: CreateJobRoleForm): ValidationResult;
  validateUpdateForm(data: UpdateJobRoleForm): ValidationResult;
  validateWizardStage(stageNumber: number, data: Partial<JobRoleWizardData>): boolean;
}

export interface IJobRoleStatisticsService {
  getStatistics(): Promise<JobRoleStatistics>;
  getRolesByDepartment(): Promise<Record<string, number>>;
  getFilledVsOpenRoles(): Promise<{ filled: number; open: number }>;
}

export interface ITeamTailorIntegrationService {
  publishRole(roleId: string): Promise<string>;
  unpublishRole(roleId: string): Promise<void>;
  syncRoleStatus(roleId: string): Promise<JobRoleStatus>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface JobRoleFilters {
  search_query?: string;
  department?: string;
  level?: string;
  employment_type?: string;
  status?: string;
  location?: string;
  is_priority?: boolean;
  published_to_teamtailor?: boolean;
}

// Re-export types for consistency
export type {
  JobRole,
  JobRoleWithStats,
  CreateJobRoleForm,
  UpdateJobRoleForm,
  JobRoleWizardData,
  JobRoleStatistics,
  JobRoleStatus
} from '@/types/job-roles';