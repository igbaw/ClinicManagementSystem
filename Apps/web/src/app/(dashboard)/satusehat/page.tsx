'use client';

/**
 * SatuSehat Dashboard
 * Main dashboard for SatuSehat integration monitoring and compliance
 * Shows metrics, submission history, and sync status
 * Admin-only access
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  RotateCw,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { SubmissionHistoryTable } from '@/components/satusehat/submission-history-table';
import SyncStatusIndicator from '@/components/satusehat/sync-status-indicator';

interface DashboardMetrics {
  totalSubmissions: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  failedRate: number;
}

interface SubmissionRecord {
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

export default function SatuSehatDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSubmissions: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    successRate: 0,
    failedRate: 0,
  });
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check admin access and load data
  useEffect(() => {
    const checkAccessAndLoadData = async () => {
      try {
        // Get current user
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          router.push('/login');
          return;
        }

        // Check if admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userData?.role !== 'admin') {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this dashboard',
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);

        // Load submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('satusehat_submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!submissionsError && submissionsData) {
          setSubmissions(submissionsData);

          // Calculate metrics
          const total = submissionsData.length;
          const success = submissionsData.filter(
            s => s.submission_status === 'success'
          ).length;
          const failed = submissionsData.filter(
            s => s.submission_status === 'failed'
          ).length;
          const pending = submissionsData.filter(
            s => s.submission_status === 'pending' || s.submission_status === 'processing'
          ).length;

          setMetrics({
            totalSubmissions: total,
            successCount: success,
            failedCount: failed,
            pendingCount: pending,
            successRate: total > 0 ? Math.round((success / total) * 100) : 0,
            failedRate: total > 0 ? Math.round((failed / total) * 100) : 0,
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAccessAndLoadData();
  }, [supabase, router, toast]);

  const handleManualProcessQueue = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/satusehat/queue/process', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to process queue');
      }

      const result = await response.json();

      toast({
        title: 'Queue Processed',
        description: `Processed ${result.data.processed} items: ${result.data.succeeded} succeeded, ${result.data.failed} failed`,
      });

      // Reload submissions
      const { data: submissionsData } = await supabase
        .from('satusehat_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (submissionsData) {
        setSubmissions(submissionsData);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetrySubmission = async (submissionId: string) => {
    try {
      const response = await fetch('/api/satusehat/submission/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retry');
      }

      toast({
        title: 'Retry Queued',
        description: 'Submission has been queued for retry',
      });

      // Reload submissions
      const { data: submissionsData } = await supabase
        .from('satusehat_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (submissionsData) {
        setSubmissions(submissionsData);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">SatuSehat Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your SatuSehat submissions and compliance
          </p>
        </div>

        <Button
          onClick={handleManualProcessQueue}
          disabled={isSyncing}
          className="whitespace-nowrap"
        >
          {isSyncing ? (
            <>
              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4 mr-2" />
              Process Queue Now
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Submissions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold mt-2">{metrics.totalSubmissions}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Success Count */}
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-green-700">Successful</p>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  {metrics.successCount}
                </p>
                <p className="text-xs text-green-600 mt-2">{metrics.successRate}% success</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Count */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-700">Pending</p>
                <p className="text-2xl font-bold text-blue-700 mt-2">{metrics.pendingCount}</p>
                <p className="text-xs text-blue-600 mt-2">In queue</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Failed Count */}
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-red-700">Failed</p>
                <p className="text-2xl font-bold text-red-700 mt-2">{metrics.failedCount}</p>
                <p className="text-xs text-red-600 mt-2">{metrics.failedRate}% failed</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-amber-700">Success Rate</p>
                <p className="text-2xl font-bold text-amber-700 mt-2">
                  {metrics.successRate}%
                </p>
                <p className="text-xs text-amber-600 mt-2">Overall performance</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission History */}
      <SubmissionHistoryTable
        submissions={submissions}
        isLoading={isLoading}
        onRetry={handleRetrySubmission}
        totalCount={metrics.totalSubmissions}
        pageSize={50}
      />

      {/* Recent Failures */}
      {submissions.filter(s => s.submission_status === 'failed').length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Recent Failures
            </CardTitle>
            <CardDescription>
              These submissions failed and may need manual attention
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {submissions
                .filter(s => s.submission_status === 'failed')
                .slice(0, 5)
                .map(submission => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 bg-white rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{submission.resource_type}</p>
                      <p className="text-xs text-red-600 truncate">
                        {submission.error_message || 'Unknown error'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetrySubmission(submission.id)}
                      className="ml-2 whitespace-nowrap"
                    >
                      Retry
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes */}
      <Card className="border-gray-300 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Admin Notes</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Queue is automatically processed every 5 minutes</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Click "Process Queue Now" to manually trigger processing</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Failed submissions can be retried up to 3 times</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Contact SatuSehat support if permanent failures persist</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
