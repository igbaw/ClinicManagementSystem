'use client';

/**
 * SatuSehat Submission History Table
 * Sortable, filterable table for submission history
 * Follows shadcn/ui design system
 */

import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SubmissionStatusPopover } from './submission-status-popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface SubmissionRecord {
  id: string;
  resource_type: string;
  submission_status: 'pending' | 'processing' | 'success' | 'failed';
  local_id: string;
  resource_id?: string;
  error_message?: string;
  retry_count: number;
  submitted_at?: string;
  created_at: string;
}

export interface SubmissionHistoryTableProps {
  submissions: SubmissionRecord[];
  isLoading?: boolean;
  onRetry?: (submissionId: string) => void;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

type SortField = 'created_at' | 'submitted_at' | 'resource_type' | 'submission_status';
type SortDirection = 'asc' | 'desc';

/**
 * Submission history table with filtering and sorting
 */
export function SubmissionHistoryTable({
  submissions,
  isLoading = false,
  onRetry,
  totalCount,
  pageSize = 50,
  onPageChange,
}: SubmissionHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique resource types
  const resourceTypes = useMemo(
    () => [...new Set(submissions.map(s => s.resource_type))].sort(),
    [submissions]
  );

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Status filter
      if (filterStatus !== 'all' && submission.submission_status !== filterStatus) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && submission.resource_type !== filterType) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          submission.id.toLowerCase().includes(searchLower) ||
          submission.local_id.toLowerCase().includes(searchLower) ||
          submission.resource_id?.toLowerCase().includes(searchLower) ||
          submission.resource_type.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [submissions, filterStatus, filterType, searchTerm]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    const sorted = [...filteredSubmissions].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'created_at' || sortField === 'submitted_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredSubmissions, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedSubmissions.length / pageSize);
  const paginatedSubmissions = sortedSubmissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
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

  const getStatusBadgeVariant = (
    status: string
  ): 'success' | 'error' | 'warning' | 'primary' | 'gray' => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      default:
        return 'gray';
    }
  };

  const SortHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-2 hover:text-blue-600"
    >
      {label}
      {sortField === field && (
        <ArrowUpDown
          className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission History</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by ID or type..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600">
            Showing {paginatedSubmissions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedSubmissions.length)} of{' '}
            {sortedSubmissions.length} submissions
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : paginatedSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No submissions found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortHeader field="resource_type" label="Type" />
                      </TableHead>
                      <TableHead>
                        <SortHeader field="submission_status" label="Status" />
                      </TableHead>
                      <TableHead>Resource ID</TableHead>
                      <TableHead>
                        <SortHeader field="created_at" label="Date" />
                      </TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubmissions.map(submission => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.resource_type}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(submission.submission_status)}
                            <Badge
                              variant={getStatusBadgeVariant(submission.submission_status)}
                            >
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

                        <TableCell className="font-mono text-xs">
                          {submission.resource_id ? (
                            <span className="text-green-700">{submission.resource_id}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(submission.created_at), 'MMM d, HH:mm')}
                        </TableCell>

                        <TableCell className="text-sm">
                          {submission.retry_count > 0 ? (
                            <span className="font-semibold">
                              {submission.retry_count}/3
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <SubmissionStatusPopover
                            submission={submission}
                            onRetry={() => onRetry?.(submission.id)}
                            showDetails={true}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SubmissionHistoryTable;
