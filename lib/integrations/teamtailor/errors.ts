/**
 * Custom error classes for TeamTailor integration
 * Provides structured error handling for different scenarios
 */

import { TeamTailorErrorResponse } from './types';

// Base error class for all TeamTailor errors
export class TeamTailorError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;
  public readonly context?: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown,
    context?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Authentication error (401, 403)
export class AuthenticationError extends TeamTailorError {
  constructor(message: string = 'Authentication failed', details?: unknown, context?: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, details, context);
  }
}

// Rate limit error (429)
export class RateLimitError extends TeamTailorError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    details?: unknown,
    context?: string
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, details, context);
    this.retryAfter = retryAfter;
  }
}

// Validation error (400, 422)
export class ValidationError extends TeamTailorError {
  public readonly validationErrors?: Array<{
    field?: string;
    message: string;
  }>;

  constructor(
    message: string = 'Validation failed',
    validationErrors?: Array<{ field?: string; message: string }>,
    statusCode: number = 400,
    context?: string
  ) {
    super(message, 'VALIDATION_ERROR', statusCode, validationErrors, context);
    this.validationErrors = validationErrors;
  }
}

// Not found error (404)
export class NotFoundError extends TeamTailorError {
  constructor(
    message: string = 'Resource not found',
    resourceType?: string,
    resourceId?: string,
    context?: string
  ) {
    const details = resourceType && resourceId 
      ? { resourceType, resourceId }
      : undefined;
    super(message, 'NOT_FOUND_ERROR', 404, details, context);
  }
}

// Pagination error
export class PaginationError extends TeamTailorError {
  constructor(
    message: string = 'Pagination failed',
    details?: {
      currentPage?: number;
      totalPages?: number;
      recordCount?: number;
      error?: string;
    },
    context?: string
  ) {
    super(message, 'PAGINATION_ERROR', undefined, details, context);
  }
}

// Network error
export class NetworkError extends TeamTailorError {
  constructor(
    message: string = 'Network request failed',
    originalError?: Error,
    context?: string
  ) {
    super(message, 'NETWORK_ERROR', undefined, { originalError: originalError?.message }, context);
  }
}

// Timeout error
export class TimeoutError extends TeamTailorError {
  constructor(
    message: string = 'Request timeout',
    timeout: number,
    context?: string
  ) {
    super(message, 'TIMEOUT_ERROR', undefined, { timeout }, context);
  }
}

// Configuration error
export class ConfigurationError extends TeamTailorError {
  constructor(
    message: string = 'Configuration error',
    missingFields?: string[],
    context?: string
  ) {
    super(message, 'CONFIGURATION_ERROR', undefined, { missingFields }, context);
  }
}

// Error factory to create appropriate error from HTTP response
export async function createErrorFromResponse(
  response: Response,
  context?: string
): Promise<TeamTailorError> {
  const statusCode = response.status;
  let errorBody: TeamTailorErrorResponse | null = null;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      errorBody = await response.json() as TeamTailorErrorResponse;
    }
  } catch {
    // Failed to parse error body, continue with generic error
  }

  // Extract error details from TeamTailor error response
  const errorDetails = errorBody?.errors?.[0];
  const message = errorDetails?.detail || errorDetails?.title || response.statusText;

  switch (statusCode) {
    case 401:
    case 403:
      return new AuthenticationError(
        message || 'Authentication failed',
        errorBody,
        context
      );

    case 429:
      const retryAfter = response.headers.get('retry-after');
      return new RateLimitError(
        message || 'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter, 10) : undefined,
        errorBody,
        context
      );

    case 400:
    case 422:
      const validationErrors = errorBody?.errors?.map(err => ({
        field: err.source?.pointer || err.source?.parameter,
        message: err.detail || err.title,
      }));
      return new ValidationError(
        message || 'Validation failed',
        validationErrors,
        statusCode,
        context
      );

    case 404:
      return new NotFoundError(
        message || 'Resource not found',
        undefined,
        undefined,
        context
      );

    case 500:
    case 502:
    case 503:
    case 504:
      return new NetworkError(
        message || `Server error: ${statusCode}`,
        undefined,
        context
      );

    default:
      return new TeamTailorError(
        message || `Request failed with status ${statusCode}`,
        'UNKNOWN_ERROR',
        statusCode,
        errorBody,
        context
      );
  }
}

// Helper to determine if an error is retryable
export function isRetryableError(error: Error): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof TimeoutError) {
    return true;
  }
  
  if (error instanceof TeamTailorError && error.statusCode) {
    // Retry on server errors
    return error.statusCode >= 500;
  }
  
  return false;
}

// Helper to get retry delay
export function getRetryDelay(error: Error, attemptNumber: number, baseDelay: number = 1000): number {
  if (error instanceof RateLimitError && error.retryAfter) {
    // Use the retry-after header if available
    return error.retryAfter * 1000;
  }
  
  // Exponential backoff with jitter
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptNumber), 30000);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  
  return Math.floor(exponentialDelay + jitter);
}