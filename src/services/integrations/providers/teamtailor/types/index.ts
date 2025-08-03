/**
 * TeamTailor API Type Definitions
 */

// API Response Types
export interface TeamTailorApiResponse<T> {
  data: T[];
  meta?: {
    "record-count": number;
    "page-count": number;
  };
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export interface TeamTailorSingleResponse<T> {
  data: T;
  included?: unknown[];
}

// Department Types
export interface TeamTailorDepartment {
  id: string;
  type: "departments";
  attributes: {
    name: string;
    "created-at": string;
    "updated-at": string;
  };
  relationships?: {
    parent?: {
      data?: {
        id: string;
        type: "departments";
      };
    };
  };
}

// Location Types
export interface TeamTailorLocation {
  id: string;
  type: "locations";
  attributes: {
    name: string;
    city: string;
    country: string;
    "created-at": string;
    "updated-at": string;
  };
}

// Job Template Types
export interface TeamTailorJobTemplate {
  id: string;
  type: "job-templates";
  attributes: {
    name: string;
    body?: string;
    requirements?: string;
    "created-at": string;
    "updated-at": string;
  };
}

// Stage Types
export interface TeamTailorStage {
  id: string;
  type: "stages";
  attributes: {
    name: string;
    order: number;
    category: string;
    "created-at": string;
    "updated-at": string;
  };
}

// Job Types
export interface TeamTailorJobAttributes {
  name: string;
  body?: string;
  requirements?: string;
  status: "published" | "draft" | "archived";
  "apply-button-text"?: string;
  "end-date"?: string;
  "start-date"?: string;
  tags?: string[];
  "reference-number"?: string;
  "salary-description"?: string;
  "employment-type"?: string;
  "apply-url"?: string;
  "created-at"?: string;
  "updated-at"?: string;
}

export interface TeamTailorJobRelationships {
  department?: {
    data: {
      id: string;
      type: "departments";
    };
  };
  locations?: {
    data: Array<{
      id: string;
      type: "locations";
    }>;
  };
  "job-template"?: {
    data: {
      id: string;
      type: "job-templates";
    };
  };
  stages?: {
    data: Array<{
      id: string;
      type: "stages";
    }>;
  };
}

export interface TeamTailorJob {
  id: string;
  type: "jobs";
  attributes: TeamTailorJobAttributes;
  relationships?: TeamTailorJobRelationships;
}

export interface TeamTailorJobRequest {
  data: {
    type: "jobs";
    attributes: Omit<TeamTailorJobAttributes, "apply-url" | "created-at" | "updated-at">;
    relationships?: TeamTailorJobRelationships;
  };
}

// Publish Result Types
export interface TeamTailorPublishResult {
  externalId: string;
  externalUrl: string;
  metadata: Record<string, unknown>;
}

// Internal Types
export interface RoleData {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  department?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  referenceNumber?: string;
  status?: string;
  [key: string]: unknown;
}

export interface TeamTailorJobData {
  name: string;
  body?: string;
  requirements?: string;
  status: string;
  departmentId?: string;
  locationId?: string;
  locationIds?: string[];
  jobTemplateId?: string;
  stageIds?: string[];
  applyButtonText?: string;
  endDate?: string;
  startDate?: string;
  tags?: string[];
  referenceNumber?: string;
  salaryDescription?: string;
  employmentType?: string;
  [key: string]: unknown;
}