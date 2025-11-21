/**
 * SatuSehat Queue Processing Service
 * Handles async submission of FHIR resources with retry logic
 */

import { createServerClient } from '@/lib/supabase/server';
import { SatuSehatClient } from './client';
import {
  SubmissionStatus,
  QueueStatus,
  type SatuSehatSubmission,
  type SatuSehatQueueItem,
  type SubmissionResult,
} from './types';
import {
  calculateBackoffDelay,
  isRetryableError,
  isSyncDue,
  extractErrorCode,
  generateCorrelationId,
} from './utils';

const MAX_CONCURRENT_PROCESSING = 5;
const PROCESSING_TIMEOUT = 30000; // 30 seconds

export class SatuSehatQueueService {
  private satusehatClient: SatuSehatClient;

  constructor() {
    this.satusehatClient = new SatuSehatClient();
  }

  /**
   * Process pending queue items
   */
  async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ queueId: string; error: string }>;
  }> {
    const supabase = await createServerClient();

    const result = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ queueId: string; error: string }>,
    };

    try {
      // Get pending queue items due for processing
      const { data: queueItems, error: fetchError } = await supabase
        .from('satusehat_queue')
        .select('*')
        .eq('status', 'queued')
        .lt('next_retry_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })
        .limit(MAX_CONCURRENT_PROCESSING);

      if (fetchError) {
        console.error('Error fetching queue items:', fetchError);
        throw fetchError;
      }

      if (!queueItems || queueItems.length === 0) {
        return result;
      }

      // Process queue items in parallel
      const promises = queueItems.map(async (queueItem) => {
        try {
          await this.processQueueItem(queueItem);
          return { success: true, id: queueItem.id };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          return { success: false, id: queueItem.id, error: errorMsg };
        }
      });

      const results = await Promise.all(promises);

      // Aggregate results
      for (const res of results) {
        result.processed++;
        if (res.success) {
          result.succeeded++;
        } else {
          result.failed++;
          if (res.error) {
            result.errors.push({
              queueId: res.id,
              error: res.error,
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Queue processing error:', error);
      throw error;
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(queueItem: SatuSehatQueueItem): Promise<void> {
    const supabase = await createServerClient();
    const correlationId = generateCorrelationId();

    try {
      // Update queue status to processing
      await supabase
        .from('satusehat_queue')
        .update({ status: 'processing' })
        .eq('id', queueItem.id);

      // Get the submission details
      const { data: submission, error: submissionError } = await supabase
        .from('satusehat_submissions')
        .select('*')
        .eq('id', queueItem.submission_id)
        .single();

      if (submissionError || !submission) {
        throw new Error(`Submission not found: ${queueItem.submission_id}`);
      }

      // Submit the resource
      const result = await this.submitResource(submission, correlationId);

      if (result.success) {
        // Update submission status
        await supabase
          .from('satusehat_submissions')
          .update({
            submission_status: SubmissionStatus.SUCCESS,
            resource_id: result.resourceId,
            submitted_at: new Date().toISOString(),
          })
          .eq('id', queueItem.submission_id);

        // Update queue status
        await supabase
          .from('satusehat_queue')
          .update({
            status: 'completed',
            attempt_count: queueItem.attempt_count + 1,
          })
          .eq('id', queueItem.id);

        // Log sync event
        await this.logSyncEvent('sync_success', submission.resource_type, result.resourceId || '', {
          correlation_id: correlationId,
          attempts: queueItem.attempt_count + 1,
        });
      } else {
        // Handle submission failure
        await this.handleSubmissionFailure(
          queueItem,
          submission,
          result,
          correlationId
        );
      }
    } catch (error) {
      // Handle processing error
      await this.handleProcessingError(queueItem, error, correlationId);
    }
  }

  /**
   * Submit a resource to SatuSehat with proper error handling
   */
  private async submitResource(
    submission: SatuSehatSubmission,
    correlationId: string
  ): Promise<SubmissionResult> {
    try {
      const payload = submission.request_payload as Record<string, unknown>;

      // Call appropriate SatuSehat client method based on resource type
      let response: Record<string, unknown>;

      switch (submission.resource_type) {
        case 'Patient':
          response = await this.satusehatClient.createPatient(
            payload as any
          );
          break;
        case 'Encounter':
          response = await this.satusehatClient.createEncounter(
            payload as any
          );
          break;
        case 'Condition':
          response = await this.satusehatClient.createCondition(
            payload as any
          );
          break;
        case 'Observation':
          response = await this.satusehatClient.createObservation(
            payload as any
          );
          break;
        case 'MedicationRequest':
          response = await this.satusehatClient.createMedicationRequest(
            payload as any
          );
          break;
        case 'ServiceRequest':
          response = await this.satusehatClient.createServiceRequest(
            payload as any
          );
          break;
        default:
          throw new Error(`Unsupported resource type: ${submission.resource_type}`);
      }

      // Extract resource ID from response
      const resourceId = (response.id || (response as any).entry?.[0]?.resource?.id) as string;

      return {
        success: true,
        resourceId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorCode = extractErrorCode(message);

      return {
        success: false,
        error: message,
        statusCode: errorCode ? parseInt(errorCode) : undefined,
        retryable: isRetryableError(error),
      };
    }
  }

  /**
   * Handle submission failure with retry logic
   */
  private async handleSubmissionFailure(
    queueItem: SatuSehatQueueItem,
    submission: SatuSehatSubmission,
    result: SubmissionResult,
    correlationId: string
  ): Promise<void> {
    const supabase = await createServerClient();
    const shouldRetry =
      result.retryable &&
      queueItem.attempt_count < queueItem.max_retries;

    if (shouldRetry) {
      // Calculate next retry time
      const delay = calculateBackoffDelay(queueItem.attempt_count);
      const nextRetryAt = new Date(Date.now() + delay).toISOString();

      // Update queue item for retry
      await supabase
        .from('satusehat_queue')
        .update({
          status: 'failed',
          attempt_count: queueItem.attempt_count + 1,
          next_retry_at: nextRetryAt,
          last_error: result.error,
        })
        .eq('id', queueItem.id);

      // Update submission status
      await supabase
        .from('satusehat_submissions')
        .update({
          submission_status: SubmissionStatus.FAILED,
          error_message: result.error,
          http_status_code: result.statusCode,
          retry_count: submission.retry_count + 1,
          last_retry_at: new Date().toISOString(),
        })
        .eq('id', queueItem.submission_id);

      // Log sync event
      await this.logSyncEvent('sync_retried', submission.resource_type, submission.local_id, {
        correlation_id: correlationId,
        attempt: queueItem.attempt_count + 1,
        max_retries: queueItem.max_retries,
        next_retry_at: nextRetryAt,
        error: result.error,
      });
    } else {
      // Move to dead letter queue (permanent failure)
      await supabase
        .from('satusehat_queue')
        .update({
          status: 'dead_letter',
          attempt_count: queueItem.attempt_count + 1,
          last_error: `Max retries exceeded: ${result.error}`,
        })
        .eq('id', queueItem.id);

      // Update submission status
      await supabase
        .from('satusehat_submissions')
        .update({
          submission_status: SubmissionStatus.FAILED,
          error_message: `Permanent failure after ${queueItem.attempt_count} retries: ${result.error}`,
          http_status_code: result.statusCode,
          retry_count: queueItem.max_retries,
        })
        .eq('id', queueItem.submission_id);

      // Log sync event
      await this.logSyncEvent('sync_failed', submission.resource_type, submission.local_id, {
        correlation_id: correlationId,
        attempts: queueItem.attempt_count,
        error: result.error,
        permanent: true,
      });
    }
  }

  /**
   * Handle processing error
   */
  private async handleProcessingError(
    queueItem: SatuSehatQueueItem,
    error: unknown,
    correlationId: string
  ): Promise<void> {
    const supabase = await createServerClient();
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Get submission for logging
    const { data: submission } = await supabase
      .from('satusehat_submissions')
      .select('*')
      .eq('id', queueItem.submission_id)
      .single();

    const shouldRetry =
      isRetryableError(error) &&
      queueItem.attempt_count < queueItem.max_retries;

    if (shouldRetry) {
      const delay = calculateBackoffDelay(queueItem.attempt_count);
      const nextRetryAt = new Date(Date.now() + delay).toISOString();

      await supabase
        .from('satusehat_queue')
        .update({
          status: 'failed',
          attempt_count: queueItem.attempt_count + 1,
          next_retry_at: nextRetryAt,
          last_error: errorMsg,
        })
        .eq('id', queueItem.id);

      if (submission) {
        await this.logSyncEvent('sync_retried', submission.resource_type, submission.local_id, {
          correlation_id: correlationId,
          error: errorMsg,
          processing_error: true,
        });
      }
    } else {
      await supabase
        .from('satusehat_queue')
        .update({
          status: 'dead_letter',
          attempt_count: queueItem.attempt_count + 1,
          last_error: errorMsg,
        })
        .eq('id', queueItem.id);

      if (submission) {
        await this.logSyncEvent('sync_failed', submission.resource_type, submission.local_id, {
          correlation_id: correlationId,
          error: errorMsg,
          processing_error: true,
          permanent: true,
        });
      }
    }
  }

  /**
   * Log sync event for audit trail
   */
  private async logSyncEvent(
    eventType: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createServerClient();

    try {
      await supabase.from('satusehat_sync_events').insert({
        event_type: eventType,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
      });
    } catch (error) {
      console.error('Error logging sync event:', error);
      // Don't throw - logging shouldn't break processing
    }
  }
}

// Singleton instance
let queueServiceInstance: SatuSehatQueueService | null = null;

export function getQueueService(): SatuSehatQueueService {
  if (!queueServiceInstance) {
    queueServiceInstance = new SatuSehatQueueService();
  }
  return queueServiceInstance;
}
