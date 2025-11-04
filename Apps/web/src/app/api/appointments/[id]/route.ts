import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(
          id,
          medical_record_number,
          full_name,
          nik,
          bpjs_number,
          phone,
          date_of_birth
        ),
        doctor:users!appointments_doctor_id_fkey(
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Appointment tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
