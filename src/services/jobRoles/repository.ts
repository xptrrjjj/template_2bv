// SOLID Principle: Single Responsibility - Pure data access layer
import { apiClient } from '../api';
import { v4 as uuidv4 } from 'uuid';
import type { 
  IJobRoleRepository,
  JobRole,
  JobRoleWithStats,
  CreateJobRoleForm,
  UpdateJobRoleForm
} from './interfaces';

const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_IDENTIFIER || 'antd_recruiter';
const RECORD_TYPE = 'job_roles';

export class JobRoleRepository implements IJobRoleRepository {
  async getAllJobRoles(): Promise<JobRoleWithStats[]> {
    try {
      const response = await apiClient.getRecords(APP_IDENTIFIER, { app_id: RECORD_TYPE });
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to fetch job roles');
      }

      let jobRoles = (response.data || []) as JobRole[];
      
      // Filter out invalid records (ones without proper structure)
      jobRoles = jobRoles.filter(role => 
        role && 
        role.role_id && 
        role.app_id === RECORD_TYPE &&
        typeof role.title === 'string'
      );

      // Transform to JobRoleWithStats
      return jobRoles.map(role => {
        const daysOpen = Math.floor(
          (new Date().getTime() - new Date(role.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const fillRate = role.openings_count > 0 
          ? (role.filled_count / role.openings_count) * 100 
          : 0;

        return {
          ...role,
          days_open: daysOpen,
          fill_rate: fillRate,
          applicant_count: 0, // TODO: Integrate with actual applicant data
          interview_count: 0
        } as JobRoleWithStats;
      });
    } catch (error) {
      console.error('JobRoleRepository.getAllJobRoles error:', error);
      throw error;
    }
  }

  async getJobRole(roleId: string): Promise<JobRole | null> {
    try {
      const response = await apiClient.getRecords(APP_IDENTIFIER, { app_id: RECORD_TYPE, role_id: roleId });
      
      if (response.status !== 'success' || !response.data || response.data.length === 0) {
        return null;
      }

      return response.data[0] as JobRole;
    } catch (error) {
      console.error('JobRoleRepository.getJobRole error:', error);
      return null;
    }
  }

  async createJobRole(formData: CreateJobRoleForm, createdBy: string): Promise<JobRole> {
    try {
      const roleId = uuidv4();
      const now = new Date().toISOString();

      const jobRoleData: JobRole = {
        // Required datastore fields
        app_id: RECORD_TYPE, // Record type identifier for datastore
        record_id: roleId, // Use the same ID for record_id
        role_id: roleId,
        
        // Company info
        company_id: (formData as any).company_id || '',
        company_name: (formData as any).company_name || '',
        
        // Basic info
        title: formData.title || '',
        department: formData.department || '',
        client: (formData as any).client,
        account_exec: (formData as any).account_exec,
        date_of_request: (formData as any).date_of_request || now,
        desired_start_date: (formData as any).desired_start_date || now,
        contract_duration: (formData as any).contract_duration || 'rolling',
        level: formData.level || 'mid',
        employment_type: formData.employment_type || 'full-time',
        location: formData.location || '',
        location_type: (formData as any).location_type || 'remote',
        time_zone: (formData as any).time_zone,
        
        // Budget
        target_budget_usd: (formData as any).target_budget_usd,
        target_budget_local: (formData as any).target_budget_local,
        maximum_budget_usd: (formData as any).maximum_budget_usd,
        maximum_budget_local: (formData as any).maximum_budget_local,
        target_rate_usd: (formData as any).target_rate_usd,
        currency: formData.currency || 'USD',
        budget_notes: (formData as any).budget_notes,
        
        // Role requirements
        number_of_resources: (formData as any).number_of_resources || formData.openings_count || 1,
        desired_minimum_years_experience: (formData as any).desired_minimum_years_experience || 0,
        job_description_attachment: (formData as any).job_description_attachment,
        
        // Skills
        requirements: formData.requirements || [],
        preferred_qualifications: formData.preferred_qualifications || [],
        responsibilities: formData.responsibilities || [],
        
        // Description
        description: formData.description || '',
        
        // Legacy compatibility
        salary_range_min: formData.salary_range_min || (formData as any).target_budget_usd,
        salary_range_max: formData.salary_range_max || (formData as any).maximum_budget_usd,
        
        // Status
        status: 'draft',
        is_priority: formData.is_priority || false,
        openings_count: (formData as any).number_of_resources || formData.openings_count || 1,
        filled_count: 0,
        
        // TeamTailor
        published_to_teamtailor: false,
        teamtailor_job_id: undefined,
        
        // Metadata
        created_at: now,
        updated_at: now,
        created_by: createdBy,
        updated_by: createdBy
      };

      const response = await apiClient.createRecord(APP_IDENTIFIER, jobRoleData);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to create job role');
      }

      return jobRoleData;
    } catch (error) {
      console.error('JobRoleRepository.createJobRole error:', error);
      throw error;
    }
  }

  async updateJobRole(roleId: string, formData: UpdateJobRoleForm, updatedBy: string): Promise<JobRole> {
    try {
      const existingRole = await this.getJobRole(roleId);
      if (!existingRole) {
        throw new Error('Job role not found');
      }

      const updatedData: Partial<JobRole> = {
        // Required identifiers for datastore update
        app_id: RECORD_TYPE,
        record_id: existingRole.record_id || existingRole.role_id,
        role_id: roleId,
        
        // Update fields
        ...formData,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      };


      const response = await apiClient.updateRecord(APP_IDENTIFIER, updatedData);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to update job role');
      }

      return { ...existingRole, ...updatedData } as JobRole;
    } catch (error) {
      console.error('JobRoleRepository.updateJobRole error:', error);
      throw error;
    }
  }

  async deleteJobRole(roleId: string): Promise<void> {
    try {
      const response = await apiClient.deleteRecord(APP_IDENTIFIER, roleId);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete job role');
      }
    } catch (error) {
      console.error('JobRoleRepository.deleteJobRole error:', error);
      throw error;
    }
  }
}