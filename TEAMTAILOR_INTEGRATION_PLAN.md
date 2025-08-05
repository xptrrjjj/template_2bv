# TeamTailor Integration Layer Design

## Overview

This document outlines the architecture for a reusable, scalable TeamTailor integration layer for Next.js 15.4. The system prioritizes **centralized pagination handling** while maintaining DRY/SOLID principles and supporting all HTTP methods across any TeamTailor endpoint.

## Core Architecture Principles

### 1. Single Responsibility Principle (SRP)
- **Client Module**: Handles HTTP requests, authentication, and base configurations
- **Pagination Module**: Exclusively manages paginated data fetching logic
- **Endpoint Modules**: Contain business logic for specific resource types
- **Types Module**: Maintains all TypeScript definitions

### 2. Open/Closed Principle (OCP)
- Core client is closed for modification but open for extension
- New endpoints can be added without modifying existing code
- Pagination logic works with any paginated endpoint

### 3. Dependency Inversion Principle (DIP)
- Endpoint modules depend on abstractions (client interface) not concrete implementations
- Pagination utility is injected as a dependency

## Folder Structure & Module Responsibilities

```
lib/integrations/teamtailor/
├── client.ts                 # Core HTTP client with auth & request handling
├── pagination.ts             # Centralized pagination logic
├── config.ts                 # Environment validation & configuration
├── types.ts                  # Shared TypeScript definitions
├── errors.ts                 # Custom error classes & handling
├── endpoints/
│   ├── clients.ts           # Client-specific operations
│   ├── jobs.ts              # Job-specific operations
│   ├── candidates.ts        # Candidate-specific operations
│   └── custom-fields.ts     # Custom field operations
├── utils/
│   ├── rate-limiter.ts      # Rate limiting utility
│   └── cache.ts             # Optional caching layer
└── index.ts                 # Public API exports
```

### Module Breakdown

#### `client.ts` - Core HTTP Client
**Responsibilities:**
- Handles all HTTP requests (GET, POST, PATCH, DELETE)
- Manages authentication headers and API versioning
- Provides base request/response handling
- Integrates with pagination utility for GET requests

**Key Features:**
- Generic request method supporting any endpoint
- Automatic header injection
- Error response standardization
- Integration point for rate limiting

#### `pagination.ts` - Centralized Pagination Handler
**Responsibilities:**
- Recursively fetches all pages from paginated endpoints
- Handles `links.next` navigation
- Implements safety measures against infinite loops
- Manages rate limiting across paginated requests

**Key Features:**
- Generic pagination that works with any endpoint
- Configurable batch processing
- Automatic retry logic for failed pages
- Memory-efficient streaming option for large datasets

#### `config.ts` - Environment & Configuration
**Responsibilities:**
- Validates environment variables using Zod
- Provides typed configuration object
- Handles API key validation and rotation

#### `endpoints/*.ts` - Resource-Specific Logic
**Responsibilities:**
- Implements business logic for specific TeamTailor resources
- Maps API responses to application-friendly formats
- Handles resource-specific validation and transformations

#### `types.ts` - Shared Type Definitions
**Responsibilities:**
- Defines all API request/response interfaces
- Maintains consistency across modules
- Provides generic types for pagination and error handling

## Core Function Signatures

### Pagination-Aware Functions

```typescript
// All list-fetching functions automatically handle pagination
async function getAllClients(options?: {
  include?: string[];
  filter?: Record<string, any>;
  sort?: string;
  page?: { size?: number };
}): Promise<ClientOption[]>

async function getAllJobs(options?: {
  include?: string[];
  filter?: Record<string, any>;
  sort?: string;
  page?: { size?: number };
}): Promise<JobOption[]>

async function getAllCandidates(options?: {
  include?: string[];
  filter?: Record<string, any>;
  sort?: string;
  page?: { size?: number };
}): Promise<CandidateOption[]>

// Single resource operations (no pagination needed)
async function getClient(id: string, options?: { include?: string[] }): Promise<ClientOption>
async function createClient(data: ClientPayload): Promise<ClientOption>
async function updateClient(id: string, data: Partial<ClientPayload>): Promise<ClientOption>
async function deleteClient(id: string): Promise<void>
```

