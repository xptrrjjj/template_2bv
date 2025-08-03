import { NextRequest, NextResponse } from "next/server";
import { WebhookProcessor } from "@/services/integrations/webhooks/services/WebhookProcessor";
import { WebhookRouter } from "@/services/integrations/webhooks/services/WebhookRouter";
import { teamTailorHandlers } from "@/services/integrations/webhooks/handlers/teamtailor";
import { salesforceHandlers } from "@/services/integrations/webhooks/handlers/salesforce";
import { checkrHandlers } from "@/services/integrations/webhooks/handlers/checkr";
import {
  WEBHOOK_PROVIDERS,
  WEBHOOK_HEADERS,
  WEBHOOK_ERROR_MESSAGES,
  WEBHOOK_STATUS_CODES,
  DEFAULT_SECURITY_CONFIG,
} from "@/services/integrations/webhooks/constants";

// Initialize webhook processor and router
const router = new WebhookRouter();
const processor = new WebhookProcessor(undefined, router);

// Register all handlers
const allHandlers = {
  [WEBHOOK_PROVIDERS.TEAMTAILOR]: teamTailorHandlers,
  [WEBHOOK_PROVIDERS.SALESFORCE]: salesforceHandlers,
  [WEBHOOK_PROVIDERS.CHECKR]: checkrHandlers,
};

Object.entries(allHandlers).forEach(([provider, handlers]) => {
  Object.entries(handlers).forEach(([eventType, handler]) => {
    const handlerKey = `${provider}:${eventType}`;
    router.registerHandler(handlerKey, handler);
    router.registerEventMapping({
      provider,
      externalEvent: eventType,
      internalEvent: eventType,
      handler: handlerKey,
    });
  });
});

/**
 * POST /api/integrations/webhook/[provider]/[event]
 * Handle incoming webhook events
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; event: string }> }
) {
  try {
    const { provider, event } = await params;

    // Validate HTTPS in production
    if (
      DEFAULT_SECURITY_CONFIG.requireHttps &&
      process.env.NODE_ENV === "production" &&
      request.headers.get("x-forwarded-proto") !== "https"
    ) {
      return NextResponse.json(
        { error: WEBHOOK_ERROR_MESSAGES.HTTPS_REQUIRED },
        { status: WEBHOOK_STATUS_CODES.FORBIDDEN }
      );
    }

    // Validate content type
    const contentType = request.headers.get(WEBHOOK_HEADERS.CONTENT_TYPE);
    if (
      DEFAULT_SECURITY_CONFIG.validateContentType &&
      !contentType?.includes("application/json")
    ) {
      return NextResponse.json(
        { error: WEBHOOK_ERROR_MESSAGES.INVALID_CONTENT_TYPE },
        { status: WEBHOOK_STATUS_CODES.BAD_REQUEST }
      );
    }

    // Get request body
    const bodyText = await request.text();
    
    // Check payload size
    if (bodyText.length > DEFAULT_SECURITY_CONFIG.maxPayloadSize) {
      return NextResponse.json(
        { error: WEBHOOK_ERROR_MESSAGES.PAYLOAD_TOO_LARGE },
        { status: WEBHOOK_STATUS_CODES.PAYLOAD_TOO_LARGE }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: WEBHOOK_STATUS_CODES.BAD_REQUEST }
      );
    }

    // Get signature header based on provider
    let signatureHeader: string;
    switch (provider) {
      case WEBHOOK_PROVIDERS.TEAMTAILOR:
        signatureHeader = WEBHOOK_HEADERS.TEAMTAILOR_SIGNATURE;
        break;
      case WEBHOOK_PROVIDERS.SALESFORCE:
        signatureHeader = WEBHOOK_HEADERS.SALESFORCE_SIGNATURE;
        break;
      case WEBHOOK_PROVIDERS.CHECKR:
        signatureHeader = WEBHOOK_HEADERS.CHECKR_SIGNATURE;
        break;
      default:
        return NextResponse.json(
          { error: WEBHOOK_ERROR_MESSAGES.PROVIDER_NOT_FOUND },
          { status: WEBHOOK_STATUS_CODES.NOT_FOUND }
        );
    }

    const signature = request.headers.get(signatureHeader);
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: WEBHOOK_STATUS_CODES.UNAUTHORIZED }
      );
    }

    // Get webhook secret from environment
    const secretKey = `WEBHOOK_SECRET_${provider.toUpperCase()}`;
    const secret = process.env[secretKey];
    if (!secret) {
      console.error(`Missing webhook secret for provider: ${provider}`);
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: WEBHOOK_STATUS_CODES.INTERNAL_ERROR }
      );
    }

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Process webhook
    const result = await processor.processWebhookEvent(
      provider,
      event,
      payload,
      headers,
      signature,
      secret,
      { async: true, retryOnFailure: true }
    );

    return NextResponse.json(result.body, { status: result.statusCode });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : WEBHOOK_ERROR_MESSAGES.PROCESSING_FAILED,
      },
      { status: WEBHOOK_STATUS_CODES.INTERNAL_ERROR }
    );
  }
}

/**
 * GET /api/integrations/webhook/[provider]/[event]
 * Health check endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; event: string }> }
) {
  const { provider, event } = await params;
  return NextResponse.json({
    status: "ok",
    provider,
    event,
    timestamp: new Date().toISOString(),
  });
}