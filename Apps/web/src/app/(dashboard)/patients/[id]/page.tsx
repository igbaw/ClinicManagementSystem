import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  nik: string;
  bpjs_number?: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    notFound();
  }

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patients" className="text-blue-600 hover:underline text-sm">
            ← Kembali ke Daftar Pasien
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Pasien</h1>
        </div>
        <Link
          href={`/patients/${id}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Informasi Pribadi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">No. Rekam Medis</label>
                <p className="font-medium">{patient.medical_record_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Nama Lengkap</label>
                <p className="font-medium">{patient.full_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">NIK</label>
                <p className="font-medium">{patient.nik}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">No. BPJS</label>
                <p className="font-medium">{patient.bpjs_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tanggal Lahir</label>
                <p className="font-medium">
                  {formatDate(patient.date_of_birth)} ({calculateAge(patient.date_of_birth)} tahun)
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Jenis Kelamin</label>
                <p className="font-medium">{patient.gender}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Kontak</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Telepon</label>
                <p className="font-medium">{patient.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{patient.email || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Alamat</label>
                <p className="font-medium">{patient.address}</p>
              </div>
            </div>
          </div>

          {patient.emergency_contact && (
            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Kontak Darurat</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Nama</label>
                  <p className="font-medium">{patient.emergency_contact.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Hubungan</label>
                  <p className="font-medium">{patient.emergency_contact.relationship}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Telepon</label>
                  <p className="font-medium">{patient.emergency_contact.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Statistik</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Terdaftar</label>
                <p className="font-medium">{formatDate(patient.created_at)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Terakhir Diupdate</label>
                <p className="font-medium">{formatDate(patient.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              <Link
                href={`/appointments/new?patient=${id}`}
                className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📅 Buat Janji Temu
              </Link>
              <Link
                href={`/medical-records/new?patient=${id}&walkin=true`}
                className="block w-full px-4 py-2 text-center bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                🚶 Walk-in Kunjungan
              </Link>
              <Link
                href={`/patients/${id}/medical-history`}
                className="block w-full px-4 py-2 text-center border rounded-md hover:bg-gray-50"
              >
                📋 Riwayat Rekam Medis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
