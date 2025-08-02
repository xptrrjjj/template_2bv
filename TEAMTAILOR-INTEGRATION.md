# TeamTailor Integration Workflow

## 1. Integration Overview

### Purpose
This document outlines the Draft → Approval → Publish workflow for TeamTailor job posting integration, designed as a reference implementation for the extensible integrations system. The workflow ensures data validation and approval before external publishing while maintaining all state exclusively in the Datastore.

### Integration Flow
```
Role Creation → Dynamic Options Fetch → Draft State → Approval → Publish → Sync State Tracking
```

### Key Principles
- **Draft-First**: All roles start in draft state with external options pre-populated
- **Approval Gate**: Manual approval required before external publishing
- **Optional Sync**: Publishing to external service is user-triggered, not automatic
- **State Persistence**: All workflow states and metadata stored in Datastore
- **Platform Agnostic**: Architecture scales to other job posting platforms

## 2. Workflow States and Transitions

### Role Lifecycle States
```typescript
enum RolePublishState {
  DRAFT = 'draft',                    // Initial state, external options fetched
  PENDING_APPROVAL = 'pending_approval', // Submitted for review
  APPROVED = 'approved',              // Ready for publishing
  PUBLISHED = 'published',            // Successfully published to external service
  PUBLISH_FAILED = 'publish_failed',  // Publishing attempt failed
  UNPUBLISHED = 'unpublished'         // Removed from external service
}
```

### State Transition Matrix
```
DRAFT → PENDING_APPROVAL (on submit for approval)
PENDING_APPROVAL → APPROVED (on approval)
PENDING_APPROVAL → DRAFT (on rejection)
APPROVED → PUBLISHED (on successful publish)
APPROVED → PUBLISH_FAILED (on publish failure)
PUBLISHED → UNPUBLISHED (on removal)
PUBLISH_FAILED → APPROVED (on retry/fix)
```

### Workflow Actions
- **Submit for Approval**: DRAFT → PENDING_APPROVAL
- **Approve**: PENDING_APPROVAL → APPROVED  
- **Reject**: PENDING_APPROVAL → DRAFT
- **Publish**: APPROVED → PUBLISHED/PUBLISH_FAILED
- **Unpublish**: PUBLISHED → UNPUBLISHED
- **Retry Publish**: PUBLISH_FAILED → APPROVED

## 3. Datastore Schema Design

