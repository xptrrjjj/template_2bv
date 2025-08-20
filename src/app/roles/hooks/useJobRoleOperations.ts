import { useState } from 'react';
import { App } from 'antd';
import { JobRoleWithStats, JobRoleStatus, DataCollectionData, TestSetupData, ManagementReviewData, CreateJobRoleForm, JobRoleWizardData, UpdateJobRoleForm } from '@/types/job-roles';
import { useJobRoles } from '@/hooks/useJobRoles';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for job role operations
 * Centralizes all CRUD operations, status changes, and error handling
 * Follows Single Responsibility Principle
 */
export const useJobRoleOperations = () => {
  const { message } = App.useApp();
  const { updateJobRole, deleteJobRole, loadJobRoles } = useJobRoles();
  const { user } = useAuth();
  const [operationLoading, setOperationLoading] = useState(false);

  /**
   * Update a job role with error handling and user feedback
   */
  const handleUpdateJobRole = async (
    roleId: string, 
    updates: UpdateJobRoleForm,
    successMessage?: string
  ): Promise<boolean> => {
    setOperationLoading(true);
    try {
      await updateJobRole(roleId, updates, user?.email || 'unknown@company.com');
      if (successMessage) {
        message.success(successMessage);
      }
      await loadJobRoles();
      return true;
    } catch (error) {
      console.error('Update job role error:', error);
      message.error('Failed to update job role');
      return false;
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Delete a job role with confirmation and error handling
   */
  const handleDeleteJobRole = async (role: JobRoleWithStats): Promise<boolean> => {
    const confirmed = window.confirm(`Are you sure you want to delete "${role.title}"?`);
    if (!confirmed) return false;

    setOperationLoading(true);
    try {
      await deleteJobRole(role.role_id);
      message.success('Job role deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete job role error:', error);
      message.error('Failed to delete job role');
      return false;
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Change job role status with validation and feedback
   */
  const handleStatusChange = async (role: JobRoleWithStats, newStatus: JobRoleStatus): Promise<boolean> => {
    return await handleUpdateJobRole(
      role.role_id, 
      { status: newStatus }, 
      `Status updated to ${newStatus.replace('_', ' ')}`
    );
  };

  /**
   * Save data collection data and update status
   */
  const handleDataCollectionSave = async (
    role: JobRoleWithStats, 
    dataCollectionData: DataCollectionData
  ): Promise<boolean> => {
    // First, save the data collection data
    const dataResult = await handleUpdateJobRole(
      role.role_id,
      { data_collection: dataCollectionData },
      ''
    );
    
    if (!dataResult) {
      return false;
    }
    
    // Then, update the status separately
    return await handleUpdateJobRole(
      role.role_id,
      { status: 'data_collection' },
      'Data collection completed successfully!'
    );
  };

  /**
   * Save test setup data and update status
   */
  const handleTestSetupSave = async (
    role: JobRoleWithStats, 
    testSetupData: TestSetupData
  ): Promise<boolean> => {
    // First, save the test setup data
    const dataResult = await handleUpdateJobRole(
      role.role_id,
      { test_setup: testSetupData },
      ''
    );
    
    if (!dataResult) {
      return false;
    }
    
    // Then, progress to the next status (management_review)
    return await handleUpdateJobRole(
      role.role_id,
      { status: 'management_review' },
      'Test setup completed successfully! Ready for management review.'
    );
  };

  /**
   * Save management review data and update status
   */
  const handleManagementReviewSave = async (
    role: JobRoleWithStats, 
    managementReviewData: ManagementReviewData
  ): Promise<boolean> => {
    // First, save the management review data
    const dataResult = await handleUpdateJobRole(
      role.role_id,
      { management_review: managementReviewData },
      ''
    );
    
    if (!dataResult) {
      return false;
    }
    
    // Determine the next status based on review decision
    let nextStatus: JobRoleStatus = 'management_review';
    let statusMessage = 'Management review saved successfully!';
    
    if (managementReviewData.review_status === 'approved') {
      nextStatus = 'ready_to_publish';
      statusMessage = 'Management review approved! Role is ready to publish.';
    } else if (managementReviewData.review_status === 'rejected') {
      nextStatus = 'draft'; // Send back to draft for major revisions
      statusMessage = 'Role rejected and returned to draft status.';
    } else if (managementReviewData.review_status === 'requires_changes') {
      nextStatus = 'test_setup'; // Send back to test setup for minor changes
      statusMessage = 'Changes requested - role returned to test setup stage.';
    }
    
    // Update the status separately
    return await handleUpdateJobRole(
      role.role_id,
      { status: nextStatus },
      statusMessage
    );
  };

  /**
   * Update job role from edit form
   */
  const handleEditSubmit = async (
    role: JobRoleWithStats, 
    formData: CreateJobRoleForm
  ): Promise<boolean> => {
    return await handleUpdateJobRole(
      role.role_id,
      formData,
      'Job role updated successfully!'
    );
  };

  /**
   * Populate form with role data for editing
   */
  const prepareRoleForEdit = (role: JobRoleWithStats) => {
    // Convert arrays to strings for form editing
    const requirements = Array.isArray(role.requirements) ? role.requirements.join('\n') : role.requirements;
    const preferred_qualifications = Array.isArray(role.preferred_qualifications) ? role.preferred_qualifications.join('\n') : role.preferred_qualifications;
    const responsibilities = Array.isArray(role.responsibilities) ? role.responsibilities.join('\n') : role.responsibilities;
    
    return {
      title: role.title,
      department: role.department,
      level: role.level,
      employment_type: role.employment_type,
      location: role.location,
      description: role.description,
      requirements,
      preferred_qualifications,
      responsibilities,
      salary_range_min: role.salary_range_min,
      salary_range_max: role.salary_range_max,
      currency: role.currency,
      openings_count: role.openings_count,
      is_priority: role.is_priority,
      publish_to_teamtailor: role.published_to_teamtailor
    };
  };

  /**
   * Convert JobRoleWithStats to JobRoleWizardData format for wizard editing
   */
  const prepareRoleForWizard = (role: JobRoleWithStats): JobRoleWizardData => {
    return {
      // Stage 1: Company
      company_id: role.company_id || '', // Add default if missing
      company_name: role.company_name,
      
      // Stage 2: Basic Info
      title: role.title,
      department: role.department,
      level: role.level,
      employment_type: role.employment_type,
      location: role.location,
      location_type: role.location_type || 'remote',
      time_zone: role.time_zone,
      number_of_resources: role.openings_count,
      contract_duration: role.contract_duration || '',
      
      // Required fields with defaults
      date_of_request: role.created_at?.split('T')[0] || new Date().toISOString().split('T')[0], // Use creation date or today
      desired_start_date: role.desired_start_date || new Date().toISOString().split('T')[0], // Default to today
      currency: role.currency || 'USD',
      desired_minimum_years_experience: role.desired_minimum_years_experience || 0,
      
      // Budget information
      target_budget_usd: role.target_budget_usd,
      maximum_budget_usd: role.maximum_budget_usd,
      target_rate_usd: role.target_rate_usd,
      budget_notes: role.budget_notes,
      
      // Stage 3: Skills
      requirements: Array.isArray(role.requirements) ? role.requirements : [role.requirements].filter(Boolean),
      preferred_qualifications: Array.isArray(role.preferred_qualifications) ? role.preferred_qualifications : [role.preferred_qualifications].filter(Boolean),
      responsibilities: Array.isArray(role.responsibilities) ? role.responsibilities : [role.responsibilities].filter(Boolean),
      
      // Stage 4: Position Analysis
      description: role.description,
      position_analysis: role.position_analysis,
      
      // Stage 5: Review
      is_priority: role.is_priority,
      publish_to_teamtailor: role.published_to_teamtailor || false,
    };
  };

  return {
    operationLoading,
    handleUpdateJobRole,
    handleDeleteJobRole,
    handleStatusChange,
    handleDataCollectionSave,
    handleTestSetupSave,
    handleManagementReviewSave,
    handleEditSubmit,
    prepareRoleForEdit,
    prepareRoleForWizard,
  };
};