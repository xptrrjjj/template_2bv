// SOLID Principle: Single Responsibility - Pure validation logic
import type { 
  IJobRoleValidationService,
  CreateJobRoleForm,
  UpdateJobRoleForm,
  JobRoleWizardData,
  ValidationResult
} from './interfaces';

export class JobRoleValidationService implements IJobRoleValidationService {
  validateCreateForm(data: CreateJobRoleForm): ValidationResult {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.title?.trim()) errors.push('Job title is required');
    if (!data.department?.trim()) errors.push('Department is required');
    if (!data.level) errors.push('Level is required');
    if (!data.employment_type) errors.push('Employment type is required');
    if (!data.location?.trim()) errors.push('Location is required');
    if (!data.description?.trim()) errors.push('Job description is required');
    if (!data.currency) errors.push('Currency is required');
    
    // Array field validation
    if (!data.requirements || data.requirements.length === 0) {
      errors.push('At least one requirement is needed');
    }
    if (!data.responsibilities || data.responsibilities.length === 0) {
      errors.push('At least one responsibility is needed');
    }

    // Numeric validations
    if (data.openings_count && data.openings_count < 1) {
      errors.push('Number of openings must be at least 1');
    }
    if (data.salary_range_min && data.salary_range_max && 
        data.salary_range_min > data.salary_range_max) {
      errors.push('Minimum salary cannot be higher than maximum salary');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateUpdateForm(data: UpdateJobRoleForm): ValidationResult {
    const errors: string[] = [];
    
    // Optional field validations (only validate if provided)
    if (data.title !== undefined && !data.title?.trim()) {
      errors.push('Job title cannot be empty');
    }
    if (data.department !== undefined && !data.department?.trim()) {
      errors.push('Department cannot be empty');
    }
    if (data.location !== undefined && !data.location?.trim()) {
      errors.push('Location cannot be empty');
    }
    if (data.description !== undefined && !data.description?.trim()) {
      errors.push('Job description cannot be empty');
    }

    // Array validations
    if (data.requirements && data.requirements.length === 0) {
      errors.push('At least one requirement is needed');
    }
    if (data.responsibilities && data.responsibilities.length === 0) {
      errors.push('At least one responsibility is needed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateWizardStage(stageNumber: number, data: Partial<JobRoleWizardData>): boolean {
    switch (stageNumber) {
      case 1: // Company
        return !!(data.company_id && data.company_name);
      
      case 2: // Basic Info
        return !!(
          data.title?.trim() &&
          data.department?.trim() &&
          data.level &&
          data.employment_type &&
          data.location?.trim() &&
          data.currency &&
          data.number_of_resources &&
          data.desired_minimum_years_experience !== undefined
        );
      
      case 3: // Skills
        return !!(
          data.requirements && data.requirements.length > 0 &&
          data.responsibilities && data.responsibilities.length > 0
        );
      
      case 4: // Position Analysis
        return !!(data.description?.trim() && data.description.length >= 50);
      
      case 5: // Review
        return true; // Always valid if we reached this stage
      
      default:
        return false;
    }
  }
}