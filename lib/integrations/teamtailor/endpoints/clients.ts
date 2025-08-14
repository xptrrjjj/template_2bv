/**
 * TeamTailor Clients endpoint implementation
 * Handles all client-related operations with automatic pagination
 */

import { teamTailorClient } from '../client';
import { 
  ClientResource, 
  ClientOption, 
  ClientPayload,
  ClientRequestOptions,
  TeamTailorPaginatedResponse
} from '../types';
import { NotFoundError } from '../errors';

/**
 * Transform TeamTailor client resource to application-friendly format
 */
function transformClient(resource: ClientResource): ClientOption {
  return {
    id: resource.id,
    name: resource.attributes.name,
    externalId: resource.attributes['external-id'],
    status: resource.attributes.status,
    description: resource.attributes.description,
    website: resource.attributes.website,
    industry: resource.attributes.industry,
    size: resource.attributes.size,
    logoUrl: resource.attributes['logo-url'],
    createdAt: resource.attributes['created-at'],
    updatedAt: resource.attributes['updated-at'],
  };
}

/**
 * Transform client payload to TeamTailor API format
 */
function transformPayload(payload: ClientPayload): Record<string, unknown> {
  const attributes: Record<string, unknown> = {
    name: payload.name,
  };
  
  if (payload.externalId !== undefined) {
    attributes['external-id'] = payload.externalId;
  }
  if (payload.status !== undefined) {
    attributes.status = payload.status;
  }
  if (payload.description !== undefined) {
    attributes.description = payload.description;
  }
  if (payload.website !== undefined) {
    attributes.website = payload.website;
  }
  if (payload.industry !== undefined) {
    attributes.industry = payload.industry;
  }
  if (payload.size !== undefined) {
    attributes.size = payload.size;
  }

  return {
    data: {
      type: 'clients',
      attributes
    }
  };
}

/**
 * Transform partial client payload for updates to TeamTailor API format
 */
function transformPartialPayload(payload: Partial<ClientPayload>): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  
  if (payload.name !== undefined) {
    attributes.name = payload.name;
  }
  if (payload.externalId !== undefined) {
    attributes['external-id'] = payload.externalId;
  }
  if (payload.status !== undefined) {
    attributes.status = payload.status;
  }
  if (payload.description !== undefined) {
    attributes.description = payload.description;
  }
  if (payload.website !== undefined) {
    attributes.website = payload.website;
  }
  if (payload.industry !== undefined) {
    attributes.industry = payload.industry;
  }
  if (payload.size !== undefined) {
    attributes.size = payload.size;
  }
  
  return {
    data: {
      type: 'clients',
      attributes
    }
  };
}

/**
 * Get all clients with automatic pagination
 * Returns a complete array of all clients
 */
export async function getAllClients(options?: ClientRequestOptions): Promise<ClientOption[]> {
  const resources = await teamTailorClient.getAllPaginated<ClientResource>(
    '/v1/clients',
    options
  );
  
  return resources.map(transformClient);
}

/**
 * Get a single client by ID
 */
export async function getClient(
  id: string, 
  options?: { include?: string[] }
): Promise<ClientOption> {
  const response = await teamTailorClient.get<{ data: ClientResource }>(
    `/v1/clients/${id}`,
    options ? { params: options as Record<string, unknown> } : undefined
  );
  
  if (!response.data) {
    throw new NotFoundError('Client not found', 'clients', id);
  }
  
  return transformClient(response.data);
}

/**
 * Create a new client
 */
export async function createClient(data: ClientPayload): Promise<ClientOption> {
  const attributes = transformPayload(data);
  
  const response = await teamTailorClient.post<{ data: ClientResource }>(
    '/v1/clients',
    attributes
  );
  
  if (!response.data) {
    throw new Error('Failed to create client: no data returned');
  }
  
  return transformClient(response.data);
}

/**
 * Update an existing client
 */
export async function updateClient(
  id: string, 
  data: Partial<ClientPayload>
): Promise<ClientOption> {
  const attributes = transformPartialPayload(data);
  
  const response = await teamTailorClient.patch<{ data: ClientResource }>(
    `/v1/clients/${id}`,
    attributes
  );
  
  if (!response.data) {
    throw new NotFoundError('Client not found', 'clients', id);
  }
  
  return transformClient(response.data);
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  await teamTailorClient.delete(`/v1/clients/${id}`);
}

/**
 * Get clients by status
 */
export async function getClientsByStatus(
  status: 'active' | 'inactive',
  options?: ClientRequestOptions
): Promise<ClientOption[]> {
  return getAllClients({
    ...options,
    filter: {
      ...options?.filter,
      status,
    },
  });
}

/**
 * Search clients by name
 */
export async function searchClientsByName(
  name: string,
  options?: ClientRequestOptions
): Promise<ClientOption[]> {
  return getAllClients({
    ...options,
    filter: {
      ...options?.filter,
      name,
    },
  });
}

/**
 * Get client by external ID
 */
export async function getClientByExternalId(
  externalId: string,
  options?: ClientRequestOptions
): Promise<ClientOption | null> {
  const clients = await getAllClients({
    ...options,
    filter: {
      ...options?.filter,
      'external-id': externalId,
    },
  });
  
  return clients[0] || null;
}

/**
 * Get a single page of clients (for manual pagination control)
 */
export async function getClientsPage(
  pageUrl?: string,
  options?: ClientRequestOptions
): Promise<{
  clients: ClientOption[];
  meta: TeamTailorPaginatedResponse<ClientResource>['meta'];
  links: TeamTailorPaginatedResponse<ClientResource>['links'];
}> {
  const endpoint = pageUrl || '/v1/clients';
  const response = await teamTailorClient.get<TeamTailorPaginatedResponse<ClientResource>>(
    endpoint,
    pageUrl ? {} : { params: options as Record<string, unknown> }
  );
  
  return {
    clients: response.data.map(transformClient),
    meta: response.meta,
    links: response.links,
  };
}