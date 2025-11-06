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

interface MedicalRecord {
  id: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis_text?: string;
  diagnosis_icd10?: any[];
  doctor: {
    full_name: string;
  } | {
    full_name: string;
  }[];
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Get current user to check role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id)
    .single();

  const canViewMedicalRecords = currentUser?.role !== 'front_desk';

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    notFound();
  }

  // Fetch medical records only if user has permission
  let medicalRecords: MedicalRecord[] = [];
  if (canViewMedicalRecords) {
    // First try with join
    let { data: records, error: recordsError } = await supabase
      .from("medical_records")
      .select(`
        id,
        visit_date,
        chief_complaint,
        diagnosis_icd10,
        doctor_id,
        users!inner(full_name)
      `)
      .eq("patient_id", id)
      .order("visit_date", { ascending: false })
      .limit(10);
    
    if (recordsError) {
      console.log("Join query failed (expected), using fallback...");
      // Fallback: fetch without join
      const { data: simpleRecords, error: simpleError } = await supabase
        .from("medical_records")
        .select(`
          id,
          visit_date,
          chief_complaint,
          diagnosis_icd10,
          doctor_id
        `)
        .eq("patient_id", id)
        .order("visit_date", { ascending: false })
        .limit(10);
      
      console.log("Simple query result:", simpleRecords?.length || 0, "records");
      
      if (simpleError) {
        console.error("Error fetching medical records (simple):", simpleError);
      } else if (simpleRecords && simpleRecords.length > 0) {
        // Fetch doctor names separately
        const doctorIds = [...new Set(simpleRecords.map(r => r.doctor_id))];
        console.log("Fetching doctors for IDs:", doctorIds);
        
        const { data: doctors } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", doctorIds);
        
        console.log("Doctors fetched:", doctors?.length || 0);
        
        const doctorMap = new Map(doctors?.map(d => [d.id, d]) || []);
        records = simpleRecords.map(record => {
          const doctor = doctorMap.get(record.doctor_id);
          return {
            ...record,
            diagnosis_text: null, // Will be added after migration
            users: doctor ? [{ full_name: doctor.full_name }] : []
          };
        });
      } else {
        records = [];
      }
    }
    
    // Transform to expected format
    medicalRecords = (records?.map(record => ({
      id: record.id,
      visit_date: record.visit_date,
      chief_complaint: record.chief_complaint,
      diagnosis_text: (record as any).diagnosis_text || null,
      diagnosis_icd10: record.diagnosis_icd10,
      doctor: Array.isArray(record.users) ? record.users[0] : record.users
    })) as any) || [];
    
    console.log("Medical records loaded:", medicalRecords.length, "records for patient", id);
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
          {/* Medical Records Section - Only visible to doctors and admin - MOVED TO TOP */}
          {canViewMedicalRecords && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Riwayat Rekam Medis</h2>
                <Link
                  href={`/patients/${id}/medical-history`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Lihat Semua →
                </Link>
              </div>
              {medicalRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Belum ada rekam medis</p>
                  <p className="text-xs text-gray-400 mt-2">Pasien ini belum memiliki riwayat kunjungan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicalRecords.map((record) => {
                    const doctor = Array.isArray(record.doctor) ? record.doctor[0] : record.doctor;
                    const diagnosis = record.diagnosis_text || 
                      (record.diagnosis_icd10 && record.diagnosis_icd10.length > 0 
                        ? record.diagnosis_icd10[0]?.nameIndonesian 
                        : 'Tidak ada diagnosis');
                    
                    return (
                      <Link
                        key={record.id}
                        href={`/medical-records/${record.id}`}
                        className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(record.visit_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-600">{doctor?.full_name || 'Unknown'}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Keluhan:</span> {record.chief_complaint || '-'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Diagnosis:</span> {diagnosis}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
                <p className="font-medium">{patient.nik || '-'}</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
