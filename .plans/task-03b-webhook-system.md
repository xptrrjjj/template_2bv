# Task 03b: Webhook System Implementation

## Objective
Implement the webhook receiving, verification, and processing system for handling inbound events from external integrations.

## Dependencies
- Task 01: Core Infrastructure Setup (requires encryption and base types)

## Expected Inputs
- Webhook endpoint definitions
- Signature verification methods for different providers
- Event type mappings
- Datastore models for webhook events

## Expected Outputs
- Next.js API routes for webhook endpoints
- Webhook signature verification system
- Event processing and routing
- Webhook event storage and logging

## Required Tools/Auth
- Next.js API routes
- Crypto module for signature verification
- Datastore access for event storage
- Provider-specific webhook secrets

## Implementation Checklist

### 1. API Route Infrastructure
- [ ] Create `src/app/api/integrations/webhook/[provider]/[event]/route.ts`
- [ ] Implement POST handler for webhook reception
- [ ] Add request validation and parsing
- [ ] Include rate limiting for webhook endpoints
- [ ] Add IP allowlisting if required
- [ ] Implement proper HTTP status code responses

### 2. Webhook Verification System
- [ ] Create `src/services/integrations/webhooks/WebhookVerifier.ts`
- [ ] Implement `verifyTeamTailorSignature()` method
- [ ] Add `verifySalesforceSignature()` method
- [ ] Include `verifyCheckrSignature()` method
- [ ] Add generic HMAC verification fallback
- [ ] Implement timing-safe comparison

### 3. Event Processing Engine
- [ ] Create `src/services/integrations/webhooks/WebhookProcessor.ts`
- [ ] Implement `processWebhookEvent()` orchestrator
- [ ] Add event type routing logic
- [ ] Include payload validation
- [ ] Add error handling and logging
- [ ] Implement async processing queue

### 4. Event Router
- [ ] Create `src/services/integrations/webhooks/WebhookRouter.ts`
- [ ] Implement event handler mapping
- [ ] Add dynamic handler registration
- [ ] Include event filtering logic
- [ ] Add handler execution with timeout
- [ ] Implement fallback handlers

### 5. Webhook Event Storage
- [ ] Implement webhook event persistence
- [ ] Add event deduplication
- [ ] Include processing status tracking
- [ ] Add retry mechanism for failed processing
- [ ] Implement event archival
- [ ] Add webhook analytics

### 6. Provider-Specific Handlers
- [ ] Create TeamTailor event handlers
  - [ ] `job.application_created` handler
  - [ ] `job.published` handler  
  - [ ] `job.archived` handler
- [ ] Add Salesforce event handlers
  - [ ] `contact.updated` handler
  - [ ] `opportunity.created` handler
- [ ] Include Checkr event handlers
  - [ ] `report.completed` handler

### 7. Security and Rate Limiting
- [ ] Implement webhook rate limiting per provider
- [ ] Add request size limits
- [ ] Include payload sanitization
- [ ] Add malicious payload detection
- [ ] Implement webhook endpoint monitoring
- [ ] Add security headers

## Webhook Event Types to Support
### TeamTailor
- `job.application_created` - New application received
- `job.published` - Job successfully published
- `job.archived` - Job removed/archived
- `candidate.stage_changed` - Candidate moved between stages

### Salesforce  
- `contact.updated` - Contact record modified
- `opportunity.created` - New opportunity created
- `lead.converted` - Lead converted to opportunity

### Checkr
- `report.completed` - Background check completed
- `report.disputed` - Report disputed by candidate

## Validation Steps
1. Webhook signatures are verified correctly
2. Invalid signatures are rejected with 401
3. Events are stored with proper metadata
4. Event processing handles all supported types
5. Failed events are queued for retry
6. Rate limiting prevents abuse
7. All webhook activity is logged

## Files to Create
- `src/app/api/integrations/webhook/[provider]/[event]/route.ts`
- `src/services/integrations/webhooks/WebhookVerifier.ts`
- `src/services/integrations/webhooks/WebhookProcessor.ts`
- `src/services/integrations/webhooks/WebhookRouter.ts`
- `src/services/integrations/webhooks/index.ts`