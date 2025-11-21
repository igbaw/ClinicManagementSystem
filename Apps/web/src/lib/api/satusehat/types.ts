/**
 * SatuSehat Integration Types and Enums
 */

export enum ResourceType {
  PATIENT = 'Patient',
  ENCOUNTER = 'Encounter',
  CONDITION = 'Condition',
  OBSERVATION = 'Observation',
  MEDICATION_REQUEST = 'MedicationRequest',
  SERVICE_REQUEST = 'ServiceRequest',
  ORGANIZATION = 'Organization',
  LOCATION = 'Location',
  PRACTITIONER = 'Practitioner',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum QueueStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DEAD_LETTER = 'dead_letter',
}

export enum RetryableErrorCode {
  TIMEOUT = 'ETIMEDOUT',
  CONNECTION_RESET = 'ECONNRESET',
  NOT_FOUND = 'ENOTFOUND',
  RATE_LIMIT = '429',
  SERVER_ERROR = '500',
  BAD_GATEWAY = '502',
  SERVICE_UNAVAILABLE = '503',
  GATEWAY_TIMEOUT = '504',
}

export const RETRYABLE_ERROR_CODES = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  '429',
  '500',
  '502',
  '503',
  '504',
];

export const NON_RETRYABLE_ERROR_CODES = [
  '400', // Bad request
  '401', // Unauthorized
  '403', // Forbidden
  '404', // Not found
  '409', // Conflict
  '422', // Validation error
];

export interface SatuSehatSubmission {
  id: string;
  resource_type: ResourceType | string;
  local_id: string;
  resource_id?: string;
  submission_status: SubmissionStatus;
  request_payload: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  error_message?: string;
  http_status_code?: number;
  submitted_at?: string;
  submitted_by?: string;
  retry_count: number;
  last_retry_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SatuSehatQueueItem {
  id: string;
  submission_id: string;
  resource_type: ResourceType | string;
  local_id: string;
  priority: number;
  scheduled_for: string;
  next_retry_at?: string;
  max_retries: number;
  attempt_count: number;
  last_error?: string;
  status: QueueStatus;
  created_at: string;
  updated_at: string;
}

export interface SatuSehatEncounter {
  id: string;
  appointment_id?: string;
  medical_record_id?: string;
  encounter_resource_id?: string;
  encounter_status?: string;
  submission_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncEventDetails {
  resource_id?: string;
  error?: string;
  retry_count?: number;
  status_code?: number;
  [key: string]: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number; // milliseconds
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export interface SubmissionResult {
  success: boolean;
  resourceId?: string;
  error?: string;
  statusCode?: number;
  retryable?: boolean;
}

export enum EventType {
  PATIENT_CREATED = 'patient_created',
  PATIENT_UPDATED = 'patient_updated',
  ENCOUNTER_SUBMITTED = 'encounter_submitted',
  CONDITION_SUBMITTED = 'condition_submitted',
  OBSERVATION_SUBMITTED = 'observation_submitted',
  MEDICATION_REQUEST_SUBMITTED = 'medication_request_submitted',
  SYNC_SUCCESS = 'sync_success',
  SYNC_FAILED = 'sync_failed',
  SYNC_RETRIED = 'sync_retried',
  QUEUE_PROCESSED = 'queue_processed',
}
