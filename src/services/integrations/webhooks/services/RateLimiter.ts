import { RateLimitState } from "../types";
import { DEFAULT_RATE_LIMITS } from "../constants";

/**
 * Rate Limiter Service
 * Implements sliding window rate limiting for webhook endpoints
 */
export class RateLimiter {
  private readonly limits: Map<string, RateLimitState>;
  private readonly requestsPerMinute: number;
  private readonly requestsPerHour: number;
  private readonly windowSizeMs: number;

  constructor(
    requestsPerMinute: number = DEFAULT_RATE_LIMITS.requestsPerMinute,
    requestsPerHour: number = DEFAULT_RATE_LIMITS.requestsPerHour,
    windowSizeMs: number = DEFAULT_RATE_LIMITS.windowSizeMs
  ) {
    this.limits = new Map();
    this.requestsPerMinute = requestsPerMinute;
    this.requestsPerHour = requestsPerHour;
    this.windowSizeMs = windowSizeMs;
  }

  /**
   * Check if request is within rate limits
   */
  checkLimit(provider: string): boolean {
    const now = Date.now();
    const state = this.getOrCreateState(provider);

    // Clean old requests
    this.cleanOldRequests(state, now);

    // Check minute limit
    const minuteAgo = now - 60000;
    const requestsInLastMinute = state.requests.filter(
      (timestamp) => timestamp > minuteAgo
    ).length;

    if (requestsInLastMinute >= this.requestsPerMinute) {
      return false;
    }

    // Check hour limit
    const hourAgo = now - 3600000;
    const requestsInLastHour = state.requests.filter(
      (timestamp) => timestamp > hourAgo
    ).length;

    if (requestsInLastHour >= this.requestsPerHour) {
      return false;
    }

    // Add current request
    state.requests.push(now);
    return true;
  }

  /**
   * Get remaining requests for provider
   */
  getRemainingRequests(provider: string): {
    perMinute: number;
    perHour: number;
  } {
    const now = Date.now();
    const state = this.getOrCreateState(provider);

    // Clean old requests
    this.cleanOldRequests(state, now);

    // Calculate remaining requests
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    const requestsInLastMinute = state.requests.filter(
      (timestamp) => timestamp > minuteAgo
    ).length;

    const requestsInLastHour = state.requests.filter(
      (timestamp) => timestamp > hourAgo
    ).length;

    return {
      perMinute: Math.max(0, this.requestsPerMinute - requestsInLastMinute),
      perHour: Math.max(0, this.requestsPerHour - requestsInLastHour),
    };
  }

  /**
   * Get retry after time in milliseconds
   */
  getRetryAfter(provider: string): number {
    const now = Date.now();
    const state = this.getOrCreateState(provider);

    // Clean old requests
    this.cleanOldRequests(state, now);

    // Check minute limit
    const minuteAgo = now - 60000;
    const requestsInLastMinute = state.requests.filter(
      (timestamp) => timestamp > minuteAgo
    );

    if (requestsInLastMinute.length >= this.requestsPerMinute) {
      // Find the oldest request in the last minute
      const oldestRequest = Math.min(...requestsInLastMinute);
      return Math.max(0, oldestRequest + 60000 - now);
    }

    // Check hour limit
    const hourAgo = now - 3600000;
    const requestsInLastHour = state.requests.filter(
      (timestamp) => timestamp > hourAgo
    );

    if (requestsInLastHour.length >= this.requestsPerHour) {
      // Find the oldest request in the last hour
      const oldestRequest = Math.min(...requestsInLastHour);
      return Math.max(0, oldestRequest + 3600000 - now);
    }

    return 0;
  }

  /**
   * Reset rate limits for provider
   */
  reset(provider: string): void {
    this.limits.delete(provider);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.limits.clear();
  }

  /**
   * Get or create rate limit state
   */
  private getOrCreateState(provider: string): RateLimitState {
    let state = this.limits.get(provider);
    
    if (!state) {
      state = {
        provider,
        requests: [],
        windowStart: Date.now(),
      };
      this.limits.set(provider, state);
    }

    return state;
  }

  /**
   * Clean old requests from state
   */
  private cleanOldRequests(state: RateLimitState, now: number): void {
    const hourAgo = now - 3600000;
    state.requests = state.requests.filter(
      (timestamp) => timestamp > hourAgo
    );
  }

  /**
   * Get current state for all providers
   */
  getState(): Map<string, RateLimitState> {
    const now = Date.now();
    const result = new Map<string, RateLimitState>();

    this.limits.forEach((state, provider) => {
      this.cleanOldRequests(state, now);
      result.set(provider, { ...state, requests: [...state.requests] });
    });

    return result;
  }
}