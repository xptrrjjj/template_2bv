# Datastore Architecture & Parallel API Layer Design

## Overview

This document provides a comprehensive reference for understanding the Datastore system architecture and designing an optional parallel API layer for data mirroring and external integrations.

## 1. Datastore Architecture

### Core Components

The Datastore system is built around a centralized API client that manages data operations through Bearer-authenticated HTTP requests.

#### ApiClient Structure (`src/services/api.ts`)
- **Base URL**: Configurable via `NEXT_PUBLIC_API_BASE_URL` environment variable
- **Authentication**: Bearer token from localStorage (`access_token`)
- **Request Pattern**: RESTful API with JSON payloads
- **Error Handling**: Standardized error responses with status codes

#### Data Flow Architecture
```
Frontend Components → ApiClient → External Datastore API
                         ↓
                  Bearer Token Auth
                         ↓
                  JSON Request/Response
```

### Datastore Operations

#### Core Actions (`src/types/datastore.ts`)
1. **Create**: Insert new records
2. **Update**: Modify existing records  
3. **Append**: Add data to existing records
4. **Delete**: Remove specific records
5. **Delete All**: Remove all records for an identifier

#### Request Structure
```typescript
interface DatastoreCreateRequest {
  identifier: string;     // Data collection identifier
  action: DatastoreAction; // CRUD operation type
  data: Record<string, unknown>; // Payload data
}

interface DatastoreRetrieveRequest {
  identifier: string;     // Data collection identifier
  filters?: Record<string, unknown>; // Query filters
}
```

#### Response Format
```typescript
interface DatastoreResponse {
  status: 'success' | 'error';
  data?: unknown[];       // Retrieved data array
  message?: string;       // Error/success message
}
```

### Usage Patterns

#### Write Operations (`src/services/api.ts:56-116`)
All write operations go through `datastoreCreate()` with different actions:
- **Create**: `apiClient.createRecord(identifier, data)`
- **Update**: `apiClient.updateRecord(identifier, data)`  
- **Append**: `apiClient.appendToRecord(identifier, data)`
- **Delete**: `apiClient.deleteRecord(identifier, recordId)`
- **Delete All**: `apiClient.deleteAllRecords(identifier)`

#### Read Operations (`src/services/api.ts:111-116`)
Retrieve operations use `datastoreRetrieve()`:
- **Get All**: `apiClient.getRecords(identifier)`
- **Filtered**: `apiClient.getRecords(identifier, filters)`

#### Authentication Flow
1. Token retrieved from `localStorage.getItem('access_token')`
2. Added to request headers as `Authorization: Bearer ${token}`
3. All requests include `Content-Type: application/json`

### Integration Points

#### RBAC System Integration (`src/services/api.ts:118-663`)
The Datastore serves as the persistence layer for the RBAC system:
- **Users**: Stored in `rbac_users` identifier
- **Roles**: Stored in `rbac_roles` identifier  
- **Permissions**: Stored in `rbac_permissions` identifier
- **Applications**: Stored in `rbac_applications` identifier
- **Audit Logs**: Stored in `rbac_audit_logs` identifier

#### UI Integration (`src/app/datastore/`)
- **Testing Interface**: Manual datastore operation testing
- **Form Components**: `DatastoreOperationForm`, `DatastoreRetrieveForm`
- **Response Display**: Real-time operation results

## 2. Parallel API Layer Design

### Architecture Overview

The parallel API layer enables simultaneous data writes to an additional service (analytics, external sync, audit trail) without disrupting the main Datastore flow.

### Design Patterns

#### Option A: Middleware Layer (Recommended)
```
Frontend → ApiClient → Middleware → Primary Datastore
                         ↓
                    Parallel API Service
```

**Implementation Location**: `src/services/middleware/`

#### Option B: API Gateway Pattern
```
Frontend → API Gateway → Primary Datastore
              ↓
         Parallel API Service
```

**Implementation Location**: External infrastructure layer

#### Option C: Event-Driven Architecture
```
Frontend → ApiClient → Primary Datastore
                         ↓
                    Event Publisher
                         ↓
                  Parallel API Consumer
```

**Implementation Location**: `src/services/events/`

### Recommended Implementation: Middleware Layer

