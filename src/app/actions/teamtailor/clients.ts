'use server'

/**
 * SOLID Principle: Single Responsibility
 * TeamTailor Client Actions - handles only client-related operations
 */

import { 
  getAllClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientsByStatus,
  searchClientsByName,
  getClientByExternalId,
  getClientsPage,
  ClientPayload,
  ClientOption,
  ClientRequestOptions
} from '@/lib/integrations/teamtailor';

// ===== CLIENT ACTIONS =====

export async function fetchAllClients(options?: ClientRequestOptions): Promise<ClientOption[]> {
  try {
    return await getAllClients(options);
  } catch (error) {
    console.error('Server Action: fetchAllClients failed:', error);
    throw new Error('Failed to fetch clients');
  }
}

export async function fetchClient(id: string): Promise<ClientOption> {
  try {
    return await getClient(id);
  } catch (error) {
    console.error('Server Action: fetchClient failed:', error);
    throw new Error(`Failed to fetch client ${id}`);
  }
}

export async function createNewClient(data: ClientPayload): Promise<ClientOption> {
  try {
    return await createClient(data);
  } catch (error) {
    console.error('Server Action: createNewClient failed:', error);
    throw new Error('Failed to create client');
  }
}

export async function updateExistingClient(id: string, data: Partial<ClientPayload>): Promise<ClientOption> {
  try {
    return await updateClient(id, data);
  } catch (error) {
    console.error('Server Action: updateExistingClient failed:', error);
    throw new Error(`Failed to update client ${id}`);
  }
}

export async function removeClient(id: string): Promise<void> {
  try {
    await deleteClient(id);
  } catch (error) {
    console.error('Server Action: removeClient failed:', error);
    throw new Error(`Failed to delete client ${id}`);
  }
}

export async function fetchClientsByStatus(status: 'active' | 'inactive'): Promise<ClientOption[]> {
  try {
    return await getClientsByStatus(status);
  } catch (error) {
    console.error('Server Action: fetchClientsByStatus failed:', error);
    throw new Error(`Failed to fetch ${status} clients`);
  }
}

export async function searchClients(name: string): Promise<ClientOption[]> {
  try {
    return await searchClientsByName(name);
  } catch (error) {
    console.error('Server Action: searchClients failed:', error);
    throw new Error('Failed to search clients by name');
  }
}

export async function fetchClientByExternalId(externalId: string): Promise<ClientOption | null> {
  try {
    return await getClientByExternalId(externalId);
  } catch (error) {
    console.error('Server Action: fetchClientByExternalId failed:', error);
    throw new Error('Failed to fetch client by external ID');
  }
}

export async function fetchClientsPage(
  page = 1,
  limit = 25,
  options?: Omit<ClientRequestOptions, 'page'>
): Promise<{
  data: ClientOption[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}> {
  try {
    const result = await getClientsPage(undefined, { ...options, page: { size: limit } });
    
    return {
      data: result.clients,
      pagination: {
        currentPage: page,
        totalPages: result.meta['page-count'],
        totalItems: result.meta['record-count'],
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    console.error('Server Action: fetchClientsPage failed:', error);
    throw new Error('Failed to fetch clients page');
  }
}