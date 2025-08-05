# TeamTailor Integration Implementation Tasks

## Overview
This document provides executable tasks to implement the complete TeamTailor integration layer for Next.js 15.4 based on the design specifications in `TEAMTAILOR_INTEGRATION_PLAN.md`.

## Implementation Phases

### Phase 1: Foundation Setup
**Goal**: Establish project structure and core dependencies

#### Task 1.1: Create Folder Structure
```bash
# Create the main integration directory structure
mkdir -p lib/integrations/teamtailor/endpoints
mkdir -p lib/integrations/teamtailor/utils
```

**Files to create:**
- `lib/integrations/teamtailor/client.ts`
- `lib/integrations/teamtailor/pagination.ts`
- `lib/integrations/teamtailor/config.ts`
- `lib/integrations/teamtailor/types.ts`
- `lib/integrations/teamtailor/errors.ts`
- `lib/integrations/teamtailor/index.ts`
- `lib/integrations/teamtailor/endpoints/clients.ts`
- `lib/integrations/teamtailor/endpoints/jobs.ts`
- `lib/integrations/teamtailor/endpoints/candidates.ts`
- `lib/integrations/teamtailor/endpoints/custom-fields.ts`
- `lib/integrations/teamtailor/utils/rate-limiter.ts`
- `lib/integrations/teamtailor/utils/cache.ts`

#### Task 1.2: Install Dependencies
```bash
npm install zod
# zod for environment validation and type safety
```

**Update package.json if needed:**
- Ensure TypeScript is configured for strict mode
- Verify Next.js 15.4 compatibility

### Phase 2: Core Module Implementation

#### Task 2.1: Implement Configuration Module (`config.ts`)
**Requirements:**
- Zod schema for environment validation
- TeamTailor API key validation
- Configuration object with defaults

**Key Components:**
```typescript
// Environment validation schema
const teamTailorConfigSchema = z.object({
  apiKey: z.string().min(1, "TeamTailor API key is required"),
  apiVersion: z.string().default("20240404"),
  baseUrl: z.string().url().default("https://api.teamtailor.com"),
  rateLimitPerSecond: z.number().default(5), // 50 per 10 seconds = 5 per second
})
```

**Acceptance Criteria:**
- [ ] Environment variables validated on import
- [ ] Typed configuration object exported
- [ ] Default values for optional settings
- [ ] Clear error messages for missing/invalid config

#### Task 2.2: Implement Type Definitions (`types.ts`)
**Requirements:**
- TeamTailor API response interfaces
- Pagination-specific types
- Generic types for extensibility
- Error types

**Key Components:**
```typescript
// Core pagination types
interface TeamTailorPaginatedResponse<T>
interface PaginationConfig
interface PaginationOptions

// Resource types
interface ClientOption, JobOption, CandidateOption
interface ClientPayload, JobPayload, CandidatePayload

// API parameter types
interface TeamTailorRequestOptions
interface FilterOptions, IncludeOptions, SortOptions
```

**Acceptance Criteria:**
- [ ] All API response structures typed
- [ ] Generic types for reusability
- [ ] Strict TypeScript compliance
- [ ] JSDoc comments for complex types

#### Task 2.3: Implement Error Handling (`errors.ts`)
**Requirements:**
- Custom error classes for different scenarios
- Error factory for HTTP status codes
- Structured error responses

**Key Components:**
```typescript
// Error hierarchy
class TeamTailorError extends Error
class AuthenticationError extends TeamTailorError
class RateLimitError extends TeamTailorError
class ValidationError extends TeamTailorError
class NotFoundError extends TeamTailorError
class PaginationError extends TeamTailorError

// Error factory
function createErrorFromResponse(response: Response, context: string): TeamTailorError
```

**Acceptance Criteria:**
- [ ] Complete error hierarchy implemented
- [ ] HTTP status code mapping
- [ ] Contextual error messages
- [ ] Error serialization for logging

#### Task 2.4: Implement Rate Limiter (`utils/rate-limiter.ts`)
**Requirements:**
- Token bucket algorithm for 50 req/10s limit
- Queue system for request management
- Automatic backoff on 429 responses

