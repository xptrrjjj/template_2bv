export type DatastoreAction = 'create' | 'update' | 'append' | 'delete' | 'delete_all';

export interface DatastoreCreateRequest {
  identifier: string;
  action: DatastoreAction;
  data: Record<string, unknown>;
}

export interface DatastoreRetrieveRequest {
  identifier: string;
  filters?: Record<string, unknown>;
}

export interface DatastoreResponse {
  status: 'success' | 'error';
  data?: unknown[];
  message?: string;
}