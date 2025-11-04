'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

interface FormState {
  noKartu: string;
  tglSep: string;
  ppkPelayanan: string;
  klsRawat: string;
  noMR: string;
  rujukanNoRujukan: string;
  rujukanTglRujukan: string;
  rujukanPpkRujukan: string;
  diagAwal: string;
  poliTujuan: string;
  catatan: string;
  noTelp: string;
}

export default function CreateSEPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [formData, setFormData] = useState<FormState>({
    noKartu: '',
    tglSep: format(new Date(), 'yyyy-MM-dd'),
    ppkPelayanan: process.env.NEXT_PUBLIC_BPJS_PPK_CODE || '',
    klsRawat: '3',
    noMR: '',
    rujukanNoRujukan: '',
    rujukanTglRujukan: format(new Date(), 'yyyy-MM-dd'),
    rujukanPpkRujukan: '',
    diagAwal: '',
    poliTujuan: '002',
    catatan: '',
    noTelp: '',
  });

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  async function loadAppointment() {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      if (res.ok) {
        const data = await res.json();
        setAppointment(data);
        setFormData((prev) => ({
          ...prev,
          noKartu: data.bpjs_card_number || '',
          noMR: data.patient?.medical_record_number || '',
          tglSep: data.appointment_date,
          noTelp: data.patient?.phone || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
    }
  }

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const sepRequest = {
        noKartu: formData.noKartu,
        tglSep: formData.tglSep,
        ppkPelayanan: formData.ppkPelayanan,
        jnsPelayanan: '2',
        klsRawat: formData.klsRawat,
        noMR: formData.noMR,
        rujukan: {
          asalRujukan: '1',
          tglRujukan: formData.rujukanTglRujukan,
          noRujukan: formData.rujukanNoRujukan,
          ppkRujukan: formData.rujukanPpkRujukan,
        },
        catatan: formData.catatan,
        diagAwal: formData.diagAwal,
        poli: { tujuan: formData.poliTujuan, eksekutif: '0' },
        cob: { cob: '0' },
        katarak: { katarak: '0' },
        jaminan: {
          lakaLantas: '0',
          noLP: '',
          penjamin: {
            tglKejadian: '',
            keterangan: '',
            suplesi: {
              suplesi: '0',
              noSepSuplesi: '',
              lokasiLaka: { kdPropinsi: '', kdKabupaten: '', kdKecamatan: '' },
            },
          },
        },
        tujuanKunj: '0',
        flagProcedure: '',
        kdPenunjang: '',
        assesmentPel: '',
        skdp: { noSurat: '', kodeDPJP: '' },
        dpjpLayan: '',
        noTelp: formData.noTelp,
        user: 'frontdesk',
      };

      const res = await fetch('/api/bpjs/sep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sepRequest, appointmentId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`SEP berhasil dibuat!\nNo. SEP: ${data.sepNumber}`);
        router.push('/dashboard/appointments');
      } else {
        const error = await res.json();
        alert(`Gagal membuat SEP: ${error.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat membuat SEP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buat SEP (Surat Eligibilitas Peserta)</h1>
        <p className="text-gray-600">Generate SEP untuk klaim BPJS</p>
      </div>

      {appointment && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Informasi Pasien</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Nama Pasien</p>
              <p className="font-medium">{appointment.patient?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-600">No. RM</p>
              <p className="font-medium">{appointment.patient?.medical_record_number}</p>
            </div>
            <div>
              <p className="text-gray-600">Tanggal Kunjungan</p>
              <p className="font-medium">{appointment.appointment_date}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Data SEP</h2>
          <p className="text-sm text-gray-600 mb-4">Lengkapi data untuk pembuatan SEP</p>
        </div>

        {/* Basic Information */}
        <div>
          <h3 className="font-medium mb-3">Informasi Dasar</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Kartu BPJS *
              </label>
              <input
                type="text"
                value={formData.noKartu}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('noKartu', e.target.value)}
                maxLength={13}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal SEP *
              </label>
              <input
                type="date"
                value={formData.tglSep}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('tglSep', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Medical Record *
              </label>
              <input
                type="text"
                value={formData.noMR}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('noMR', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas Rawat *
              </label>
              <select
                value={formData.klsRawat}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('klsRawat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Kelas 1</option>
                <option value="2">Kelas 2</option>
                <option value="3">Kelas 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rujukan */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Data Rujukan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Rujukan *
              </label>
              <input
                type="text"
                value={formData.rujukanNoRujukan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('rujukanNoRujukan', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Rujukan *
              </label>
              <input
                type="date"
                value={formData.rujukanTglRujukan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('rujukanTglRujukan', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode PPK Rujukan *
              </label>
              <input
                type="text"
                value={formData.rujukanPpkRujukan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('rujukanPpkRujukan', e.target.value)}
                placeholder="Kode Faskes 1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Diagnosis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Awal (ICD-10) *
              </label>
              <input
                type="text"
                value={formData.diagAwal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('diagAwal', e.target.value)}
                placeholder="Contoh: H66.9"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Poli Tujuan *
              </label>
              <input
                type="text"
                value={formData.poliTujuan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('poliTujuan', e.target.value)}
                placeholder="002 untuk THT"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                value={formData.catatan}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('catatan', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              <input
                type="text"
                value={formData.noTelp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('noTelp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Membuat SEP...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Buat SEP
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
