'use client';

/**
 * SatuSehat Submission Status Section
 * Complete section showing all submissions for an entity
 * Follows shadcn/ui design system
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubmissionStatusPopover } from './submission-status-popover';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface Submission {
  id: string;
  resource_type: string;
  submission_status: 'pending' | 'processing' | 'success' | 'failed';
  resource_id?: string;
  error_message?: string;
  retry_count: number;
  submitted_at?: string;
  created_at: string;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
}

export interface SubmissionStatusSectionProps {
  submissions: Submission[];
  title?: string;
  description?: string;
  onRetry?: (submissionId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Section showing submission status for an entity (patient, medical record, etc.)
 */
export function SubmissionStatusSection({
  submissions,
  title = 'SatuSehat Submission Status',
  description = 'Track your data submissions to SatuSehat',
  onRetry,
  isLoading = false,
  emptyMessage = 'No submissions yet',
}: SubmissionStatusSectionProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Loading submissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.submission_status === 'pending').length,
    processing: submissions.filter(s => s.submission_status === 'processing').length,
    success: submissions.filter(s => s.submission_status === 'success').length,
    failed: submissions.filter(s => s.submission_status === 'failed').length,
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string): 'success' | 'error' | 'warning' | 'primary' | 'gray' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'gray';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          {/* Summary Stats */}
          <div className="flex gap-3 flex-wrap">
            <div className="text-sm">
              <p className="text-gray-600">Total</p>
              <p className="font-semibold">{stats.total}</p>
            </div>
            {stats.success > 0 && (
              <div className="text-sm">
                <p className="text-green-600 text-xs">Success</p>
                <p className="font-semibold text-green-700">{stats.success}</p>
              </div>
            )}
            {stats.failed > 0 && (
              <div className="text-sm">
                <p className="text-red-600 text-xs">Failed</p>
                <p className="font-semibold text-red-700">{stats.failed}</p>
              </div>
            )}
            {(stats.pending + stats.processing) > 0 && (
              <div className="text-sm">
                <p className="text-blue-600 text-xs">Pending</p>
                <p className="font-semibold text-blue-700">
                  {stats.pending + stats.processing}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table View */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Resource Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(submission => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <button
                      onClick={() => toggleRow(submission.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Toggle details"
                    >
                      {expandedRows.has(submission.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>

                  <TableCell className="font-medium">
                    {submission.resource_type}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.submission_status)}
                      <Badge variant={getStatusBadge(submission.submission_status)}>
                        {submission.submission_status === 'pending'
                          ? 'Pending'
                          : submission.submission_status === 'processing'
                            ? 'Processing'
                            : submission.submission_status === 'success'
                              ? 'Success'
                              : 'Failed'}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(submission.created_at), 'MMM d, HH:mm')}
                  </TableCell>

                  <TableCell className="text-right">
                    <SubmissionStatusPopover
                      submission={submission}
                      onRetry={() => onRetry?.(submission.id)}
                      showDetails={false}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Expanded Details */}
        {expandedRows.size > 0 && (
          <div className="mt-4 space-y-4">
            {submissions.map(submission => {
              if (!expandedRows.has(submission.id)) return null;

              return (
                <div
                  key={`details-${submission.id}`}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">ID</p>
                      <p className="text-sm font-mono mt-1 break-all text-gray-700">
                        {submission.id}
                      </p>
                    </div>

                    {submission.resource_id && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          SatuSehat ID
                        </p>
                        <p className="text-sm font-mono mt-1 text-green-700">
                          {submission.resource_id}
                        </p>
                      </div>
                    )}

                    {submission.retry_count > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          Retries
                        </p>
                        <p className="text-sm mt-1">
                          {submission.retry_count}/3
                        </p>
                      </div>
                    )}
                  </div>

                  {submission.submission_status === 'failed' &&
                    submission.error_message && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          Error Message
                        </p>
                        <p className="text-xs text-red-600 break-all">
                          {submission.error_message}
                        </p>
                      </div>
                    )}

                  {submission.submission_status === 'failed' && onRetry && (
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() => onRetry(submission.id)}
                    >
                      Retry Submission
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubmissionStatusSection;
