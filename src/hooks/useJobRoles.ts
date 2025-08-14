// SOLID Principle: Single Responsibility - Job Roles data management hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { App } from 'antd';
import { jobRoleRepository, jobRoleValidationService } from '@/services/jobRoles/index';
import type { 
  JobRoleWithStats, 
  CreateJobRoleForm, 
  UpdateJobRoleForm,
  JobRoleFilters,
  ValidationResult 
} from '@/services/jobRoles/interfaces';

export interface UseJobRolesReturn {
  // Data
  jobRoles: JobRoleWithStats[];
  filteredJobRoles: JobRoleWithStats[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  loadJobRoles: () => Promise<void>;
  createJobRole: (data: CreateJobRoleForm, createdBy: string) => Promise<void>;
  updateJobRole: (id: string, data: UpdateJobRoleForm, updatedBy: string) => Promise<void>;
  deleteJobRole: (id: string) => Promise<void>;
  
  // Filtering
  setFilters: (filters: JobRoleFilters) => void;
  clearFilters: () => void;
  
  // Validation
  validateCreateForm: (data: CreateJobRoleForm) => ValidationResult;
  validateUpdateForm: (data: UpdateJobRoleForm) => ValidationResult;
}

const defaultFilters: JobRoleFilters = {};

export const useJobRoles = (initialFilters?: JobRoleFilters): UseJobRolesReturn => {
  const { message } = App.useApp();
  
  // State
  const [jobRoles, setJobRoles] = useState<JobRoleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobRoleFilters>(initialFilters || defaultFilters);
  
  // Use ref to maintain stable callback references
  const messageRef = useRef(message);
  messageRef.current = message;

  // Load job roles
  const loadJobRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roles = await jobRoleRepository.getAllJobRoles();
      setJobRoles(roles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load job roles';
      setError(errorMessage);
      messageRef.current.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create job role
  const createJobRole = useCallback(async (data: CreateJobRoleForm, createdBy: string) => {
    try {
      setLoading(true);
      
      // Validate first
      const validation = jobRoleValidationService.validateCreateForm(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      await jobRoleRepository.createJobRole(data, createdBy);
      messageRef.current.success('Job role created successfully');
      
      // Reload data
      await loadJobRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job role';
      messageRef.current.error(errorMessage);
      throw err; // Re-throw for component handling
    }
  }, [loadJobRoles]);

  // Update job role
  const updateJobRole = useCallback(async (id: string, data: UpdateJobRoleForm, updatedBy: string) => {
    try {
      setLoading(true);
      
      // Validate first
      const validation = jobRoleValidationService.validateUpdateForm(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      await jobRoleRepository.updateJobRole(id, data, updatedBy);
      messageRef.current.success('Job role updated successfully');
      
      // Reload data
      await loadJobRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job role';
      messageRef.current.error(errorMessage);
      throw err;
    }
  }, [loadJobRoles]);

  // Delete job role
  const deleteJobRole = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      await jobRoleRepository.deleteJobRole(id);
      messageRef.current.success('Job role deleted successfully');
      
      // Reload data
      await loadJobRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job role';
      messageRef.current.error(errorMessage);
      throw err;
    }
  }, [loadJobRoles]);

  // Apply filters to job roles
  const filteredJobRoles = jobRoles.filter(role => {
    // Search query filter
    if (filters.search_query) {
      const searchLower = filters.search_query.toLowerCase();
      const matchesSearch = 
        role.title.toLowerCase().includes(searchLower) ||
        role.department.toLowerCase().includes(searchLower) ||
        role.location.toLowerCase().includes(searchLower) ||
        role.requirements.some(req => req.toLowerCase().includes(searchLower)) ||
        role.responsibilities.some(resp => resp.toLowerCase().includes(searchLower)) ||
        role.preferred_qualifications.some(qual => qual.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    if (filters.department && role.department !== filters.department) return false;
    if (filters.level && role.level !== filters.level) return false;
    if (filters.employment_type && role.employment_type !== filters.employment_type) return false;
    if (filters.status && role.status !== filters.status) return false;
    if (filters.location && !role.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.is_priority !== undefined && role.is_priority !== filters.is_priority) return false;
    if (filters.published_to_teamtailor !== undefined && role.published_to_teamtailor !== filters.published_to_teamtailor) return false;
    
    return true;
  });

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadJobRoles();
  }, [loadJobRoles]);

  // Validation methods
  const validateCreateForm = useCallback((data: CreateJobRoleForm): ValidationResult => {
    return jobRoleValidationService.validateCreateForm(data);
  }, []);

  const validateUpdateForm = useCallback((data: UpdateJobRoleForm): ValidationResult => {
    return jobRoleValidationService.validateUpdateForm(data);
  }, []);

  return {
    // Data
    jobRoles,
    filteredJobRoles,
    
    // State
    loading,
    error,
    
    // Actions
    loadJobRoles,
    createJobRole,
    updateJobRole,
    deleteJobRole,
    
    // Filtering
    setFilters,
    clearFilters,
    
    // Validation
    validateCreateForm,
    validateUpdateForm
  };
};