import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { booking_code } = await request.json();

    // Validate booking code
    if (!booking_code) {
      return NextResponse.json(
        { success: false, error: 'MISSING_BOOKING_CODE', message: 'Booking code is required' },
        { status: 400 }
      );
    }

    // Normalize booking code (uppercase, trim)
    const normalizedCode = booking_code.toString().toUpperCase().trim();

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find appointment by booking code
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        booking_code,
        appointment_date,
        appointment_time,
        status,
        patient_id,
        doctor_id,
        patients!appointments_patient_id_fkey (
          id,
          full_name,
          medical_record_number
        ),
        users!appointments_doctor_id_fkey (
          id,
          full_name
        )
      `)
      .eq('booking_code', normalizedCode)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { success: false, error: 'BOOKING_NOT_FOUND', message: 'Kode booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if appointment is for today
    const today = new Date().toISOString().split('T')[0];
    if (appointment.appointment_date !== today) {
      return NextResponse.json({
        success: false,
        error: 'WRONG_DATE',
        message: `Janji temu ini untuk tanggal ${new Date(appointment.appointment_date).toLocaleDateString('id-ID')}`,
        data: { appointment_date: appointment.appointment_date },
      }, { status: 400 });
    }

    // Check if appointment is cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'APPOINTMENT_CANCELLED', message: 'Janji temu ini telah dibatalkan' },
        { status: 400 }
      );
    }

    // Check if already checked in
    const { data: existingQueue, error: queueCheckError } = await supabase
      .from('queue_entries')
      .select('id, queue_number, check_in_time')
      .eq('appointment_id', appointment.id)
      .eq('queue_date', today)
      .single();

    if (!queueCheckError && existingQueue) {
      return NextResponse.json({
        success: false,
        error: 'ALREADY_CHECKED_IN',
        message: `Anda sudah check-in dengan nomor antrian ${existingQueue.queue_number}`,
        data: {
          queue_number: existingQueue.queue_number,
          checked_in_at: existingQueue.check_in_time,
        },
      }, { status: 400 });
    }

    // Get next queue number
    const { data: queueNumberData, error: queueNumberError } = await supabase
      .rpc('get_next_queue_number', { p_doctor_id: appointment.doctor_id });

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
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_id: appointment.id,
        entry_type: 'appointment',
        queue_number: queueNumber,
        queue_date: today,
        status: 'waiting',
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

    // Update appointment status (optional - can keep as 'scheduled')
    await supabase
      .from('appointments')
      .update({ status: 'checked_in' })
      .eq('id', appointment.id);

    return NextResponse.json({
      success: true,
      data: {
        queue_entry_id: queueEntry.id,
        queue_number: queueNumber,
        queue_date: today,
        entry_type: 'appointment',
        appointment: {
          id: appointment.id,
          booking_code: appointment.booking_code,
          appointment_time: appointment.appointment_time,
        },
        patient: {
          id: (Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients)?.id,
          full_name: (Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients)?.full_name,
          medical_record_number: (Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients)?.medical_record_number,
        },
        doctor: {
          id: (Array.isArray(appointment.users) ? appointment.users[0] : appointment.users)?.id,
          full_name: (Array.isArray(appointment.users) ? appointment.users[0] : appointment.users)?.full_name,
        },
      },
    });
  } catch (error) {
    console.error('Booking check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
