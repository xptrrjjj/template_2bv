/**
 * TypeScript type definitions for TeamTailor API
 * Includes all request/response interfaces and pagination types
 */

// Core pagination types
export interface TeamTailorPaginatedResponse<T> {
  data: T[];
  meta: {
    "record-count": number;    // Total number of items in collection
    "page-count": number;      // Total number of pages
  };
  links: {
    first?: string;            // First page URL
    last?: string;             // Last page URL
    prev?: string;             // Previous page URL (with page[before] cursor)
    next?: string;             // Next page URL (with page[after] cursor)
  };
  included?: any[];            // Related resources when using include parameter
}

export interface PaginationConfig {
  maxPages?: number;           // Safety limit (default: 1000)
  delayBetweenRequests?: number; // Rate limiting delay (default: 200ms)
  retryFailedPages?: boolean;   // Retry failed page requests
  maxRetries?: number;         // Maximum retry attempts per page
  pageSize?: number;          // Items per page (default: 30, max: 30)
  onPageFetched?: <T>(pageData: TeamTailorPaginatedResponse<T>, currentPage: number, totalPages: number) => void;
}

export interface PaginationOptions {
  include?: string[];          // Related resources to include
  filter?: Record<string, any>; // Filters to apply
  sort?: string;              // Sort order
  page?: { size?: number };   // Page size (max 30)
}

// API parameter types
export interface TeamTailorRequestOptions extends PaginationOptions {
  fields?: Record<string, string[]>; // Sparse fieldsets
}

// Base resource types
export interface TeamTailorResource {
  id: string;
  type: string;
}

export interface TeamTailorResourceAttributes {
  "created-at"?: string;
  "updated-at"?: string;
}

// Client types
export interface ClientAttributes extends TeamTailorResourceAttributes {
  name: string;
  "external-id"?: string;
  status?: 'active' | 'inactive';
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  "logo-url"?: string;
}

export interface ClientResource extends TeamTailorResource {
  type: 'clients';
  attributes: ClientAttributes;
  relationships?: {
    jobs?: {
      data: Array<{ id: string; type: 'jobs' }>;
    };
    users?: {
      data: Array<{ id: string; type: 'users' }>;
    };
  };
}

