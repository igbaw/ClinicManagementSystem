/**
 * BPJS Claim Builder Service
 * Foundation for BPJS claims integration (currently disabled/hidden)
 *
 * Purpose:
 * - Convert billing records to FHIR Claim format for BPJS E-Klaim system
 * - Currently serves as a placeholder for future enablement
 * - Will be enabled when clinic accepts BPJS patients
 *
 * Status: FOUNDATION ONLY
 * - Structure defined
 * - Feature flag disabled by default
 * - UI components hidden
 * - Database support ready (satusehat_claims table)
 *
 * When Enabled:
 * 1. Clinic must register with BPJS and obtain credentials
 * 2. Feature flag will be enabled in UI
 * 3. Claims will be submitted to BPJS E-Klaim via SatuSehat
 * 4. ClaimResponse will be tracked for verification results
 */

import {
  FhirClaim,
  FhirClaimResponse,
} from '@/lib/api/satusehat/client';

/**
 * BPJS Configuration (to be set when enabling BPJS)
 */
export interface BpjsConfig {
  enabled: boolean; // Feature flag
  clinicBpjsCode?: string; // BPJS clinic identifier
  participantNumber?: string; // Clinic participant number
  contactPersonName?: string;
  contactPersonPhone?: string;
}

/**
 * BPJS Diagnosis information for claims
 */
export interface BpjsDiagnosis {
  icdCode: string; // ICD-10 code
  diagnosisText: string;
  isPrimary: boolean; // True for primary diagnosis
}

/**
 * BPJS Service information
 */
export interface BpjsService {
  serviceCode: string; // BPJS service code
  serviceName: string;
  quantity: number;
  unitPrice: number; // BPJS tariff
  total: number;
}

/**
 * BPJS Claim Builder (Foundation)
 */
export class BpjsClaimBuilder {
  private config: BpjsConfig;
  private isEnabled: boolean;

  constructor(config?: Partial<BpjsConfig>) {
    this.config = {
      enabled: false, // Default disabled
      ...config,
    };
    this.isEnabled = this.config.enabled;
  }

  /**
   * Check if BPJS is enabled
   */
  isFeatureEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable BPJS feature (requires proper configuration)
   */
  enableFeature(config: Partial<BpjsConfig>): boolean {
    if (
      !config.clinicBpjsCode ||
      !config.participantNumber
    ) {
      console.error(
        'BPJS configuration incomplete: clinicBpjsCode and participantNumber required'
      );
      return false;
    }

    this.config = { ...this.config, ...config, enabled: true };
    this.isEnabled = true;
    return true;
  }

  /**
   * Disable BPJS feature
   */
  disableFeature(): void {
    this.config.enabled = false;
    this.isEnabled = false;
  }

