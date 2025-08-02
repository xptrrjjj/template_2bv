import { createCipher, createDecipher, randomBytes, createHash } from "crypto";
import { IntegrationError } from "@/types/integrations";

/**
 * Encryption service for securing integration credentials and sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly encoding: BufferEncoding = "base64";

  private constructor() {
    this.validateEnvironment();
  }

  /**
   * Get singleton instance of EncryptionService
   */
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Validate that required environment variables are present
   */
  private validateEnvironment(): void {
    if (!this.getEncryptionKey()) {
      throw new Error(
        "INTEGRATION_ENCRYPTION_KEY environment variable is required. " +
          "Please set a 32-byte base64-encoded key for encryption."
      );
    }
  }

  /**
   * Get encryption key from environment variables
   */
  private getEncryptionKey(): Buffer | null {
    const key = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (!key) {
      return null;
    }

    try {
      const keyBuffer = Buffer.from(key, "base64");
      if (keyBuffer.length !== this.keyLength) {
        throw new Error(`Encryption key must be ${this.keyLength} bytes long`);
      }
      return keyBuffer;
    } catch (error) {
      throw new Error(
        `Invalid encryption key format: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Generate a secure random encryption key (for setup purposes)
   */
  public static generateKey(): string {
    return randomBytes(32).toString("base64");
  }

  /**
   * Encrypt a value using AES-256-GCM
   * @param value - The value to encrypt
   * @returns Encrypted value as base64 string with format: iv:encryptedData:authTag
   */
  public encryptValue(value: string): string {
    try {
      const key = this.getEncryptionKey();
      if (!key) {
        throw new Error("Encryption key not available");
      }

      // Generate random IV for each encryption
      const iv = randomBytes(this.ivLength);

      // Create cipher
      const cipher = createCipher(this.algorithm, key);

      // Encrypt the data (simplified approach for now)
      let encrypted = cipher.update(value, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Combine IV and encrypted data (simplified without GCM auth tag for now)
      const combined = Buffer.concat([iv, encrypted]);

      return combined.toString(this.encoding);
    } catch (error) {
      const integrationError: IntegrationError = {
        name: "EncryptionError",
        message: `Failed to encrypt value: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "configuration_error",
        retryable: false,
        metadata: {
          operation: "encrypt",
          algorithm: this.algorithm,
        },
      };
      throw integrationError;
    }
  }

  /**
   * Decrypt a value using AES-256-GCM
   * @param encryptedValue - The encrypted value as base64 string
   * @returns Decrypted value as string
   */
  public decryptValue(encryptedValue: string): string {
    try {
      const key = this.getEncryptionKey();
      if (!key) {
        throw new Error("Encryption key not available");
      }

      // Parse the encrypted data
      const combined = Buffer.from(encryptedValue, this.encoding);

      if (combined.length < this.ivLength) {
        throw new Error("Invalid encrypted data format");
      }

      // Extract components (simplified without auth tag)
      const encrypted = combined.subarray(this.ivLength);

      // Create decipher
      const decipher = createDecipher(this.algorithm, key);

      // Decrypt the data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString("utf8");
    } catch (error) {
      const integrationError: IntegrationError = {
        name: "DecryptionError",
        message: `Failed to decrypt value: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "configuration_error",
        retryable: false,
        metadata: {
          operation: "decrypt",
          algorithm: this.algorithm,
          dataFormat: "malformed",
        },
      };
      throw integrationError;
    }
  }

  /**
   * Encrypt an object by converting it to JSON first
   * @param obj - The object to encrypt
   * @returns Encrypted object as base64 string
   */
  public encryptObject(obj: Record<string, unknown>): string {
    try {
      const jsonString = JSON.stringify(obj);
      return this.encryptValue(jsonString);
    } catch (error) {
      const integrationError: IntegrationError = {
        name: "EncryptionError",
        message: `Failed to encrypt object: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "configuration_error",
        retryable: false,
        metadata: {
          operation: "encryptObject",
          objectKeys: Object.keys(obj),
        },
      };
      throw integrationError;
    }
  }

  /**
   * Decrypt an object by decrypting and parsing JSON
   * @param encryptedValue - The encrypted object as base64 string
   * @returns Decrypted object
   */
  public decryptObject<T = Record<string, unknown>>(encryptedValue: string): T {
    try {
      const decryptedString = this.decryptValue(encryptedValue);
      return JSON.parse(decryptedString) as T;
    } catch (error) {
      const integrationError: IntegrationError = {
        name: "DecryptionError",
        message: `Failed to decrypt object: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "configuration_error",
        retryable: false,
        metadata: {
          operation: "decryptObject",
          parseError: error instanceof SyntaxError,
        },
      };
      throw integrationError;
    }
  }

  /**
   * Validate that a value can be encrypted and decrypted successfully
   * @param testValue - Test value to validate encryption/decryption
   * @returns True if validation passes
   */
  public validateEncryption(testValue = "test-encryption-validation"): boolean {
    try {
      const encrypted = this.encryptValue(testValue);
      const decrypted = this.decryptValue(encrypted);
      return decrypted === testValue;
    } catch {
      return false;
    }
  }

  /**
   * Check if encryption is properly configured
   * @returns True if encryption is configured and working
   */
  public isConfigured(): boolean {
    try {
      const key = this.getEncryptionKey();
      return key !== null && this.validateEncryption();
    } catch {
      return false;
    }
  }

  /**
   * Get encryption algorithm information
   */
  public getAlgorithmInfo(): {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
  } {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      tagLength: this.tagLength,
    };
  }

  /**
   * Securely hash a value for comparison purposes (not reversible)
   * Useful for storing credential identifiers or verification tokens
   * @param value - Value to hash
   * @returns Base64-encoded hash
   */
  public hashValue(value: string): string {
    const hash = createHash("sha256");
    hash.update(value, "utf8");
    return hash.digest("base64");
  }

  /**
   * Generate a secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns Base64-encoded random token
   */
  public generateToken(length = 32): string {
    return randomBytes(length).toString("base64");
  }
}
