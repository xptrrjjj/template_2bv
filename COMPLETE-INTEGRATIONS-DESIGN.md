# Complete Integrations System Design

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Data Models](#2-core-data-models)
3. [API Interaction Patterns](#3-api-interaction-patterns)
4. [Webhook & Event Handling](#4-webhook--event-handling)
5. [Execution Models](#5-execution-models)
6. [TeamTailor Reference Implementation](#6-teamtailor-reference-implementation)
7. [Security & Compliance](#7-security--compliance)
8. [Extensibility Framework](#8-extensibility-framework)
9. [Environment Configuration](#9-environment-configuration)

---

## 1. System Overview

### Purpose and Scope

The Integrations System enables the platform to connect with and synchronize data to/from third-party services through APIs and webhooks. All configuration, credentials, and runtime state are managed exclusively via the existing Datastore infrastructure using Bearer-authenticated API calls.

### Core Capabilities

- **CRM Integration**: Sync candidate data with Salesforce, HubSpot, Pipedrive
- **Email Platforms**: Connect with Mailchimp, SendGrid, Constant Contact
- **Job Boards**: Post positions to Indeed, LinkedIn, Glassdoor, TeamTailor
- **Background Check Services**: Integrate with Checkr, Sterling, HireRight
- **Assessment Tools**: Connect with Codility, HackerRank, TestGorilla
- **Communication Tools**: Slack notifications, Microsoft Teams updates

### Integration Patterns

#### Outbound Sync
- Push new candidate applications to CRM
- Post job openings to multiple job boards
- Send welcome emails via email platform
- Trigger background checks on candidate progression

#### Inbound Webhook
- Receive candidate status updates from background check services
- Process assessment completion notifications
- Handle job board application submissions
- Accept CRM record updates

#### Draft → Approval → Publish Workflow
- **Draft-First**: All entities start in draft state with external options pre-populated
- **Approval Gate**: Manual approval required before external publishing
- **Optional Sync**: Publishing to external service is user-triggered, not automatic
- **State Persistence**: All workflow states and metadata stored in Datastore
- **Platform Agnostic**: Architecture scales to any external platform

---

## 2. Core Data Models

### Integration Registry (`integrations_registry`)

Defines available integration providers and their capabilities.

```json
{
  "record_id": "integration_teamtailor_jobs",
  "app_id": "integrations_registry",
  "integration_id": "teamtailor_jobs",
  "name": "TeamTailor Job Board",
  "provider": "teamtailor",
  "type": "job_board",
  "version": "v1.0",
  "auth_method": "api_key",
  "status": "active",
  "capabilities": ["outbound_sync", "draft_workflow", "options_fetching"],
  "endpoints": {
    "base_url": "https://api.teamtailor.com/v1",
    "auth_url": null,
    "token_url": null,
    "webhook_url": "/integrations/webhook/teamtailor"
  },
  "rate_limits": {
    "requests_per_minute": 60,
    "requests_per_day": 10000
  },
  "created_at": "2024-01-15T10:00:00Z",
  "created_by": "system",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Integration Instances (`integrations_instances`)

Active integration configurations for specific providers.

```json
{
  "record_id": "instance_teamtailor_main",
  "app_id": "integrations_instances",
  "instance_id": "teamtailor_main",
  "integration_id": "teamtailor_jobs",
  "name": "Main TeamTailor Instance",
  "status": "active",
  "configuration": {
    "company_domain": "company.teamtailor.com",
    "default_department": "Engineering",
    "auto_publish": false,
    "field_mappings": {
      "role.title": "job.name",
      "role.description": "job.body",
      "role.requirements": "job.requirements",
      "role.department": "job.department_id",
      "role.location": "job.location_id"
    },
    "approval_workflow": {
      "enabled": true,
      "required_approvers": ["manager", "hr"],
      "auto_approve_conditions": []
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "admin_user_123",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

### Credential Storage (`integrations_credentials`)

Encrypted authentication credentials for integrations.

```json
{
  "record_id": "creds_teamtailor_main",
  "app_id": "integrations_credentials",
  "instance_id": "teamtailor_main",
  "auth_method": "api_key",
  "credentials": {
    "api_key": "encrypted_api_key",
    "token_type": "Bearer"
  },
  "api_keys": {
    "client_id": null,
    "client_secret": null
  },
  "webhook_secrets": {
    "verification_token": "encrypted_webhook_secret"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:15:00Z",
  "expires_at": null
}
```

### Entity Integration Metadata (`role_integration_metadata`)

Workflow state and external options for specific entities (roles, candidates, etc.).

```json
{
  "record_id": "role_integration_meta_role123",
  "app_id": "role_integration_metadata", 
  "entity_id": "role_123",
  "entity_type": "role",
  "integration_provider": "teamtailor",
  "publish_state": "draft",
  "external_options": {
    "departments": [
      {"id": "dept_001", "name": "Engineering", "selected": true},
      {"id": "dept_002", "name": "Marketing", "selected": false}
    ],
    "job_templates": [
      {"id": "tmpl_001", "name": "Senior Developer Template", "selected": true}
    ],
    "hiring_stages": [
      {"id": "stage_001", "name": "Application", "order": 1},
      {"id": "stage_002", "name": "Phone Screen", "order": 2},
      {"id": "stage_003", "name": "Technical Interview", "order": 3}
    ],
    "locations": [
      {"id": "loc_001", "name": "New York", "selected": true},
      {"id": "loc_002", "name": "Remote", "selected": false}
    ]
  },
  "field_mappings": {
    "role.title": "job.name",
    "role.description": "job.body",
    "role.requirements": "job.requirements",
    "role.department": "job.department_id",
    "role.location": "job.location_id"
  },
  "approval_workflow": {
    "required_approvers": ["manager_user_456", "hr_user_789"],
    "submitted_at": null,
    "submitted_by": null,
    "approved_at": null,
    "approved_by": null,
    "rejection_reason": null
  },
  "created_at": "2024-01-20T10:00:00Z",
  "updated_at": "2024-01-20T10:00:00Z"
}
```

### Publishing History (`entity_publishing_history`)

Complete audit trail of all publishing attempts.

```json
{
  "record_id": "role_publish_hist_20240120_100530",
  "app_id": "entity_publishing_history",
  "entity_id": "role_123",
  "entity_type": "role",
  "integration_provider": "teamtailor",
  "action": "publish",
  "status": "success",
  "external_entity_id": "teamtailor_job_98765",
  "external_entity_url": "https://company.teamtailor.com/jobs/98765",
  "request_payload": {
    "name": "Senior Full Stack Developer",
    "body": "We are looking for...",
    "department_id": "dept_001",
    "location_id": "loc_001"
  },
  "response_data": {
    "id": 98765,
    "status": "published",
    "created_at": "2024-01-20T10:05:30Z"
  },
  "error_details": null,
  "sync_duration_ms": 1250,
  "triggered_by": "user_123",
  "triggered_at": "2024-01-20T10:05:00Z",
  "completed_at": "2024-01-20T10:05:30Z"
}
```

### External Options Cache (`integration_external_options`)

Cached options from external services to reduce API calls.

```json
{
  "record_id": "ext_options_teamtailor_departments_20240120",
  "app_id": "integration_external_options",
  "integration_provider": "teamtailor",
  "option_type": "departments",
  "options_data": [
    {"id": "dept_001", "name": "Engineering", "parent_id": null},
    {"id": "dept_002", "name": "Marketing", "parent_id": null},
    {"id": "dept_003", "name": "Frontend", "parent_id": "dept_001"}
  ],
  "fetched_at": "2024-01-20T09:30:00Z",
  "expires_at": "2024-01-20T21:30:00Z",
  "fetch_status": "success",
  "cache_version": "v1.0"
}
```

### Sync State Tracking (`entity_sync_state`)

Current synchronization status for published entities.

```json
{
  "record_id": "role_sync_state_role123",
  "app_id": "entity_sync_state",
  "entity_id": "role_123",
  "entity_type": "role",
  "integration_provider": "teamtailor",
  "external_id": "teamtailor_job_98765",
  "sync_status": "published",
  "last_sync_at": "2024-01-20T10:05:30Z",
  "last_sync_type": "publish",
  "sync_errors": [],
  "pending_changes": false,
  "needs_republish": false,
  "external_url": "https://company.teamtailor.com/jobs/98765",
  "external_metadata": {
    "views": 127,
    "applications": 8,
    "status": "published"
  }
}
```

### Sync Logs (`integrations_sync_logs`)

Detailed logging of all integration operations.

```json
{
  "record_id": "sync_log_20240120_143022",
  "app_id": "integrations_sync_logs",
  "sync_id": "sync_20240120_143022",
  "instance_id": "teamtailor_main",
  "sync_type": "outbound",
  "operation": "role_publish",
  "status": "completed",
  "started_at": "2024-01-20T14:30:22Z",
  "completed_at": "2024-01-20T14:30:45Z",
  "records_processed": 1,
  "records_successful": 1,
  "records_failed": 0,
  "errors": [],
  "metadata": {
    "api_calls_made": 3,
    "rate_limit_remaining": 57,
    "response_time_avg_ms": 420
  }
}
```

### Retry Queue (`integrations_retry_queue`)

Failed operations queued for retry with exponential backoff.

```json
{
  "record_id": "retry_queue_item_456",
  "app_id": "integrations_retry_queue",
  "queue_item_id": "retry_456",
  "instance_id": "teamtailor_main",
  "operation": "role_publish",
  "payload": {
    "entity_id": "role_123",
    "entity_type": "role",
    "action": "publish",
    "data": {
      "name": "Senior Developer",
      "body": "Job description...",
      "department_id": "dept_001"
    }
  },
  "attempt_count": 2,
  "max_attempts": 5,
  "next_retry_at": "2024-01-20T15:00:00Z",
  "last_error": "Rate limit exceeded",
  "status": "pending",
  "created_at": "2024-01-20T14:30:22Z",
  "updated_at": "2024-01-20T14:45:30Z"
}
```

---

## 3. API Interaction Patterns

### Entity Creation with Integration Setup

```typescript
// 1. Create base entity (role, candidate, etc.)
const createEntityPayload = {
  identifier: "recruitment_roles",
  action: "create", 
  data: {
    app_id: "recruitment_roles",
    record_id: "role_123",
    title: "Senior Full Stack Developer",
    description: "We are looking for...",
    department: "Engineering",
    location: "New York",
    status: "draft",
    created_by: "user_123",
    created_at: new Date().toISOString()
  }
};

// 2. Fetch external options from provider
const externalOptions = await fetchProviderOptions('teamtailor');

// 3. Create integration metadata
const integrationMetaPayload = {
  identifier: "role_integration_metadata",
  action: "create",
  data: {
    app_id: "role_integration_metadata",
    record_id: `role_integration_meta_${entityId}`,
    entity_id: entityId,
    entity_type: "role",
    integration_provider: "teamtailor",
    publish_state: "draft",
    external_options: externalOptions,
    field_mappings: getDefaultFieldMappings('teamtailor'),
    approval_workflow: {
      required_approvers: await getRequiredApprovers(entityId)
    },
    created_at: new Date().toISOString()
  }
};
```

### Workflow State Transitions

```typescript
// Submit for Approval
const submitForApprovalPayload = {
  identifier: "role_integration_metadata",
  action: "update",
  data: {
    record_id: `role_integration_meta_${entityId}`,
    publish_state: "pending_approval",
    approval_workflow: {
      submitted_at: new Date().toISOString(),
      submitted_by: "user_123"
    },
    updated_at: new Date().toISOString()
  }
};

// Approve Entity
const approveEntityPayload = {
  identifier: "role_integration_metadata",
  action: "update",
  data: {
    record_id: `role_integration_meta_${entityId}`,
    publish_state: "approved",
    approval_workflow: {
      approved_at: new Date().toISOString(),
      approved_by: "manager_user_456"
    },
    updated_at: new Date().toISOString()
  }
};

// Log Publishing Attempt
const logPublishPayload = {
  identifier: "entity_publishing_history",
  action: "create",
  data: {
    app_id: "entity_publishing_history",
    record_id: `entity_publish_hist_${Date.now()}`,
    entity_id: entityId,
    entity_type: "role",
    integration_provider: "teamtailor",
    action: "publish",
    status: "success",
    external_entity_id: "teamtailor_job_98765",
    external_entity_url: "https://company.teamtailor.com/jobs/98765",
    request_payload: publishPayload,
    response_data: providerResponse,
    error_details: null,
    sync_duration_ms: 1250,
    triggered_by: "user_123",
    triggered_at: startTime.toISOString(),
    completed_at: new Date().toISOString()
  }
};
```

### Credentials Management

```typescript
// Store API Key Credentials
const storeCredentialsPayload = {
  identifier: "integrations_credentials",
  action: "create",
  data: {
    app_id: "integrations_credentials",
    record_id: `creds_${instance_id}`,
    instance_id: "teamtailor_main",
    auth_method: "api_key",
    credentials: {
      api_key: encryptValue(apiKey),
      token_type: "Bearer"
    },
    created_at: new Date().toISOString()
  }
};

// Store OAuth Credentials
const storeOAuthPayload = {
  identifier: "integrations_credentials",
  action: "create",
  data: {
    app_id: "integrations_credentials",
    record_id: `creds_${instance_id}`,
    instance_id: "salesforce_main",
    auth_method: "oauth2",
    credentials: {
      access_token: encryptValue(accessToken),
      refresh_token: encryptValue(refreshToken),
      token_type: "Bearer",
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      scope: "api refresh_token"
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString()
  }
};
```

### Query Operations

```typescript
// Get Active Integrations
const getActiveIntegrationsPayload = {
  identifier: "integrations_instances",
  filters: {
    status: "active"
  }
};

// Get Entities Pending Approval
const getPendingApprovalsPayload = {
  identifier: "role_integration_metadata",
  filters: {
    publish_state: "pending_approval",
    integration_provider: "teamtailor"
  }
};

// Get Publishing History
const getPublishingHistoryPayload = {
  identifier: "entity_publishing_history",
  filters: {
    entity_id: "role_123",
    entity_type: "role"
  }
};

// Get Retry Queue Items
const getRetryQueuePayload = {
  identifier: "integrations_retry_queue",
  filters: {
    status: "pending",
    next_retry_at: { $lte: new Date().toISOString() }
  }
};
```

---

## 4. Webhook & Event Handling

### Webhook Endpoint Architecture

```typescript
// Next.js API route: /api/integrations/webhook/[provider]/[event]
export async function POST(request: Request, { params }: { params: { provider: string, event: string } }) {
  const { provider, event } = params;
  const payload = await request.json();
  const signature = request.headers.get('X-Webhook-Signature');

  // 1. Verify webhook authenticity
  const isValid = await verifyWebhookSignature(provider, signature, payload);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Store webhook event
  const webhookEvent = {
    identifier: "integrations_webhook_events",
    action: "create",
    data: {
      app_id: "integrations_webhook_events",
      record_id: `webhook_event_${Date.now()}`,
      provider,
      event_type: event,
      payload,
      processed: false,
      received_at: new Date().toISOString()
    }
  };
  
  await apiClient.datastoreCreate(webhookEvent);

  // 3. Process webhook (async)
  processWebhookEvent(provider, event, payload);

  return Response.json({ status: 'received' });
}
```

### Event Processing

```typescript
async function processWebhookEvent(provider: string, eventType: string, payload: any) {
  // 1. Find matching webhook configuration
  const webhookConfig = await apiClient.getRecords("integrations_webhooks", {
    provider,
    event_type: eventType,
    status: "active"
  });

  if (!webhookConfig.data?.length) {
    await logWebhookError("No active webhook config found", provider, eventType);
    return;
  }

  // 2. Get integration instance and credentials
  const instanceId = webhookConfig.data[0].instance_id;
  const [instance, credentials] = await Promise.all([
    apiClient.getRecords("integrations_instances", { instance_id: instanceId }),
    apiClient.getRecords("integrations_credentials", { instance_id: instanceId })
  ]);

  // 3. Process the webhook based on event type
  const processor = getWebhookProcessor(provider, eventType);
  await processor.process(payload, instance.data[0], credentials.data[0]);
}
```

### Event Type Mapping

```typescript
const WEBHOOK_EVENT_HANDLERS = {
  'teamtailor': {
    'job.application_created': TeamTailorApplicationHandler,
    'job.published': TeamTailorJobPublishedHandler,
    'job.archived': TeamTailorJobArchivedHandler
  },
  'salesforce': {
    'contact.updated': SalesforceContactUpdateHandler,
    'opportunity.created': SalesforceOpportunityCreateHandler,
    'lead.converted': SalesforceLeadConvertHandler
  },
  'checkr': {
    'report.completed': CheckrReportCompletedHandler,
    'report.disputed': CheckrReportDisputedHandler
  }
};
```

---

## 5. Execution Models

### Workflow States and Transitions

```typescript
enum EntityPublishState {
  DRAFT = 'draft',                    // Initial state, external options fetched
  PENDING_APPROVAL = 'pending_approval', // Submitted for review
  APPROVED = 'approved',              // Ready for publishing
  PUBLISHED = 'published',            // Successfully published to external service
  PUBLISH_FAILED = 'publish_failed',  // Publishing attempt failed
  UNPUBLISHED = 'unpublished'         // Removed from external service
}

// State Transition Matrix
const VALID_TRANSITIONS = {
  [EntityPublishState.DRAFT]: [EntityPublishState.PENDING_APPROVAL],
  [EntityPublishState.PENDING_APPROVAL]: [EntityPublishState.APPROVED, EntityPublishState.DRAFT],
  [EntityPublishState.APPROVED]: [EntityPublishState.PUBLISHED, EntityPublishState.PUBLISH_FAILED],
  [EntityPublishState.PUBLISHED]: [EntityPublishState.UNPUBLISHED],
  [EntityPublishState.PUBLISH_FAILED]: [EntityPublishState.APPROVED],
  [EntityPublishState.UNPUBLISHED]: [EntityPublishState.APPROVED]
};
```

### Sync Execution Strategies

#### Real-time Sync (Event-driven)
- Triggered by platform events (entity created, status updated)
- Immediate API calls to external services
- Fallback to retry queue on failure

#### Scheduled Sync (Batch)
- Cron-based execution for bulk operations
- Configurable intervals (hourly, daily, weekly)
- Efficient for large data sets

#### On-demand Sync (User-initiated)
- Manual sync triggers from admin interface
- Full or partial data synchronization
- Progress tracking and status updates

### Retry Mechanism

```typescript
class ExponentialBackoffRetryStrategy {
  async executeWithRetry(operation: () => Promise<any>, maxAttempts: number = 5): Promise<any> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts || !this.isRetryableError(error)) {
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s
        await this.sleep(delay);
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: Error): boolean {
    return error.message.includes('rate limit') || 
           error.message.includes('timeout') ||
           error.message.includes('network');
  }
}
```

---

## 6. TeamTailor Reference Implementation

### Provider Integration

```typescript
class TeamTailorIntegration extends BaseIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.teamtailor.com/v1';

  constructor(credentials: IntegrationCredentials) {
    super();
    this.apiKey = decryptValue(credentials.credentials.api_key);
  }

  async fetchOptions(): Promise<ExternalOptions> {
    const [departments, locations, templates, stages] = await Promise.all([
      this.fetchDepartments(),
      this.fetchLocations(), 
      this.fetchJobTemplates(),
      this.fetchHiringStages()
    ]);

    return {
      departments,
      locations,
      job_templates: templates,
      hiring_stages: stages
    };
  }

  private async fetchDepartments(): Promise<OptionItem[]> {
    const response = await fetch(`${this.baseUrl}/departments`, {
      headers: {
        'Authorization': `Token token=${this.apiKey}`,
        'X-Api-Version': '20210218'
      }
    });
    
    const data = await response.json();
    return data.data.map(dept => ({
      id: dept.id,
      name: dept.attributes.name,
      parent_id: dept.relationships?.parent?.data?.id || null
    }));
  }

  private async fetchLocations(): Promise<OptionItem[]> {
    const response = await fetch(`${this.baseUrl}/locations`, {
      headers: {
        'Authorization': `Token token=${this.apiKey}`,
        'X-Api-Version': '20210218'
      }
    });
    
    const data = await response.json();
    return data.data.map(loc => ({
      id: loc.id,
      name: loc.attributes.name,
      city: loc.attributes.city,
      country: loc.attributes.country
    }));
  }

  async publishJob(roleData: RoleData, integrationMeta: IntegrationMetadata): Promise<PublishResult> {
    const payload = this.transformRoleToTeamTailorJob(roleData, integrationMeta);
    
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${this.apiKey}`,
        'X-Api-Version': '20210218',
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: 'jobs',
          attributes: payload
        }
      })
    });

    if (!response.ok) {
      throw new Error(`TeamTailor API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      external_entity_id: result.data.id,
      external_entity_url: `https://company.teamtailor.com/jobs/${result.data.id}`,
      response_data: result.data
    };
  }

  private transformRoleToTeamTailorJob(roleData: RoleData, integrationMeta: IntegrationMetadata) {
    const selectedDepartment = integrationMeta.external_options.departments.find(d => d.selected);
    const selectedLocation = integrationMeta.external_options.locations.find(l => l.selected);

    return {
      name: roleData.title,
      body: roleData.description,
      requirements: roleData.requirements,
      department_id: selectedDepartment?.id,
      location_id: selectedLocation?.id,
      status: 'published',
      apply_button_text: 'Apply Now'
    };
  }
}
```

### Service Layer Implementation

```typescript
class EntityIntegrationService {
  async createEntityWithIntegration(
    entityData: CreateEntityRequest, 
    entityType: string,
    integrationProvider: string
  ): Promise<EntityWithIntegration> {
    // 1. Create base entity
    const entity = await this.createEntity(entityData, entityType);
    
    // 2. Fetch external options
    const provider = this.getProvider(integrationProvider);
    const externalOptions = await provider.fetchOptions();
    
    // 3. Cache external options
    await this.cacheExternalOptions(integrationProvider, externalOptions);
    
    // 4. Create integration metadata
    const integrationMeta = await this.createIntegrationMetadata(
      entity.entity_id, 
      entityType,
      integrationProvider, 
      externalOptions
    );
    
    return {
      entity,
      integration_metadata: integrationMeta,
      external_options: externalOptions
    };
  }

  async submitForApproval(entityId: string, entityType: string, submittedBy: string): Promise<void> {
    await this.updatePublishState(entityId, entityType, 'pending_approval', {
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy
    });
    
    // Send notifications to approvers
    await this.notifyApprovers(entityId, entityType);
  }

  async approveEntity(entityId: string, entityType: string, approvedBy: string): Promise<void> {
    await this.updatePublishState(entityId, entityType, 'approved', {
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    });
  }

  async publishEntity(entityId: string, entityType: string, triggeredBy: string): Promise<PublishResult> {
    const startTime = new Date();
    
    try {
      // 1. Get entity and integration metadata
      const [entity, integrationMeta] = await Promise.all([
        this.getEntity(entityId, entityType),
        this.getIntegrationMetadata(entityId, entityType)
      ]);

      // 2. Validate state
      if (integrationMeta.publish_state !== 'approved') {
        throw new Error('Entity must be approved before publishing');
      }

      // 3. Publish to external service
      const provider = this.getProvider(integrationMeta.integration_provider);
      const publishResult = await provider.publishEntity(entity, integrationMeta);

      // 4. Update states
      await Promise.all([
        this.updatePublishState(entityId, entityType, 'published'),
        this.updateSyncState(entityId, entityType, publishResult),
        this.logPublishingHistory(entityId, entityType, 'publish', 'success', publishResult, startTime, triggeredBy)
      ]);

      return publishResult;
    } catch (error) {
      // Handle failure
      await Promise.all([
        this.updatePublishState(entityId, entityType, 'publish_failed'),
        this.logPublishingHistory(entityId, entityType, 'publish', 'failed', null, startTime, triggeredBy, error)
      ]);
      throw error;
    }
  }
}
```

### Workflow Manager

```typescript
class EntityPublishWorkflowManager {
  async transitionState(
    entityId: string, 
    entityType: string,
    fromState: EntityPublishState, 
    toState: EntityPublishState, 
    metadata: any = {}
  ): Promise<void> {
    // Validate transition
    if (!this.isValidTransition(fromState, toState)) {
      throw new Error(`Invalid state transition: ${fromState} → ${toState}`);
    }

    // Update state in datastore
    await apiClient.datastoreCreate({
      identifier: `${entityType}_integration_metadata`,
      action: "update",
      data: {
        record_id: `${entityType}_integration_meta_${entityId}`,
        publish_state: toState,
        ...metadata,
        updated_at: new Date().toISOString()
      }
    });

    // Log state transition
    await this.logStateTransition(entityId, entityType, fromState, toState, metadata);
  }

  private isValidTransition(from: EntityPublishState, to: EntityPublishState): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) || false;
  }
}
```

---

## 7. Security & Compliance

### Credential Encryption

```typescript
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = process.env.INTEGRATIONS_ENCRYPTION_KEY;

  encryptValue(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decryptValue(encryptedValue: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Token Management

```typescript
class TokenManager {
  async refreshTokenIfNeeded(instanceId: string): Promise<string> {
    const credentials = await this.getCredentials(instanceId);
    
    // Check if token expires within 5 minutes
    if (this.isTokenExpiringSoon(credentials.expires_at)) {
      return await this.refreshToken(instanceId, credentials.refresh_token);
    }
    
    return decryptValue(credentials.access_token);
  }

  private async refreshToken(instanceId: string, refreshToken: string): Promise<string> {
    const integration = await this.getIntegrationInstance(instanceId);
    const provider = this.getProvider(integration.integration_id);
    
    try {
      const newTokens = await provider.refreshAccessToken(refreshToken);
      
      // Update credentials in datastore
      await apiClient.datastoreCreate({
        identifier: "integrations_credentials",
        action: "update",
        data: {
          record_id: `creds_${instanceId}`,
          credentials: {
            access_token: encryptValue(newTokens.access_token),
            refresh_token: encryptValue(newTokens.refresh_token),
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          },
          updated_at: new Date().toISOString()
        }
      });
      
      return newTokens.access_token;
    } catch (error) {
      await this.handleTokenRefreshFailure(instanceId, error);
      throw error;
    }
  }
}
```

### Webhook Security

```typescript
class WebhookVerifier {
  async verifyTeamTailorSignature(signature: string, payload: any, secret: string): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  async verifySalesforceSignature(signature: string, payload: any, secret: string): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  }
}
```

### RBAC Integration

```typescript
// Permission patterns for integration management
const INTEGRATION_PERMISSIONS = {
  'system.integrations.manage': 'Full integration system management',
  'system.integrations.view': 'View integration configurations',
  'app.integrations.configure': 'Configure app-specific integrations',
  'app.integrations.sync': 'Trigger sync operations',
  'app.integrations.logs': 'View sync logs and status',
  'app.entities.approve': 'Approve entities for publishing',
  'app.entities.publish': 'Publish approved entities to external services'
};

// Check permissions before integration operations
async function checkIntegrationPermission(userId: string, action: string, appId?: string): Promise<boolean> {
  const permissionContext = {
    userId,
    resource: 'integrations',
    action,
    appId: appId || 'system'
  };
  
  const result = await apiClient.checkPermission(permissionContext);
  return result.granted;
}
```

### Data Privacy

```typescript
class DataPrivacyManager {
  async sanitizeDataForSync(data: any, integrationId: string): Promise<any> {
    const integration = await this.getIntegrationConfig(integrationId);
    const privacyRules = integration.privacy_settings;
    
    // Remove or encrypt PII fields based on configuration
    const sanitized = { ...data };
    
    for (const field of privacyRules.pii_fields || []) {
      if (sanitized[field]) {
        if (privacyRules.encrypt_pii) {
          sanitized[field] = this.encryptPII(sanitized[field]);
        } else if (privacyRules.exclude_pii) {
          delete sanitized[field];
        }
      }
    }
    
    return sanitized;
  }
}
```

---

## 8. Extensibility Framework

### Provider Registration

```typescript
// 1. Create provider implementation
class LinkedInJobsIntegration extends BaseIntegration {
  async fetchOptions(): Promise<ExternalOptions> {
    // LinkedIn-specific options fetching
    const [companies, locations] = await Promise.all([
      this.fetchCompanies(),
      this.fetchLocations()
    ]);

    return { companies, locations };
  }

  async publishJob(roleData: RoleData, metadata: IntegrationMetadata): Promise<PublishResult> {
    // LinkedIn job posting logic
    const linkedInJob = this.transformToLinkedInJob(roleData, metadata);
    const response = await this.postToLinkedIn(linkedInJob);
    
    return {
      external_entity_id: response.id,
      external_entity_url: `https://linkedin.com/jobs/${response.id}`,
      response_data: response
    };
  }
}

// 2. Register provider in system
const integrationRegistry = {
  'teamtailor': TeamTailorIntegration,
  'linkedin': LinkedInJobsIntegration,
  'indeed': IndeedIntegration,
  'salesforce': SalesforceIntegration
};

// 3. Add to datastore registry
await apiClient.datastoreCreate({
  identifier: "integrations_registry",
  action: "create",
  data: {
    app_id: "integrations_registry",
    record_id: "integration_linkedin_jobs",
    integration_id: "linkedin_jobs",
    name: "LinkedIn Jobs",
    provider: "linkedin",
    type: "job_board",
    capabilities: ["outbound_sync", "draft_workflow"],
    created_at: new Date().toISOString(),
    created_by: "system"
  }
});
```

### File Structure

```
src/services/integrations/
├── core/
│   ├── IntegrationManager.ts         # Main orchestrator
│   ├── BaseIntegration.ts            # Abstract base class
│   ├── EntityIntegrationService.ts   # Entity workflow management
│   ├── WorkflowManager.ts            # State transitions
│   └── RetryManager.ts               # Retry handling
├── providers/
│   ├── teamtailor/
│   │   ├── TeamTailorIntegration.ts  # Provider implementation
│   │   ├── TeamTailorOptions.ts      # Options fetching
│   │   ├── TeamTailorPublisher.ts    # Job publishing
│   │   └── TeamTailorMapper.ts       # Data transformation
│   ├── linkedin/
│   │   ├── LinkedInIntegration.ts
│   │   ├── LinkedInAuth.ts
│   │   └── LinkedInPublisher.ts
│   ├── salesforce/
│   │   ├── SalesforceIntegration.ts
│   │   ├── SalesforceAuth.ts
│   │   ├── SalesforceWebhooks.ts
│   │   └── SalesforceMappers.ts
│   └── checkr/
│       ├── CheckrIntegration.ts
│       ├── CheckrAuth.ts
│       └── CheckrWebhooks.ts
├── adapters/
│   ├── DataMapper.ts                 # Generic data mapping
│   ├── FieldValidator.ts             # Data validation
│   └── FormatConverter.ts            # Format transformations
├── webhooks/
│   ├── WebhookVerifier.ts            # Signature verification
│   ├── WebhookRouter.ts              # Event routing
│   └── WebhookProcessor.ts           # Event processing
├── workflows/
│   ├── EntityPublishWorkflow.ts      # Workflow orchestration
│   ├── ApprovalService.ts            # Approval logic
│   └── StateManager.ts               # State persistence
└── utils/
    ├── RateLimiter.ts                # Rate limiting
    ├── EncryptionService.ts          # Credential encryption
    ├── TokenManager.ts               # OAuth token management
    └── LoggingService.ts             # Integration logging
```

### Multi-Provider Publishing

```typescript
class MultiProviderPublisher {
  async publishToMultipleProviders(
    entityId: string, 
    entityType: string,
    providers: string[]
  ): Promise<Record<string, PublishResult>> {
    const results: Record<string, PublishResult> = {};
    
    for (const provider of providers) {
      try {
        results[provider] = await this.publishToProvider(entityId, entityType, provider);
      } catch (error) {
        results[provider] = { 
          error: error.message, 
          status: 'failed',
          external_entity_id: null,
          external_entity_url: null,
          response_data: null
        };
      }
    }
    
    return results;
  }

  private async publishToProvider(
    entityId: string, 
    entityType: string,
    provider: string
  ): Promise<PublishResult> {
    const integrationService = new EntityIntegrationService();
    return await integrationService.publishEntity(entityId, entityType, 'system');
  }
}
```

---

## 9. Environment Configuration

### Core Environment Variables

```bash
# Integration System
NEXT_PUBLIC_INTEGRATIONS_ENABLED=true
NEXT_PUBLIC_INTEGRATIONS_WEBHOOK_BASE_URL=https://app.example.com/api/integrations/webhook
NEXT_PUBLIC_INTEGRATIONS_ENCRYPTION_KEY=your_encryption_key
NEXT_PUBLIC_INTEGRATIONS_MAX_RETRY_ATTEMPTS=5
NEXT_PUBLIC_INTEGRATIONS_RETRY_QUEUE_BATCH_SIZE=10

# Rate Limiting
NEXT_PUBLIC_INTEGRATIONS_DEFAULT_RATE_LIMIT=100
NEXT_PUBLIC_INTEGRATIONS_RATE_LIMIT_WINDOW=60000

# Security
NEXT_PUBLIC_INTEGRATIONS_WEBHOOK_TIMEOUT=30000
NEXT_PUBLIC_INTEGRATIONS_TOKEN_REFRESH_BUFFER=300000

# Workflow Configuration
NEXT_PUBLIC_INTEGRATIONS_REQUIRE_APPROVAL=true
NEXT_PUBLIC_INTEGRATIONS_AUTO_PUBLISH=false
NEXT_PUBLIC_INTEGRATIONS_CACHE_TTL=43200
```

### Provider-Specific Configuration

```bash
# TeamTailor
NEXT_PUBLIC_TEAMTAILOR_API_KEY=your_teamtailor_api_key
NEXT_PUBLIC_TEAMTAILOR_COMPANY_DOMAIN=company.teamtailor.com
NEXT_PUBLIC_TEAMTAILOR_WEBHOOK_SECRET=your_teamtailor_webhook_secret

# LinkedIn
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=https://app.example.com/auth/linkedin/callback

# Salesforce
NEXT_PUBLIC_SALESFORCE_CLIENT_ID=your_salesforce_client_id
NEXT_PUBLIC_SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
NEXT_PUBLIC_SALESFORCE_SANDBOX_MODE=false

# Checkr
NEXT_PUBLIC_CHECKR_API_KEY=your_checkr_api_key
NEXT_PUBLIC_CHECKR_WEBHOOK_SECRET=your_checkr_webhook_secret
```

### Feature Toggles

```typescript
interface IntegrationFeatureFlags {
  enableBulkSync: boolean;
  enableRealTimeSync: boolean;
  enableWebhooks: boolean;
  enableRetryQueue: boolean;
  enableEncryption: boolean;
  enableApprovalWorkflow: boolean;
  enableMultiProviderPublishing: boolean;
  maxConcurrentSyncs: number;
  syncBatchSize: number;
  optionsCacheTTL: number;
}

// Stored in datastore for runtime configuration
const featureFlags = await apiClient.getRecords("integrations_feature_flags");
```

---

## Summary

This comprehensive integrations system provides:

1. **Unified Architecture**: Single system supporting all integration types
2. **Draft-Approval-Publish Workflow**: Consistent workflow across all providers
3. **Datastore-First**: All state and configuration managed via existing infrastructure
4. **TeamTailor Reference**: Complete implementation example
5. **Security & Compliance**: Encryption, RBAC, audit logging, PII handling
6. **Extensibility**: Easy addition of new providers and entity types
7. **Reliability**: Retry mechanisms, error handling, webhook verification
8. **Scalability**: Caching, rate limiting, batch processing

The system scales from simple API key integrations like TeamTailor to complex OAuth workflows like Salesforce, while maintaining consistent patterns and user experience across all integrations.