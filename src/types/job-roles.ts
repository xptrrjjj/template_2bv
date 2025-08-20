// Job Roles type definitions for recruitment management

export interface JobRole {
  // Required datastore fields
  app_id: string; // Application identifier for datastore
  record_id: string; // Unique record identifier for datastore
  role_id: string; // UUID primary key
  
  // Stage 1: Company
  company_id: string; // Selected company ID
  company_name: string; // Company name for display
  
  // Stage 2: Basic Info
  title: string; // Job title (e.g., "Senior Software Engineer")
  department: string; // Department/Team from TeamTailor
  client?: string; // Client from TeamTailor
  account_exec?: string; // Account Executive details
  date_of_request: string; // Date of request
  desired_start_date: string; // Desired start date (default 6 weeks from request)
  contract_duration: string; // Rolling, 3 month minimum, or set months
  level: JobLevel; // Seniority level
  employment_type: EmploymentType; // Full-time, Part-time, Contract, etc.
  location: string; // Job location or "Remote"
  location_type: 'remote' | 'hybrid' | 'on-site'; // Location type
  time_zone?: string; // Time zone requirement
  
  // Budget & Compensation
  target_budget_usd?: number; // Target budget in USD
  target_budget_local?: number; // Target budget in local currency
  maximum_budget_usd?: number; // Maximum budget in USD
  maximum_budget_local?: number; // Maximum budget in local currency
  target_rate_usd?: number; // Target rate in USD
  currency: string; // Currency code (USD, EUR, etc.)
  budget_notes?: string; // Budget notes
  
  // Role Requirements
  number_of_resources: number; // Number of resources required
  desired_minimum_years_experience: number; // Minimum years experience
  job_description_attachment?: string; // Attachment for job description/scope
  
  // Stage 3: Skills (existing fields)
  requirements: string[]; // Required skills/qualifications
  preferred_qualifications: string[]; // Nice-to-have qualifications
  responsibilities: string[]; // Key responsibilities
  
  // Stage 4: Position Analysis
  description: string; // Detailed job description
  position_analysis?: PositionAnalysisResults; // AI analysis data
  
  // Stage 5: Data Collection (for data_collection status)
  data_collection?: DataCollectionData; // Comprehensive setup data
  
  // Stage 6: Test Setup (for test_setup status)
  test_setup?: TestSetupData; // Test configuration for candidates
  
  // Stage 7: Management Review (for management_review status)
  management_review?: ManagementReviewData; // Management approval workflow data
  
  // Legacy fields for compatibility
  salary_range_min?: number; // Minimum salary (legacy)
  salary_range_max?: number; // Maximum salary (legacy)
  
  // Status and Metadata
  status: JobRoleStatus; // Active, On Hold, Filled, Closed, Draft
  is_priority: boolean; // High priority role
  openings_count: number; // Number of positions to fill (same as number_of_resources)
  filled_count: number; // Number already filled
  
  // TeamTailor Integration
  teamtailor_job_id?: string; // TeamTailor job posting ID
  published_to_teamtailor: boolean; // Whether posted to TeamTailor
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string; // User who created the role
  updated_by: string; // User who last updated
  
  // Index signature for datastore compatibility
  [key: string]: unknown;
}

// Enums and Types
export type JobLevel = 'intern' | 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director' | 'vp' | 'c-level';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern' | 'temporary' | 'freelance';

export type JobRoleStatus = 'draft' | 'data_collection' | 'test_setup' | 'management_review' | 'ready_to_publish' | 'published_to_teamtailor' | 'active' | 'on-hold' | 'filled' | 'closed';

// Wizard stage interfaces
export interface JobRoleWizardStage1 {
  company_id: string;
  company_name: string;
}

export interface JobRoleWizardStage2 {
  // General Information
  department: string;
  client?: string;
  account_exec?: string;
  date_of_request: string;
  desired_start_date: string;
  contract_duration: string;
  
