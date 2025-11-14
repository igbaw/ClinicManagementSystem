/**
 * Hook for SatuSehat Patient Synchronization
 * Handles automatic sync, polling, and status tracking
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'failed' | 'queued';
  submissionId?: string;
  resourceId?: string;
  error?: string;
  retryCount?: number;
  lastUpdated?: Date;
}

export interface UseSatuSehatSyncOptions {
  patientId?: string;
  autoSync?: boolean;
  pollInterval?: number;
  onSuccess?: (resourceId: string) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

/**
 * Hook to synchronize patient to SatuSehat
 * Automatically polls for status updates
 */
export function useSatuSehatSync(options: UseSatuSehatSyncOptions = {}) {
  const {
    patientId,
    autoSync = true,
    pollInterval = 5000, // 5 seconds
    onSuccess,
    onError,
    showToast = true,
  } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
  });

  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const toastShownRef = useRef<Set<string>>(new Set());

  /**
   * Trigger manual sync
   */
  const triggerSync = useCallback(async (id?: string) => {
    const targetId = id || patientId;
    if (!targetId) {
      const error = 'Patient ID is required';
      setSyncStatus(prev => ({ ...prev, status: 'failed', error }));
      if (showToast) {
        toast({
          title: 'Sync Failed',
          description: error,
          variant: 'destructive',
        });
      }
      return;
    }

    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));

    try {
      const response = await fetch('/api/satusehat/patient/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: targetId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sync failed');
      }

      const data = await response.json();

      setSyncStatus(prev => ({
        ...prev,
        status: 'queued',
        submissionId: data.submissionId,
        lastUpdated: new Date(),
      }));

      if (showToast && !toastShownRef.current.has('queued')) {
        toastShownRef.current.add('queued');
        toast({
          title: 'Syncing to SatuSehat',
          description: 'Your patient data is being synchronized...',
        });
      }

      // Start polling
      setIsPolling(true);

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSyncStatus(prev => ({
        ...prev,
        status: 'failed',
        error: errorMsg,
      }));

      if (showToast && !toastShownRef.current.has('error')) {
        toastShownRef.current.add('error');
        toast({
          title: 'Sync Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(errorMsg);
      }

      throw error;
    }
  }, [patientId, showToast, toast, onError]);

  /**
   * Poll for submission status
   */
  const pollStatus = useCallback(async (submissionId: string) => {
    try {
      const response = await fetch(
        `/api/satusehat/submissions?limit=1&offset=0`,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submission status');
      }

      const data = await response.json();
      const submission = data.data?.[0];

      if (!submission) {
        return;
      }

      const newStatus: SyncStatus = {
        submissionId,
        resourceId: submission.resource_id,
        retryCount: submission.retry_count,
        lastUpdated: new Date(),
        status: 'idle',
      };

      switch (submission.submission_status) {
        case 'pending':
        case 'processing':
          newStatus.status = 'syncing';
          break;
        case 'success':
          newStatus.status = 'success';
          if (showToast && !toastShownRef.current.has('success')) {
            toastShownRef.current.add('success');
            toast({
              title: 'Patient Synced',
              description: `Successfully synced to SatuSehat (ID: ${submission.resource_id})`,
              variant: 'default',
            });
          }
          if (onSuccess && submission.resource_id) {
            onSuccess(submission.resource_id);
          }
          setIsPolling(false);
          break;
        case 'failed':
          newStatus.status = 'failed';
          newStatus.error = submission.error_message || 'Sync failed';
          if (showToast && !toastShownRef.current.has('failed')) {
            toastShownRef.current.add('failed');
            toast({
              title: 'Sync Failed',
              description: newStatus.error,
              variant: 'destructive',
              action: {
                label: 'Retry',
                onClick: () => triggerSync(),
              },
            });
          }
          if (onError) {
            onError(newStatus.error);
          }
          setIsPolling(false);
          break;
      }

      setSyncStatus(newStatus);
    } catch (error) {
      console.error('Error polling submission status:', error);
    }
  }, [showToast, toast, onSuccess, onError, triggerSync]);

  /**
   * Setup polling interval
   */
  useEffect(() => {
    if (!isPolling || !syncStatus.submissionId) {
      return;
    }

    // Poll immediately
    pollStatus(syncStatus.submissionId);

    // Then poll at intervals
    pollIntervalRef.current = setInterval(() => {
      pollStatus(syncStatus.submissionId!);
    }, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, syncStatus.submissionId, pollStatus, pollInterval]);

  /**
   * Auto-sync on mount if patientId provided
   */
  useEffect(() => {
    if (autoSync && patientId && syncStatus.status === 'idle') {
      triggerSync(patientId);
    }
  }, [autoSync, patientId, syncStatus.status, triggerSync]);

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
    ...syncStatus,
    triggerSync,
    isPolling,
  };
}

export default useSatuSehatSync;