**Key Components:**
```typescript
class TeamTailorRateLimiter {
  private tokens: number
  private lastRefill: number
  private queue: Array<QueuedRequest>
  
  async executeRequest<T>(request: () => Promise<T>): Promise<T>
  private refillTokens(): void
  private processQueue(): void
}
```

**Acceptance Criteria:**
- [ ] Rate limiting respects 50 req/10s limit
- [ ] Request queuing when rate limited
- [ ] Exponential backoff on 429 responses
- [ ] Queue processing optimization

### Phase 3: Core Client Implementation

#### Task 3.1: Implement HTTP Client (`client.ts`)
**Requirements:**
- Generic HTTP methods (GET, POST, PATCH, DELETE)
- Automatic header injection
- Integration with rate limiter
- Error response handling

**Key Components:**
```typescript
class TeamTailorClient {
  private config: TeamTailorConfig
  private rateLimiter: TeamTailorRateLimiter
  
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T>
  async post<T>(endpoint: string, data: any, options?: RequestOptions): Promise<T>
  async patch<T>(endpoint: string, data: any, options?: RequestOptions): Promise<T>
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T>
  
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit
  private handleResponse<T>(response: Response): Promise<T>
}
```

**Acceptance Criteria:**
- [ ] All HTTP methods implemented
- [ ] Automatic authentication headers
- [ ] Rate limiting integration
- [ ] Comprehensive error handling
- [ ] Request/response logging (optional)

#### Task 3.2: Implement Pagination Utility (`pagination.ts`)
**Requirements:**
- Cursor-based pagination handler
- Automatic following of `links.next`
- Safety measures against infinite loops
- Memory-efficient processing

**Key Components:**
```typescript
class TeamTailorPaginator<T> {
  private client: TeamTailorClient
  private config: PaginationConfig
  
  async getAllPages(endpoint: string, options?: PaginationOptions): Promise<T[]>
  async getPage(url: string): Promise<TeamTailorPaginatedResponse<T>>
  
  private validatePaginationResponse(response: TeamTailorPaginatedResponse<T>): void
  private trackVisitedUrls(url: string): boolean
  private combineResults(responses: TeamTailorPaginatedResponse<T>[]): T[]
}
```

**Acceptance Criteria:**
- [ ] Follows `links.next` until completion
- [ ] Handles cursor-based navigation
- [ ] Prevents infinite loops
- [ ] Validates final record count
- [ ] Memory-efficient for large datasets
- [ ] Progress tracking capability

### Phase 4: Endpoint Implementation

#### Task 4.1: Implement Clients Endpoint (`endpoints/clients.ts`)
**Requirements:**
- Complete CRUD operations for clients
- Pagination-aware list operations
- TeamTailor-specific parameter handling

**Key Functions:**
```typescript
// Paginated operations
async function getAllClients(options?: ClientRequestOptions): Promise<ClientOption[]>

// Single resource operations  
async function getClient(id: string, options?: { include?: string[] }): Promise<ClientOption>
async function createClient(data: ClientPayload): Promise<ClientOption>
async function updateClient(id: string, data: Partial<ClientPayload>): Promise<ClientOption>
async function deleteClient(id: string): Promise<void>
```

**Acceptance Criteria:**
- [ ] All CRUD operations implemented
- [ ] Automatic pagination for list operations
- [ ] Include/filter parameter support
- [ ] Type-safe request/response handling
- [ ] Error handling with context

#### Task 4.2: Implement Jobs Endpoint (`endpoints/jobs.ts`)
**Requirements:**
- Job listing with filtering capabilities
- Job creation from templates
- Department and location includes

**Key Functions:**
```typescript
async function getAllJobs(options?: JobRequestOptions): Promise<JobOption[]>
async function getJob(id: string, options?: { include?: string[] }): Promise<JobOption>
async function createJob(data: JobPayload): Promise<JobOption>
async function createJobFromTemplate(templateId: number, data: JobPayload): Promise<JobOption>
async function updateJob(id: string, data: Partial<JobPayload>): Promise<JobOption>
async function deleteJob(id: string): Promise<void>
async function getJobTemplates(): Promise<JobTemplate[]>
```

