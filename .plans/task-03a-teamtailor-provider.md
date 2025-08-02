# Task 03a: TeamTailor Provider Implementation

## Objective
Implement the complete TeamTailor integration provider including options fetching, job publishing, and data transformation.

## Dependencies  
- Task 01: Core Infrastructure Setup (requires BaseIntegration class)

## Expected Inputs
- BaseIntegration abstract class
- TeamTailor API documentation and endpoints
- Integration types and interfaces
- Encryption service for API key storage

## Expected Outputs
- Complete TeamTailor provider implementation
- Options fetching for departments, locations, templates, stages
- Job publishing functionality
- Data transformation between internal and TeamTailor formats
- Error handling and rate limiting

## Required Tools/Auth
- TeamTailor API key
- Network access to TeamTailor API endpoints
- Datastore access for caching options

## Implementation Checklist

### 1. Provider Structure
- [ ] Create `src/services/integrations/providers/teamtailor/` directory
- [ ] Create `TeamTailorIntegration.ts` main provider class
- [ ] Create `TeamTailorOptions.ts` for options fetching
- [ ] Create `TeamTailorPublisher.ts` for job publishing
- [ ] Create `TeamTailorMapper.ts` for data transformation

### 2. Main Integration Class
- [ ] Implement `TeamTailorIntegration extends BaseIntegration`
- [ ] Add constructor with credential initialization
- [ ] Implement `fetchOptions()` method
- [ ] Add `publishJob()` method
- [ ] Include rate limiting and error handling
- [ ] Add health check functionality

### 3. Options Fetching Service
- [ ] Implement `fetchDepartments()` API call
- [ ] Add `fetchLocations()` with city/country data
- [ ] Include `fetchJobTemplates()` functionality
- [ ] Add `fetchHiringStages()` with ordering
- [ ] Implement options caching with TTL
- [ ] Add cache invalidation logic

### 4. Job Publishing Service
- [ ] Implement job creation API call
- [ ] Add job update functionality
- [ ] Include job archiving/unpublishing
- [ ] Add bulk publishing support
- [ ] Implement publish status checking
- [ ] Add error recovery and retry logic

### 5. Data Transformation
- [ ] Create role-to-TeamTailor job mapping
- [ ] Implement field validation
- [ ] Add required field checking
- [ ] Include data sanitization
- [ ] Add format conversion utilities
- [ ] Implement reverse mapping for updates

### 6. API Communication
- [ ] Implement authenticated API requests
- [ ] Add proper headers (Authorization, X-Api-Version)
- [ ] Include request/response logging
- [ ] Add timeout handling
- [ ] Implement response parsing
- [ ] Add API error code handling

### 7. Integration Testing
- [ ] Create mock API responses for testing
- [ ] Add unit tests for data transformation
- [ ] Include integration tests with test API
- [ ] Add error scenario testing
- [ ] Test rate limiting behavior
- [ ] Validate caching mechanisms

## API Endpoints to Implement
- `GET /v1/departments` - Fetch department options
- `GET /v1/locations` - Fetch location options  
- `GET /v1/job-templates` - Fetch job templates
- `GET /v1/stages` - Fetch hiring stages
- `POST /v1/jobs` - Create/publish job
- `PATCH /v1/jobs/{id}` - Update job
- `DELETE /v1/jobs/{id}` - Archive job

## Validation Steps
1. Options are fetched correctly from TeamTailor API
2. Jobs can be published successfully
3. Data transformation preserves all required fields
4. Rate limiting prevents API quota exhaustion
5. Error handling provides meaningful messages
6. Caching reduces redundant API calls

## Files to Create
- `src/services/integrations/providers/teamtailor/TeamTailorIntegration.ts`
- `src/services/integrations/providers/teamtailor/TeamTailorOptions.ts`
- `src/services/integrations/providers/teamtailor/TeamTailorPublisher.ts`
- `src/services/integrations/providers/teamtailor/TeamTailorMapper.ts`
- `src/services/integrations/providers/teamtailor/index.ts`