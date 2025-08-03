import { createHmac, timingSafeEqual } from "crypto";
import {
  WebhookVerificationResult,
  ProviderWebhookConfig,
} from "../types";
import {
  WEBHOOK_PROVIDERS,
  WEBHOOK_HEADERS,
  WEBHOOK_ERROR_MESSAGES,
} from "../constants";

/**
 * Webhook Verifier Service
 * Handles signature verification for different webhook providers
 */
export class WebhookVerifier {
  private readonly providerConfigs: Map<string, ProviderWebhookConfig>;

  constructor() {
    this.providerConfigs = new Map();
    this.initializeProviderConfigs();
  }

  /**
   * Initialize provider-specific webhook configurations
   */
  private initializeProviderConfigs(): void {
    // TeamTailor configuration
    this.providerConfigs.set(WEBHOOK_PROVIDERS.TEAMTAILOR, {
      provider: WEBHOOK_PROVIDERS.TEAMTAILOR,
      signatureHeader: WEBHOOK_HEADERS.TEAMTAILOR_SIGNATURE,
      signatureAlgorithm: "hmac-sha256",
      verificationMethod: this.verifyHmacSha256,
      supportedEvents: ["job.application_created", "job.published", "job.archived", "candidate.stage_changed"],
    });

    // Salesforce configuration
    this.providerConfigs.set(WEBHOOK_PROVIDERS.SALESFORCE, {
      provider: WEBHOOK_PROVIDERS.SALESFORCE,
      signatureHeader: WEBHOOK_HEADERS.SALESFORCE_SIGNATURE,
      signatureAlgorithm: "hmac-sha256",
      verificationMethod: this.verifyHmacSha256,
      supportedEvents: ["contact.updated", "opportunity.created", "lead.converted"],
    });

    // Checkr configuration
    this.providerConfigs.set(WEBHOOK_PROVIDERS.CHECKR, {
      provider: WEBHOOK_PROVIDERS.CHECKR,
      signatureHeader: WEBHOOK_HEADERS.CHECKR_SIGNATURE,
      signatureAlgorithm: "hmac-sha1",
      verificationMethod: this.verifyHmacSha1,
      supportedEvents: ["report.completed", "report.disputed"],
    });
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(
    provider: string,
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<WebhookVerificationResult> {
    try {
      const config = this.providerConfigs.get(provider);
      
      if (!config) {
        return {
          isValid: false,
          provider,
          error: WEBHOOK_ERROR_MESSAGES.PROVIDER_NOT_FOUND,
        };
      }

      const isValid = config.verificationMethod(payload, signature, secret);

      return {
        isValid,
        provider,
        error: isValid ? undefined : WEBHOOK_ERROR_MESSAGES.INVALID_SIGNATURE,
      };
    } catch (error) {
      return {
        isValid: false,
        provider,
        error: error instanceof Error ? error.message : WEBHOOK_ERROR_MESSAGES.INVALID_SIGNATURE,
      };
    }
  }

  /**
   * Verify TeamTailor webhook signature
   */
  async verifyTeamTailorSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const result = await this.verifyWebhook(
      WEBHOOK_PROVIDERS.TEAMTAILOR,
      payload,
      signature,
      secret
    );
    return result.isValid;
  }

  /**
   * Verify Salesforce webhook signature
   */
  async verifySalesforceSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const result = await this.verifyWebhook(
      WEBHOOK_PROVIDERS.SALESFORCE,
      payload,
      signature,
      secret
    );
    return result.isValid;
  }

  /**
   * Verify Checkr webhook signature
   */
  async verifyCheckrSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const result = await this.verifyWebhook(
      WEBHOOK_PROVIDERS.CHECKR,
      payload,
      signature,
      secret
    );
    return result.isValid;
  }

  /**
   * Verify HMAC SHA-256 signature
   */
  private verifyHmacSha256(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify HMAC SHA-1 signature
   */
  private verifyHmacSha1(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    const hmac = createHmac("sha1", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: string): ProviderWebhookConfig | undefined {
    return this.providerConfigs.get(provider);
  }

  /**
   * Check if event is supported by provider
   */
  isEventSupported(provider: string, eventType: string): boolean {
    const config = this.providerConfigs.get(provider);
    return config ? config.supportedEvents.includes(eventType) : false;
  }

  /**
   * Get signature header for provider
   */
  getSignatureHeader(provider: string): string | undefined {
    const config = this.providerConfigs.get(provider);
    return config?.signatureHeader;
  }
}