**Acceptance Criteria:**
- [ ] Full job lifecycle management
- [ ] Template-based job creation
- [ ] Department/location relationship handling
- [ ] Advanced filtering options
- [ ] Publish/unpublish functionality

#### Task 4.3: Implement Candidates Endpoint (`endpoints/candidates.ts`)
**Requirements:**
- Candidate management with job applications
- Location relationship handling
- Hiring stage filtering

**Key Functions:**
```typescript
async function getAllCandidates(options?: CandidateRequestOptions): Promise<CandidateOption[]>
async function getCandidate(id: string, options?: { include?: string[] }): Promise<CandidateOption>
async function createCandidate(data: CandidatePayload): Promise<CandidateOption>
async function updateCandidate(id: string, data: Partial<CandidatePayload>): Promise<CandidateOption>
async function getHiredCandidates(): Promise<CandidateOption[]>
async function getCandidateApplications(candidateId: string): Promise<JobApplication[]>
```

**Acceptance Criteria:**
- [ ] Complete candidate lifecycle
- [ ] Job application integration
- [ ] Hiring stage management
- [ ] Location relationship support
- [ ] Advanced search/filtering

#### Task 4.4: Implement Custom Fields Endpoint (`endpoints/custom-fields.ts`)
**Requirements:**
- Custom field management
- Field type validation
- Resource association

**Key Functions:**
```typescript
async function getAllCustomFields(options?: CustomFieldRequestOptions): Promise<CustomFieldOption[]>
async function getCustomField(id: string): Promise<CustomFieldOption>
async function createCustomField(data: CustomFieldPayload): Promise<CustomFieldOption>
async function updateCustomField(id: string, data: Partial<CustomFieldPayload>): Promise<CustomFieldOption>
async function deleteCustomField(id: string): Promise<void>
```

**Acceptance Criteria:**
- [ ] Full custom field management
- [ ] Field type validation
- [ ] Resource association handling
- [ ] Field value management

### Phase 5: Next.js Integration

#### Task 5.1: Create Server Actions (`app/actions/teamtailor.ts`)
**Requirements:**
- Server-side integration functions
- Proper error handling
- Type-safe parameters and returns

**Key Functions:**
```typescript
'use server'

export async function fetchAllClients(): Promise<ClientOption[]>
export async function createNewClient(data: ClientPayload): Promise<ClientOption>
export async function fetchAllJobs(filters?: JobFilters): Promise<JobOption[]>
export async function createNewJob(data: JobPayload): Promise<JobOption>
export async function fetchCandidates(filters?: CandidateFilters): Promise<CandidateOption[]>
```

**Acceptance Criteria:**
- [ ] All major operations exposed as server actions
- [ ] Proper error boundaries
- [ ] Type-safe implementations
- [ ] Logging and monitoring hooks

#### Task 5.2: Create API Route Handlers
**Requirements:**
- RESTful API endpoints
- Proper HTTP status codes
- Request validation

**Files to create:**
- `app/api/teamtailor/clients/route.ts`
- `app/api/teamtailor/jobs/route.ts`
- `app/api/teamtailor/candidates/route.ts`

**Acceptance Criteria:**
- [ ] RESTful endpoint structure
- [ ] Proper HTTP status handling
- [ ] Request/response validation
- [ ] Error response formatting

#### Task 5.3: Environment Configuration
**Requirements:**
- Environment variable setup
- Development vs production configs
- Validation on startup

**Files to update:**
- `.env.local` (development)
- `.env.example` (template)
- `next.config.ts` (if needed)

**Environment Variables:**
```bash
TEAMTAILOR_API_KEY=your_api_key_here
TEAMTAILOR_API_VERSION=20240404
TEAMTAILOR_BASE_URL=https://api.teamtailor.com
```

**Acceptance Criteria:**
- [ ] Environment variables documented
- [ ] Validation on application startup
- [ ] Development/production configurations
- [ ] Security best practices followed

