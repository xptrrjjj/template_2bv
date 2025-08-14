/**
 * TeamTailor Custom Field Options endpoint implementation
 * Handles custom field option values (e.g., company names in select fields)
 */

import { teamTailorClient } from '../client';
import { TeamTailorPaginatedResponse } from '../types';
import { NotFoundError } from '../errors';

// Custom Field Option types
export interface CustomFieldOptionResource {
  id: string;
  type: 'custom-field-options';
  attributes: {
    value: string;
    'created-at': string;
    'updated-at': string;
  };
  relationships: {
    'custom-field': {
      data: { id: string; type: 'custom-fields' };
    };
  };
}

export interface CustomFieldOptionOption {
  id: string;
  value: string;
  customFieldId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldOptionPayload {
  value: string;
  customFieldId: string;
}

export interface CustomFieldOptionRequestOptions {
  include?: string[];
  filter?: {
    'custom-field'?: string;
    value?: string;
  };
  sort?: string;
  page?: { size?: number };
  [key: string]: unknown;
}

/**
 * Transform TeamTailor custom field option resource to application-friendly format
 */
function transformCustomFieldOption(resource: CustomFieldOptionResource): CustomFieldOptionOption {
  return {
    id: resource.id,
    value: resource.attributes.value,
    customFieldId: resource.relationships['custom-field'].data.id,
    createdAt: resource.attributes['created-at'],
    updatedAt: resource.attributes['updated-at'],
  };
}

/**
 * Transform custom field option payload to TeamTailor API format
 */
function transformPayload(payload: CustomFieldOptionPayload): Record<string, unknown> {
  return {
    attributes: {
      value: payload.value,
    },
    relationships: {
      'custom-field': {
        data: { 
          id: payload.customFieldId, 
          type: 'custom-fields' 
        }
      }
    }
  };
}

/**
 * Get all custom field options with automatic pagination
 * Returns a complete array of all custom field options
 */
export async function getAllCustomFieldOptions(options?: CustomFieldOptionRequestOptions): Promise<CustomFieldOptionOption[]> {
  const resources = await teamTailorClient.getAllPaginated<CustomFieldOptionResource>(
    '/v1/custom-field-options',
    options
  );
  
  return resources.map(transformCustomFieldOption);
}

/**
 * Get custom field options by custom field ID
 * Uses the correct endpoint: /custom-field-selects/{fieldId}/custom-field-options
 */
export async function getCustomFieldOptionsByFieldId(
  customFieldId: string,
  options?: Omit<CustomFieldOptionRequestOptions, 'filter'>
): Promise<CustomFieldOptionOption[]> {
  const resources = await teamTailorClient.getAllPaginated<CustomFieldOptionResource>(
    `/v1/custom-field-selects/${customFieldId}/custom-field-options`,
    options
  );
  
  return resources.map(transformCustomFieldOption);
}

/**
 * Get a single custom field option by ID
 */
export async function getCustomFieldOption(
  id: string, 
  options?: { include?: string[] }
): Promise<CustomFieldOptionOption> {
  const response = await teamTailorClient.get<{ data: CustomFieldOptionResource }>(
    `/v1/custom-field-options/${id}`,
    { params: options }
  );
  
  if (!response.data) {
    throw new NotFoundError('Custom field option not found', 'custom-field-options', id);
  }
  
  return transformCustomFieldOption(response.data);
}

/**
 * Create a new custom field option
 */
export async function createCustomFieldOption(data: CustomFieldOptionPayload): Promise<CustomFieldOptionOption> {
  const payload = transformPayload(data);
  
  const response = await teamTailorClient.post<{ data: CustomFieldOptionResource }>(
    '/v1/custom-field-options',
    { data: { type: 'custom-field-options', ...payload } }
  );
  
  return transformCustomFieldOption(response.data);
}

/**
 * Update an existing custom field option
 */
export async function updateCustomFieldOption(
  id: string, 
  data: Partial<CustomFieldOptionPayload>
): Promise<CustomFieldOptionOption> {
  const payload = data.customFieldId 
    ? transformPayload(data as CustomFieldOptionPayload)
    : { attributes: { value: data.value } };
  
  const response = await teamTailorClient.patch<{ data: CustomFieldOptionResource }>(
    `/v1/custom-field-options/${id}`,
    { data: { type: 'custom-field-options', id, ...payload } }
  );
  
  return transformCustomFieldOption(response.data);
}

/**
 * Delete a custom field option
 */
export async function deleteCustomFieldOption(id: string): Promise<void> {
  await teamTailorClient.delete(`/v1/custom-field-options/${id}`);
}

/**
 * Search custom field options by value
 */
export async function searchCustomFieldOptionsByValue(
  customFieldId: string,
  searchValue: string,
  options?: Omit<CustomFieldOptionRequestOptions, 'filter'>
): Promise<CustomFieldOptionOption[]> {
  const allOptions = await getCustomFieldOptionsByFieldId(customFieldId, options);
  
  // Filter by value (case-insensitive partial match)
  return allOptions.filter(option => 
    option.value.toLowerCase().includes(searchValue.toLowerCase())
  );
}

/**
 * Get a page of custom field options with pagination support
 * Returns paginated results with metadata
 */
export async function getCustomFieldOptionsPage(options?: CustomFieldOptionRequestOptions): Promise<{
  options: CustomFieldOptionOption[];
  meta: {
    recordCount: number;
    pageCount: number;
  };
  links: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}> {
  const response = await teamTailorClient.get<TeamTailorPaginatedResponse<CustomFieldOptionResource>>(
    '/v1/custom-field-options',
    { params: options }
  );
  
  return {
    options: response.data.map(transformCustomFieldOption),
    meta: {
      recordCount: response.meta['record-count'],
      pageCount: response.meta['page-count']
    },
    links: response.links
  };
}