  // Basic job info
  location: string;
  location_type: 'remote' | 'hybrid' | 'on-site';
  time_zone?: string;
  level: JobLevel;
  employment_type: EmploymentType;
  
  // Budget & Compensation
  target_budget_usd?: number;
  target_budget_local?: number;
  maximum_budget_usd?: number;
  maximum_budget_local?: number;
  target_rate_usd?: number;
  currency: string;
  budget_notes?: string;
  
  // Role Requirements
  number_of_resources: number;
  title: string;
  desired_minimum_years_experience: number;
  job_description_attachment?: string;
}

export interface JobRoleWizardStage3 {
  requirements: string[];
  preferred_qualifications: string[];
  responsibilities: string[];
}

export interface JobRoleWizardStage4 {
  description: string;
  // Position analysis data
  position_analysis?: PositionAnalysisResults;
}

// Position Analysis result types for job data persistence
export interface ProviderMarketRate {
  min: number;
  max: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
}

export interface ProviderTalentData {
  score: number;
  status: 'abundant' | 'moderate' | 'limited' | 'scarce';
  timeline: string;
  insights: string[];
  challenges: string[];
}

export interface PositionAnalysisResults {
  marketRates?: {
    philippines: {
      openai: ProviderMarketRate;
      gemini: ProviderMarketRate;
    };
    usa: {
      openai: ProviderMarketRate;
      gemini: ProviderMarketRate;
    };
  };
  talentAvailability?: {
    openai: ProviderTalentData;
    gemini: ProviderTalentData;
  };
  jobDescription?: {
    openai: { content: string; wordCount: number; readingTime: number; };
    gemini: { content: string; wordCount: number; readingTime: number; };
  };
  rolePitch?: {
    openai: { content: string; keyPoints: string[]; };
    gemini: { content: string; keyPoints: string[]; };
  };
  analysisMetadata?: {
    timestamp: string;
    dataUsed: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

// Data Collection interfaces for comprehensive job setup
export interface InterviewerInfo {
  name: string;
  email: string;
  role: string;
  timezone: string;
  availability_hours?: string; // e.g., "9AM-5PM EST"
}

export interface InterviewSetupData {
  skills_interview: {
    interviewers: InterviewerInfo[];
    interview_kit_name?: string;
    max_interviews_per_day?: number;
    joint_or_separate: 'joint' | 'separate' | 'flexible';
    timezone_preference?: string;
    notes?: string;
  };
  final_interview: {
    client_interview_required: 'yes' | 'no' | 'tbc';
    client_interviewers: InterviewerInfo[];
    availability?: string;
    notes?: string;
  };
}

export interface SystemsAccessData {
  device_provided: 'yes' | 'no';
  microsoft_365_required: 'yes' | 'no';
  microsoft_apps_required: string[]; // List of specific O365 apps
  sharepoint_access_requirements?: string;
  additional_tools_software?: string[]; // List of additional tools/software
}

export interface ApplicationQuestionsData {
  us_shift_experience: 'required' | 'preferred' | 'not_required';
  custom_questions: string[]; // Array of custom application questions
}

export interface SiftingCriteriaData {
  must_have_skills: string[];
  nice_to_have_skills: string[];
  disqualifiers_red_flags: string[];
  sifting_owner?: string; // Who owns the sifting process
  notes?: string;
}

export interface DataCollectionData {
  interview_setup: InterviewSetupData;
  systems_access: SystemsAccessData;
  application_questions: ApplicationQuestionsData;
  sifting_criteria: SiftingCriteriaData;
  completion_metadata?: {
    completed_at?: string;
    completed_by?: string;
    completion_notes?: string;
  };
}

// Test Setup interfaces for TestDome integration
export interface TestConfiguration {
  test_id: string;
  test_name: string;
  test_url?: string;
  duration_minutes?: number;
  passing_score?: number;
  description?: string;
  skills_assessed: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_mandatory: boolean;
  test_order?: number; // For multiple tests
  programming_languages?: string[];
  test_type: 'programming' | 'knowledge' | 'multiple-choice' | 'open-ended';
}

export interface TestSetupData {
  tests_required: boolean;
  selected_tests: TestConfiguration[];
  test_instructions?: string;
  test_deadline_days?: number; // Days from application to complete tests
  send_test_immediately?: boolean; // Send test link immediately after application
  require_all_tests?: boolean; // Require all tests to pass or just one
  auto_screen_failures?: boolean; // Automatically reject failed tests
  test_coordinator?: string; // Person responsible for test management
  custom_test_requirements?: string; // Any special test requirements
  completion_metadata?: {
    configured_at?: string;
    configured_by?: string;
    configuration_notes?: string;
  };
}

// Management Review interfaces for management approval workflow
export interface ManagementReviewData {
  review_status: 'pending' | 'approved' | 'rejected' | 'requires_changes';
  reviewer_name?: string; // Person conducting the review
  reviewer_email?: string; // Reviewer's email
  review_notes?: string; // Management feedback/comments
  requested_changes?: string[]; // Specific changes requested
  approved_budget?: {
    target_budget_approved: boolean;
    maximum_budget_approved: boolean;
    approved_budget_amount?: number;
    budget_approval_notes?: string;
  };
  hiring_manager_approval?: {
    approved: boolean;
    hiring_manager_name?: string;
    approval_date?: string;
    approval_notes?: string;
  };
  priority_level?: 'urgent' | 'high' | 'normal' | 'low';
  estimated_approval_timeline?: string; // Expected time to get final approval
  compliance_checklist?: {
    budget_approved: boolean;
    headcount_approved: boolean;
    department_approval: boolean;
    legal_review_needed: boolean;
    diversity_requirements_met: boolean;
  };
  completion_metadata?: {
    reviewed_at?: string;
    reviewed_by?: string;
    review_duration_hours?: number;
    escalation_required?: boolean;
  };
}

export interface JobRoleWizardStage5 {
  is_priority: boolean;
  publish_to_teamtailor: boolean;
  // Review stage - shows all data for confirmation
}

export interface JobRoleWizardData extends 
  JobRoleWizardStage1, 
  JobRoleWizardStage2, 
  JobRoleWizardStage3, 
  JobRoleWizardStage4, 
  JobRoleWizardStage5 {}

// Legacy form interface for compatibility
export interface CreateJobRoleForm {
  title: string;
  department: string;
  level: JobLevel;
  employment_type: EmploymentType;
  location: string;
  description: string;
  requirements: string[];
  preferred_qualifications: string[];
  responsibilities: string[];
  salary_range_min?: number;
  salary_range_max?: number;
  currency: string;
  openings_count: number;
  is_priority: boolean;
  publish_to_teamtailor: boolean;
}

export interface UpdateJobRoleForm extends Partial<CreateJobRoleForm> {
  status?: JobRoleStatus;
  publish_to_teamtailor?: boolean;
  teamtailor_job_id?: string;
  data_collection?: DataCollectionData;
  test_setup?: TestSetupData;
  management_review?: ManagementReviewData;
}

// Enhanced interface for display
export interface JobRoleWithStats extends JobRole {
  applicant_count?: number; // Number of applications
  interview_count?: number; // Number in interview process
  days_open: number; // Days since role was opened
  fill_rate: number; // Percentage filled (filled_count / openings_count)
}

// Filter and search interfaces
export interface JobRoleFilters {
  department?: string;
  level?: JobLevel;
  employment_type?: EmploymentType;
  status?: JobRoleStatus;
  location?: string;
  is_priority?: boolean;
  published_to_teamtailor?: boolean;
}

export interface JobRoleSearchParams {
  query: string;
  filters: JobRoleFilters;
  sort_by: 'created_at' | 'updated_at' | 'title' | 'department' | 'salary_range_max';
  sort_order: 'asc' | 'desc';
}

// Statistics interfaces
export interface JobRoleStatistics {
  total_roles: number;
  active_roles: number;
  filled_roles: number;
  total_openings: number;
  total_filled: number;
  fill_rate: number;
  avg_time_to_fill: number; // In days
  roles_by_department: Record<string, number>;
  roles_by_level: Record<JobLevel, number>;
  priority_roles: number;
  teamtailor_published: number;
}

// Constants
export const JOB_LEVELS: { value: JobLevel; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP' },
  { value: 'c-level', label: 'C-Level' }
];

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'freelance', label: 'Freelance' }
];

