import { NextRequest, NextResponse } from 'next/server';
import { BPJSClient, SEPRequest } from '@/lib/api/bpjs/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sepRequest, appointmentId } = await request.json();

    if (!sepRequest || !appointmentId) {
      return NextResponse.json(
        { error: 'Data SEP dan appointment ID harus diisi' },
        { status: 400 }
      );
    }

    const bpjsClient = new BPJSClient();
    const response = await bpjsClient.createSEP(sepRequest as SEPRequest);

    if (response.metaData.code === '200') {
      // Update appointment with SEP number
      const supabase = await createServerClient();
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          sep_number: response.response.sep.noSep,
          bpjs_card_number: sepRequest.noKartu,
          rujukan_number: sepRequest.rujukan.noRujukan,
          rujukan_date: sepRequest.rujukan.tglRujukan,
          rujukan_ppk_code: sepRequest.rujukan.ppkRujukan,
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Failed to update appointment with SEP:', updateError);
      }

      return NextResponse.json({
        success: true,
        sepNumber: response.response.sep.noSep,
        sep: response.response.sep,
      });
    } else {
      return NextResponse.json(
        {
          error: response.metaData.message || 'Gagal membuat SEP',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('BPJS SEP creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sepNumber = searchParams.get('sepNumber');

    if (!sepNumber) {
      return NextResponse.json({ error: 'No. SEP harus diisi' }, { status: 400 });
    }

    const bpjsClient = new BPJSClient();
    const response = await bpjsClient.getSEP(sepNumber);

    if (response.metaData.code === '200') {
      return NextResponse.json({
        success: true,
        sep: response.response.sep,
      });
    } else {
      return NextResponse.json(
        {
          error: response.metaData.message || 'SEP tidak ditemukan',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('BPJS get SEP error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sepNumber, user, appointmentId } = await request.json();

    if (!sepNumber || !user) {
      return NextResponse.json(
        { error: 'No. SEP dan user harus diisi' },
        { status: 400 }
      );
    }

    const bpjsClient = new BPJSClient();
    const response = await bpjsClient.deleteSEP(sepNumber, user);

    if (response.metaData.code === '200') {
      // Clear SEP data from appointment if provided
      if (appointmentId) {
        const supabase = await createServerClient();
        await supabase
          .from('appointments')
          .update({
            sep_number: null,
          })
          .eq('id', appointmentId);
      }

      return NextResponse.json({
        success: true,
        message: 'SEP berhasil dihapus',
      });
    } else {
      return NextResponse.json(
        {
          error: response.metaData.message || 'Gagal menghapus SEP',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('BPJS delete SEP error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    );
  }
}