### Generic HTTP Operations

```typescript
// Core client exposes generic methods for custom usage
async function get<T>(endpoint: string, params?: Record<string, any>): Promise<T>
async function post<T>(endpoint: string, data: any): Promise<T>
async function patch<T>(endpoint: string, data: any): Promise<T>
async function delete<T>(endpoint: string): Promise<T>

// Pagination-aware GET method
async function getAllPaginated<T>(endpoint: string, params?: Record<string, any>): Promise<T[]>
```

## Data Flow Architecture

### 1. Request Initiation
```
API Route Handler / Server Action
    ↓
Endpoint Module (e.g., clients.ts)
    ↓
Core Client (client.ts)
```

### 2. Pagination Flow (for GET list operations)
```
getAllClients() call
    ↓
Core Client.getAllPaginated('/v1/clients', { page: { size: 30 } })
    ↓
Pagination Utility.fetchAllPages()
    ↓
Request 1: GET /v1/clients?page[size]=30
    ↓
Response 1: { data: [...], links: { next: "/v1/clients?page[after]=Ng&page[size]=30" }, meta: { "record-count": 85, "page-count": 3 } }
    ↓
Request 2: GET /v1/clients?page[after]=Ng&page[size]=30
    ↓
Response 2: { data: [...], links: { next: "/v1/clients?page[after]=Xy&page[size]=30" }, meta: { ... } }
    ↓
Request 3: GET /v1/clients?page[after]=Xy&page[size]=30
    ↓
Response 3: { data: [...], links: { next: null }, meta: { ... } }
    ↓
Combine all data arrays [response1.data, response2.data, response3.data]
    ↓
Validate: total items (85) matches meta.record-count
    ↓
Return complete dataset (85 clients)
```

### 3. Non-Paginated Flow (for single resources/mutations)
```
createClient() call
    ↓
Core Client.post()
    ↓
Single HTTP request
    ↓
Return response
```

## Centralized Pagination Implementation Strategy

### Core Pagination Logic

The pagination utility implements a cursor-based fetching strategy aligned with TeamTailor's pagination system:

1. **Initial Request**: Fetch first page with `page[size]=30` and any provided filters
2. **Response Analysis**: Check for `meta.record-count`, `meta.page-count`, and `links.next`
3. **Cursor-Based Traversal**: If `links.next` exists, use the complete URL (contains `page[after]` cursor)
4. **Rate Limit Handling**: Implement delays between requests (50 req/10s limit)
5. **Data Aggregation**: Combine all `data` arrays from each page response
6. **Safety Measures**: 
   - Maximum page limit to prevent infinite loops (based on `meta.page-count`)
   - Visited URL tracking to detect circular references
   - Timeout handling for stuck requests
   - Validation that `meta.record-count` matches final result count

### Pagination Utility Interface

```typescript
interface PaginationConfig {
  maxPages?: number;           // Safety limit (default: 1000)
  delayBetweenRequests?: number; // Rate limiting delay (default: 200ms)
  retryFailedPages?: boolean;   // Retry failed page requests
  maxRetries?: number;         // Maximum retry attempts per page
  pageSize?: number;          // Items per page (default: 30, max: 30)
}

interface TeamTailorPaginatedResponse<T> {
  data: T[];
  meta: {
    "record-count": number;    // Total number of items in collection
    "page-count": number;      // Total number of pages
  };
  links: {
    first?: string;            // First page URL
    last?: string;             // Last page URL
    prev?: string;             // Previous page URL (with page[before] cursor)
    next?: string;             // Next page URL (with page[after] cursor)
  };
}
```

### Usage Patterns

#### Automatic Pagination (Recommended)
All `getAll*` functions automatically use pagination:
```typescript
// Internally calls pagination utility
const allClients = await getAllClients();
// Returns complete array, regardless of page count
```

