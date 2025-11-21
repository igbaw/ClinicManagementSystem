/**
 * POST /api/satusehat/patient/sync
 * Sync a patient to SatuSehat (creates submission and queues it)
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SatuSehatClient } from '@/lib/api/satusehat/client';
import { buildFhirPatient } from '../builder';
import { isValidNIK } from '@/lib/api/satusehat/utils';
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
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId' },
        { status: 400 }
      );
    }

    // Get patient data
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Validate NIK
    if (!isValidNIK(patient.nik)) {
      return NextResponse.json(
        { error: 'Invalid NIK format' },
        { status: 400 }
      );
    }

    // Check if patient already synced
    if (patient.ihs_number) {
      return NextResponse.json(
        {
          message: 'Patient already synced',
          ihsNumber: patient.ihs_number,
        },
        { status: 200 }
      );
    }

    // Search for existing patient in SatuSehat by NIK
    const satusehatClient = new SatuSehatClient();
    let existingPatient: any = null;

    try {
      const searchResult = await satusehatClient.searchPatientByNIK(patient.nik);
      if (searchResult.total && searchResult.total > 0 && searchResult.entry?.[0]) {
        existingPatient = searchResult.entry[0].resource;
      }
    } catch (error) {
      console.warn('Failed to search existing patient:', error);
      // Continue with patient creation even if search fails
    }

    // Build FHIR patient resource
    const fhirPatient = buildFhirPatient(patient);

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('satusehat_submissions')
      .insert({
        resource_type: ResourceType.PATIENT,
        local_id: patientId,
        submission_status: SubmissionStatus.PENDING,
        request_payload: fhirPatient,
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

    // Update patient sync status to pending
    await supabase
      .from('patients')
      .update({
        satusehat_sync_status: 'pending',
      })
      .eq('id', patientId);

    // Log sync event
    await supabase.from('satusehat_sync_events').insert({
      event_type: 'patient_created',
      resource_type: ResourceType.PATIENT,
      resource_id: patientId,
      details: {
        existing_patient: existingPatient ? true : false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Patient sync queued',
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Patient sync error:', error);

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
