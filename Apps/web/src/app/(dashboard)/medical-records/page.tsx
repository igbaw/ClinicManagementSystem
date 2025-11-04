import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

interface SearchParams {
  search?: string;
  date?: string;
}

export default async function MedicalRecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("medical_records")
    .select(`
      *,
      patient:patients(
        id,
        medical_record_number,
        full_name,
        date_of_birth
      ),
      doctor:users!medical_records_doctor_id_fkey(
        full_name
      ),
      appointment:appointments(
        appointment_date,
        appointment_time
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // Apply search filter
  if (params.search) {
    query = query.or(
      `patient.full_name.ilike.%${params.search}%,patient.medical_record_number.ilike.%${params.search}%`
    );
  }

  // Apply date filter
  if (params.date) {
    query = query.gte("created_at", `${params.date}T00:00:00`)
      .lte("created_at", `${params.date}T23:59:59`);
  }

  const { data: records, error } = await query;

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getPrimaryDiagnosis(diagnosis: any[]) {
    if (!diagnosis || diagnosis.length === 0) return "-";
    const primary = diagnosis.find((d) => d.isPrimary);
    return primary
      ? `${primary.code} - ${primary.nameIndonesian}`
      : `${diagnosis[0].code} - ${diagnosis[0].nameIndonesian}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekam Medis</h1>
          <p className="text-sm text-gray-600 mt-1">
            Daftar semua rekam medis pasien dalam sistem
          </p>
        </div>
        <Link
          href="/queue"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          Lihat Antrian Pasien
        </Link>
      </div>

      {/* Info Box */}
      {(!records || records.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">Cara Membuat Rekam Medis</h3>
              <div className="mt-2 text-sm text-blue-800">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Pasien melakukan check-in pada halaman Janji Temu</li>
                  <li>Pasien akan muncul di halaman <strong>Antrian Pasien</strong></li>
                  <li>Klik tombol "Mulai Pemeriksaan" untuk membuat rekam medis</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white border rounded-lg p-4">
        <form className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              name="search"
              placeholder="Cari nama pasien atau No. RM..."
              defaultValue={params.search}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div>
            <input
              type="date"
              name="date"
              defaultValue={params.date}
              className="px-4 py-2 border rounded-md"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Cari
          </button>
          <Link
            href="/medical-records"
            className="px-6 py-2 border rounded-md hover:bg-gray-50"
          >
            Reset
          </Link>
        </form>
      </div>

      {/* Records List */}
      <div className="bg-white border rounded-lg">
        {error && (
          <div className="p-6 text-red-600">Error: {error.message}</div>
        )}

        {!error && records && records.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p>Tidak ada rekam medis ditemukan</p>
          </div>
        )}

        {!error && records && records.length > 0 && (
          <div className="divide-y">
            {records.map((record: any) => (
              <div
                key={record.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {record.patient?.full_name || "Unknown"}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {record.patient?.medical_record_number}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        📅 {formatDate(record.created_at)} •{" "}
                        {record.doctor?.full_name}
                      </p>
                      <p>
                        🏥 Diagnosis: {getPrimaryDiagnosis(record.diagnosis_icd10)}
                      </p>
                      <p className="text-gray-500">
                        Keluhan: {record.chief_complaint?.substring(0, 100)}
                        {record.chief_complaint?.length > 100 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/medical-records/${record.id}`}
                    className="ml-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 text-center">
        Menampilkan {records?.length || 0} rekam medis
      </div>
    </div>
  );
}
