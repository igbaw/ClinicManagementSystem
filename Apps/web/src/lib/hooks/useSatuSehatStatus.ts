/**
 * Hook for polling SatuSehat submission status
 * Generic hook that can poll any submission by ID
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface SubmissionStatus {
  id: string;
  resourceType: string;
  submissionStatus: 'pending' | 'processing' | 'success' | 'failed';
  resourceId?: string;
  errorMessage?: string;
  retryCount: number;
  submittedAt?: string;
  queue?: {
    status: string;
    attempt: number;
    maxRetries: number;
  };
}

export interface UseSubmissionStatusOptions {
  submissionId?: string;
  enabled?: boolean;
  pollInterval?: number;
  maxPolls?: number;
  onStatusChange?: (status: SubmissionStatus) => void;
  onComplete?: (status: SubmissionStatus) => void;
}

/**
 * Hook to poll submission status
 */
export function useSatuSehatStatus(options: UseSubmissionStatusOptions = {}) {
  const {
    submissionId,
    enabled = true,
    pollInterval = 5000,
    maxPolls = 60, // 5 minutes with 5s interval
    onStatusChange,
    onComplete,
  } = options;

  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  /**
   * Fetch current submission status
   */
  const fetchStatus = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/satusehat/submissions?limit=100&offset=0`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submission status');
      }

      const data = await response.json();
      const submission = data.data?.find(
        (s: any) => s.id === id
      ) as SubmissionStatus | undefined;

      if (!submission) {
        setError('Submission not found');
        return null;
      }

      setStatus(submission);
      setIsLoading(false);

      if (onStatusChange) {
        onStatusChange(submission);
      }

      // Check if complete
      if (
        submission.submissionStatus === 'success' ||
        submission.submissionStatus === 'failed'
      ) {
        if (onComplete) {
          onComplete(submission);
        }
        return submission; // Signal completion
      }

      return submission;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsLoading(false);
      return null;
    }
  }, [onStatusChange, onComplete]);

  /**
   * Start polling
   */
  useEffect(() => {
    if (!enabled || !submissionId) {
      return;
    }

    pollCountRef.current = 0;

    const poll = async () => {
      if (pollCountRef.current >= maxPolls) {
        setError('Polling timeout - submission still pending');
        return;
      }

      pollCountRef.current++;
      const result = await fetchStatus(submissionId);

      // If completed, stop polling
      if (
        result?.submissionStatus === 'success' ||
        result?.submissionStatus === 'failed'
      ) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
    };

    // Poll immediately
    poll();

    // Then poll at intervals
    pollIntervalRef.current = setInterval(poll, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, submissionId, fetchStatus, pollInterval, maxPolls]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isLoading,
    error,
    refetch: submissionId ? () => fetchStatus(submissionId) : null,
    isComplete:
      status?.submissionStatus === 'success' ||
      status?.submissionStatus === 'failed',
  };
}

export default useSatuSehatStatus;
