import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const doctor_id = searchParams.get('doctor_id');
    const status = searchParams.get('status'); // optional filter

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from('queue_entries')
      .select(`
        id,
        queue_number,
        entry_type,
        status,
        check_in_time,
        started_at,
        completed_at,
        chief_complaint,
        notes,
        queue_date,
        patient:patients (
          id,
          full_name,
          medical_record_number,
          date_of_birth,
          phone
        ),
        doctor:users!queue_entries_doctor_id_fkey (
          id,
          full_name
        ),
        appointment:appointments (
          id,
          appointment_time,
          booking_code
        )
      `)
      .eq('queue_date', date)
      .order('queue_number', { ascending: true });

    // Filter by doctor if specified
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    const { data: queueEntries, error } = await query;

    if (error) {
      console.error('Error fetching queue:', error);
      return NextResponse.json(
        { success: false, error: 'FETCH_ERROR', message: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    // Calculate age for each patient
    const entriesWithAge = queueEntries?.map((entry: any) => ({
      ...entry,
      patient: {
        ...entry.patient,
        age: entry.patient?.date_of_birth 
          ? Math.floor((new Date().getTime() - new Date(entry.patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
          : null,
      },
      appointment_time: entry.appointment?.appointment_time || null,
    }));

    // Calculate summary stats
    const summary = {
      total: entriesWithAge?.length || 0,
      waiting: entriesWithAge?.filter((e: any) => e.status === 'waiting').length || 0,
      in_progress: entriesWithAge?.filter((e: any) => e.status === 'in_progress').length || 0,
      completed: entriesWithAge?.filter((e: any) => e.status === 'completed').length || 0,
      cancelled: entriesWithAge?.filter((e: any) => e.status === 'cancelled').length || 0,
    };

    // Get doctor info if doctor_id was provided
    let doctorInfo = null;
    if (doctor_id) {
      const { data: doctor } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', doctor_id)
        .single();
      doctorInfo = doctor;
    }

    return NextResponse.json({
      success: true,
      data: {
        queue_date: date,
        doctor: doctorInfo,
        entries: entriesWithAge,
        summary,
      },
    });
  } catch (error) {
    console.error('Queue fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
