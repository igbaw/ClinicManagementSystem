/**
 * POST /api/satusehat/clinical-data/submit
 * Submit clinical data (conditions, observations) from medical records to SatuSehat
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { buildFhirCondition, buildFhirObservation } from './builders';
import { SubmissionStatus, ResourceType } from '@/lib/api/satusehat/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { medicalRecordId, dataType } = body; // dataType: 'condition' | 'observation' | 'all'

    if (!medicalRecordId) {
      return NextResponse.json(
        { error: 'Missing medicalRecordId' },
        { status: 400 }
      );
    }

    // Get medical record
    const { data: medicalRecord, error: mrError } = await supabase
      .from('medical_records')
      .select('*, patients(*), appointments(*)')
      .eq('id', medicalRecordId)
      .single();

    if (mrError || !medicalRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    const patient = medicalRecord.patients;

    // Check if patient has been synced to SatuSehat
    if (!patient.ihs_number) {
      return NextResponse.json(
        { error: 'Patient not synced to SatuSehat yet' },
        { status: 400 }
      );
    }

    const submissions = [];

    // Submit conditions (diagnoses)
    if (!dataType || dataType === 'all' || dataType === 'condition') {
      if (medicalRecord.diagnosis_icd10 && medicalRecord.diagnosis_icd10.length > 0) {
        for (const diagnosis of medicalRecord.diagnosis_icd10) {
          const fhirCondition = buildFhirCondition({
            medicalRecord,
            diagnosis,
            patientIhsNumber: patient.ihs_number,
            practitionerId: medicalRecord.doctor_id,
          });

          const { data: submission, error } = await supabase
            .from('satusehat_submissions')
            .insert({
              resource_type: ResourceType.CONDITION,
              local_id: medicalRecordId,
              submission_status: SubmissionStatus.PENDING,
              request_payload: fhirCondition,
              submitted_by: user.id,
            })
            .select('id')
            .single();

          if (!error && submission) {
            submissions.push({
              type: 'Condition',
              submissionId: submission.id,
              diagnosis: diagnosis,
            });
          }
        }
      }
    }

    // Submit observations (vital signs)
    if (!dataType || dataType === 'all' || dataType === 'observation') {
      if (medicalRecord.vital_signs) {
        const observations = buildFhirObservations({
          medicalRecord,
          vitalSigns: medicalRecord.vital_signs,
          patientIhsNumber: patient.ihs_number,
          practitionerId: medicalRecord.doctor_id,
        });

        for (const observation of observations) {
          const { data: submission, error } = await supabase
            .from('satusehat_submissions')
            .insert({
              resource_type: ResourceType.OBSERVATION,
              local_id: medicalRecordId,
              submission_status: SubmissionStatus.PENDING,
              request_payload: observation,
              submitted_by: user.id,
            })
            .select('id')
            .single();

          if (!error && submission) {
            submissions.push({
              type: 'Observation',
              submissionId: submission.id,
              code: (observation.code as any).coding?.[0]?.display || 'Unknown',
            });
          }
        }
      }
    }

    if (submissions.length === 0) {
      return NextResponse.json(
        {
          message: 'No clinical data to submit',
        },
        { status: 200 }
      );
    }

    // Log sync event
    await supabase.from('satusehat_sync_events').insert({
      event_type: 'clinical_data_submitted',
      resource_type: 'MedicalRecord',
      resource_id: medicalRecordId,
      details: {
        submission_count: submissions.length,
        data_types: submissions.map((s: any) => s.type),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${submissions.length} clinical data submission(s) queued`,
      submissions,
    });
  } catch (error) {
    console.error('Clinical data submission error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to build FHIR observations from vital signs
 */
function buildFhirObservations(params: any) {
  const observations = [];

  const vitalSigns = params.vitalSigns || {};
  const { patientIhsNumber, practitionerId, medicalRecord } = params;

  // Blood Pressure
  if (vitalSigns.blood_pressure) {
    observations.push(
      buildFhirObservation({
        code: 'BP',
        display: 'Blood Pressure',
        value: vitalSigns.blood_pressure,
        unit: 'mmHg',
        patientIhsNumber,
        practitionerId,
        medicalRecord,
      })
    );
  }

  // Heart Rate
  if (vitalSigns.heart_rate) {
    observations.push(
      buildFhirObservation({
        code: '8867-4',
        display: 'Heart Rate',
        value: vitalSigns.heart_rate,
        unit: 'bpm',
        patientIhsNumber,
        practitionerId,
        medicalRecord,
      })
    );
  }

  // Temperature
  if (vitalSigns.temperature) {
    observations.push(
      buildFhirObservation({
        code: '8310-5',
        display: 'Body Temperature',
        value: vitalSigns.temperature,
        unit: '°C',
        patientIhsNumber,
        practitionerId,
        medicalRecord,
      })
    );
  }

  // Respiratory Rate
  if (vitalSigns.respiratory_rate) {
    observations.push(
      buildFhirObservation({
        code: '9279-1',
        display: 'Respiratory Rate',
        value: vitalSigns.respiratory_rate,
        unit: '/min',
        patientIhsNumber,
        practitionerId,
        medicalRecord,
      })
    );
  }

  // Weight
  if (vitalSigns.weight) {
    observations.push(
      buildFhirObservation({
        code: '29463-7',
        display: 'Body Weight',
        value: vitalSigns.weight,
        unit: 'kg',
        patientIhsNumber,
        practitionerId,
        medicalRecord,
      })
    );
  }

  // Height
  if (vitalSigns.height) {
    observations.push(
      buildFhirObservation({
        code: '8302-2',
        display: 'Body Height',
        value: vitalSigns.height,
        unit: 'cm',
        patientIhsNumber,
        practitionerId,
        medicalRecord,
      })
    );
  }

  return observations;
}
