import { DatastoreCreateRequest, DatastoreRetrieveRequest, DatastoreResponse } from '@/types/datastore';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Datastore operations
  async datastoreCreate(request: DatastoreCreateRequest): Promise<DatastoreResponse> {
    return this.makeRequest<DatastoreResponse>('/api/datastore/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async datastoreRetrieve(request: DatastoreRetrieveRequest): Promise<DatastoreResponse> {
    return this.makeRequest<DatastoreResponse>('/api/datastore/retrieve', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Convenience methods for specific actions
  async createRecord(identifier: string, data: Record<string, unknown>): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: 'create',
      data,
    });
  }

  async updateRecord(identifier: string, data: Record<string, unknown>): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: 'update',
      data,
    });
  }

  async appendToRecord(identifier: string, data: Record<string, unknown>): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: 'append',
      data,
    });
  }

  async deleteRecord(identifier: string, recordId: string): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: 'delete',
      data: { record_id: recordId },
    });
  }

  async deleteAllRecords(identifier: string): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: 'delete_all',
      data: {},
    });
  }

  async getRecords(identifier: string, filters?: Record<string, unknown>): Promise<DatastoreResponse> {
    return this.datastoreRetrieve({
      identifier,
      filters,
    });
  }
}

export const apiClient = new ApiClient();