export interface ClientOption {
  id: string;
  name: string;
  externalId?: string;
  status?: 'active' | 'inactive';
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientPayload {
  name: string;
  externalId?: string;
  status?: 'active' | 'inactive';
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
}

// Job types
export interface JobAttributes extends TeamTailorResourceAttributes {
  title: string;
  body: string;
  pitch?: string;
  status: 'draft' | 'published' | 'archived' | 'template';
  "start-date"?: string;
  "end-date"?: string;
  "external-id"?: string;
  "remote-status"?: 'none' | 'temporary' | 'permanent';
  "salary-currency"?: string;
  "salary-from"?: number;
  "salary-to"?: number;
  "employment-type"?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  "experience-required"?: string;
  "skills-required"?: string[];
  "careersite-job-url"?: string;
  "careersite-job-apply-url"?: string;
  "careersite-job-apply-iframe-url"?: string;
  "template-id"?: number;
}

export interface JobResource extends TeamTailorResource {
  type: 'jobs';
  attributes: JobAttributes;
  relationships?: {
    department?: {
      data: { id: string; type: 'departments' } | null;
    };
    locations?: {
      data: Array<{ id: string; type: 'locations' }>;
    };
    user?: {
      data: { id: string; type: 'users' } | null;
    };
    client?: {
      data: { id: string; type: 'clients' } | null;
    };
  };
}

export interface JobOption {
  id: string;
  title: string;
  body: string;
  pitch?: string;
  status: 'draft' | 'published' | 'archived' | 'template';
  startDate?: string;
  endDate?: string;
  externalId?: string;
  remoteStatus?: 'none' | 'temporary' | 'permanent';
  salaryCurrency?: string;
  salaryFrom?: number;
  salaryTo?: number;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  experienceRequired?: string;
  skillsRequired?: string[];
  careersiteJobUrl?: string;
  careersiteJobApplyUrl?: string;
  careersiteJobApplyIframeUrl?: string;
  templateId?: number;
  department?: any;
  locations?: any[];
  user?: any;
  client?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobPayload {
  title: string;
  body: string;
  pitch?: string;
  status?: 'draft' | 'published' | 'archived';
  startDate?: string;
  endDate?: string;
  externalId?: string;
  remoteStatus?: 'none' | 'temporary' | 'permanent';
  salaryCurrency?: string;
  salaryFrom?: number;
  salaryTo?: number;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  experienceRequired?: string;
  skillsRequired?: string[];
  departmentId?: string;
  locationIds?: string[];
  userId?: string;
  clientId?: string;
  templateId?: number;
}

export interface JobTemplate extends JobOption {
  status: 'template';
  templateName?: string;
}

// Candidate types
export interface CandidateAttributes extends TeamTailorResourceAttributes {
  "first-name"?: string;
  "last-name"?: string;
  email: string;
  phone?: string;
  pitch?: string;
  "external-id"?: string;
  "sourced"?: boolean;
  "profile-picture-url"?: string;
  tags?: string[];
  "linkedin-url"?: string;
  "facebook-url"?: string;
  "twitter-url"?: string;
  "connected"?: boolean;
  "resume-url"?: string;
}

export interface CandidateResource extends TeamTailorResource {
  type: 'candidates';
  attributes: CandidateAttributes;
  relationships?: {
    "job-applications"?: {
      data: Array<{ id: string; type: 'job-applications' }>;
    };
    locations?: {
      data: Array<{ id: string; type: 'locations' }>;
    };
    user?: {
      data: { id: string; type: 'users' } | null;
    };
  };
}

export interface CandidateOption {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  pitch?: string;
  externalId?: string;
  sourced?: boolean;
  profilePictureUrl?: string;
  tags?: string[];
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  connected?: boolean;
  resumeUrl?: string;
  jobApplications?: any[];
  locations?: any[];
  user?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidatePayload {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  pitch?: string;
  externalId?: string;
  sourced?: boolean;
  tags?: string[];
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  locationIds?: string[];
  merge?: boolean; // Merge with existing candidate if email matches
}

// Job Application types
export interface JobApplicationAttributes extends TeamTailorResourceAttributes {
  "stage-type": 'applied' | 'phone_screen' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  "rejected-at"?: string;
  "changed-stage-at"?: string;
  "sourced"?: boolean;
  "cover-letter"?: string;
  rating?: number;
}

export interface JobApplicationResource extends TeamTailorResource {
  type: 'job-applications';
  attributes: JobApplicationAttributes;
  relationships?: {
    candidate?: {
      data: { id: string; type: 'candidates' } | null;
    };
    job?: {
      data: { id: string; type: 'jobs' } | null;
    };
    user?: {
      data: { id: string; type: 'users' } | null;
    };
  };
}

export interface JobApplication {
  id: string;
  stageType: 'applied' | 'phone_screen' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  rejectedAt?: string;
  changedStageAt?: string;
  sourced?: boolean;
  coverLetter?: string;
  rating?: number;
  candidate?: CandidateOption;
  job?: JobOption;
  user?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Custom Field types
export interface CustomFieldAttributes extends TeamTailorResourceAttributes {
  name: string;
  "field-type": 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  "api-key": string;
  required?: boolean;
  "resource-type": 'candidates' | 'jobs' | 'users';
  options?: string[];
  description?: string;
}

export interface CustomFieldResource extends TeamTailorResource {
  type: 'custom-fields';
  attributes: CustomFieldAttributes;
}

export interface CustomFieldOption {
  id: string;
  name: string;
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  apiKey: string;
  required?: boolean;
  resourceType: 'candidates' | 'jobs' | 'users';
  options?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomFieldPayload {
  name: string;
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  apiKey: string;
  required?: boolean;
  resourceType: 'candidates' | 'jobs' | 'users';
  options?: string[];
  description?: string;
}

// Request option types for endpoints
export interface ClientRequestOptions extends TeamTailorRequestOptions {
  filter?: {
    status?: 'active' | 'inactive';
    name?: string;
    "external-id"?: string;
  };
}

export interface JobRequestOptions extends TeamTailorRequestOptions {
  filter?: {
    status?: 'draft' | 'published' | 'archived' | 'template';
    "department-id"?: string;
    "location-id"?: string;
    "client-id"?: string;
    "user-id"?: string;
    "template-name"?: string;
  };
}

export interface CandidateRequestOptions extends TeamTailorRequestOptions {
  filter?: {
    email?: string;
    "external-id"?: string;
    tag?: string;
    sourced?: boolean;
    connected?: boolean;
  };
}

export interface CustomFieldRequestOptions extends TeamTailorRequestOptions {
  filter?: {
    "resource-type"?: 'candidates' | 'jobs' | 'users';
    "field-type"?: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  };
}

// Department types
export interface DepartmentAttributes extends TeamTailorResourceAttributes {
  name: string;
}

export interface DepartmentResource extends TeamTailorResource {
  type: 'departments';
  attributes: DepartmentAttributes;
  relationships?: {
    jobs?: {
      data: Array<{ id: string; type: 'jobs' }>;
    };
  };
}

export interface DepartmentOption {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentPayload {
  name: string;
}

export interface DepartmentRequestOptions extends TeamTailorRequestOptions {
  filter?: {
    name?: string;
  };
}

// Error response type
export interface TeamTailorErrorResponse {
  errors: Array<{
    status: string;
    title: string;
    detail?: string;
    source?: {
      pointer?: string;
      parameter?: string;
    };
  }>;
}