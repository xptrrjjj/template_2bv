'use server'

/**
 * SOLID Principle: Single Responsibility
 * TeamTailor Department Actions - handles only department-related operations
 */

import { 
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  DepartmentOption,
  DepartmentPayload,
  DepartmentRequestOptions
} from '@/lib/integrations/teamtailor';

// ===== DEPARTMENT ACTIONS =====

export async function fetchAllDepartments(options?: DepartmentRequestOptions): Promise<DepartmentOption[]> {
  try {
    return await getAllDepartments(options);
  } catch (error) {
    // Re-throw the original error message
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch departments');
  }
}

export async function fetchDepartment(id: string): Promise<DepartmentOption> {
  try {
    return await getDepartment(id);
  } catch (error) {
    throw new Error(`Failed to fetch department ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createNewDepartment(data: DepartmentPayload): Promise<DepartmentOption> {
  try {
    return await createDepartment(data);
  } catch (error) {
    throw new Error(`Failed to create department: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateExistingDepartment(id: string, data: Partial<DepartmentPayload>): Promise<DepartmentOption> {
  try {
    return await updateDepartment(id, data);
  } catch (error) {
    throw new Error(`Failed to update department ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeDepartment(id: string): Promise<void> {
  try {
    await deleteDepartment(id);
  } catch (error) {
    throw new Error(`Failed to delete department ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}