export const JOB_ROLE_STATUSES: { value: JobRoleStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'data_collection', label: 'Data Collection', color: 'processing' },
  { value: 'test_setup', label: 'Test Setup', color: 'warning' },
  { value: 'management_review', label: 'Management Review', color: 'purple' },
  { value: 'ready_to_publish', label: 'Ready to Publish', color: 'cyan' },
  { value: 'published_to_teamtailor', label: 'Published to TeamTailor', color: 'blue' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'on-hold', label: 'On Hold', color: 'orange' },
  { value: 'filled', label: 'Filled', color: 'geekblue' },
  { value: 'closed', label: 'Closed', color: 'red' }
];

export const COMMON_DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Customer Success',
  'Operations',
  'HR',
  'Finance',
  'Legal',
  'Data Science',
  'DevOps',
  'Quality Assurance',
  'Business Development'
];

export const CONTRACT_DURATIONS = [
  { value: 'rolling', label: 'Rolling Contract' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '12months', label: '12 Months' },
  { value: '18months', label: '18 Months' },
  { value: '24months', label: '24 Months' },
  { value: 'custom', label: 'Custom Duration' }
];

export const TIME_ZONES = [
  { value: 'PST', label: 'Pacific Time (PST/PDT)' },
  { value: 'MST', label: 'Mountain Time (MST/MDT)' },
  { value: 'CST', label: 'Central Time (CST/CDT)' },
  { value: 'EST', label: 'Eastern Time (EST/EDT)' },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
  { value: 'CET', label: 'Central European Time (CET)' },
  { value: 'JST', label: 'Japan Standard Time (JST)' },
  { value: 'AEST', label: 'Australian Eastern Time (AEST)' },
  { value: 'flexible', label: 'Flexible/Multiple Zones' }
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' }
];