#### Manual Pagination Control
For advanced use cases requiring custom pagination:
```typescript
// Access to manual pagination control
const paginator = createPaginator<ClientOption>('/v1/clients');
const firstPage = await paginator.getPage(); // Gets first page
const nextPageUrl = firstPage.links.next;
const secondPage = await paginator.getPageByUrl(nextPageUrl);
const allPages = await paginator.getAllPages();
```

### TeamTailor-Specific Pagination Examples

#### Basic List with Maximum Page Size
```typescript
// Fetch jobs with maximum page size for efficiency
const allJobs = await getAllJobs({ 
  page: { size: 30 },  // Use max page size to minimize requests
  include: ['department', 'locations'] 
});

// Internal URL progression:
// 1. GET /v1/jobs?page[size]=30&include=department,locations
// 2. GET /v1/jobs?page[after]=cursor1&page[size]=30&include=department,locations  
// 3. GET /v1/jobs?page[after]=cursor2&page[size]=30&include=department,locations
// ... until links.next is null
```

#### Filtered Pagination
```typescript
// Get all hired candidates (potentially large dataset)
const hiredCandidates = await getAllJobApplications({
  include: ['candidate'],
  filter: { 'stage-type': 'hired' },
  sort: '-changed_stage_at',
  page: { size: 30 }
});

// TeamTailor handles cursor-based filtering automatically
// URLs will include filter parameters in each paginated request
```

#### Progress Tracking for Large Datasets
```typescript
// For large datasets, optionally track progress
const candidates = await getAllCandidates({
  page: { size: 30 },
  onPageFetched: (pageData, currentPage, totalPages) => {
    console.log(`Fetched page ${currentPage}/${totalPages}: ${pageData.data.length} candidates`);
    // Based on meta.page-count from first response
  }
});
```

### Cursor-Based Pagination Advantages

TeamTailor's cursor-based pagination system provides several benefits over traditional offset-based pagination:

#### **Consistency During Data Changes**
- **Cursor-based**: Results remain consistent even if new records are added during pagination
- **Offset-based**: Can cause duplicates or skipped records if data changes between requests

#### **Performance**
- **Cursors**: Direct database lookups using indexed cursors (faster for large datasets)
- **Offsets**: Database must count/skip records for each page (slower for high page numbers)

#### **Real-time Data Integrity**
- **Example**: If fetching candidates and new applications arrive during pagination, cursor-based navigation ensures no records are missed or duplicated
- **Implementation**: Each `page[after]` cursor represents a specific position in the ordered dataset

#### **Automatic Parameter Preservation**
TeamTailor's `links.next` URLs automatically preserve all query parameters:
```typescript
// Initial request: /v1/jobs?filter[department]=337&include=locations&sort=created-at&page[size]=30
// Next page URL: /v1/jobs?filter[department]=337&include=locations&sort=created-at&page[after]=cursor123&page[size]=30
// All filters, includes, and sorting are preserved automatically
```

#### **Rate Limit Optimization**
- **Page Size Strategy**: Always use `page[size]=30` (maximum) to minimize total requests
- **Efficient Traversal**: Fewer requests needed for large datasets
- **Progress Tracking**: `meta.page-count` allows accurate progress estimation

## Error Handling Strategy

### Error Hierarchy
```typescript
TeamTailorError (base)
├── AuthenticationError (401, 403)
├── RateLimitError (429)
├── ValidationError (400, 422)
├── NotFoundError (404)
├── PaginationError (pagination-specific issues)
└── NetworkError (network/timeout issues)
```

### Error Handling Flow
1. **Client Level**: Catches HTTP errors and transforms to typed errors
2. **Pagination Level**: Handles pagination-specific errors (infinite loops, failed pages)
3. **Endpoint Level**: Adds business context to errors
4. **Application Level**: Handles errors in API routes/server actions

## Rate Limiting & Reliability

### Rate Limiting Strategy
- **TeamTailor Limit**: 50 requests per 10 seconds
- **Implementation**: 
  - Request queue with configurable delay
  - Automatic backoff on 429 responses
  - Distributed rate limiting for pagination batches

### Retry Logic
- **Transient Failures**: Automatic retry with exponential backoff
- **Pagination Failures**: Retry individual failed pages
- **Circuit Breaker**: Temporarily halt requests after consecutive failures

