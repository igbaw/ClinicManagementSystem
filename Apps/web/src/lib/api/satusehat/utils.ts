/**
 * SatuSehat Utility Functions
 */

import { RETRYABLE_ERROR_CODES, NON_RETRYABLE_ERROR_CODES, type RetryConfig } from './types';

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1 second
  retryableErrors: RETRYABLE_ERROR_CODES,
  nonRetryableErrors: NON_RETRYABLE_ERROR_CODES,
};

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message;

    // Check for network-related errors
    for (const code of DEFAULT_RETRY_CONFIG.retryableErrors) {
      if (message.includes(code)) {
        return true;
      }
    }

    // Check for non-retryable errors
    for (const code of DEFAULT_RETRY_CONFIG.nonRetryableErrors) {
      if (message.includes(code)) {
        return false;
      }
    }
  }

  // Default to retryable for unknown errors
  return true;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, retryCount);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() - 0.5) * 2;
  return Math.max(config.initialDelay, delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate NIK format (16 digits)
 */
export function isValidNIK(nik: string): boolean {
  const nikRegex = /^\d{16}$/;
  return nikRegex.test(nik);
}

/**
 * Validate date format (ISO 8601)
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
  } catch {
    return false;
  }
}

/**
 * Validate ICD-10 code format
 */
export function isValidICD10Code(code: string): boolean {
  // ICD-10 format: A00-Z99, with optional decimal (e.g., A00.1)
  const icdRegex = /^[A-Z]\d{2}(\.\d+)?$/;
  return icdRegex.test(code);
}

/**
 * Format date to ISO 8601 date format (YYYY-MM-DD)
 */
export function formatToISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format date/time to ISO 8601 datetime format with WIB timezone (+07:00)
 */
export function formatToISODateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Convert to WIB timezone (UTC+7)
  const wibTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const isoString = wibTime.toISOString();
  // Replace Z with +07:00
  return isoString.replace('Z', '+07:00');
}

/**
 * Extract error code from error message
 */
export function extractErrorCode(message: string): string | null {
  // Try to extract HTTP status codes (e.g., "400", "500")
  const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/);
  if (statusMatch) {
    return statusMatch[1];
  }

  // Try to extract error codes (e.g., "ETIMEDOUT", "ECONNRESET")
  const codeMatch = message.match(/E\w+/);
  if (codeMatch) {
    return codeMatch[0];
  }

  return null;
}

/**
 * Build FHIR reference string
 */
export function buildFhirReference(
  resourceType: string,
  resourceId: string,
  display?: string
): {
  reference: string;
  display?: string;
} {
  const ref: {
    reference: string;
    display?: string;
  } = {
    reference: `${resourceType}/${resourceId}`,
  };

  if (display) {
    ref.display = display;
  }

  return ref;
}

/**
 * Build FHIR coding object
 */
export function buildFhirCoding(
  system: string,
  code: string,
  display?: string
): {
  system: string;
  code: string;
  display?: string;
} {
  const coding: {
    system: string;
    code: string;
    display?: string;
  } = {
    system,
    code,
  };

  if (display) {
    coding.display = display;
  }

  return coding;
}

/**
 * Build FHIR identifier object
 */
export function buildFhirIdentifier(
  system: string,
  value: string,
  type?: string
): {
  system: string;
  value: string;
  type?: { text: string };
} {
  const identifier: {
    system: string;
    value: string;
    type?: { text: string };
  } = {
    system,
    value,
  };

  if (type) {
    identifier.type = { text: type };
  }

  return identifier;
}

/**
 * Build FHIR name object
 */
export function buildFhirName(
  text: string,
  family?: string,
  given?: string[]
): {
  use?: string;
  text: string;
  family?: string;
  given?: string[];
} {
  return {
    text,
    family: family || text.split(' ').pop() || text,
    given: given || text.split(' ').slice(0, -1),
  };
}

/**
 * Build FHIR address object
 */
export function buildFhirAddress(
  line: string[],
  city?: string,
  postalCode?: string,
  country?: string
): {
  line: string[];
  city?: string;
  postalCode?: string;
  country?: string;
} {
  return {
    line,
    city,
    postalCode,
    country: country || 'ID', // Default to Indonesia
  };
}

/**
 * Build FHIR telecom (contact) object
 */
export function buildFhirTelecom(
  system: string,
  value: string,
  use?: string
): {
  system: string;
  value: string;
  use?: string;
} {
  const telecom: {
    system: string;
    value: string;
    use?: string;
  } = {
    system,
    value,
  };

  if (use) {
    telecom.use = use;
  }

  return telecom;
}

/**
 * Build FHIR quantity object (for observations)
 */
export function buildFhirQuantity(
  value: number,
  unit: string,
  system?: string,
  code?: string
): {
  value: number;
  unit: string;
  system?: string;
  code?: string;
} {
  return {
    value,
    unit,
    system,
    code,
  };
}

/**
 * Check if resource sync is due (for retry attempts)
 */
export function isSyncDue(lastRetryAt: string | null, retryCount: number): boolean {
  if (!lastRetryAt) {
    return true; // Never retried, so it's due
  }

  const config = DEFAULT_RETRY_CONFIG;
  const delay = calculateBackoffDelay(retryCount, config);
  const nextRetryTime = new Date(lastRetryAt).getTime() + delay;

  return Date.now() >= nextRetryTime;
}

/**
 * Generate a correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
