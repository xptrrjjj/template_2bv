// Company-related type definitions for Companies page

export interface CompanyRecord {
  // Required datastore fields
  app_id: string;                        // Data type identifier ('companies')
  record_id: string;                     // Datastore record identifier
  
  // Company-specific fields
  company_id: string;                    // UUID primary key
  teamtailor_option_id: string;          // External key to TT custom-field-option
  industry: string;                      // Datastore only
  website?: string;                      // Datastore only (optional)
  contact_name: string;                  // Datastore only
  source: string;                        // Datastore only (e.g., "LinkedIn Referral")
  teamtailor_location_id: string;        // TT location reference
  location_name: string;                 // Human-readable location name
  created_at: string;                    // ISO timestamp
  updated_at: string;                    // ISO timestamp
  [key: string]: unknown;                // Index signature for datastore compatibility
}

export interface MergedCompany extends CompanyRecord {
  company_name: string;                  // From TT (authoritative)
  sync_status: 'synced' | 'missing';     // Derived status
  tt_created_at?: string;                // From TT
  tt_updated_at?: string;                // From TT
}

export interface CreateCompanyForm {
  company_name: string;
  industry: string;
  website?: string;
  contact_name: string;
  source: string;
  teamtailor_location_id: string;
  location_name: string;
}

export interface EditCompanyForm extends Partial<CreateCompanyForm> {
  company_name?: string;
}

// TeamTailor API response types for Companies integration
export interface TTCompanyOption {
  id: string;                            // Maps to teamtailor_option_id
  type: 'custom-field-options';
  attributes: {
    value: string;                       // Company Name (authoritative)
    'created-at': string;
    'updated-at': string;
  };
  relationships: {
    'custom-field': {
      data: { id: string; type: 'custom-fields' };
    };
  };
}

export interface TTLocationOption {
  id: string;                            // Maps to teamtailor_location_id
  type: 'locations';
  attributes: {
    name: string;                        // Maps to location_name
    city?: string;
    country?: string;
    'created-at': string;
    'updated-at': string;
  };
}

export interface TTCustomField {
  id: string;
  type: 'custom-fields';
  attributes: {
    name: string;
    'field-type': string;
    'api-key': string;
    'resource-type': string;
    'created-at': string;
    'updated-at': string;
  };
}

// API response wrappers
export interface TTCompanyResponse {
  data: TTCompanyOption[];
  meta: {
    'record-count': number;
    'page-count': number;
  };
  links: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface TTLocationResponse {
  data: TTLocationOption[];
  meta: {
    'record-count': number;
    'page-count': number;
  };
  links: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface TTSingleResponse<T> {
  data: T;
}

// Constants
export const COMPANY_SOURCES = [
  'LinkedIn Referral',
  'Direct Contact', 
  'Job Board',
  'Company Website',
  'Networking Event',
  'Other'
] as const;

export type CompanySource = typeof COMPANY_SOURCES[number];

// Error types
export class CompanyError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'CompanyError';
  }
}