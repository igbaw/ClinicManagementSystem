'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DatePicker from '@/components/calendar/DatePicker';

interface EligibilityResult {
  eligible: boolean;
  peserta?: {
    nama: string;
    nik: string;
    noKartu: string;
    tglLahir: string;
    sex: string;
    statusPeserta: {
      keterangan: string;
      kode: string;
    };
    jenisPeserta: {
      keterangan: string;
    };
    provUmum: {
      kdProvider: string;
      nmProvider: string;
    };
    umur: {
      umurSaatPelayanan: string;
      umurSekarang: string;
    };
    tglTAT: string;
    tglTMT: string;
  };
  error?: string;
}

export default function BPJSEligibilityPage() {
  const [bpjsNumber, setBpjsNumber] = useState('');
  const [serviceDate, setServiceDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/bpjs/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpjsNumber,
          serviceDate: format(serviceDate, 'yyyy-MM-dd'),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          eligible: false,
          error: data.error || 'Terjadi kesalahan saat memeriksa eligibilitas',
        });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({
        eligible: false,
        error: 'Gagal terhubung ke server BPJS',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cek Eligibilitas BPJS</h1>
        <p className="text-gray-600">Verifikasi kelayakan peserta BPJS sebelum pelayanan</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Formulir Cek Eligibilitas</h2>
        <p className="text-sm text-gray-600 mb-4">
          Masukkan nomor kartu BPJS dan tanggal pelayanan
        </p>
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label htmlFor="bpjsNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Kartu BPJS
            </label>
            <input
              id="bpjsNumber"
              type="text"
              value={bpjsNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBpjsNumber(e.target.value)}
              placeholder="0001234567890"
              maxLength={13}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">13 digit nomor kartu BPJS</p>
          </div>

          <div>
            <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pelayanan
            </label>
            <DatePicker
              value={serviceDate}
              onChange={(date) => setServiceDate(date)}
              placeholder="Pilih tanggal pelayanan"
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading || bpjsNumber.length !== 13}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Memeriksa...' : 'Cek Eligibilitas'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            {result.eligible ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Peserta Eligible</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Peserta Tidak Eligible</span>
              </>
            )}
          </h2>
          <div>
            {result.error ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Gagal Memeriksa Eligibilitas</p>
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                </div>
              </div>
            ) : result.peserta ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama Peserta</p>
                    <p className="font-medium">{result.peserta.nama}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">NIK</p>
                    <p className="font-medium">{result.peserta.nik}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">No. Kartu BPJS</p>
                    <p className="font-medium">{result.peserta.noKartu}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Lahir</p>
                    <p className="font-medium">{result.peserta.tglLahir}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jenis Kelamin</p>
                    <p className="font-medium">{result.peserta.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Umur</p>
                    <p className="font-medium">{result.peserta.umur.umurSaatPelayanan}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status Peserta</p>
                      <p className="font-medium">{result.peserta.statusPeserta.keterangan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jenis Peserta</p>
                      <p className="font-medium">{result.peserta.jenisPeserta.keterangan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Faskes Tingkat 1</p>
                      <p className="font-medium">{result.peserta.provUmum.nmProvider}</p>
                      <p className="text-xs text-gray-500">Kode: {result.peserta.provUmum.kdProvider}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">TMT (Terhitung Mulai Tanggal)</p>
                      <p className="font-medium">{result.peserta.tglTMT}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">TAT (Terhitung Akhir Tanggal)</p>
                      <p className="font-medium">{result.peserta.tglTAT}</p>
                    </div>
                  </div>
                </div>

                {result.eligible && (
                  <div className="pt-4 border-t">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Lanjutkan ke Pembuatan SEP
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
