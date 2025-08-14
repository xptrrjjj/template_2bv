import { apiClient } from './api';
import {
  JobRole,
  JobRoleWithStats,
  CreateJobRoleForm,
  UpdateJobRoleForm,
  JobRoleFilters,
  JobRolesResponse,
  JobRoleResponse,
  JobRoleStatistics,
  DataCollectionData
} from '@/types/job-roles';
import { v4 as uuidv4 } from 'uuid';

const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_IDENTIFIER || 'antd_recruiter';
const RECORD_TYPE = 'job_roles';

export class JobRoleService {
  
  /**
   * Get all job roles with optional filtering
   */
  async getAllJobRoles(filters?: JobRoleFilters): Promise<JobRoleWithStats[]> {
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

      // Apply filters if provided
      if (filters) {
        jobRoles = this.applyFilters(jobRoles, filters);
      }

      // Convert to JobRoleWithStats by calculating additional metrics
      const jobRolesWithStats: JobRoleWithStats[] = jobRoles.map(role => {
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
          // TODO: These would come from actual applicant/interview data when integrated
          applicant_count: 0,
          interview_count: 0
        };
      });

      return jobRolesWithStats;
    } catch (error) {
      console.error('JobRoleService.getAllJobRoles error:', error);
      throw error;
    }
  }

  /**
   * Get a single job role by ID
   */
  async getJobRole(roleId: string): Promise<JobRole | null> {
    try {
      const response = await apiClient.getRecords(APP_IDENTIFIER, { app_id: RECORD_TYPE, role_id: roleId });
      
      if (response.status !== 'success' || !response.data || response.data.length === 0) {
        return null;
      }

      return response.data[0] as JobRole;
    } catch (error) {
      console.error('JobRoleService.getJobRole error:', error);
      return null;
    }
  }

  /**
   * Create a new job role from wizard data or form data
   */
  async createJobRole(formData: CreateJobRoleForm | any, createdBy: string): Promise<JobRole> {
    try {
      const roleId = uuidv4();
      const now = new Date().toISOString();

      const jobRoleData: JobRole = {
        // Required datastore fields
        app_id: RECORD_TYPE, // Required by datastore - specific to record type
        record_id: roleId,   // Required by datastore
        role_id: roleId,
        
        // Stage 1: Company (required)
        company_id: formData.company_id || '',
        company_name: formData.company_name || '',
        
        // Stage 2: Basic Info (required)
        title: formData.title || '',
        department: formData.department || '',
        client: formData.client,
        account_exec: formData.account_exec,
        date_of_request: formData.date_of_request || now,
        desired_start_date: formData.desired_start_date || now,
        contract_duration: formData.contract_duration || 'rolling',
        level: formData.level || 'mid',
        employment_type: formData.employment_type || 'full-time',
        location: formData.location || '',
        location_type: formData.location_type || 'remote',
        time_zone: formData.time_zone,
        
        // Budget & Compensation
        target_budget_usd: formData.target_budget_usd,
        target_budget_local: formData.target_budget_local,
        maximum_budget_usd: formData.maximum_budget_usd,
        maximum_budget_local: formData.maximum_budget_local,
        target_rate_usd: formData.target_rate_usd,
        currency: formData.currency || 'USD',
        budget_notes: formData.budget_notes,
        
        // Role Requirements
        number_of_resources: formData.number_of_resources || formData.openings_count || 1,
        desired_minimum_years_experience: formData.desired_minimum_years_experience || 0,
        job_description_attachment: formData.job_description_attachment,
        
        // Stage 3: Skills (required)
        requirements: formData.requirements || [],
        preferred_qualifications: formData.preferred_qualifications || [],
        responsibilities: formData.responsibilities || [],
        
        // Stage 4: Position Analysis (required)
        description: formData.description || '',
        position_analysis: formData.position_analysis, // Save AI analysis data
        
        // Legacy fields for compatibility
        salary_range_min: formData.salary_range_min || formData.target_budget_usd,
        salary_range_max: formData.salary_range_max || formData.maximum_budget_usd,
        
        // Status and metadata
        status: 'draft', // Always starts as draft
        is_priority: formData.is_priority || false,
        openings_count: formData.number_of_resources || formData.openings_count || 1,
        filled_count: 0, // Always starts at 0
        
        // TeamTailor fields - NEVER auto-publish from draft creation
        published_to_teamtailor: false, // Always false for draft status
        teamtailor_job_id: undefined,
        
        // Timestamps
        created_at: now,
        updated_at: now,
        created_by: createdBy,
        updated_by: createdBy
      };

      const response = await apiClient.createRecord(APP_IDENTIFIER, jobRoleData);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to create job role');
      }

      // If publish_to_teamtailor was requested, handle that separately
      if (formData.publish_to_teamtailor) {
        // TODO: Implement TeamTailor publishing
        console.log('TODO: Publish to TeamTailor');
      }

      return jobRoleData;
    } catch (error) {
      console.error('JobRoleService.createJobRole error:', error);
      throw error;
    }
  }

  /**
   * Update an existing job role
   */
  async updateJobRole(roleId: string, formData: UpdateJobRoleForm, updatedBy: string): Promise<JobRole> {
    try {
      const existingRole = await this.getJobRole(roleId);
      if (!existingRole) {
        throw new Error('Job role not found');
      }

      const updatedData: Partial<JobRole> = {
        ...formData,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      };

      const response = await apiClient.updateRecord(roleId, updatedData);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to update job role');
      }

      return { ...existingRole, ...updatedData } as JobRole;
    } catch (error) {
      console.error('JobRoleService.updateJobRole error:', error);
      throw error;
    }
  }

  /**
   * Delete a job role
   */
  async deleteJobRole(roleId: string): Promise<void> {
    try {
      const response = await apiClient.deleteRecord(APP_IDENTIFIER, roleId);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete job role');
      }
    } catch (error) {
      console.error('JobRoleService.deleteJobRole error:', error);
      throw error;
    }
  }

  /**
   * Update job role status
   */
  async updateStatus(roleId: string, status: JobRole['status'], updatedBy: string): Promise<void> {
    try {
      await this.updateJobRole(roleId, { status }, updatedBy);
    } catch (error) {
      console.error('JobRoleService.updateStatus error:', error);
      throw error;
    }
  }

  /**
   * Publish job role to TeamTailor
   */
  async publishToTeamTailor(roleId: string): Promise<string> {
    try {
      // TODO: Implement actual TeamTailor job posting API
      const teamTailorJobId = `tt-${Date.now()}`;
      
      await this.updateJobRole(roleId, {
        publish_to_teamtailor: true,
        teamtailor_job_id: teamTailorJobId
      }, 'system');

      return teamTailorJobId;
    } catch (error) {
      console.error('JobRoleService.publishToTeamTailor error:', error);
      throw error;
    }
  }

  /**
   * Get job role statistics
   */
  async getStatistics(): Promise<JobRoleStatistics> {
    try {
      const jobRoles = await this.getAllJobRoles();

      const stats: JobRoleStatistics = {
        total_roles: jobRoles.length,
        active_roles: jobRoles.filter(r => r.status === 'active').length,
        filled_roles: jobRoles.filter(r => r.status === 'filled').length,
        total_openings: jobRoles.reduce((sum, r) => sum + r.openings_count, 0),
        total_filled: jobRoles.reduce((sum, r) => sum + r.filled_count, 0),
        fill_rate: 0,
        avg_time_to_fill: 0,
        roles_by_department: {},
        roles_by_level: {} as Record<JobRole['level'], number>,
        priority_roles: jobRoles.filter(r => r.is_priority).length,
        teamtailor_published: jobRoles.filter(r => r.published_to_teamtailor).length
      };

      // Calculate fill rate
      if (stats.total_openings > 0) {
        stats.fill_rate = (stats.total_filled / stats.total_openings) * 100;
      }

      // Calculate average time to fill for filled roles
      const filledRoles = jobRoles.filter(r => r.status === 'filled');
      if (filledRoles.length > 0) {
        const totalDays = filledRoles.reduce((sum, r) => sum + r.days_open, 0);
        stats.avg_time_to_fill = totalDays / filledRoles.length;
      }

      // Group by department
      jobRoles.forEach(role => {
        stats.roles_by_department[role.department] = 
          (stats.roles_by_department[role.department] || 0) + 1;
      });

      // Group by level
      jobRoles.forEach(role => {
        stats.roles_by_level[role.level] = 
          (stats.roles_by_level[role.level] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('JobRoleService.getStatistics error:', error);
      throw error;
    }
  }

  /**
   * Apply filters to job roles array
   */
  private applyFilters(jobRoles: JobRole[], filters: JobRoleFilters): JobRole[] {
    return jobRoles.filter(role => {
      if (filters.department && role.department !== filters.department) return false;
      if (filters.level && role.level !== filters.level) return false;
      if (filters.employment_type && role.employment_type !== filters.employment_type) return false;
      if (filters.status && role.status !== filters.status) return false;
      if (filters.location && !role.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.is_priority !== undefined && role.is_priority !== filters.is_priority) return false;
      if (filters.published_to_teamtailor !== undefined && role.published_to_teamtailor !== filters.published_to_teamtailor) return false;
      
      return true;
    });
  }

  /**
   * Search job roles by query string
   */
  async searchJobRoles(query: string, filters?: JobRoleFilters): Promise<JobRoleWithStats[]> {
    try {
      const allJobRoles = await this.getAllJobRoles(filters);
      
      if (!query) {
        return allJobRoles;
      }

      const searchTerms = query.toLowerCase().split(' ');
      
      return allJobRoles.filter(role => {
        const searchableText = [
          role.title,
          role.department,
          role.location,
          role.description,
          ...role.requirements,
          ...role.preferred_qualifications,
          ...role.responsibilities
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    } catch (error) {
      console.error('JobRoleService.searchJobRoles error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jobRoleService = new JobRoleService();