'use client';

/**
 * SatuSehat Submission Status Popover
 * Shows detailed status information for a submission
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export interface SubmissionStatusPopoverProps {
  submission: {
    id: string;
    resource_type: string;
    submission_status: 'pending' | 'processing' | 'success' | 'failed';
    resource_id?: string;
    error_message?: string;
    http_status_code?: number;
    retry_count: number;
    submitted_at?: string;
    created_at: string;
    request_payload?: Record<string, unknown>;
    response_payload?: Record<string, unknown>;
  };
  onRetry?: () => void;
  showDetails?: boolean;
}

/**
 * Popover with detailed submission information
 */
export function SubmissionStatusPopover({
  submission,
  onRetry,
  showDetails = false,
}: SubmissionStatusPopoverProps) {
  const [open, setOpen] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = () => {
    switch (submission.submission_status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (submission.submission_status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
    }
  };

  const getStatusBadgeVariant = ():
    | 'success'
    | 'error'
    | 'warning'
    | 'primary'
    | 'secondary' => {
    switch (submission.submission_status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="View submission details"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusText()}
              </Badge>
              <span className="text-xs text-gray-500">
                {submission.resource_type}
              </span>
            </div>

            <p className="text-sm font-mono text-gray-600 break-all">
              {submission.id}
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => copyToClipboard(submission.id, 'ID')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy ID
            </Button>
          </div>

          <Separator />

          {/* Status Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Resource ID
              </p>
              <p className="font-mono text-xs mt-1 break-all">
                {submission.resource_id ? (
                  <span className="text-green-700">{submission.resource_id}</span>
                ) : (
                  <span className="text-gray-400">Not yet assigned</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Retries
              </p>
              <p className="font-mono text-xs mt-1">
                {submission.retry_count}/{3}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Created
              </p>
              <p className="text-xs mt-1">
                {format(new Date(submission.created_at), 'MMM d, yyyy HH:mm')}
              </p>
            </div>

            {submission.submitted_at && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Submitted
                </p>
                <p className="text-xs mt-1">
                  {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {submission.submission_status === 'failed' && submission.error_message && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Error
                </p>
                <p className="text-xs text-red-700 bg-red-50 p-2 rounded break-all">
                  {submission.error_message}
                </p>
                {submission.http_status_code && (
                  <p className="text-xs text-gray-500 mt-1">
                    HTTP {submission.http_status_code}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Payload Details */}
          {showDetails && (
            <>
              <Separator />
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowPayload(!showPayload)}
                >
                  {showPayload ? 'Hide' : 'Show'} Request/Response
                  <ExternalLink className="w-4 h-4" />
                </Button>

                {showPayload && (
                  <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                    {submission.request_payload && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Request
                        </p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(submission.request_payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {submission.response_payload && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Response
                        </p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(submission.response_payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          {submission.submission_status === 'failed' && onRetry && (
            <>
              <Separator />
              <Button
                onClick={() => {
                  onRetry();
                  setOpen(false);
                }}
                className="w-full"
                size="sm"
              >
                Retry Submission
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SubmissionStatusPopover;
