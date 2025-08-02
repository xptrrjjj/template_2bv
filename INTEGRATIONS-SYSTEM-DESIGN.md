# Integrations System Design

## 1. Purpose and Scope

### Overview

The Integrations System enables the platform to connect with and synchronize data to/from third-party services through APIs and webhooks. All configuration, credentials, and runtime state are managed exclusively via the existing Datastore infrastructure using Bearer-authenticated API calls.

### Capabilities

- **CRM Integration**: Sync candidate data with Salesforce, HubSpot, Pipedrive
- **Email Platforms**: Connect with Mailchimp, SendGrid, Constant Contact
- **Job Boards**: Post positions to Indeed, LinkedIn, Glassdoor
- **Background Check Services**: Integrate with Checkr, Sterling, HireRight
- **Assessment Tools**: Connect with Codility, HackerRank, TestGorilla
- **Communication Tools**: Slack notifications, Microsoft Teams updates

### Use Cases

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

#### Bidirectional Sync

- Keep candidate data synchronized between platform and CRM
- Maintain job posting status across multiple job boards
- Synchronize interview scheduling with calendar systems

## 2. Data Model (Datastore Storage)

### Integration Definitions (`integrations_registry`)

```json
{
  "record_id": "integration_salesforce_crm",
  "app_id": "integrations_registry",
  "integration_id": "salesforce_crm",
  "name": "Salesforce CRM",
  "provider": "salesforce",
  "type": "crm",
  "version": "v1.0",
  "auth_method": "oauth2",
  "status": "active",
  "capabilities": ["outbound_sync", "inbound_webhook", "bidirectional_sync"],
  "endpoints": {
    "base_url": "https://api.salesforce.com",
    "auth_url": "https://login.salesforce.com/services/oauth2/authorize",
    "token_url": "https://login.salesforce.com/services/oauth2/token",
    "webhook_url": "/integrations/webhook/salesforce"
  },
  "rate_limits": {
    "requests_per_minute": 100,
    "requests_per_day": 10000
  },
  "created_at": "2024-01-15T10:00:00Z",
  "created_by": "system",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Integration Instances (`integrations_instances`)

```json
{
  "record_id": "instance_salesforce_main",
  "app_id": "integrations_instances",
  "instance_id": "salesforce_main",
  "integration_id": "salesforce_crm",
  "name": "Main Salesforce Instance",
  "status": "active",
  "configuration": {
    "sandbox_mode": false,
    "sync_frequency": "real_time",
    "field_mappings": {
      "candidate.name": "Contact.Name",
      "candidate.email": "Contact.Email",
      "candidate.position": "Contact.Job_Title__c"
    },
    "filters": {
      "sync_only_active": true,
      "exclude_test_data": true
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "admin_user_123",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

### Credential Storage (`integrations_credentials`)

```json
{
  "record_id": "creds_salesforce_main",
  "app_id": "integrations_credentials",
  "instance_id": "salesforce_main",
  "auth_method": "oauth2",
  "credentials": {
    "access_token": "encrypted_access_token",
    "refresh_token": "encrypted_refresh_token",
    "token_type": "Bearer",
    "expires_at": "2024-01-22T10:30:00Z",
    "scope": "api refresh_token"
  },
  "api_keys": {
    "client_id": "encrypted_client_id",
    "client_secret": "encrypted_client_secret"
  },
  "webhook_secrets": {
    "verification_token": "encrypted_webhook_secret"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:15:00Z",
  "expires_at": "2024-01-22T10:30:00Z"
}
```

### Webhook Configurations (`integrations_webhooks`)

```json
{
  "record_id": "webhook_salesforce_main",
  "app_id": "integrations_webhooks",
  "webhook_id": "webhook_salesforce_contact_update",
  "instance_id": "salesforce_main",
  "event_type": "contact.updated",
  "endpoint_url": "/api/integrations/webhook/salesforce/contact-update",
  "verification_method": "signature",
  "verification_secret": "encrypted_secret",
  "status": "active",
  "retry_config": {
    "max_attempts": 3,
    "backoff_strategy": "exponential",
    "timeout_seconds": 30
  },
  "headers": {
    "Content-Type": "application/json",
    "X-Integration-Source": "salesforce"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Sync State and Logs (`integrations_sync_logs`)

```json
{
  "record_id": "sync_log_20240120_143022",
  "app_id": "integrations_sync_logs",
  "sync_id": "sync_20240120_143022",
  "instance_id": "salesforce_main",
  "sync_type": "outbound",
  "operation": "candidate_create",
  "status": "completed",
  "started_at": "2024-01-20T14:30:22Z",
  "completed_at": "2024-01-20T14:30:45Z",
  "records_processed": 15,
  "records_successful": 14,
  "records_failed": 1,
  "errors": [
    {
      "record_id": "candidate_789",
      "error_code": "INVALID_EMAIL",
      "error_message": "Email format is invalid",
      "retry_count": 2
    }
  ],
  "metadata": {
    "api_calls_made": 16,
    "rate_limit_remaining": 984,
    "response_time_avg_ms": 245
  }
}
```

### Retry Queue (`integrations_retry_queue`)

```json
{
  "record_id": "retry_queue_item_456",
  "app_id": "integrations_retry_queue",
  "queue_item_id": "retry_456",
  "instance_id": "salesforce_main",
  "operation": "candidate_update",
  "payload": {
    "candidate_id": "candidate_789",
    "data": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "status": "interviewed"
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

## 3. API Interaction Design

### Integration Management API

#### Create Integration Instance

```typescript
// POST via apiClient.datastoreCreate()
const createIntegrationPayload = {
  identifier: "integrations_instances",
  action: "create",
  data: {
    app_id: "integrations_instances",
    record_id: `instance_${integration_id}_${Date.now()}`,
    instance_id: `${integration_id}_${randomId}`,
    integration_id: "salesforce_crm",
    name: "Main Salesforce Instance",
    status: "pending_auth",
    configuration: {
      sandbox_mode: false,
      sync_frequency: "real_time",
      field_mappings: {...},
      filters: {...}
    },
    created_at: new Date().toISOString(),
    created_by: currentUser.microsoft_oid
  }
};
```

#### Update Integration Configuration

```typescript
// POST via apiClient.datastoreCreate()
const updateConfigPayload = {
  identifier: "integrations_instances",
  action: "update",
  data: {
    record_id: "instance_salesforce_main",
    configuration: {
      sync_frequency: "hourly",
      field_mappings: {
        "candidate.phone": "Contact.Phone",
      },
    },
    updated_at: new Date().toISOString(),
  },
};
```

#### Store Credentials (OAuth)

```typescript
// POST via apiClient.datastoreCreate()
const storeCredentialsPayload = {
  identifier: "integrations_credentials",
  action: "create",
  data: {
    app_id: "integrations_credentials",
    record_id: `creds_${instance_id}`,
    instance_id: "salesforce_main",
    auth_method: "oauth2",
    credentials: {
      access_token: encryptToken(accessToken),
      refresh_token: encryptToken(refreshToken),
      token_type: "Bearer",
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      scope: "api refresh_token",
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
};
```

#### Retrieve Active Integrations

```typescript
// POST via apiClient.datastoreRetrieve()
const getActiveIntegrationsPayload = {
  identifier: "integrations_instances",
  filters: {
    status: "active",
  },
};
```

#### Log Sync Operation

```typescript
// POST via apiClient.datastoreCreate()
const logSyncPayload = {
  identifier: "integrations_sync_logs",
  action: "create",
  data: {
    app_id: "integrations_sync_logs",
    record_id: `sync_log_${Date.now()}`,
    sync_id: `sync_${Date.now()}`,
    instance_id: "salesforce_main",
    sync_type: "outbound",
    operation: "candidate_create",
    status: "completed",
    started_at: startTime.toISOString(),
    completed_at: new Date().toISOString(),
    records_processed: 15,
    records_successful: 14,
    records_failed: 1,
    errors: [...],
    metadata: {...}
  }
};
```

### Credentials Management API

#### Refresh OAuth Token

```typescript
// POST via apiClient.datastoreCreate()
const refreshTokenPayload = {
  identifier: "integrations_credentials",
  action: "update",
  data: {
    record_id: "creds_salesforce_main",
    credentials: {
      access_token: encryptToken(newAccessToken),
      refresh_token: encryptToken(newRefreshToken),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    },
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
};
```

#### Delete Integration (Cascade)

```typescript
// Multiple datastore operations to clean up all related data
const deleteOperations = [
  {
    identifier: "integrations_instances",
    action: "delete",
    data: { record_id: "instance_salesforce_main" },
  },
  {
    identifier: "integrations_credentials",
    action: "delete",
    data: { record_id: "creds_salesforce_main" },
  },
  {
    identifier: "integrations_webhooks",
    action: "delete_all",
    data: { instance_id: "salesforce_main" },
  },
];
```

## 4. Trigger/Event Handling

### Webhook Endpoint Architecture

#### Incoming Webhook Handler (`/api/integrations/webhook/[provider]/[event]`)

```typescript
// Next.js API route: /api/integrations/webhook/salesforce/contact-update
export async function POST(request: Request) {
  const { provider, event } = params;
  const payload = await request.json();
  const signature = request.headers.get("X-Salesforce-Signature");

  // 1. Verify webhook authenticity
  const isValid = await verifyWebhookSignature(provider, signature, payload);
  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
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
      received_at: new Date().toISOString(),
    },
  };

  await apiClient.datastoreCreate(webhookEvent);

  // 3. Process webhook (async)
  processWebhookEvent(provider, event, payload);

  return Response.json({ status: "received" });
}
```

#### Webhook Event Processing

```typescript
async function processWebhookEvent(provider: string, eventType: string, payload: any) {
  // 1. Find matching webhook configuration
  const webhookConfig = await apiClient.getRecords("integrations_webhooks", {
    provider,
    event_type: eventType,
    status: "active",
  });

  if (!webhookConfig.data?.length) {
    await logWebhookError("No active webhook config found", provider, eventType);
    return;
  }

  // 2. Get integration instance and credentials
  const instanceId = webhookConfig.data[0].instance_id;
  const [instance, credentials] = await Promise.all([
    apiClient.getRecords("integrations_instances", { instance_id: instanceId }),
    apiClient.getRecords("integrations_credentials", { instance_id: instanceId }),
  ]);

  // 3. Process the webhook based on event type
  const processor = getWebhookProcessor(provider, eventType);
  await processor.process(payload, instance.data[0], credentials.data[0]);
}
```

### Event Routing

#### Event Type Mapping

```typescript
const WEBHOOK_EVENT_HANDLERS = {
  salesforce: {
    "contact.updated": SalesforceContactUpdateHandler,
    "opportunity.created": SalesforceOpportunityCreateHandler,
    "lead.converted": SalesforceLeadConvertHandler,
  },
  checkr: {
    "report.completed": CheckrReportCompletedHandler,
    "report.disputed": CheckrReportDisputedHandler,
  },
  mailchimp: {
    "list.member.updated": MailchimpMemberUpdateHandler,
    "campaign.sent": MailchimpCampaignSentHandler,
  },
};
```

#### Webhook Verification

```typescript
async function verifyWebhookSignature(
  provider: string,
  signature: string,
  payload: any
): Promise<boolean> {
  // Get webhook secret from credentials
  const webhookConfig = await apiClient.getRecords("integrations_webhooks", {
    provider,
    status: "active",
  });

  const secret = decryptValue(webhookConfig.data[0].verification_secret);

  switch (provider) {
    case "salesforce":
      return verifySalesforceSignature(signature, payload, secret);
    case "checkr":
      return verifyCheckrSignature(signature, payload, secret);
    default:
      return verifyGenericHMACSignature(signature, payload, secret);
  }
}
```

## 5. Execution Model

### Sync Execution Strategies

#### Real-time Sync (Event-driven)

- Triggered by platform events (candidate created, status updated)
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

### Sync Orchestration Flow

```typescript
class IntegrationSyncOrchestrator {
  async executeSyncOperation(instanceId: string, operation: SyncOperation) {
    // 1. Pre-sync validation
    const [instance, credentials] = await this.validateSyncPrerequisites(instanceId);

    // 2. Create sync log entry
    const syncLog = await this.createSyncLog(instanceId, operation);

    // 3. Execute sync operation
    try {
      const result = await this.performSync(instance, credentials, operation);
      await this.updateSyncLog(syncLog.sync_id, "completed", result);
    } catch (error) {
      await this.handleSyncFailure(syncLog.sync_id, error, operation);
    }
  }

  private async handleSyncFailure(syncId: string, error: Error, operation: SyncOperation) {
    // 1. Update sync log with failure
    await this.updateSyncLog(syncId, "failed", { error: error.message });

    // 2. Add to retry queue if retryable
    if (this.isRetryableError(error)) {
      await this.addToRetryQueue(operation);
    }

    // 3. Send notifications if critical
    if (this.isCriticalFailure(error)) {
      await this.sendFailureNotification(operation, error);
    }
  }
}
```

### Retry Mechanism

#### Exponential Backoff Strategy

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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: Error): boolean {
    return (
      error.message.includes("rate limit") ||
      error.message.includes("timeout") ||
      error.message.includes("network")
    );
  }
}
```

#### Retry Queue Processing

```typescript
class RetryQueueProcessor {
  async processRetryQueue() {
    // Get pending retry items
    const retryItems = await apiClient.getRecords("integrations_retry_queue", {
      status: "pending",
      next_retry_at: { $lte: new Date().toISOString() },
    });

    for (const item of retryItems.data || []) {
      await this.processRetryItem(item);
    }
  }

  private async processRetryItem(item: any) {
    try {
      // Execute the retry operation
      await this.executeRetryOperation(item);

      // Remove from retry queue on success
      await apiClient.datastoreCreate({
        identifier: "integrations_retry_queue",
        action: "delete",
        data: { record_id: item.record_id },
      });
    } catch (error) {
      // Update retry item with new attempt
      await this.updateRetryItem(item, error);
    }
  }
}
```

## 6. Extensibility and Environment

### Integration Registry System

#### Registering New Integrations

```typescript
// Add to integrations registry via datastore
const registerIntegration = async (integrationDef: IntegrationDefinition) => {
  await apiClient.datastoreCreate({
    identifier: "integrations_registry",
    action: "create",
    data: {
      app_id: "integrations_registry",
      record_id: `integration_${integrationDef.integration_id}`,
      ...integrationDef,
      created_at: new Date().toISOString(),
      created_by: "system",
    },
  });
};
```

#### File Structure for Integration Modules

```
src/services/integrations/
├── core/
│   ├── IntegrationManager.ts         # Main orchestrator
│   ├── BaseIntegration.ts            # Abstract base class
│   ├── SyncOrchestrator.ts           # Sync execution logic
│   └── RetryManager.ts               # Retry handling
├── providers/
│   ├── salesforce/
│   │   ├── SalesforceIntegration.ts  # Provider implementation
│   │   ├── SalesforceAuth.ts         # OAuth handling
│   │   ├── SalesforceWebhooks.ts     # Webhook handlers
│   │   └── SalesforceMappers.ts      # Data transformation
│   ├── checkr/
│   │   ├── CheckrIntegration.ts
│   │   ├── CheckrAuth.ts
│   │   └── CheckrWebhooks.ts
│   └── mailchimp/
│       ├── MailchimpIntegration.ts
│       ├── MailchimpAuth.ts
│       └── MailchimpWebhooks.ts
├── adapters/
│   ├── DataMapper.ts                 # Generic data mapping
│   ├── FieldValidator.ts             # Data validation
│   └── FormatConverter.ts            # Format transformations
├── webhooks/
│   ├── WebhookVerifier.ts            # Signature verification
│   ├── WebhookRouter.ts              # Event routing
│   └── WebhookProcessor.ts           # Event processing
└── utils/
    ├── RateLimiter.ts                # Rate limiting
    ├── EncryptionService.ts          # Credential encryption
    └── LoggingService.ts             # Integration logging
```

### Environment Configuration

#### Core Environment Variables

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
```

#### Provider-Specific Configuration

```bash
# Salesforce
NEXT_PUBLIC_SALESFORCE_CLIENT_ID=your_salesforce_client_id
NEXT_PUBLIC_SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
NEXT_PUBLIC_SALESFORCE_SANDBOX_MODE=false

# Checkr
NEXT_PUBLIC_CHECKR_API_KEY=your_checkr_api_key
NEXT_PUBLIC_CHECKR_WEBHOOK_SECRET=your_checkr_webhook_secret

# Mailchimp
NEXT_PUBLIC_MAILCHIMP_CLIENT_ID=your_mailchimp_client_id
NEXT_PUBLIC_MAILCHIMP_CLIENT_SECRET=your_mailchimp_client_secret
```

### Feature Toggles and Flags

```typescript
interface IntegrationFeatureFlags {
  enableBulkSync: boolean;
  enableRealTimeSync: boolean;
  enableWebhooks: boolean;
  enableRetryQueue: boolean;
  enableEncryption: boolean;
  maxConcurrentSyncs: number;
  syncBatchSize: number;
}

// Stored in datastore for runtime configuration
const featureFlags = await apiClient.getRecords("integrations_feature_flags");
```

## 7. Security Considerations

### Token Management

#### OAuth Token Lifecycle

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
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
      });

      return newTokens.access_token;
    } catch (error) {
      await this.handleTokenRefreshFailure(instanceId, error);
      throw error;
    }
  }
}
```

#### Credential Encryption

```typescript
class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key = process.env.INTEGRATIONS_ENCRYPTION_KEY;

  encryptValue(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  decryptValue(encryptedValue: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedValue.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

### Webhook Security

#### Signature Verification

```typescript
class WebhookVerifier {
  async verifySalesforceSignature(
    signature: string,
    payload: any,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  }

  async verifyCheckrSignature(signature: string, payload: any, secret: string): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac("sha1", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return signature === `sha1=${expectedSignature}`;
  }
}
```

#### Request Rate Limiting

```typescript
class WebhookRateLimiter {
  private attempts = new Map<string, number[]>();

  async isAllowed(provider: string, ipAddress: string): Promise<boolean> {
    const key = `${provider}:${ipAddress}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    const requests = this.attempts.get(key) || [];
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.attempts.set(key, validRequests);

    return true;
  }
}
```

### RBAC Integration

#### Integration Permissions

```typescript
// Permission patterns for integration management
const INTEGRATION_PERMISSIONS = {
  "system.integrations.manage": "Full integration system management",
  "system.integrations.view": "View integration configurations",
  "app.integrations.configure": "Configure app-specific integrations",
  "app.integrations.sync": "Trigger sync operations",
  "app.integrations.logs": "View sync logs and status",
};

// Check permissions before integration operations
async function checkIntegrationPermission(
  userId: string,
  action: string,
  appId?: string
): Promise<boolean> {
  const permissionContext = {
    userId,
    resource: "integrations",
    action,
    appId: appId || "system",
  };

  const result = await apiClient.checkPermission(permissionContext);
  return result.granted;
}
```

#### Audit Logging

```typescript
// Log all integration activities for compliance
async function logIntegrationActivity(activity: IntegrationAuditLog) {
  await apiClient.createAuditLog({
    actor_id: activity.userId,
    action: activity.action,
    resource_type: "integration",
    resource_id: activity.integrationId,
    details: {
      integration_type: activity.integrationType,
      operation: activity.operation,
      result: activity.result,
      error_message: activity.error,
    },
    ip_address: activity.ipAddress,
    user_agent: activity.userAgent,
  });
}
```

### Data Privacy and Compliance

#### PII Data Handling

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

This design provides a comprehensive, secure, and extensible integrations system that leverages the existing Datastore infrastructure while maintaining proper separation of concerns and security best practices.
