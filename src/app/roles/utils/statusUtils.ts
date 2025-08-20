import { JobRoleStatus, JobRoleWithStats } from '@/types/job-roles';

/**
 * Status progression mapping for job roles workflow
 * Defines the next status in the workflow sequence
 */
export const STATUS_PROGRESSION: Record<JobRoleStatus, JobRoleStatus> = {
  'draft': 'data_collection',
  'data_collection': 'test_setup',
  'test_setup': 'management_review',
  'management_review': 'ready_to_publish',
  'ready_to_publish': 'published_to_teamtailor',
  'published_to_teamtailor': 'active',
  'active': 'active', // Terminal state
  'on-hold': 'on-hold', // Terminal state
  'filled': 'filled', // Terminal state
  'closed': 'closed' // Terminal state
};

/**
 * Check if a role can start data collection
 */
export const canStartDataCollection = (status: JobRoleStatus): boolean => {
  return status === 'draft';
};

/**
 * Check if a role is currently in data collection phase
 */
export const isInDataCollection = (status: JobRoleStatus): boolean => {
  return status === 'data_collection';
};

/**
 * Check if a role can start test setup
 */
export const canStartTestSetup = (status: JobRoleStatus): boolean => {
  return status === 'data_collection';
};

/**
 * Check if a role is currently in test setup phase
 */
export const isInTestSetup = (status: JobRoleStatus): boolean => {
  return status === 'test_setup';
};

/**
 * Check if a role can start management review
 */
export const canStartManagementReview = (status: JobRoleStatus, role?: JobRoleWithStats): boolean => {
  if (status !== 'test_setup') return false;
  // Check if test setup is complete
  return role ? isTestSetupComplete(role) : true;
};

/**
 * Check if a role is currently in management review phase
 */
export const isInManagementReview = (status: JobRoleStatus): boolean => {
  return status === 'management_review';
};

/**
 * Check if test setup is complete (has at least one test configured)
 */
export const isTestSetupComplete = (role: JobRoleWithStats): boolean => {
  if (!role.test_setup) return false;
  return role.test_setup.tests_required === false || 
         (role.test_setup.selected_tests && role.test_setup.selected_tests.length > 0);
};

/**
 * Check if a role can progress to the next status
 * For test_setup status, requires at least one test to be configured
 */
export const canProgressStatus = (status: JobRoleStatus, role?: JobRoleWithStats): boolean => {
  const progressableStatuses = ['data_collection', 'test_setup', 'management_review', 'ready_to_publish'];
  
  if (!progressableStatuses.includes(status)) {
    return false;
  }
  
  // Special validation for test_setup status
  if (status === 'test_setup' && role) {
    return isTestSetupComplete(role);
  }
  
  return true;
};

/**
 * Get the next status in the progression
 */
export const getNextStatus = (currentStatus: JobRoleStatus): JobRoleStatus => {
  return STATUS_PROGRESSION[currentStatus];
};

/**
 * Check if status transition is valid
 */
export const isValidStatusTransition = (from: JobRoleStatus, to: JobRoleStatus): boolean => {
  const expectedNext = STATUS_PROGRESSION[from];
  return expectedNext === to;
};

/**
 * Get user-friendly description for status progression action
 */
export const getStatusActionLabel = (currentStatus: JobRoleStatus): string => {
  const nextStatus = getNextStatus(currentStatus);
  
  const actionLabels: Record<JobRoleStatus, string> = {
    'draft': 'Start Data Collection',
    'data_collection': 'Move to Test Setup',
    'test_setup': 'Send for Management Review',
    'management_review': 'Mark Ready to Publish',
    'ready_to_publish': 'Publish to TeamTailor',
    'published_to_teamtailor': 'Activate Role',
    'active': 'Already Active',
    'on-hold': 'On Hold',
    'filled': 'Already Filled',
    'closed': 'Already Closed'
  };

  return actionLabels[currentStatus] || 'Progress Status';
};

/**
 * Get status-specific styling information
 */
export const getStatusStyling = (status: JobRoleStatus) => {
  const statusStyles: Record<JobRoleStatus, { color: string; priority: number }> = {
    'draft': { color: '#8c8c8c', priority: 1 },
    'data_collection': { color: '#1890ff', priority: 2 },
    'test_setup': { color: '#faad14', priority: 3 },
    'management_review': { color: '#722ed1', priority: 4 },
    'ready_to_publish': { color: '#13c2c2', priority: 5 },
    'published_to_teamtailor': { color: '#1890ff', priority: 6 },
    'active': { color: '#52c41a', priority: 7 },
    'on-hold': { color: '#fa8c16', priority: 0 },
    'filled': { color: '#2f54eb', priority: 8 },
    'closed': { color: '#f5222d', priority: 9 }
  };

  return statusStyles[status] || { color: '#8c8c8c', priority: 0 };
};