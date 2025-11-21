/**
 * POST /api/satusehat/encounter/submit
 * Submit an encounter (from appointment/medical record) to SatuSehat
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { buildFhirEncounter } from '../builder';
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
    const { appointmentId, medicalRecordId } = body;

    if (!appointmentId && !medicalRecordId) {
      return NextResponse.json(
        { error: 'Missing appointmentId or medicalRecordId' },
        { status: 400 }
      );
    }

    // Get appointment/medical record data
    let appointmentData = null;
    let medicalRecordData = null;

    if (appointmentId) {
      const { data: apt, error: aptError } = await supabase
        .from('appointments')
        .select('*, patients(*, users(name))')
        .eq('id', appointmentId)
        .single();

      if (aptError || !apt) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      appointmentData = apt;
    }

    if (medicalRecordId) {
      const { data: mr, error: mrError } = await supabase
        .from('medical_records')
        .select('*, appointments(*, patients(*))')
        .eq('id', medicalRecordId)
        .single();

      if (mrError || !mr) {
        return NextResponse.json(
          { error: 'Medical record not found' },
          { status: 404 }
        );
      }

      medicalRecordData = mr;
    }

    // Get or use appointment data from medical record
    const encounter = appointmentData || medicalRecordData?.appointments;

    if (!encounter) {
      return NextResponse.json(
        { error: 'No encounter data found' },
        { status: 400 }
      );
    }

    // Check if patient has been synced to SatuSehat
    const patient = encounter.patients;
    if (!patient.ihs_number) {
      return NextResponse.json(
        { error: 'Patient not synced to SatuSehat yet' },
        { status: 400 }
      );
    }

    // Check if practitioner is synced
    const { data: practitionerData } = await supabase
      .from('satusehat_practitioners')
      .select('resource_id')
      .eq('user_id', encounter.assigned_to)
      .single();

    if (!practitionerData?.resource_id) {
      return NextResponse.json(
        {
          error: 'Practitioner not synced to SatuSehat yet',
          message: 'Doctor must be registered in SatuSehat first',
        },
        { status: 400 }
      );
    }

    // Build FHIR encounter resource
    const fhirEncounter = buildFhirEncounter({
      encounter,
      medicalRecord: medicalRecordData,
      patientIhsNumber: patient.ihs_number,
      practitionerResourceId: practitionerData.resource_id,
    });

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('satusehat_submissions')
      .insert({
        resource_type: ResourceType.ENCOUNTER,
        local_id: appointmentId || medicalRecordId,
        submission_status: SubmissionStatus.PENDING,
        request_payload: fhirEncounter,
        submitted_by: user.id,
      })
      .select('id')
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Failed to create submission record' },
        { status: 500 }
      );
    }

    // Create encounter tracking record
    await supabase
      .from('satusehat_encounters')
      .insert({
        appointment_id: appointmentId,
        medical_record_id: medicalRecordId,
        submission_id: submission.id,
      });

    // Log sync event
    await supabase.from('satusehat_sync_events').insert({
      event_type: 'encounter_submitted',
      resource_type: ResourceType.ENCOUNTER,
      resource_id: appointmentId || medicalRecordId,
      details: {
        appointment_id: appointmentId,
        medical_record_id: medicalRecordId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Encounter submission queued',
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Encounter submission error:', error);

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