### Phase 6: Main Export Module

#### Task 6.1: Implement Public API (`index.ts`)
**Requirements:**
- Clean public interface
- Re-export all endpoint functions
- Hide internal implementation details

**Key Exports:**
```typescript
// Client operations
export { getAllClients, getClient, createClient, updateClient, deleteClient } from './endpoints/clients'

// Job operations  
export { getAllJobs, getJob, createJob, createJobFromTemplate, updateJob, deleteJob } from './endpoints/jobs'

// Candidate operations
export { getAllCandidates, getCandidate, createCandidate, updateCandidate } from './endpoints/candidates'

// Custom field operations
export { getAllCustomFields, getCustomField, createCustomField, updateCustomField, deleteCustomField } from './endpoints/custom-fields'

// Types
export type * from './types'

// Errors
export { TeamTailorError, AuthenticationError, RateLimitError } from './errors'
```

**Acceptance Criteria:**
- [ ] Clean public API surface
- [ ] All endpoint functions exported
- [ ] Types and errors exported
- [ ] Internal modules hidden
- [ ] JSDoc documentation

### Phase 7: Testing Implementation

#### Task 7.1: Unit Tests Setup
**Requirements:**
- Jest/Vitest configuration
- Mock HTTP client
- Test utilities

**Files to create:**
- `lib/integrations/teamtailor/__tests__/client.test.ts`
- `lib/integrations/teamtailor/__tests__/pagination.test.ts`
- `lib/integrations/teamtailor/__tests__/endpoints/clients.test.ts`
- `lib/integrations/teamtailor/__tests__/utils/rate-limiter.test.ts`

**Test Coverage Requirements:**
- [ ] HTTP client methods
- [ ] Pagination logic
- [ ] Rate limiting behavior
- [ ] Error handling scenarios
- [ ] Endpoint function behavior

#### Task 7.2: Integration Tests
**Requirements:**
- Real API testing (with test credentials)
- Pagination edge cases
- Rate limiting validation

**Files to create:**
- `lib/integrations/teamtailor/__tests__/integration/pagination.integration.test.ts`
- `lib/integrations/teamtailor/__tests__/integration/rate-limiting.integration.test.ts`

**Test Scenarios:**
- [ ] Large dataset pagination
- [ ] Empty result handling
- [ ] Single page responses
- [ ] Rate limit boundary testing
- [ ] Error recovery scenarios

### Phase 8: Performance & Caching

#### Task 8.1: Implement Caching Layer (`utils/cache.ts`)
**Requirements:**
- In-memory caching with TTL
- Request deduplication
- Cache invalidation strategies

**Key Components:**
```typescript
class TeamTailorCache {
  private cache: Map<string, CacheEntry>
  private requestMap: Map<string, Promise<any>>
  
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async invalidate(pattern: string): Promise<void>
  
  // Request deduplication
  async deduplicate<T>(key: string, request: () => Promise<T>): Promise<T>
}
```

**Acceptance Criteria:**
- [ ] TTL-based cache expiration
- [ ] Request deduplication
- [ ] Pattern-based invalidation
- [ ] Memory usage limits
- [ ] Cache hit/miss metrics

#### Task 8.2: Performance Monitoring
**Requirements:**
- Request timing metrics
- Pagination performance tracking
- Error rate monitoring

**Key Components:**
```typescript
interface TeamTailorMetrics {
  requestCount: number
  averageResponseTime: number
  errorRate: number
  paginationStats: {
    averagePages: number
    averageRecordsPerPage: number
    totalRecordsFetched: number
  }
}
```

**Acceptance Criteria:**
- [ ] Request performance tracking
- [ ] Pagination efficiency metrics
- [ ] Error rate monitoring
- [ ] Memory usage tracking

### Phase 9: Documentation & Examples

#### Task 9.1: Create Usage Documentation
**Files to create:**
- `lib/integrations/teamtailor/README.md`
- `docs/teamtailor-integration-guide.md`
- `examples/teamtailor-usage.md`

