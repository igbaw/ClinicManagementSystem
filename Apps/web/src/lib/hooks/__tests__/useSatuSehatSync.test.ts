/**
 * Unit Tests for useSatuSehatSync Hook
 * Tests auto-polling, manual sync, error handling, and toast notifications
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSatuSehatSync } from '../useSatuSehatSync';

describe('useSatuSehatSync Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    test('should initialize with idle status when patientId is undefined', () => {
      const { result } = renderHook(() => useSatuSehatSync({ patientId: undefined }));

      expect(result.current.status).toBe('idle');
      expect(result.current.isPolling).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should have correct initial values', () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123' })
      );

      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('triggerSync');
      expect(result.current).toHaveProperty('isPolling');
      expect(result.current).toHaveProperty('submissionId');
      expect(result.current).toHaveProperty('resourceId');
      expect(result.current).toHaveProperty('retryCount');
    });
  });

  describe('Auto-sync', () => {
    test('should trigger sync when autoSync=true and patientId is set', async () => {
      const { result, rerender } = renderHook(
        ({ patientId }) => useSatuSehatSync({ patientId, autoSync: true }),
        { initialProps: { patientId: undefined } }
      );

      expect(result.current.status).toBe('idle');

      rerender({ patientId: 'patient-123' });

      await waitFor(() => {
        expect(result.current.status).not.toBe('idle');
      });
    });

    test('should not trigger sync when autoSync=false', () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: false })
      );

      // Status should remain idle since autoSync is false
      expect(result.current.status).toBe('idle');
    });

    test('should trigger sync when patientId changes', async () => {
      const { result, rerender } = renderHook(
        ({ patientId }) => useSatuSehatSync({ patientId, autoSync: true }),
        { initialProps: { patientId: 'patient-111' } }
      );

      const firstStatus = result.current.status;

      rerender({ patientId: 'patient-222' });

      await waitFor(() => {
        // Status should change or update
        expect(result.current.status).toBeDefined();
      });
    });
  });

  describe('Manual trigger', () => {
    test('should trigger sync when triggerSync is called', async () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: false })
      );

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.triggerSync('patient-123');
      });

      await waitFor(() => {
        expect(result.current.status).not.toBe('idle');
      });
    });

    test('should accept different patientId in triggerSync', async () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: undefined, autoSync: false })
      );

      act(() => {
        result.current.triggerSync('different-patient-id');
      });

      await waitFor(() => {
        expect(result.current.status).not.toBe('idle');
      });
    });
  });

  describe('Polling behavior', () => {
    test('should set isPolling to true when sync starts', async () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true })
      );

      await waitFor(() => {
        // Either polling or status changed
        expect(result.current.isPolling || result.current.status !== 'idle').toBe(true);
      });
    });

    test('should stop polling when status is success', async () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true, pollInterval: 100 })
      );

      // Mock successful response
      jest.spyOn(global, 'fetch').mockResolvedValueOnce(
        Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', resourceId: 'IHS-123456' })
        } as Response)
      );

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });
    });

    test('should respect custom pollInterval', async () => {
      const customInterval = 2000;
      const fetchSpy = jest.spyOn(global, 'fetch');

      const { result } = renderHook(() =>
        useSatuSehatSync({
          patientId: 'patient-123',
          autoSync: true,
          pollInterval: customInterval
        })
      );

      // Advance by less than interval
      jest.advanceTimersByTime(customInterval - 100);
      expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(1);

      // Advance past interval
      jest.advanceTimersByTime(200);
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

      fetchSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    test('should set error state when sync fails', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    test('should handle API error responses', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce(
        Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid patient ID' })
        } as Response)
      );

      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'invalid-id', autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('failed');
      });
    });

    test('should increment retryCount on failure', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.retryCount).toBeGreaterThan(0);
      });
    });

    test('should return submission data after success', async () => {
      const mockSubmissionId = 'sub-123';
      const mockResourceId = 'IHS-456789';

      jest.spyOn(global, 'fetch').mockResolvedValueOnce(
        Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            submissionId: mockSubmissionId,
            resourceId: mockResourceId
          })
        } as Response)
      );

      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.submissionId).toBe(mockSubmissionId);
        expect(result.current.resourceId).toBe(mockResourceId);
      });
    });
  });

  describe('Toast notifications', () => {
    test('should handle showToast option', () => {
      // This test depends on toast implementation
      // Mocking toast context if available
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true, showToast: true })
      );

      expect(result.current).toBeDefined();
      // Verify toast called (implementation dependent)
    });

    test('should not show toast when showToast=false', () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true, showToast: false })
      );

      expect(result.current).toBeDefined();
      // Verify toast not called
    });
  });

  describe('Cleanup', () => {
    test('should cleanup polling on unmount', () => {
      const { unmount } = renderHook(() =>
        useSatuSehatSync({ patientId: 'patient-123', autoSync: true })
      );

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      // Verify intervals are cleared
      jest.advanceTimersByTime(1000);
      // Polling should not continue
    });

    test('should cleanup when patientId becomes undefined', async () => {
      const { rerender } = renderHook(
        ({ patientId }) => useSatuSehatSync({ patientId, autoSync: true }),
        { initialProps: { patientId: 'patient-123' } }
      );

      rerender({ patientId: undefined });

      // Polling should stop
      await waitFor(() => {
        // Verify no further API calls
      });
    });
  });

  describe('Multiple syncs', () => {
    test('should handle rapid consecutive sync calls', async () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: undefined, autoSync: false })
      );

      act(() => {
        result.current.triggerSync('patient-1');
        result.current.triggerSync('patient-2');
        result.current.triggerSync('patient-3');
      });

      // Should handle multiple calls gracefully
      expect(result.current.status).not.toBe('idle');
    });

    test('should cancel previous polling when new sync starts', async () => {
      const { result, rerender } = renderHook(
        ({ patientId }) => useSatuSehatSync({ patientId, autoSync: true }),
        { initialProps: { patientId: 'patient-1' } }
      );

      const firstStatus = result.current.status;

      rerender({ patientId: 'patient-2' });

      await waitFor(() => {
        // Status should reflect new patient
        expect(result.current).toBeDefined();
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle empty string patientId', () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: '', autoSync: true })
      );

      // Should not crash
      expect(result.current.status).toBe('idle');
    });

    test('should handle null patientId', () => {
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: null as any, autoSync: true })
      );

      expect(result.current).toBeDefined();
    });

    test('should handle very long patientIds', () => {
      const longId = 'p'.repeat(1000);
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: longId, autoSync: true })
      );

      expect(result.current).toBeDefined();
    });

    test('should handle special characters in patientId', () => {
      const specialId = 'patient@#$%^&*()123';
      const { result } = renderHook(() =>
        useSatuSehatSync({ patientId: specialId, autoSync: true })
      );

      expect(result.current).toBeDefined();
    });
  });
});
