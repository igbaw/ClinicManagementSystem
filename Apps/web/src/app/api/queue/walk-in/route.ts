import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { patient_id, doctor_id, chief_complaint, notes, vital_signs } = await request.json();

    // Validate required fields
    if (!patient_id || !doctor_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Patient ID and Doctor ID are required' },
        { status: 400 }
      );
    }

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name, medical_record_number')
      .eq('id', patient_id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { success: false, error: 'PATIENT_NOT_FOUND', message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', doctor_id)
      .eq('role', 'doctor')
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json(
        { success: false, error: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Get next queue number for this doctor today
    const { data: queueNumberData, error: queueNumberError } = await supabase
      .rpc('get_next_queue_number', { p_doctor_id: doctor_id });

    if (queueNumberError) {
      console.error('Error getting queue number:', queueNumberError);
      return NextResponse.json(
        { success: false, error: 'QUEUE_NUMBER_ERROR', message: 'Failed to generate queue number' },
        { status: 500 }
      );
    }

    const queueNumber = queueNumberData as number;

    // Create queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from('queue_entries')
      .insert({
        patient_id,
        doctor_id,
        entry_type: 'walk-in',
        queue_number: queueNumber,
        queue_date: new Date().toISOString().split('T')[0],
        status: 'waiting',
        chief_complaint,
        notes,
        vital_signs,
        created_by: user.id,
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error creating queue entry:', queueError);
      return NextResponse.json(
        { success: false, error: 'QUEUE_CREATION_ERROR', message: 'Failed to create queue entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        queue_entry_id: queueEntry.id,
        queue_number: queueNumber,
        queue_date: queueEntry.queue_date,
        entry_type: 'walk-in',
        patient: {
          id: patient.id,
          full_name: patient.full_name,
          medical_record_number: patient.medical_record_number,
        },
        doctor: {
          id: doctor.id,
          full_name: doctor.full_name,
        },
        chief_complaint,
      },
    });
  } catch (error) {
    console.error('Walk-in check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
