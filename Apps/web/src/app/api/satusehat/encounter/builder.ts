/**
 * FHIR Encounter Resource Builder
 * Converts clinic appointment/medical record data to FHIR Encounter resource
 */

import type { FhirEncounter } from '@/lib/api/satusehat/client';
import { buildFhirReference, buildFhirCoding, formatToISODateTime } from '@/lib/api/satusehat/utils';

interface BuildEncounterParams {
  encounter: any; // Appointment data
  medicalRecord?: any; // Medical record data (optional)
  patientIhsNumber: string;
  practitionerResourceId: string;
  locationResourceId?: string;
}

/**
 * Build FHIR Encounter resource from clinic appointment/medical record data
 */
export function buildFhirEncounter(params: BuildEncounterParams): FhirEncounter {
  const {
    encounter,
    medicalRecord,
    patientIhsNumber,
    practitionerResourceId,
    locationResourceId,
  } = params;

  // Determine encounter status
  let status = 'completed';
  if (encounter.status === 'cancelled') {
    status = 'cancelled';
  } else if (encounter.status === 'pending' || encounter.status === 'scheduled') {
    status = 'planned';
  } else if (encounter.status === 'in-progress') {
    status = 'in-progress';
  }

  // Build period (start and end time)
  const startTime = encounter.appointment_date || encounter.created_at;
  const endTime = medicalRecord?.completed_at || new Date().toISOString();

  const period = {
    start: formatToISODateTime(startTime),
    ...(status === 'completed' && { end: formatToISODateTime(endTime) }),
  };

  // Build encounter resource
  const fhirEncounter: FhirEncounter = {
    resourceType: 'Encounter',
    identifier: [
      {
        system: 'https://fhir.kemkes.go.id/id/encounter',
        value: encounter.id,
      },
    ],
    status,
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB', // Ambulatory
      display: 'Ambulatory',
    },
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'ROUTINEVISIT',
            display: 'Routine Visit',
          },
        ],
      },
    ],
    subject: buildFhirReference('Patient', patientIhsNumber, encounter.patients?.name),
    participant: [
      {
        individual: buildFhirReference('Practitioner', practitionerResourceId),
        type: [
          {
            coding: [
              buildFhirCoding(
                'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                'PPRF',
                'Primary Performer'
              ),
            ],
          },
        ],
      },
    ],
    period,
    ...(locationResourceId && {
      location: [
        {
          location: buildFhirReference('Location', locationResourceId),
        },
      ],
    }),
    serviceProvider: {
      reference: 'Organization/clinic-001', // Should be replaced with actual org ID
    },

    // Add diagnosis from medical record if available
    ...(medicalRecord?.diagnoses && medicalRecord.diagnoses.length > 0 && {
      diagnosis: medicalRecord.diagnoses.map((diagnosis: any, index: number) => ({
        condition: {
          reference: `Condition/${diagnosis.id}`,
          display: diagnosis.diagnosis_text || diagnosis.icd10_code,
        },
        rank: index + 1,
      })),
    }),

    // Add reason for visit
    ...(medicalRecord?.chief_complaint && {
      reason: [
        {
          use: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/encounter-reason-use',
                  code: 'RCC',
                  display: 'Reason for Consultation/Complaint',
                },
              ],
            },
          ],
          value: [
            {
              reference: {
                display: medicalRecord.chief_complaint,
              },
            },
          ],
        },
      ],
    }),
  };

  return fhirEncounter;
}