## Next.js 15.4 Integration Patterns

### Server Actions Usage
```typescript
// app/actions/teamtailor.ts
'use server'

import { getAllClients, createClient } from '@/lib/integrations/teamtailor'

export async function fetchClients() {
  return await getAllClients()
}

export async function addClient(data: ClientPayload) {
  return await createClient(data)
}
```

### API Route Handlers
```typescript
// app/api/teamtailor/clients/route.ts
import { getAllClients } from '@/lib/integrations/teamtailor'

export async function GET() {
  try {
    const clients = await getAllClients()
    return Response.json(clients)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### Component Usage (Client Components)
```typescript
// Components never call integration directly
// Always go through Server Actions or API routes
const { data: clients } = useSWR('/api/teamtailor/clients')
```

## Extension Architecture

### Adding New Endpoints

1. **Create Endpoint Module**: `endpoints/new-resource.ts`
2. **Define Types**: Add interfaces to `types.ts`
3. **Implement Functions**: Use existing client methods
4. **Export**: Add to `index.ts`

Example new endpoint structure:
```typescript
// endpoints/departments.ts
export async function getAllDepartments(): Promise<DepartmentOption[]> {
  return client.getAllPaginated<DepartmentOption>('/v1/departments')
}

export async function getDepartment(id: string): Promise<DepartmentOption> {
  return client.get<DepartmentOption>(`/v1/departments/${id}`)
}
```

### Adding Custom HTTP Methods

The core client supports any HTTP method:
```typescript
// For PATCH requests
export async function partialUpdate<T>(endpoint: string, data: any): Promise<T> {
  return client.patch<T>(endpoint, data)
}

// For custom headers
export async function requestWithCustomHeaders<T>(
  endpoint: string, 
  headers: Record<string, string>
): Promise<T> {
  return client.request<T>(endpoint, { headers })
}
```

### Dynamic Endpoint Support

For generic resource handling:
```typescript
export async function getAllEntities<T>(resourceType: string): Promise<T[]> {
  return client.getAllPaginated<T>(`/v1/${resourceType}`)
}

// Usage
const departments = await getAllEntities<Department>('departments')
const locations = await getAllEntities<Location>('locations')
```

## Performance Optimizations

### Caching Strategy
- **Response Caching**: Cache paginated results with TTL
- **Request Deduplication**: Prevent duplicate simultaneous requests
- **Partial Updates**: Cache individual resources for PATCH operations

### Memory Management
- **Streaming Pagination**: Process pages as they arrive for large datasets
- **Batch Processing**: Process paginated results in configurable batches
- **Memory Limits**: Configurable limits for maximum cached data

### Monitoring & Observability
- **Request Metrics**: Track API usage patterns
- **Pagination Analytics**: Monitor page counts and fetch times
- **Error Rates**: Track and alert on integration health

## Security Considerations

### API Key Management
- Environment variable validation with Zod
- No client-side exposure of credentials
- Key rotation support

### Request Validation
- Input validation for all endpoint functions
- Parameter sanitization
- Response validation against schemas

### Audit Trail
- Log all API interactions (optional)
- Track data access patterns
- Integration with application audit system

## Testing Strategy

### Unit Testing
- Mock HTTP client for endpoint testing
- Pagination logic testing with controlled responses
- Error handling validation

### Integration Testing
- Real API testing with test credentials
- Pagination edge cases (empty results, single page, many pages)
- Rate limiting behavior validation

### Performance Testing
- Large dataset pagination testing
- Concurrent request handling
- Memory usage under load

## Migration & Deployment

### Rollout Strategy
1. **Phase 1**: Deploy core client and pagination utilities
2. **Phase 2**: Migrate existing TeamTailor calls to new system
3. **Phase 3**: Add advanced features (caching, monitoring)

### Backward Compatibility
- Maintain existing function signatures during migration
- Gradual deprecation of old integration code
- Feature flags for new functionality

This architecture provides a robust, scalable foundation for TeamTailor integration while prioritizing the critical requirement of comprehensive pagination support. The modular design ensures easy maintenance and extension while following established software engineering principles.