  /**
   * Build FHIR Claim for BPJS (Foundation)
   * Returns claim structure but does NOT submit
   */
  buildClaimForBpjs(
    claimId: string,
    patientData: {
      id: string;
      nik: string;
      fullName: string;
      bpjsNumber: string;
    },
    diagnoses: BpjsDiagnosis[],
    services: BpjsService[],
    visitDate: string,
    clinicName: string
  ): FhirClaim {
    // Foundation structure - not yet enabled for submission
    return {
      resourceType: 'Claim',

      status: 'draft' as const,
      use: 'claim',
      insurer: {
        reference: 'Organization/BPJS',
        display: 'BPJS Kesehatan',
      },

      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/claim-type',
            code: 'institutional',
            display: 'Institutional',
          },
        ],
      },

      // Patient identification
      patient: {
        reference: `Patient/${patientData.nik}`,
        display: patientData.fullName,
      },

      // When the service was provided
      billablePeriod: {
        start: visitDate,
        end: visitDate,
      },

      // When the claim was created
      created: new Date().toISOString(),

      // Insurance information (BPJS)
      insurance: [
        {
          sequence: 1,
          focal: true,
          coverage: {
            reference: `Coverage/${patientData.bpjsNumber}`,
            display: `BPJS Insurance - ${patientData.bpjsNumber}`,
          },
        },
      ],

      // Provider (clinic)
      provider: {
        reference: `Organization/${this.config.clinicBpjsCode || 'UNKNOWN'}`,
        display: clinicName,
      },

      // Priority
      priority: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/processpriority',
            code: 'normal',
            display: 'Normal',
          },
        ],
      },

      // Diagnosis information
      diagnosis: diagnoses.map((diagnosis, index) => ({
        sequence: index + 1,
        diagnosisCodeableConcept: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: diagnosis.icdCode,
              display: diagnosis.diagnosisText,
            },
          ],
          text: diagnosis.diagnosisText,
        },
        type: diagnosis.isPrimary
          ? [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/ex-diagnosistype',
                  code: 'principal',
                  display: 'Principal Diagnosis',
                },
              ],
            },
          ]
          : [],
      })),

      // Items/services provided
      item: services.map((service, index) => ({
        sequence: index + 1,

        careTeamSequence: [],

        diagnosisSequence: [1], // Reference to primary diagnosis

        // Service code
        productOrService: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/ex-serviceplace',
              code: service.serviceCode,
              display: service.serviceName,
            },
          ],
          text: service.serviceName,
        },

        // Quantity
        quantity: {
          value: service.quantity,
        },

        // Unit amount (BPJS tariff)
        unitAmount: {
          value: service.unitPrice,
          currency: 'IDR',
        },

        // Net amount
        net: {
          value: service.total,
          currency: 'IDR',
        },
      })),

      // Total
      total: [
        {
          category: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/adjudication',
                code: 'submitted',
                display: 'Submitted Amount',
              },
            ],
          },
          amount: {
            value: services.reduce((sum, svc) => sum + svc.total, 0),
            currency: 'IDR',
          },
        },
      ],
    };
  }

  /**
   * Build Claim Response (placeholder for BPJS response)
   * Used when receiving claim verification from BPJS
   */
  buildClaimResponseForBpjs(
    responseId: string,
    originalClaimId: string,
    status: 'active' | 'cancelled' | 'error',
    approvedAmount: number,
    rejectedAmount: number,
    notes?: string
  ): FhirClaimResponse {
    return {
      resourceType: 'ClaimResponse',

      status: (status === 'error' ? 'entered-in-error' : status) as
        | 'active'
        | 'cancelled'
        | 'entered-in-error',

      use: 'claim',

      patient: {
        reference: 'Patient/unknown', // Should be populated from original claim
      },

      insurer: {
        reference: 'Organization/BPJS',
        display: 'BPJS Kesehatan',
      },

      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/claim-type',
            code: 'institutional',
            display: 'Institutional',
          },
        ],
      },

      // Reference to original claim
      request: {
        reference: `Claim/${originalClaimId}`,
      },

      // When response was created
      created: new Date().toISOString(),

      // Outcome
      outcome: status === 'active' ? 'complete' : 'error',

      // Processing notes
      processNote: notes
        ? [
          {
            text: notes,
          },
        ]
        : [],



      // Adjudication summary (Total)
      total: [
        {
          category: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/adjudication',
                code: 'eligible',
                display: 'Eligible Amount',
              },
            ],
          },
          amount: {
            value: approvedAmount,
            currency: 'IDR',
          },
        },
        // Note: 'denied' is not usually a total category in standard examples but we can include it if needed
        // or just leave eligible amount.
      ],
    };
  }

  /**
   * Validate BPJS claim before submission
   * Returns validation result
   */
  validateClaimForBpjs(claim: FhirClaim): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if BPJS is enabled
    if (!this.isEnabled) {
      errors.push('BPJS feature is not enabled');
    }

    // Check required fields
    if (!claim.patient?.reference) {
      errors.push('Patient reference is required');
    }

    if (!claim.provider?.reference) {
      errors.push('Provider reference is required');
    }

    if (!claim.insurance || claim.insurance.length === 0) {
      errors.push('At least one insurance entry is required');
    }

    if (!claim.diagnosis || claim.diagnosis.length === 0) {
      errors.push('At least one diagnosis is required');
    }

    if (!claim.item || claim.item.length === 0) {
      errors.push('At least one service item is required');
    }

    if (!claim.total || claim.total.length === 0 || claim.total[0].amount.value <= 0) {
      errors.push('Claim total must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get BPJS configuration (read-only)
   */
  getConfig(): Readonly<BpjsConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get status message for UI
   */
  getStatusMessage(): string {
    if (!this.isEnabled) {
      return 'BPJS integration is not yet enabled for this clinic. Contact administrator to enable BPJS support.';
    }

    if (!this.config.clinicBpjsCode) {
      return 'BPJS configuration incomplete. Please contact administrator.';
    }

    return `BPJS enabled - Clinic Code: ${this.config.clinicBpjsCode}`;
  }
}

/**
 * Create BPJS claim builder instance
 */
export function createBpjsClaimBuilder(
  config?: Partial<BpjsConfig>
): BpjsClaimBuilder {
  return new BpjsClaimBuilder(config);
}

/**
 * Get global BPJS configuration
 * This would come from environment variables or admin settings
 */
export function getBpjsConfig(): BpjsConfig {
  const enabled =
    process.env.NEXT_PUBLIC_BPJS_ENABLED === 'true' ||
    process.env.BPJS_ENABLED === 'true';

  return {
    enabled,
    clinicBpjsCode: process.env.NEXT_PUBLIC_BPJS_PPK_CODE,
    participantNumber: process.env.BPJS_PARTICIPANT_NUMBER,
    contactPersonName: process.env.BPJS_CONTACT_NAME,
    contactPersonPhone: process.env.BPJS_CONTACT_PHONE,
  };
}
