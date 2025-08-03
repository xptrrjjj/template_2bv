# Webhook System

A comprehensive webhook receiving, verification, and processing system for handling inbound events from external integrations.

## Features

- **Multi-Provider Support**: Built-in support for TeamTailor, Salesforce, and Checkr
- **Signature Verification**: Secure webhook validation using HMAC signatures
- **Rate Limiting**: Sliding window rate limiting per provider
- **Event Processing**: Async/sync processing with retry capabilities
- **Event Storage**: Persistent storage with deduplication
- **Analytics**: Real-time webhook analytics and monitoring
- **Type Safety**: Full TypeScript support with strict typing
- **SOLID Principles**: Modular architecture following best practices

## Architecture

```
webhooks/
├── types/              # TypeScript type definitions
├── constants.ts        # System constants and configuration
├── services/           # Core services
│   ├── WebhookVerifier.ts    # Signature verification
│   ├── WebhookProcessor.ts   # Event orchestration
│   ├── WebhookRouter.ts      # Event routing
│   ├── WebhookStorage.ts     # Persistence layer
│   └── RateLimiter.ts        # Rate limiting
├── handlers/           # Provider-specific handlers
│   ├── teamtailor/
│   ├── salesforce/
│   └── checkr/
└── index.ts           # Public API

api/integrations/webhook/
└── [provider]/[event]/route.ts  # Next.js API routes
```

## Usage

### Webhook Endpoints

Webhooks are received at:
```
POST /api/integrations/webhook/{provider}/{event}
```

Example:
- TeamTailor: `/api/integrations/webhook/teamtailor/job.published`
- Salesforce: `/api/integrations/webhook/salesforce/contact.updated`
- Checkr: `/api/integrations/webhook/checkr/report.completed`

### Environment Variables

```env
# Webhook secrets (required)
WEBHOOK_SECRET_TEAMTAILOR=your-teamtailor-secret
WEBHOOK_SECRET_SALESFORCE=your-salesforce-secret
WEBHOOK_SECRET_CHECKR=your-checkr-secret

# Optional configuration
NODE_ENV=production  # Enforces HTTPS in production
```

### Using the Webhook System

```typescript
import { webhookSystem } from '@/services/integrations/webhooks';

// Process a webhook manually
const result = await webhookSystem.processEvent(
  'teamtailor',
  'job.published',
  payload,
  headers,
  signature,
  secret,
  { async: true, retryOnFailure: true }
);

// Get system statistics
const stats = await webhookSystem.getStatistics('teamtailor');

// Reprocess failed events
const { processed, failed } = await webhookSystem.reprocessFailedEvents();

// Clean up old events
const deleted = await webhookSystem.cleanup(30); // Keep 30 days
```

### Adding New Providers

1. Add provider constants:
```typescript
// constants.ts
export const WEBHOOK_PROVIDERS = {
  // ...existing providers
  NEWPROVIDER: "newprovider",
} as const;
```

2. Create handler functions:
```typescript
// handlers/newprovider/index.ts
export const handleEventType: WebhookHandler = async (event) => {
  // Process event
  return { success: true, message: "Processed" };
};
```

3. Register in webhook verifier:
```typescript
// services/WebhookVerifier.ts
this.providerConfigs.set(WEBHOOK_PROVIDERS.NEWPROVIDER, {
  provider: WEBHOOK_PROVIDERS.NEWPROVIDER,
  signatureHeader: "X-NewProvider-Signature",
  signatureAlgorithm: "hmac-sha256",
  verificationMethod: this.verifyHmacSha256,
  supportedEvents: ["event.type"],
});
```

## Security Features

- **HTTPS Enforcement**: Required in production
- **Signature Verification**: All webhooks must be signed
- **Rate Limiting**: 60 requests/minute, 1000 requests/hour per provider
- **Payload Size Limit**: 5MB maximum
- **Content Type Validation**: Must be application/json
- **Timing-Safe Comparison**: Prevents timing attacks
- **IP Allowlisting**: Optional IP-based filtering

## Event Processing

### Processing Flow

1. **Receive**: Webhook received at API endpoint
2. **Validate**: Security checks (HTTPS, content type, size)
3. **Verify**: Signature verification
4. **Rate Limit**: Check rate limits
5. **Deduplicate**: Check for duplicate events (5-minute window)
6. **Store**: Persist event to datastore
7. **Route**: Route to appropriate handler
8. **Process**: Execute handler with timeout (30s)
9. **Retry**: Retry failed events (max 3 attempts)

### Event States

- `pending`: Awaiting processing
- `processing`: Currently being processed
- `processed`: Successfully processed
- `failed`: Processing failed
- `invalid`: Invalid signature or format
- `duplicate`: Duplicate event (ignored)

## Monitoring

### Analytics

The system tracks:
- Total events per provider
- Success/failure rates
- Average processing time
- Last event timestamp

### Health Checks

```
GET /api/integrations/webhook/{provider}/{event}
```

Returns:
```json
{
  "status": "ok",
  "provider": "teamtailor",
  "event": "job.published",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

All errors are properly typed and include:
- Error type (authentication, rate limit, processing, etc.)
- Retryable flag
- Detailed error message
- Provider and event context

## Testing

### Manual Testing

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/integrations/webhook/teamtailor/job.published \
  -H "Content-Type: application/json" \
  -H "X-TeamTailor-Signature: your-signature" \
  -d '{"data": {"id": "123", "type": "job"}}'
```

### Signature Generation

```typescript
import { createHmac } from 'crypto';

const payload = JSON.stringify({ data: { id: "123" } });
const signature = createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
```

## Performance

- **Async Processing**: Non-blocking event processing
- **Connection Pooling**: Efficient database connections
- **Caching**: Rate limit states cached in memory
- **Batch Operations**: Bulk event processing support
- **Cleanup**: Automatic removal of old events

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check webhook secret and signature
2. **429 Rate Limited**: Wait for retry-after period
3. **413 Payload Too Large**: Reduce payload size
4. **500 Internal Error**: Check handler implementation

### Debug Mode

Enable debug logging:
```typescript
console.log('Webhook event:', event);
console.log('Verification result:', verificationResult);
console.log('Processing result:', result);
```

## Best Practices

1. **Always verify signatures** before processing
2. **Implement idempotency** to handle retries
3. **Process asynchronously** for better performance
4. **Monitor rate limits** to avoid throttling
5. **Clean up old events** regularly
6. **Log all webhook activity** for auditing
7. **Test with real payloads** from providers
8. **Handle all error cases** gracefully