### Role Integration Metadata (`role_integration_metadata`)
```json
{
  "record_id": "role_integration_meta_role123",
  "app_id": "role_integration_metadata", 
  "role_id": "role_123",
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

### Role Publishing History (`role_publishing_history`)
```json
{
  "record_id": "role_publish_hist_20240120_100530",
  "app_id": "role_publishing_history",
  "role_id": "role_123",
  "integration_provider": "teamtailor",
  "action": "publish",
  "status": "success",
  "external_job_id": "teamtailor_job_98765",
  "external_job_url": "https://company.teamtailor.com/jobs/98765",
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
```json
{
  "record_id": "ext_options_teamtailor_20240120",
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

### Integration Sync State (`role_sync_state`)
```json
{
  "record_id": "role_sync_state_role123",
  "app_id": "role_sync_state",
  "role_id": "role_123",
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

## 4. API Interaction Design

### Datastore Operations

#### Create Role with Integration Setup
```typescript
// 1. Create role record in main roles table
const createRolePayload = {
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

// 2. Fetch external options from TeamTailor
const externalOptions = await fetchTeamTailorOptions();

// 3. Create integration metadata
const integrationMetaPayload = {
  identifier: "role_integration_metadata",
  action: "create",
  data: {
    app_id: "role_integration_metadata",
    record_id: `role_integration_meta_${roleId}`,
    role_id: roleId,
    integration_provider: "teamtailor",
    publish_state: "draft",
    external_options: externalOptions,
    field_mappings: getDefaultFieldMappings(),
    approval_workflow: {
      required_approvers: await getRequiredApprovers(roleId)
    },
    created_at: new Date().toISOString()
  }
};
```

#### Submit for Approval
```typescript
const submitForApprovalPayload = {
  identifier: "role_integration_metadata",
  action: "update",
  data: {
    record_id: `role_integration_meta_${roleId}`,
    publish_state: "pending_approval",
    approval_workflow: {
      submitted_at: new Date().toISOString(),
      submitted_by: "user_123"
    },
    updated_at: new Date().toISOString()
  }
};
```

#### Approve Role
```typescript
const approveRolePayload = {
  identifier: "role_integration_metadata",
  action: "update",
  data: {
    record_id: `role_integration_meta_${roleId}`,
    publish_state: "approved",
    approval_workflow: {
      approved_at: new Date().toISOString(),
      approved_by: "manager_user_456"
    },
    updated_at: new Date().toISOString()
  }
};
```

#### Log Publishing Attempt
```typescript
const logPublishPayload = {
  identifier: "role_publishing_history",
  action: "create",
  data: {
    app_id: "role_publishing_history",
    record_id: `role_publish_hist_${Date.now()}`,
    role_id: roleId,
    integration_provider: "teamtailor",
    action: "publish",
    status: "success", // or "failed"
    external_job_id: "teamtailor_job_98765",
    external_job_url: "https://company.teamtailor.com/jobs/98765",
    request_payload: publishPayload,
    response_data: teamTailorResponse,
    error_details: null,
    sync_duration_ms: 1250,
    triggered_by: "user_123",
    triggered_at: startTime.toISOString(),
    completed_at: new Date().toISOString()
  }
};
```

### TeamTailor API Interactions

#### Fetch Dynamic Options
```typescript
class TeamTailorOptionsService {
  async fetchAllOptions(): Promise<ExternalOptions> {
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
    const response = await fetch('https://api.teamtailor.com/v1/departments', {
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
    const response = await fetch('https://api.teamtailor.com/v1/locations', {
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
}
```

#### Publish Job to TeamTailor
```typescript
class TeamTailorPublishService {
  async publishJob(roleData: RoleData, integrationMeta: IntegrationMetadata): Promise<PublishResult> {
    const payload = this.transformRoleToTeamTailorJob(roleData, integrationMeta);
    
    const response = await fetch('https://api.teamtailor.com/v1/jobs', {
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
      external_job_id: result.data.id,
      external_job_url: `https://company.teamtailor.com/jobs/${result.data.id}`,
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

## 5. Service Layer Implementation

### Integration Service Location
```
src/services/integrations/
├── core/
│   ├── RoleIntegrationService.ts      # Main orchestrator
│   ├── WorkflowManager.ts             # State transitions
│   └── ApprovalService.ts             # Approval logic
├── providers/
│   └── teamtailor/
│       ├── TeamTailorIntegration.ts   # Main implementation
│       ├── TeamTailorOptions.ts       # Options fetching
│       ├── TeamTailorPublisher.ts     # Job publishing
│       └── TeamTailorMapper.ts        # Data transformation
└── workflows/
    ├── RolePublishWorkflow.ts         # Workflow orchestration
    └── StateManager.ts                # State persistence
```

### Role Integration Service
```typescript
class RoleIntegrationService {
  async createRoleWithIntegration(roleData: CreateRoleRequest, integrationProvider: string): Promise<RoleWithIntegration> {
    // 1. Create base role
    const role = await this.createRole(roleData);
    
    // 2. Fetch external options
    const provider = this.getProvider(integrationProvider);
    const externalOptions = await provider.fetchOptions();
    
    // 3. Cache external options
    await this.cacheExternalOptions(integrationProvider, externalOptions);
    
    // 4. Create integration metadata
    const integrationMeta = await this.createIntegrationMetadata(role.role_id, integrationProvider, externalOptions);
    
    return {
      role,
      integration_metadata: integrationMeta,
      external_options: externalOptions
    };
  }

  async submitForApproval(roleId: string, submittedBy: string): Promise<void> {
    await this.updatePublishState(roleId, 'pending_approval', {
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy
    });
    
    // Send notifications to approvers
    await this.notifyApprovers(roleId);
  }

  async approveRole(roleId: string, approvedBy: string): Promise<void> {
    await this.updatePublishState(roleId, 'approved', {
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    });
  }

  async publishRole(roleId: string, triggeredBy: string): Promise<PublishResult> {
    const startTime = new Date();
    
    try {
      // 1. Get role and integration metadata
      const [role, integrationMeta] = await Promise.all([
        this.getRole(roleId),
        this.getIntegrationMetadata(roleId)
      ]);

      // 2. Validate state
      if (integrationMeta.publish_state !== 'approved') {
        throw new Error('Role must be approved before publishing');
      }

      // 3. Publish to external service
      const provider = this.getProvider(integrationMeta.integration_provider);
      const publishResult = await provider.publishJob(role, integrationMeta);

      // 4. Update states
      await Promise.all([
        this.updatePublishState(roleId, 'published'),
        this.updateSyncState(roleId, publishResult),
        this.logPublishingHistory(roleId, 'publish', 'success', publishResult, startTime, triggeredBy)
      ]);

      return publishResult;
    } catch (error) {
      // Handle failure
      await Promise.all([
        this.updatePublishState(roleId, 'publish_failed'),
        this.logPublishingHistory(roleId, 'publish', 'failed', null, startTime, triggeredBy, error)
      ]);
      throw error;
    }
  }
}
```

### Workflow Manager
```typescript
class RolePublishWorkflowManager {
  async transitionState(roleId: string, fromState: RolePublishState, toState: RolePublishState, metadata: any = {}): Promise<void> {
    // Validate transition
    if (!this.isValidTransition(fromState, toState)) {
      throw new Error(`Invalid state transition: ${fromState} → ${toState}`);
    }

    // Update state in datastore
    await apiClient.datastoreCreate({
      identifier: "role_integration_metadata",
      action: "update",
      data: {
        record_id: `role_integration_meta_${roleId}`,
        publish_state: toState,
        ...metadata,
        updated_at: new Date().toISOString()
      }
    });

    // Log state transition
    await this.logStateTransition(roleId, fromState, toState, metadata);
  }

  private isValidTransition(from: RolePublishState, to: RolePublishState): boolean {
    const validTransitions: Record<RolePublishState, RolePublishState[]> = {
      [RolePublishState.DRAFT]: [RolePublishState.PENDING_APPROVAL],
      [RolePublishState.PENDING_APPROVAL]: [RolePublishState.APPROVED, RolePublishState.DRAFT],
      [RolePublishState.APPROVED]: [RolePublishState.PUBLISHED, RolePublishState.PUBLISH_FAILED],
      [RolePublishState.PUBLISHED]: [RolePublishState.UNPUBLISHED],
      [RolePublishState.PUBLISH_FAILED]: [RolePublishState.APPROVED],
      [RolePublishState.UNPUBLISHED]: [RolePublishState.APPROVED]
    };

    return validTransitions[from]?.includes(to) || false;
  }
}
```

## 6. UI Integration Points

### Role Creation Flow
1. **Role Form**: Standard role creation form
2. **Integration Selection**: Choose external service (TeamTailor)
3. **Options Loading**: Fetch and display external options dynamically
4. **Field Mapping**: Map internal fields to external service fields
5. **Save as Draft**: Store role and integration metadata

### Approval Interface
1. **Pending Approvals List**: Show roles awaiting approval
2. **Role Review**: Display role details with external mapping
3. **Approve/Reject**: State transition actions
4. **Approval History**: Track approval workflow

### Publishing Dashboard
1. **Approved Roles**: List roles ready for publishing
2. **Publish Action**: Trigger external publishing
3. **Publishing Status**: Real-time status updates
4. **Sync History**: View publishing attempts and results

## 7. Extensibility Notes

### Adding New Providers
```typescript
// 1. Create provider implementation
class LinkedInIntegration extends BaseIntegration {
  async fetchOptions(): Promise<ExternalOptions> {
    // LinkedIn-specific options fetching
  }

  async publishJob(roleData: RoleData, metadata: IntegrationMetadata): Promise<PublishResult> {
    // LinkedIn job posting logic
  }
}

// 2. Register provider
const integrationRegistry = {
  'teamtailor': TeamTailorIntegration,
  'linkedin': LinkedInIntegration,
  'indeed': IndeedIntegration
};

// 3. Add to datastore registry
await apiClient.datastoreCreate({
  identifier: "integrations_registry",
  action: "create",
  data: {
    integration_id: "linkedin_jobs",
    name: "LinkedIn Jobs",
    provider: "linkedin",
    type: "job_board",
    capabilities: ["outbound_sync"]
  }
});
```

### Workflow Customization
```typescript
// Custom approval workflows per provider
interface ApprovalWorkflow {
  required_approvers: string[];
  approval_levels: number;
  auto_approve_conditions?: ApprovalCondition[];
  escalation_rules?: EscalationRule[];
}

// Provider-specific field mappings
interface FieldMappingTemplate {
  provider: string;
  default_mappings: Record<string, string>;
  required_fields: string[];
  optional_fields: string[];
  custom_fields: CustomFieldDefinition[];
}
```

### Multi-Provider Publishing
```typescript
class MultiProviderPublisher {
  async publishToMultipleProviders(roleId: string, providers: string[]): Promise<Record<string, PublishResult>> {
    const results: Record<string, PublishResult> = {};
    
    for (const provider of providers) {
      try {
        results[provider] = await this.publishToProvider(roleId, provider);
      } catch (error) {
        results[provider] = { error: error.message, status: 'failed' };
      }
    }
    
    return results;
  }
}
```

This architecture provides a solid foundation for role publishing workflows that can be extended to any job board or recruitment platform while maintaining consistent state management and approval processes through the Datastore.