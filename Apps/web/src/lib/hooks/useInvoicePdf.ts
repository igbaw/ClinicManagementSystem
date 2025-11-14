/**
 * useInvoicePdf Hook
 * Client-side hook for generating and managing invoice PDFs
 *
 * Usage:
 * const { generatePdf, isLoading, error, downloadFile } = useInvoicePdf();
 * await generatePdf(billingId);
 */

'use client';

import { useState } from 'react';

interface UseInvoicePdfReturn {
  generatePdf: (billingId: string, storePdf?: boolean) => Promise<boolean>;
  downloadPdf: (billingId: string) => Promise<void>;
  downloadStoredPdf: (documentId: string, fileName?: string) => Promise<void>;
  previewPdf: (documentId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useInvoicePdf(): UseInvoicePdfReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Generate PDF for a billing record
   */
  const generatePdf = async (billingId: string, storePdf = true): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/billing/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billingId, storePdf }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate PDF');
      }

      // Get PDF buffer
      const blob = await response.blob();

      // Get invoice number from response header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename="')[1]?.split('"')[0] || 'invoice.pdf'
        : 'invoice.pdf';

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Download PDF directly (generates on the fly)
   */
  const downloadPdf = async (billingId: string): Promise<void> => {
    await generatePdf(billingId, true);
  };

  /**
   * Download a stored PDF document
   */
  const downloadStoredPdf = async (documentId: string, fileName?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/billing/generate-pdf?documentId=${documentId}&action=download`, {
        method: 'GET',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download PDF');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const defaultFileName = contentDisposition
        ? contentDisposition.split('filename="')[1]?.split('"')[0] || fileName || 'invoice.pdf'
        : fileName || 'invoice.pdf';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Preview PDF in new tab
   */
  const previewPdf = async (documentId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the signed URL for preview
      const response = await fetch(`/api/billing/generate-pdf?documentId=${documentId}&action=preview`, {
        method: 'GET',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to preview PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up after a delay to ensure browser has loaded the PDF
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePdf,
    downloadPdf,
    downloadStoredPdf,
    previewPdf,
    isLoading,
    error,
    success,
  };
}
