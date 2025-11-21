'use client';

/**
 * SatuSehat Submission Status Badge
 * Shows status of a submission (pending, processing, success, failed)
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCw,
  HelpCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface SubmissionBadgeProps {
  status: 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'queued';
  resourceType?: string;
  submissionId?: string;
  errorMessage?: string;
  retryCount?: number;
  onRetry?: () => void;
  showLabel?: boolean;
  compact?: boolean;
}

/**
 * Badge component showing submission status
 */
export function SubmissionBadge({
  status,
  resourceType,
  submissionId,
  errorMessage,
  retryCount = 0,
  onRetry,
  showLabel = true,
  compact = false,
}: SubmissionBadgeProps) {
  if (status === 'idle') {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'queued':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Submitting';
      case 'success':
        return 'Synced';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const tooltipContent = () => {
    let content = `Status: ${getStatusText()}`;
    if (resourceType) content += `\nType: ${resourceType}`;
    if (submissionId) content += `\nID: ${submissionId}`;
    if (retryCount > 0) content += `\nRetries: ${retryCount}`;
    if (errorMessage) content += `\nError: ${errorMessage}`;
    return content;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2">
            <Badge
              variant="gray"
              className={`${getStatusColor()} inline-flex items-center gap-1.5 px-3 py-1`}
            >
              {getStatusIcon()}
              {showLabel && <span>{getStatusText()}</span>}
            </Badge>

            {status === 'failed' && onRetry && !compact && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRetry}
                className="h-6 w-6 p-0"
                title="Retry submission"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TooltipTrigger>

        <TooltipContent className="max-w-xs whitespace-pre-line">
          {tooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SubmissionBadge;
