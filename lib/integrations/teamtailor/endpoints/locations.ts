/**
 * TeamTailor Locations endpoint implementation
 * Handles location operations for company and job location references
 */

import { teamTailorClient } from '../client';
import { TeamTailorPaginatedResponse } from '../types';
import { NotFoundError } from '../errors';

// Location types
export interface LocationResource {
  id: string;
  type: 'locations';
  attributes: {
    name: string;
    city?: string;
    country?: string;
    'created-at': string;
    'updated-at': string;
  };
}

export interface LocationOption {
  id: string;
  name: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationRequestOptions {
  include?: string[];
  filter?: Record<string, unknown>;
  sort?: string;
  page?: { size?: number };
  [key: string]: unknown;
}

/**
 * Transform TeamTailor location resource to application-friendly format
 */
function transformLocation(resource: LocationResource): LocationOption {
  return {
    id: resource.id,
    name: resource.attributes.name,
    city: resource.attributes.city,
    country: resource.attributes.country,
    createdAt: resource.attributes['created-at'],
    updatedAt: resource.attributes['updated-at'],
  };
}

/**
 * Get all locations with automatic pagination
 * Returns a complete array of all locations
 */
export async function getAllLocations(options?: LocationRequestOptions): Promise<LocationOption[]> {
  const resources = await teamTailorClient.getAllPaginated<LocationResource>(
    '/v1/locations',
    options
  );
  
  return resources.map(transformLocation);
}

/**
 * Get a single location by ID
 */
export async function getLocation(
  id: string, 
  options?: { include?: string[] }
): Promise<LocationOption> {
  const response = await teamTailorClient.get<{ data: LocationResource }>(
    `/v1/locations/${id}`,
    { params: options }
  );
  
  if (!response.data) {
    throw new NotFoundError('Location not found', 'locations', id);
  }
  
  return transformLocation(response.data);
}

/**
 * Get a page of locations with pagination support
 * Returns paginated results with metadata
 */
export async function getLocationsPage(options?: LocationRequestOptions): Promise<{
  locations: LocationOption[];
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
  const response = await teamTailorClient.get<TeamTailorPaginatedResponse<LocationResource>>(
    '/v1/locations',
    { params: options }
  );
  
  return {
    locations: response.data.map(transformLocation),
    meta: {
      recordCount: response.meta['record-count'],
      pageCount: response.meta['page-count']
    },
    links: response.links
  };
}