// TeamTailor integration types
export interface TeamTailorJob {
  id: string;
  type: 'jobs';
  attributes: {
    title: string;
    status: string;
    'external-application-url'?: string;
    'internal-application-url'?: string;
    'created-at': string;
    'updated-at': string;
  };
}

// Wizard state management
export interface JobRoleWizardState {
  currentStage: number;
  completedStages: number[];
  data: Partial<JobRoleWizardData>;
  isValid: Record<number, boolean>;
}

// Error handling
export class JobRoleError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'JobRoleError';
  }
}

// Wizard navigation
export const JOB_ROLE_WIZARD_STAGES = [
  { id: 1, title: 'Company', description: 'Select the company for this role' },
  { id: 2, title: 'Basic Info', description: 'Job details and requirements' },
  { id: 3, title: 'Skills', description: 'Required skills and qualifications' },
  { id: 4, title: 'Position Analysis', description: 'Detailed job description' },
  { id: 5, title: 'Review', description: 'Review and save as draft' }
];

// API Response types
export interface JobRolesResponse {
  data: JobRole[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JobRoleResponse {
  data: JobRole;
}

// Company selection for Stage 1 - uses MergedCompany from @/types/company

// TeamTailor department integration
export interface TeamTailorDepartment {
  id: string;
  name: string;
  company_id: string;
}

// TeamTailor client integration  
export interface TeamTailorClient {
  id: string;
  name: string;
  company_id: string;
}