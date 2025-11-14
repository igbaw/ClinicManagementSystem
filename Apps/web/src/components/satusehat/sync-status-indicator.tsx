'use client';

/**
 * SatuSehat Sync Status Indicator
 * Inline status indicator for entity (patient, medical record, etc.)
 * Follows shadcn/ui design system
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

export interface SyncStatusIndicatorProps {
  status: 'idle' | 'pending' | 'syncing' | 'success' | 'failed' | 'synced';
  entityType?: string;
  ihsNumber?: string;
  errorMessage?: string;
  retryCount?: number;
  onRetry?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Inline status indicator for entity sync status
 * Shows whether entity has been synced to SatuSehat
 */
export function SyncStatusIndicator({
  status,
  entityType = 'Entity',
  ihsNumber,
  errorMessage,
  retryCount = 0,
  onRetry,
  showLabel = true,
  size = 'md',
}: SyncStatusIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  const getIcon = () => {
    const sizeMap = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    switch (status) {
      case 'pending':
        return <Clock className={`${sizeMap[size]} text-yellow-600`} />;
      case 'syncing':
        return <Loader2 className={`${sizeMap[size]} text-blue-600 animate-spin`} />;
      case 'success':
      case 'synced':
        return <CheckCircle2 className={`${sizeMap[size]} text-green-600`} />;
      case 'failed':
        return <AlertCircle className={`${sizeMap[size]} text-red-600`} />;
      default:
        return <HelpCircle className={`${sizeMap[size]} text-gray-600`} />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'pending':
        return 'Queued';
      case 'syncing':
        return 'Syncing...';
      case 'success':
      case 'synced':
        return 'Synced';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'success':
      case 'synced':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
      case 'syncing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const tooltipContent = () => {
    let content = `${entityType} - ${getLabel()}`;

    if (ihsNumber) {
      content += `\nIHS: ${ihsNumber}`;
    }

    if (retryCount > 0) {
      content += `\nRetries: ${retryCount}/3`;
    }

    if (errorMessage) {
      content += `\nError: ${errorMessage.substring(0, 50)}...`;
    }

    return content;
  };

  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-8 px-3 text-base',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            <Badge
              variant={getBadgeVariant()}
              className={`${sizeClasses[size]} inline-flex items-center gap-1.5 cursor-help`}
            >
              {getIcon()}
              {showLabel && <span>{getLabel()}</span>}

              {status === 'failed' && onRetry && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  className="ml-1 hover:opacity-70 transition-opacity"
                  title="Retry sync"
                >
                  <RefreshCw className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                </button>
              )}
            </Badge>
          </div>
        </TooltipTrigger>

        <TooltipContent className="max-w-xs whitespace-pre-line">
          {tooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SyncStatusIndicator;
