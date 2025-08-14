'use server'

/**
 * SOLID Principle: Single Responsibility
 * TeamTailor Custom Field Actions - handles only custom field-related operations
 * TODO: Implement when TeamTailor custom field operations are ready
 */

// ===== CUSTOM FIELD ACTIONS =====
// TODO: Implement when TeamTailor custom field operations are ready

// Placeholder implementations that return "not implemented" errors
export async function fetchAllCustomFields(): Promise<any[]> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function fetchCustomField(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function createNewCustomField(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function updateExistingCustomField(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function removeCustomField(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function fetchCustomFieldsByResourceType(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function fetchCandidateCustomFields(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function fetchJobCustomFields(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function fetchUserCustomFields(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

export async function validateFieldValue(): Promise<never> {
  throw new Error('TeamTailor custom field operations not yet implemented');
}

// ===== CUSTOM FIELD OPTIONS =====

export async function fetchAllCustomFieldOptions(): Promise<any[]> {
  throw new Error('TeamTailor custom field option operations not yet implemented');
}

export async function fetchCustomFieldOptionsByFieldId(customFieldId: string): Promise<any[]> {
  throw new Error('TeamTailor custom field option operations not yet implemented');
}

export async function fetchCustomFieldOption(): Promise<never> {
  throw new Error('TeamTailor custom field option operations not yet implemented');
}

export async function createNewCustomFieldOption(data: any): Promise<any> {
  throw new Error('TeamTailor custom field option operations not yet implemented');
}

export async function updateExistingCustomFieldOption(id: string, data: any): Promise<any> {
  throw new Error('TeamTailor custom field option operations not yet implemented');
}

export async function removeCustomFieldOption(): Promise<never> {
  throw new Error('TeamTailor custom field option operations not yet implemented');
}