#### File Structure
```
src/services/
├── api.ts                          # Existing ApiClient
├── middleware/
│   ├── index.ts                    # Export barrel
│   ├── ParallelApiMiddleware.ts    # Core middleware
│   ├── types.ts                    # Middleware types
│   └── config.ts                   # Configuration
├── parallel/
│   ├── index.ts                    # Export barrel
│   ├── ParallelApiClient.ts        # Parallel API client
│   ├── adapters/                   # Format adapters
│   │   ├── AnalyticsAdapter.ts
│   │   ├── AuditAdapter.ts
│   │   └── SyncAdapter.ts
│   └── strategies/                 # Retry/fallback strategies
│       ├── RetryStrategy.ts
│       └── FallbackStrategy.ts
```

#### Core Implementation

##### Middleware Configuration (`src/services/middleware/config.ts`)
```typescript
interface ParallelApiConfig {
  enabled: boolean;
  endpoints: {
    analytics?: string;
    audit?: string;
    sync?: string;
  };
  timeout: number;
  retryAttempts: number;
  failureMode: 'silent' | 'log' | 'throw';
  includeOperations: DatastoreAction[];
  excludeIdentifiers: string[];
}
```

##### Environment Configuration
```bash
# Parallel API Configuration
NEXT_PUBLIC_PARALLEL_API_ENABLED=true
NEXT_PUBLIC_PARALLEL_API_ANALYTICS_URL=https://analytics.example.com/api
NEXT_PUBLIC_PARALLEL_API_AUDIT_URL=https://audit.example.com/api
NEXT_PUBLIC_PARALLEL_API_TIMEOUT=5000
NEXT_PUBLIC_PARALLEL_API_RETRY_ATTEMPTS=3
NEXT_PUBLIC_PARALLEL_API_FAILURE_MODE=silent
```

##### Middleware Implementation (`src/services/middleware/ParallelApiMiddleware.ts`)
```typescript
export class ParallelApiMiddleware {
  private config: ParallelApiConfig;
  private parallelClients: Map<string, ParallelApiClient>;

  constructor(config: ParallelApiConfig) {
    this.config = config;
    this.parallelClients = new Map();
    this.initializeClients();
  }

  async interceptWrite(
    request: DatastoreCreateRequest,
    primaryResponse: DatastoreResponse
  ): Promise<DatastoreResponse> {
    // Only proceed if enabled and operation is included
    if (!this.config.enabled || !this.shouldProcess(request)) {
      return primaryResponse;
    }

    // Execute parallel writes asynchronously
    this.executeParallelWrites(request, primaryResponse);
    
    // Return primary response immediately
    return primaryResponse;
  }

  private async executeParallelWrites(
    request: DatastoreCreateRequest,
    primaryResponse: DatastoreResponse
  ): Promise<void> {
    const promises = Array.from(this.parallelClients.entries()).map(
      ([name, client]) => this.executeParallelWrite(name, client, request, primaryResponse)
    );

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      this.handleFailure(error, request);
    }
  }

  private shouldProcess(request: DatastoreCreateRequest): boolean {
    return (
      this.config.includeOperations.includes(request.action) &&
      !this.config.excludeIdentifiers.includes(request.identifier)
    );
  }
}
```

##### Modified ApiClient Integration (`src/services/api.ts`)
```typescript
class ApiClient {
  private parallelMiddleware?: ParallelApiMiddleware;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.initializeParallelMiddleware();
  }

  private initializeParallelMiddleware(): void {
    if (process.env.NEXT_PUBLIC_PARALLEL_API_ENABLED === 'true') {
      const config = this.loadParallelApiConfig();
      this.parallelMiddleware = new ParallelApiMiddleware(config);
    }
  }

  async datastoreCreate(request: DatastoreCreateRequest): Promise<DatastoreResponse> {
    // Execute primary datastore operation
    const response = await this.makeRequest<DatastoreResponse>('/api/datastore/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Execute parallel API calls if middleware is enabled
    if (this.parallelMiddleware) {
      return await this.parallelMiddleware.interceptWrite(request, response);
    }

    return response;
  }
}
```

### Data Transformation & Adapters

#### Analytics Adapter (`src/services/parallel/adapters/AnalyticsAdapter.ts`)
```typescript
export class AnalyticsAdapter {
  transform(request: DatastoreCreateRequest, response: DatastoreResponse): AnalyticsEvent {
    return {
      event_type: `datastore.${request.action}`,
      identifier: request.identifier,
      timestamp: new Date().toISOString(),
      user_id: this.getCurrentUserId(),
      metadata: {
        record_count: Array.isArray(response.data) ? response.data.length : 1,
        success: response.status === 'success'
      },
      properties: this.sanitizeData(request.data)
    };
  }
}
```

