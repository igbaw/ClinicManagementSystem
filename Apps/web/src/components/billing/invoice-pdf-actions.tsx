/**
 * Invoice PDF Actions Component
 * Provides UI buttons for generating, downloading, and previewing invoice PDFs
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useInvoicePdf } from '@/lib/hooks/useInvoicePdf';
import { FileDown, Eye, Loader } from 'lucide-react';

interface InvoicePdfActionsProps {
  billingId: string;
  invoiceNumber?: string;
  disabled?: boolean;
  variant?: 'default' | 'compact';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Invoice PDF Actions Component - Compact version with icon buttons
 */
export function InvoicePdfActions({
  billingId,
  invoiceNumber,
  disabled = false,
  variant = 'default',
  onSuccess,
  onError,
}: InvoicePdfActionsProps) {
  const { generatePdf, downloadStoredPdf, previewPdf, isLoading, error } = useInvoicePdf();
  const [showError, setShowError] = useState(false);

  const handleGenerateAndDownload = async () => {
    const success = await generatePdf(billingId, true);
    if (success) {
      onSuccess?.();
    } else {
      setShowError(true);
      onError?.(error || 'Failed to generate PDF');
    }
  };

  const handlePreview = async () => {
    await previewPdf(billingId);
  };

  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerateAndDownload}
          disabled={disabled || isLoading}
          title="Generate and download invoice PDF"
          className="h-8 w-8 p-0"
        >
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreview}
          disabled={disabled || isLoading}
          title="Preview invoice PDF"
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handleGenerateAndDownload}
          disabled={disabled || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Download Invoice
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          onClick={handlePreview}
          disabled={disabled || isLoading}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>

      {showError && error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">Error generating PDF</p>
          <p className="text-xs">{error}</p>
          <button
            onClick={() => setShowError(false)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

interface InvoiceDocumentListProps {
  billingId: string;
  documents: Array<{
    id: string;
    file_name: string;
    created_at: string;
    file_size: number;
    access_count: number;
  }>;
  onDownload: (documentId: string, fileName: string) => void;
  onPreview: (documentId: string) => void;
  isLoading?: boolean;
}

/**
 * List of stored invoice documents with actions
 */
export function InvoiceDocumentList({
  documents,
  onDownload,
  onPreview,
  isLoading = false,
}: InvoiceDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
        <p className="text-sm text-muted-foreground">No invoice documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border border-input bg-card p-4 hover:bg-accent/50"
        >
          <div className="flex-1">
            <p className="font-medium text-sm">{doc.file_name}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Size: {formatFileSize(doc.file_size)}</span>
              <span>Created: {new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
              <span>Downloads: {doc.access_count}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(doc.id)}
              disabled={isLoading}
              className="h-8"
            >
              <Eye className="mr-1 h-4 w-4" />
              Preview
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(doc.id, doc.file_name)}
              disabled={isLoading}
              className="h-8"
            >
              <FileDown className="mr-1 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
