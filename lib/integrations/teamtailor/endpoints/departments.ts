/**
 * TeamTailor Departments API endpoints
 * Handles CRUD operations for departments
 */

import { teamTailorClient } from '../client';
import { 
  DepartmentResource,
  DepartmentOption,
  DepartmentPayload,
  DepartmentRequestOptions
} from '../types';

/**
 * Get all departments with optional filtering and pagination
 */
export async function getAllDepartments(
  options: DepartmentRequestOptions = {}
): Promise<DepartmentOption[]> {
  try {
    const allDepartments: DepartmentOption[] = [];
    let nextUrl: string | null = '/v1/departments';
    
    // Add any query parameters from options
    if (Object.keys(options).length > 0) {
      const params = new URLSearchParams();
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(`filter[${key}]`, String(value));
          }
        });
      }
      if (params.toString()) {
        nextUrl += '?' + params.toString();
      }
    }
    
    // Follow the pagination links until no more 'next' link exists
    while (nextUrl) {
      const response: {
        data: DepartmentResource[];
        meta: { 'record-count': number; 'page-count': number };
        links?: { next?: string };
      } = await teamTailorClient.get(nextUrl);
      
      // Add current page results to our collection
      if (response.data && Array.isArray(response.data)) {
        const transformedDepartments = response.data.map(transformDepartmentResource);
        allDepartments.push(...transformedDepartments);
      }
      
      // Check if there's a next page
      nextUrl = response.links?.next || null;
    }
    
    return allDepartments;
    
  } catch (error: unknown) {
    console.error('TeamTailor departments API error:', error);
    
    // Check if it's a 404 - departments endpoint might not be available for this account
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return [];
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`TeamTailor departments API failed: ${errorMessage}`);
  }
}

/**
 * Get a specific department by ID
 */
export async function getDepartment(id: string): Promise<DepartmentOption> {
  try {
    const response = await teamTailorClient.get<{ data: DepartmentResource }>(`/v1/departments/${id}`);
    return transformDepartmentResource(response.data);
  } catch (error) {
    throw new Error(`Failed to fetch department ${id}: ${error}`);
  }
}

/**
 * Create a new department
 */
export async function createDepartment(payload: DepartmentPayload): Promise<DepartmentOption> {
  try {
    const requestData = {
      data: {
        type: 'departments' as const,
        attributes: {
          name: payload.name,
        },
      },
    };

    const response = await teamTailorClient.post<{ data: DepartmentResource }>('/v1/departments', requestData);
    return transformDepartmentResource(response.data);
  } catch (error) {
    throw new Error(`Failed to create department: ${error}`);
  }
}

/**
 * Update an existing department
 */
export async function updateDepartment(
  id: string, 
  payload: Partial<DepartmentPayload>
): Promise<DepartmentOption> {
  try {
    const requestData = {
      data: {
        type: 'departments' as const,
        id: id,
        attributes: {
          ...(payload.name && { name: payload.name }),
        },
      },
    };

    const response = await teamTailorClient.patch<{ data: DepartmentResource }>(`/v1/departments/${id}`, requestData);
    return transformDepartmentResource(response.data);
  } catch (error) {
    throw new Error(`Failed to update department ${id}: ${error}`);
  }
}

/**
 * Delete a department
 */
export async function deleteDepartment(id: string): Promise<void> {
  try {
    await teamTailorClient.delete(`/v1/departments/${id}`);
  } catch (error) {
    throw new Error(`Failed to delete department ${id}: ${error}`);
  }
}

/**
 * Transform a department resource to a simplified format
 */
function transformDepartmentResource(resource: DepartmentResource): DepartmentOption {
  return {
    id: resource.id,
    name: resource.attributes.name,
    createdAt: resource.attributes['created-at'],
    updatedAt: resource.attributes['updated-at'],
  };
}