#### Audit Adapter (`src/services/parallel/adapters/AuditAdapter.ts`)
```typescript
export class AuditAdapter {
  transform(request: DatastoreCreateRequest, response: DatastoreResponse): AuditLogEntry {
    return {
      action: request.action,
      resource_type: 'datastore',
      resource_id: request.identifier,
      actor_id: this.getCurrentUserId(),
      timestamp: new Date().toISOString(),
      success: response.status === 'success',
      details: {
        request: this.sanitizeRequest(request),
        response_status: response.status,
        error_message: response.message
      },
      ip_address: this.getClientIP(),
      user_agent: navigator.userAgent
    };
  }
}
```

### Error Handling & Resilience

#### Failure Modes
1. **Silent**: Log errors but don't affect primary flow
2. **Log**: Log errors and notify monitoring systems
3. **Throw**: Propagate errors to calling code (not recommended)

#### Retry Strategy (`src/services/parallel/strategies/RetryStrategy.ts`)
```typescript
export class ExponentialBackoffRetry {
  async execute<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    throw new Error('Max retry attempts exceeded');
  }
}
```

### Configuration Management

#### Environment-Based Toggle
The system can be completely disabled via environment variables without code changes:
```bash
NEXT_PUBLIC_PARALLEL_API_ENABLED=false
```

#### Runtime Configuration
```typescript
// src/services/middleware/config.ts
export const getParallelApiConfig = (): ParallelApiConfig => ({
  enabled: process.env.NEXT_PUBLIC_PARALLEL_API_ENABLED === 'true',
  endpoints: {
    analytics: process.env.NEXT_PUBLIC_PARALLEL_API_ANALYTICS_URL,
    audit: process.env.NEXT_PUBLIC_PARALLEL_API_AUDIT_URL,
    sync: process.env.NEXT_PUBLIC_PARALLEL_API_SYNC_URL,
  },
  timeout: parseInt(process.env.NEXT_PUBLIC_PARALLEL_API_TIMEOUT || '5000'),
  retryAttempts: parseInt(process.env.NEXT_PUBLIC_PARALLEL_API_RETRY_ATTEMPTS || '3'),
  failureMode: process.env.NEXT_PUBLIC_PARALLEL_API_FAILURE_MODE as 'silent' | 'log' | 'throw' || 'silent',
  includeOperations: process.env.NEXT_PUBLIC_PARALLEL_API_INCLUDE_OPERATIONS?.split(',') as DatastoreAction[] || ['create', 'update', 'delete'],
  excludeIdentifiers: process.env.NEXT_PUBLIC_PARALLEL_API_EXCLUDE_IDENTIFIERS?.split(',') || [],
});
```

## 3. Implementation Recommendations

### Phase 1: Foundation
1. Create middleware structure in `src/services/middleware/`
2. Implement configuration management
3. Add environment variable support
4. Create basic ParallelApiMiddleware class

### Phase 2: Core Functionality  
1. Implement parallel API client
2. Add retry and error handling strategies
3. Create data transformation adapters
4. Integrate with existing ApiClient

### Phase 3: Advanced Features
1. Add monitoring and metrics collection
2. Implement circuit breaker patterns
3. Add request queuing for high-volume scenarios
4. Create admin interface for configuration management

### Phase 4: Testing & Validation
1. Unit tests for middleware components
2. Integration tests with mock parallel services
3. Performance testing under load
4. Failure scenario testing

## 4. Data Consistency & Conflict Resolution

### Consistency Model
- **Primary First**: Main Datastore operation must succeed
- **Eventually Consistent**: Parallel services updated asynchronously
- **No Rollback**: Parallel service failures don't affect primary operation

### Conflict Resolution
- **Primary Wins**: Main Datastore is source of truth
- **Parallel Reconciliation**: Background processes sync discrepancies
- **Manual Override**: Admin tools for conflict resolution

## 5. Monitoring & Observability

### Metrics to Track
- Parallel API success/failure rates
- Response time impacts
- Data sync lag times
- Error frequency by service

### Logging Strategy
```typescript
interface ParallelApiLog {
  timestamp: string;
  operation: DatastoreAction;
  identifier: string;
  primary_success: boolean;
  parallel_results: {
    service: string;
    success: boolean;
    duration_ms: number;
    error?: string;
  }[];
  total_duration_ms: number;
}
```

This architecture ensures minimal impact on the primary Datastore while providing flexible options for data mirroring, analytics integration, and external synchronization.