**Documentation Requirements:**
- [ ] Quick start guide
- [ ] API reference
- [ ] Code examples for each endpoint
- [ ] Error handling examples
- [ ] Performance best practices

#### Task 9.2: Create Example Components
**Files to create:**
- `examples/components/ClientList.tsx`
- `examples/components/JobForm.tsx`
- `examples/components/CandidateSearch.tsx`

**Example Requirements:**
- [ ] Real-world usage patterns
- [ ] Error handling demonstrations
- [ ] Loading states
- [ ] Pagination UI examples

### Phase 10: Deployment & Monitoring

#### Task 10.1: Production Setup
**Requirements:**
- Environment variable validation
- Logging configuration
- Health check endpoints

**Files to create/update:**
- `app/api/health/teamtailor/route.ts`
- Production environment setup
- Monitoring dashboard configuration

**Acceptance Criteria:**
- [ ] Production environment configured
- [ ] Health check endpoint functional
- [ ] Logging properly configured
- [ ] Error tracking enabled

#### Task 10.2: Performance Baseline
**Requirements:**
- Load testing with various data sizes
- Rate limiting validation
- Memory usage profiling

**Acceptance Criteria:**
- [ ] Performance benchmarks established
- [ ] Rate limiting compliance verified
- [ ] Memory usage within acceptable limits
- [ ] Error recovery validated

## Implementation Checklist

### Core Infrastructure
- [x] Task 1.1: Folder structure created
- [x] Task 1.2: Dependencies installed
- [x] Task 2.1: Configuration module implemented
- [x] Task 2.2: Type definitions complete
- [x] Task 2.3: Error handling implemented
- [x] Task 2.4: Rate limiter functional

### Client & Pagination
- [x] Task 3.1: HTTP client implemented
- [x] Task 3.2: Pagination utility complete

### Endpoints
- [x] Task 4.1: Clients endpoint functional
- [ ] Task 4.2: Jobs endpoint functional
- [ ] Task 4.3: Candidates endpoint functional
- [ ] Task 4.4: Custom fields endpoint functional

### Next.js Integration
- [ ] Task 5.1: Server actions implemented
- [ ] Task 5.2: API routes created
- [x] Task 5.3: Environment configured

### Public API
- [ ] Task 6.1: Public API exported

### Testing
- [ ] Task 7.1: Unit tests implemented
- [ ] Task 7.2: Integration tests passing

### Performance
- [ ] Task 8.1: Caching implemented
- [ ] Task 8.2: Monitoring configured

### Documentation
- [ ] Task 9.1: Documentation complete
- [ ] Task 9.2: Examples created

### Deployment
- [ ] Task 10.1: Production setup complete
- [ ] Task 10.2: Performance validated

## Success Criteria

### Functional Requirements
- [ ] All CRUD operations working for Clients, Jobs, Candidates, Custom Fields
- [ ] Automatic pagination handling for all list operations
- [ ] Rate limiting compliance (50 req/10s)
- [ ] Error handling with proper error types
- [ ] Type-safe TypeScript implementation

### Performance Requirements
- [ ] Large dataset pagination (1000+ records) completes successfully
- [ ] Memory usage remains stable during large operations
- [ ] Request rate stays within TeamTailor limits
- [ ] Response times acceptable for production use

### Integration Requirements
- [ ] Server Actions work correctly with Next.js 15.4
- [ ] API routes handle requests properly
- [ ] Environment configuration validated
- [ ] No client-side API key exposure

### Quality Requirements
- [ ] >90% test coverage for core modules
- [ ] All TypeScript strict mode checks pass
- [ ] Comprehensive error handling
- [ ] Production-ready logging and monitoring

## Getting Started

1. **Begin with Phase 1**: Set up the folder structure and install dependencies
2. **Follow the dependency order**: Complete foundation modules before building endpoints
3. **Test incrementally**: Implement tests alongside each module
4. **Validate early**: Test pagination and rate limiting with real API calls as soon as the core client is ready
5. **Document as you build**: Maintain documentation throughout development

This implementation plan provides a complete roadmap to build the TeamTailor integration layer according to the design specifications, with clear milestones and acceptance criteria for each task.