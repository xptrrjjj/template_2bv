/**
 * Rate limiter for TeamTailor API
 * Implements token bucket algorithm for 50 req/10s limit
 */

import { RateLimitError } from '../errors';

interface QueuedRequest<T = any> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority?: number;
  timestamp: number;
}

export class TeamTailorRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  
  // TeamTailor limits: 50 requests per 10 seconds
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private readonly refillInterval: number = 10000; // 10 seconds in milliseconds
  
  constructor(maxRequestsPer10Seconds: number = 50) {
    this.maxTokens = maxRequestsPer10Seconds;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = this.maxTokens / this.refillInterval;
  }
  
  /**
   * Execute a request with rate limiting
   * @param request Function that returns a promise
   * @param priority Higher priority requests are executed first (default: 0)
   */
  async executeRequest<T>(
    request: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        execute: request,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      };
      
      this.queue.push(queuedRequest);
      this.queue.sort((a, b) => {
        // Sort by priority (descending) then by timestamp (ascending)
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.timestamp - b.timestamp;
      });
      
      this.processQueue();
    });
  }
  
  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      this.refillTokens();
      
      if (this.tokens < 1) {
        // Calculate wait time until we have at least 1 token
        const tokensNeeded = 1 - this.tokens;
        const waitTime = Math.ceil(tokensNeeded / this.refillRate);
        
        // Wait for tokens to refill
        await this.delay(waitTime);
        this.refillTokens();
      }
      
      // Check if we have tokens available
      if (this.tokens >= 1) {
        const request = this.queue.shift();
        if (!request) continue;
        
        // Consume a token
        this.tokens -= 1;
        
        try {
          const result = await request.execute();
          request.resolve(result);
        } catch (error) {
          request.reject(error as Error);
        }
      }
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    if (elapsed > 0) {
      const tokensToAdd = elapsed * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
  
  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get current rate limiter status
   */
  getStatus(): {
    availableTokens: number;
    maxTokens: number;
    queueLength: number;
    isProcessing: boolean;
  } {
    this.refillTokens();
    
    return {
      availableTokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
  
  /**
   * Clear the request queue
   */
  clearQueue(): void {
    const error = new RateLimitError('Request queue cleared');
    
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        request.reject(error);
      }
    }
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.clearQueue();
    this.isProcessing = false;
  }
}

// Singleton instance for the application
let rateLimiterInstance: TeamTailorRateLimiter | null = null;

/**
 * Get or create the global rate limiter instance
 */
export function getRateLimiter(maxRequestsPer10Seconds?: number): TeamTailorRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new TeamTailorRateLimiter(maxRequestsPer10Seconds);
  }
  return rateLimiterInstance;
}

/**
 * Reset the global rate limiter instance
 */
export function resetRateLimiter(): void {
  if (rateLimiterInstance) {
    rateLimiterInstance.reset();
    rateLimiterInstance = null;
  }
}