/**
 * BPJS Hidden Section Component
 * Phase 2B: Hidden BPJS Integration UI
 *
 * Purpose:
 * - Display BPJS configuration status (hidden by default)
 * - Allow admin to view/toggle BPJS feature flag
 * - Show when BPJS will be available
 * - Provides configuration interface when enabled
 *
 * Status: FOUNDATION ONLY
 * - Currently hidden (display: none)
 * - Only visible via debug mode or admin override
 * - Feature disabled until clinic registers with BPJS
 * - Ready for future enablement
 *
 * Usage:
 * <BpjsHiddenSection billingId={billingId} />
 *
 * Or in admin panel:
 * <BpjsHiddenSection billingId={billingId} showDebug={true} />
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { BpjsClaimBuilder, getBpjsConfig } from '@/lib/services/bpjs-claim-builder';

interface BpjsHiddenSectionProps {
  billingId: string;
  showDebug?: boolean; // Dev/admin override to show hidden section
  onBpjsToggle?: (enabled: boolean) => void;
}

/**
 * BPJS Feature Status Component
 * Shows current BPJS configuration and feature flag status
 */
export function BpjsHiddenSection({
  billingId,
  showDebug = false,
  onBpjsToggle,
}: BpjsHiddenSectionProps) {
  const [bpjsBuilder, setBpjsBuilder] = useState<BpjsClaimBuilder | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showExpanded, setShowExpanded] = useState(false);

  // Initialize BPJS builder on component mount
  useEffect(() => {
    const config = getBpjsConfig();
    const builder = new BpjsClaimBuilder(config);
    setBpjsBuilder(builder);
    setIsEnabled(builder.isFeatureEnabled());
    setStatusMessage(builder.getStatusMessage());
  }, []);

  const handleToggleBpjs = () => {
    if (!bpjsBuilder) return;

    if (isEnabled) {
      bpjsBuilder.disableFeature();
    } else {
      // Would normally require admin configuration
      const mockConfig = {
        clinicBpjsCode: 'TEST-CLINIC-001',
        participantNumber: '9999999999',
        contactPersonName: 'Test Contact',
        contactPersonPhone: '08123456789',
      };
      bpjsBuilder.enableFeature(mockConfig);
    }

    setIsEnabled(bpjsBuilder.isFeatureEnabled());
    setStatusMessage(bpjsBuilder.getStatusMessage());
    onBpjsToggle?.(bpjsBuilder.isFeatureEnabled());
  };

  // Don't render unless debug mode is enabled
  if (!showDebug) {
    return null;
  }

  return (
    <>
      {/* Hidden Section - Only visible in debug mode */}
      <div
        className="hidden"
        style={{ display: showDebug ? 'block' : 'none' }}
        data-testid="bpjs-hidden-section"
      >
        <Card className="border-amber-200 bg-amber-50 mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    🏥 BPJS Integration (Hidden - Foundation Only)
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    DISABLED
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  BPJS claims integration is currently disabled for this clinic. This section is
                  hidden and will be enabled when the clinic registers with BPJS.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Feature Status:</strong> {statusMessage}
              </div>
            </Alert>

            {/* Current Configuration */}
            <div className="bg-white rounded border border-amber-200 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">Current Configuration</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">BPJS Enabled:</span>
                  <div className="font-mono text-red-600">{isEnabled ? 'true' : 'false'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Clinic Code:</span>
                  <div className="font-mono text-gray-700">
                    {bpjsBuilder?.getConfig().clinicBpjsCode || 'NOT SET'}
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Reference */}
            <div className="bg-gray-100 rounded border border-gray-200 p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Billing Reference</h4>
              <p className="text-xs text-gray-600 font-mono break-all">{billingId}</p>
            </div>

            {/* Debug Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleBpjs}
                className="text-xs"
              >
                {isEnabled ? '🔴 Disable BPJS' : '🟢 Enable BPJS (Test)'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExpanded(!showExpanded)}
                className="text-xs"
              >
                {showExpanded ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            {/* Expanded Details */}
            {showExpanded && (
              <div className="bg-gray-50 rounded border border-gray-200 p-3 space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Implementation Details</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    <strong>Database Support:</strong> satusehat_claims table ready for claims
                    storage
                  </p>
                  <p>
                    <strong>Service Layer:</strong> BpjsClaimBuilder class available in
                    src/lib/services/
                  </p>
                  <p>
                    <strong>API Support:</strong> SatuSehatClient has createClaim(),
                    getClaimResponse() methods
                  </p>
                  <p>
                    <strong>When Enabled:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Clinic must register with BPJS and obtain credentials</li>
                    <li>Configuration will be stored in environment variables</li>
                    <li>Claims will be submitted via SatuSehat E-Klaim integration</li>
                    <li>ClaimResponse will be tracked for verification results</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden Metadata - For Testing/Development */}
      <div
        style={{ display: 'none' }}
        data-billing-id={billingId}
        data-bpjs-enabled={isEnabled}
        data-bpjs-status={statusMessage}
        className="bpjs-metadata"
      />
    </>
  );
}

/**
 * Admin BPJS Configuration Panel
 * Only visible to admins with proper permissions
 * Used to manage BPJS settings when enabling the feature
 */
export function BpjsAdminPanel() {
  const [config, setConfig] = useState({
    clinicBpjsCode: '',
    participantNumber: '',
    contactPersonName: '',
    contactPersonPhone: '',
  });

  const [showPanel, setShowPanel] = useState(false);

  // This would normally be gated by role check
  const isAdmin = true; // TODO: Check user role

  if (!isAdmin || !showPanel) {
    return null;
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardHeader>
        <CardTitle className="text-base">BPJS Configuration Panel (Admin Only)</CardTitle>
        <CardDescription>
          Configure BPJS integration credentials and settings. This is only visible to administrators.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <div className="text-sm text-amber-800">
            <strong>Warning:</strong> These settings affect all BPJS claims submitted by this
            clinic. Ensure accuracy before enabling BPJS integration.
          </div>
        </Alert>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              BPJS Clinic Code (PPK Code)
            </label>
            <input
              type="text"
              value={config.clinicBpjsCode}
              onChange={(e) => setConfig({ ...config, clinicBpjsCode: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder="e.g., 123456"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Participant Number
            </label>
            <input
              type="text"
              value={config.participantNumber}
              onChange={(e) => setConfig({ ...config, participantNumber: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder="e.g., 9999999999"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Contact Person Name
            </label>
            <input
              type="text"
              value={config.contactPersonName}
              onChange={(e) => setConfig({ ...config, contactPersonName: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder="Contact person name"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Contact Person Phone
            </label>
            <input
              type="tel"
              value={config.contactPersonPhone}
              onChange={(e) => setConfig({ ...config, contactPersonPhone: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder="e.g., +62812345678"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="primary" className="text-xs">
            Save Configuration
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPanel(false)}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * BPJS Status Badge - Can be placed in billing list
 * Shows BPJS-related information for a billing record
 */
export function BpjsStatusBadge({
  bpjsEnabled,
  claimNumber,
}: {
  bpjsEnabled: boolean;
  claimNumber?: string | null;
}) {
  if (!bpjsEnabled && !claimNumber) {
    return null;
  }

  if (claimNumber) {
    return (
      <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
        📋 BPJS Claim: {claimNumber.substring(0, 12)}...
      </Badge>
    );
  }

  return <Badge variant="secondary">🏥 BPJS Ready</Badge>;
}

/**
 * Export all BPJS UI components
 */
export default BpjsHiddenSection;
