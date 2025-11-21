/**
 * Hook for submitting clinical data (encounter, conditions, observations) to SatuSehat
 */

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface ClinicalSubmissionStatus {
  encounter?: {
    status: 'idle' | 'submitting' | 'success' | 'failed';
    submissionId?: string;
    error?: string;
  };
  conditions?: {
    status: 'idle' | 'submitting' | 'success' | 'failed';
    count: number;
    submissionIds?: string[];
    error?: string;
  };
  observations?: {
    status: 'idle' | 'submitting' | 'success' | 'failed';
    count: number;
    submissionIds?: string[];
    error?: string;
  };
  allCompleted: boolean;
  overallStatus: 'idle' | 'submitting' | 'partial' | 'success' | 'failed';
}

export interface UseClinicalSubmitOptions {
  medicalRecordId?: string;
  appointmentId?: string;
  autoSubmit?: boolean;
  submitTypes?: ('encounter' | 'conditions' | 'observations')[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

/**
 * Hook to submit medical record data to SatuSehat
 * Submits Encounter, Conditions, and Observations
 */
export function useSatuSehatClinicalSubmit(
  options: UseClinicalSubmitOptions = {}
) {
  const {
    medicalRecordId,
    appointmentId,
    autoSubmit = false,
    submitTypes = ['encounter', 'conditions', 'observations'],
    onSuccess,
    onError,
    showToast = true,
  } = options;

  const [submissionStatus, setSubmissionStatus] =
    useState<ClinicalSubmissionStatus>({
      encounter: { status: 'idle' },
      conditions: { status: 'idle', count: 0 },
      observations: { status: 'idle', count: 0 },
      allCompleted: false,
      overallStatus: 'idle',
    });

  const { toast } = useToast();

  /**
   * Submit all clinical data
   */
  const submitClinicalData = useCallback(async () => {
    if (!medicalRecordId && !appointmentId) {
      const error = 'Medical record ID or appointment ID is required';
      setSubmissionStatus(prev => ({
        ...prev,
        overallStatus: 'failed',
      }));
      if (onError) onError(error);
      return;
    }

    setSubmissionStatus(prev => ({
      ...prev,
      overallStatus: 'submitting',
      encounter: { status: 'submitting' },
      conditions: { status: 'submitting', count: 0 },
      observations: { status: 'submitting', count: 0 },
    }));

    let hasError = false;
    const submissionIds: string[] = [];

    try {
      // Submit encounter if requested
      if (submitTypes.includes('encounter')) {
        try {
          const response = await fetch(
            '/api/satusehat/encounter/submit',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                medicalRecordId,
                appointmentId,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            setSubmissionStatus(prev => ({
              ...prev,
              encounter: {
                status: 'success',
                submissionId: data.submissionId,
              },
            }));
            submissionIds.push(data.submissionId);
          } else {
            const error = await response.json();
            hasError = true;
            setSubmissionStatus(prev => ({
              ...prev,
              encounter: {
                status: 'failed',
                error: error.error || 'Failed to submit encounter',
              },
            }));
          }
        } catch (error) {
          hasError = true;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          setSubmissionStatus(prev => ({
            ...prev,
            encounter: {
              status: 'failed',
              error: errorMsg,
            },
          }));
        }
      }

      // Submit clinical data (conditions + observations)
      if (submitTypes.includes('conditions') ||
          submitTypes.includes('observations')) {
        try {
          const response = await fetch(
            '/api/satusehat/clinical-data/submit',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                medicalRecordId,
                dataType: 'all', // Submit both
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Count by type
            const conditionCount = data.submissions?.filter(
              (s: any) => s.type === 'Condition'
            ).length || 0;
            const observationCount = data.submissions?.filter(
              (s: any) => s.type === 'Observation'
            ).length || 0;

            setSubmissionStatus(prev => ({
              ...prev,
              conditions: {
                status: 'success',
                count: conditionCount,
                submissionIds: data.submissions
                  ?.filter((s: any) => s.type === 'Condition')
                  .map((s: any) => s.submissionId),
              },
              observations: {
                status: 'success',
                count: observationCount,
                submissionIds: data.submissions
                  ?.filter((s: any) => s.type === 'Observation')
                  .map((s: any) => s.submissionId),
              },
            }));

            submissionIds.push(
              ...(data.submissions?.map((s: any) => s.submissionId) || [])
            );

            if (showToast) {
              toast({
                title: 'Clinical Data Submitted',
                description: `${conditionCount} diagnoses and ${observationCount} observations queued for sync`,
              });
            }
          } else {
            const error = await response.json();
            hasError = true;
            const errorMsg = error.error || 'Failed to submit clinical data';

            setSubmissionStatus(prev => ({
              ...prev,
              conditions: {
                status: 'failed',
                count: 0,
                error: errorMsg,
              },
              observations: {
                status: 'failed',
                count: 0,
                error: errorMsg,
              },
            }));
          }
        } catch (error) {
          hasError = true;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';

          setSubmissionStatus(prev => ({
            ...prev,
            conditions: {
              status: 'failed',
              count: 0,
              error: errorMsg,
            },
            observations: {
              status: 'failed',
              count: 0,
              error: errorMsg,
            },
          }));
        }
      }

      // Final status
      setSubmissionStatus(prev => ({
        ...prev,
        allCompleted: true,
        overallStatus: hasError ? 'partial' : 'success',
      }));

      if (!hasError && onSuccess) {
        onSuccess();
      }

      if (hasError && onError) {
        onError('Some submissions failed. Check details below.');
      }

      return submissionIds;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      setSubmissionStatus(prev => ({
        ...prev,
        overallStatus: 'failed',
        allCompleted: true,
      }));

      if (onError) {
        onError(errorMsg);
      }

      if (showToast) {
        toast({
          title: 'Submission Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      }

      throw error;
    }
  }, [medicalRecordId, appointmentId, submitTypes, showToast, toast, onSuccess, onError]);

  /**
   * Auto-submit on mount if requested
   */
  useEffect(() => {
    if (autoSubmit && medicalRecordId && submissionStatus.overallStatus === 'idle') {
      submitClinicalData();
    }
  }, [autoSubmit, medicalRecordId, submissionStatus.overallStatus, submitClinicalData]);

  return {
    ...submissionStatus,
    submitClinicalData,
  };
}

export default useSatuSehatClinicalSubmit;
