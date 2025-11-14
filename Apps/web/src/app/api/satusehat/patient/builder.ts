/**
 * FHIR Patient Resource Builder
 * Converts clinic patient data to FHIR Patient resource
 */

import type { FhirPatient } from '@/lib/api/satusehat/client';
import {
  buildFhirIdentifier,
  buildFhirName,
  buildFhirAddress,
  buildFhirTelecom,
} from '@/lib/api/satusehat/utils';

interface ClincPatient {
  id: string;
  nik: string;
  name: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  bpjs_number?: string;
  marital_status?: string;
  occupation?: string;
  religion?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  [key: string]: unknown;
}

/**
 * Build FHIR Patient resource from clinic patient data
 */
export function buildFhirPatient(patient: ClincPatient): FhirPatient {
  const identifiers = [
    buildFhirIdentifier(
      'https://fhir.kemkes.go.id/id/nik',
      patient.nik,
      'NIK'
    ),
  ];

  // Add BPJS number if available
  if (patient.bpjs_number) {
    identifiers.push(
      buildFhirIdentifier(
        'https://fhir.kemkes.go.id/id/bpjs',
        patient.bpjs_number,
        'BPJS'
      )
    );
  }

  // Parse gender (convert to FHIR format: male, female, other, unknown)
  let fhirGender = 'unknown';
  if (patient.gender) {
    const genderLower = patient.gender.toLowerCase();
    if (genderLower === 'pria' || genderLower === 'male' || genderLower === 'm') {
      fhirGender = 'male';
    } else if (genderLower === 'wanita' || genderLower === 'female' || genderLower === 'f') {
      fhirGender = 'female';
    }
  }

  // Build name
  const name = buildFhirName(patient.name);

  // Build address
  const addressLines = patient.address ? [patient.address] : [];
  const address = addressLines.length > 0
    ? [
        buildFhirAddress(
          addressLines,
          patient.city,
          patient.postal_code,
          'ID'
        ),
      ]
    : undefined;

  // Build telecom (contact information)
  const telecom = [];
  if (patient.phone) {
    telecom.push(buildFhirTelecom('phone', patient.phone, 'home'));
  }
  if (patient.email) {
    telecom.push(buildFhirTelecom('email', patient.email, 'home'));
  }

  // Build emergency contact if available
  const contact = [];
  if (patient.emergency_contact_name && patient.emergency_contact_phone) {
    contact.push({
      relationship: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
              code: 'N', // Next of kin
              display: 'Next of Kin',
            },
          ],
        },
      ],
      name: {
        text: patient.emergency_contact_name,
      },
      telecom: [
        {
          system: 'phone',
          value: patient.emergency_contact_phone,
        },
      ],
    });
  }

  // Build communication (language preference)
  const communication = [
    {
      language: {
        coding: [
          {
            system: 'urn:ietf:bcp:47',
            code: 'id', // Indonesian
            display: 'Indonesian',
          },
        ],
      },
      preferred: true,
    },
  ];

  // Build the FHIR Patient resource
  const fhirPatient: FhirPatient = {
    resourceType: 'Patient',
    identifier: identifiers,
    name: [name],
    birthDate: patient.date_of_birth,
    gender: fhirGender,
    address,
    telecom: telecom.length > 0 ? telecom : undefined,
    contact: contact.length > 0 ? contact : undefined,
    communication,
    // Extension for marital status (optional)
    ...(patient.marital_status && {
      maritalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: patient.marital_status.substring(0, 1).toUpperCase(),
          },
        ],
      },
    }),
  };

  return fhirPatient;
}

/**
 * Build FHIR Patient resource for update
 */
export function buildFhirPatientUpdate(patient: ClincPatient): Partial<FhirPatient> {
  return buildFhirPatient(patient);
}
