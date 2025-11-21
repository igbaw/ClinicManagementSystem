'use client';

/**
 * SatuSehat Clinical Data Status Section
 * Shows status of Encounter, Conditions, and Observations
 * Follows shadcn/ui design system
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  Stethoscope,
  TrendingUp,
  RotateCw,
} from 'lucide-react';

export interface ClinicalDataStatus {
  status: 'idle' | 'submitting' | 'partial' | 'success' | 'failed';
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
}

export interface ClinicalDataStatusSectionProps {
  status: ClinicalDataStatus;
  onRetry?: (dataType: 'encounter' | 'conditions' | 'observations') => void;
  showDetails?: boolean;
}

/**
 * Section showing clinical data submission status
 */
export function ClinicalDataStatusSection({
  status,
  onRetry,
  showDetails = true,
}: ClinicalDataStatusSectionProps) {
  if (status.status === 'idle') {
    return null;
  }

  const getStatusIcon = (itemStatus: string) => {
    switch (itemStatus) {
      case 'submitting':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (itemStatus: string): 'success' | 'error' | 'warning' | 'primary' | 'gray' | 'secondary' => {
    switch (itemStatus) {
      case 'submitting':
        return 'primary';
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'idle':
        return 'secondary';
      default:
        return 'gray';
    }
  };

  const getStatusText = (itemStatus: string) => {
    switch (itemStatus) {
      case 'submitting':
        return 'Submitting...';
      case 'success':
        return 'Submitted';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  // Calculate progress
  const totalItems = 3;
  let completedItems = 0;
  if (status.encounter?.status === 'success') completedItems++;
  if (status.conditions?.status === 'success') completedItems++;
  if (status.observations?.status === 'success') completedItems++;

  const progressPercentage = (completedItems / totalItems) * 100;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Clinical Data Submission Status
            </CardTitle>
            <CardDescription>
              Track your encounter and clinical data synchronization to SatuSehat
            </CardDescription>
          </div>

          {status.status === 'partial' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry('encounter')}
              className="whitespace-nowrap"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Retry Failed
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold">
              {completedItems}/{totalItems} items
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Encounter Section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium">Encounter</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Visit and appointment information
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon(status.encounter?.status || 'idle')}
              <Badge variant={getStatusBadge(status.encounter?.status || 'idle')}>
                {getStatusText(status.encounter?.status || 'idle')}
              </Badge>
            </div>
          </div>

          {status.encounter?.status === 'failed' && status.encounter?.error && (
            <div className="ml-8 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <p className="text-red-700 font-semibold mb-1">Error</p>
              <p className="text-red-600 text-xs">{status.encounter.error}</p>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => onRetry('encounter')}
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {showDetails && status.encounter?.submissionId && (
            <div className="ml-8 text-xs text-gray-600 font-mono">
              ID: {status.encounter.submissionId}
            </div>
          )}
        </div>

        <Separator />

        {/* Conditions Section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium">Diagnoses</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {status.conditions?.count || 0} diagnosis
                  {(status.conditions?.count || 0) !== 1 ? 'es' : ''} recorded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon(status.conditions?.status || 'idle')}
              <Badge variant={getStatusBadge(status.conditions?.status || 'idle')}>
                {getStatusText(status.conditions?.status || 'idle')}
              </Badge>
            </div>
          </div>

          {status.conditions?.status === 'failed' && status.conditions?.error && (
            <div className="ml-8 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <p className="text-red-700 font-semibold mb-1">Error</p>
              <p className="text-red-600 text-xs">{status.conditions.error}</p>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => onRetry('conditions')}
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {showDetails && status.conditions?.submissionIds && (
            <div className="ml-8 space-y-1">
              {status.conditions.submissionIds.map((id, i) => (
                <div key={i} className="text-xs text-gray-600 font-mono truncate">
                  Diagnosis {i + 1}: {id}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Observations Section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium">Vital Signs</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {status.observations?.count || 0} vital sign
                  {(status.observations?.count || 0) !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon(status.observations?.status || 'idle')}
              <Badge variant={getStatusBadge(status.observations?.status || 'idle')}>
                {getStatusText(status.observations?.status || 'idle')}
              </Badge>
            </div>
          </div>

          {status.observations?.status === 'failed' &&
            status.observations?.error && (
              <div className="ml-8 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="text-red-700 font-semibold mb-1">Error</p>
                <p className="text-red-600 text-xs">{status.observations.error}</p>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onRetry('observations')}
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

          {showDetails && status.observations?.submissionIds && (
            <div className="ml-8 space-y-1">
              {status.observations.submissionIds.map((id, i) => (
                <div key={i} className="text-xs text-gray-600 font-mono truncate">
                  Observation {i + 1}: {id}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Message */}
        {status.status === 'success' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">All clinical data synced</p>
                <p className="text-sm text-green-700 mt-1">
                  Encounter, diagnoses, and vital signs have been successfully submitted to
                  SatuSehat.
                </p>
              </div>
            </div>
          </div>
        )}

        {status.status === 'partial' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Some submissions failed</p>
                <p className="text-sm text-yellow-700 mt-1">
                  {completedItems}/{totalItems} items submitted successfully. Check the errors
                  above and retry failed submissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ClinicalDataStatusSection;
