/**
 * FHIR Clinical Data Builders
 * Converts medical record data to FHIR Condition and Observation resources
 */

import type { FhirCondition, FhirObservation } from '@/lib/api/satusehat/client';
import {
  buildFhirReference,
  buildFhirCoding,
  formatToISODateTime,
  formatToISODate,
} from '@/lib/api/satusehat/utils';

/**
 * Build FHIR Condition resource from diagnosis
 */
export function buildFhirCondition(params: {
  medicalRecord: any;
  diagnosis: any;
  patientIhsNumber: string;
  practitionerId: string;
}): FhirCondition {
  const { medicalRecord, diagnosis, patientIhsNumber, practitionerId } = params;

  return {
    resourceType: 'Condition',
    identifier: [
      {
        system: 'https://fhir.kemkes.go.id/id/condition',
        value: `${medicalRecord.id}-${diagnosis.icd10_code || 'custom'}`,
      },
    ],
    clinicalStatus: {
      coding: [
        buildFhirCoding(
          'http://terminology.hl7.org/CodeSystem/condition-clinical',
          'active',
          'Active'
        ),
      ],
    },
    verificationStatus: {
      coding: [
        buildFhirCoding(
          'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          'confirmed',
          'Confirmed'
        ),
      ],
    },
    category: [
      {
        coding: [
          buildFhirCoding(
            'http://terminology.hl7.org/CodeSystem/condition-category',
            'encounter-diagnosis',
            'Encounter Diagnosis'
          ),
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: diagnosis.icd10_code || 'R99',
          display: diagnosis.diagnosis_text || 'Unspecified diagnosis',
        },
      ],
      text: diagnosis.diagnosis_text || diagnosis.icd10_code,
    },
    subject: buildFhirReference('Patient', patientIhsNumber),
    encounter: buildFhirReference('Encounter', medicalRecord.appointment_id),
    onsetDateTime: formatToISODateTime(medicalRecord.visit_date),
    recorder: buildFhirReference('Practitioner', practitionerId),
    asserter: buildFhirReference('Practitioner', practitionerId),
  };
}

/**
 * Build FHIR Observation resource from vital signs or lab result
 */
export function buildFhirObservation(params: {
  code: string;
  display: string;
  value: number | string;
  unit: string;
  patientIhsNumber: string;
  practitionerId: string;
  medicalRecord: any;
  referenceRange?: { low?: number; high?: number };
}): FhirObservation {
  const {
    code,
    display,
    value,
    unit,
    patientIhsNumber,
    practitionerId,
    medicalRecord,
    referenceRange,
  } = params;

  // Map code to LOINC if it's a short code
  const loincCode = mapToLoincCode(code);

  // Build reference range if provided
  const range = referenceRange
    ? [
        {
          low: referenceRange.low ? { value: referenceRange.low, unit } : undefined,
          high: referenceRange.high ? { value: referenceRange.high, unit } : undefined,
        },
      ].filter(r => r.low || r.high)
    : undefined;

  const observation: FhirObservation = {
    resourceType: 'Observation',
    identifier: [
      {
        system: 'https://fhir.kemkes.go.id/id/observation',
        value: `${medicalRecord.id}-${code}`,
      },
    ],
    status: 'final',
    category: [
      {
        coding: [
          buildFhirCoding(
            'http://terminology.hl7.org/CodeSystem/observation-category',
            'vital-signs',
            'Vital Signs'
          ),
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loincCode,
          display: display,
        },
      ],
      text: display,
    },
    subject: buildFhirReference('Patient', patientIhsNumber),
    encounter: buildFhirReference('Encounter', medicalRecord.appointment_id),
    effectiveDateTime: formatToISODateTime(medicalRecord.visit_date),
    issued: formatToISODateTime(new Date()),
    performer: [buildFhirReference('Practitioner', practitionerId)],

    // Add value based on type
    ...(typeof value === 'number' && {
      valueQuantity: {
        value,
        unit,
        system: 'http://unitsofmeasure.org',
        code: mapToUcumCode(unit),
      },
    }),

    // Add reference range if provided
    ...(range && range.length > 0 && { referenceRange: range }),
  };

  return observation;
}

/**
 * Map short code to LOINC code
 */
function mapToLoincCode(code: string): string {
  const codeMap: Record<string, string> = {
    'BP': '85354-9', // Blood Pressure
    'HR': '8867-4', // Heart Rate
    'RR': '9279-1', // Respiratory Rate
    'TEMP': '8310-5', // Body Temperature
    'O2SAT': '2708-6', // Oxygen Saturation
    'WT': '29463-7', // Body Weight
    'HT': '8302-2', // Body Height
    'BMI': '39156-5', // BMI
  };

  return codeMap[code.toUpperCase()] || code;
}

/**
 * Map unit to UCUM code
 */
function mapToUcumCode(unit: string): string {
  const unitMap: Record<string, string> = {
    'mmHg': 'mm[Hg]',
    'bpm': '/min',
    '°C': 'Cel',
    'C': 'Cel',
    '/min': '/min',
    'kg': 'kg',
    'cm': 'cm',
    'm': 'm',
    '%': '%',
    'g/dL': 'g/dL',
    'mg/dL': 'mg/dL',
  };

  return unitMap[unit] || unit;
}
