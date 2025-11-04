import { NextRequest, NextResponse } from 'next/server';
import { BPJSClient } from '@/lib/api/bpjs/client';

export async function POST(request: NextRequest) {
  try {
    const { bpjsNumber, serviceDate } = await request.json();

    if (!bpjsNumber || !serviceDate) {
      return NextResponse.json(
        { error: 'Nomor BPJS dan tanggal pelayanan harus diisi' },
        { status: 400 }
      );
    }

    const bpjsClient = new BPJSClient();
    const response = await bpjsClient.checkEligibility(bpjsNumber, serviceDate);

    // Check if response indicates success
    if (response.metaData.code === '200') {
      return NextResponse.json({
        eligible: true,
        peserta: response.response.peserta,
      });
    } else {
      return NextResponse.json(
        {
          eligible: false,
          error: response.metaData.message || 'Peserta tidak eligible',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('BPJS eligibility check error:', error);
    return NextResponse.json(
      {
        eligible: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    );
  }
}
