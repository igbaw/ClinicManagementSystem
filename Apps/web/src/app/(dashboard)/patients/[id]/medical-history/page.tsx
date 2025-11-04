import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PatientMedicalHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Get patient info
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (patientError || !patient) {
    notFound();
  }

  // Get medical records for this patient
  const { data: records, error: recordsError } = await supabase
    .from("medical_records")
    .select(`
      *,
      doctor:users!medical_records_doctor_id_fkey(
        full_name
      ),
      appointment:appointments(
        appointment_date,
        appointment_time
      )
    `)
    .eq("patient_id", id)
    .order("created_at", { ascending: false });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
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
          <Link
            href={`/patients/${id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Kembali ke Detail Pasien
          </Link>
          <h1 className="text-2xl font-bold mt-2">Riwayat Rekam Medis</h1>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{patient.full_name}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>{patient.medical_record_number}</span>
              <span>•</span>
              <span>{calculateAge(patient.date_of_birth)} tahun</span>
              <span>•</span>
              <span>{patient.gender}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {records?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Total Kunjungan</div>
          </div>
        </div>
      </div>

      {/* Medical Records Timeline */}
      <div className="bg-white border rounded-lg">
        {recordsError && (
          <div className="p-6 text-red-600">Error: {recordsError.message}</div>
        )}

        {!recordsError && (!records || records.length === 0) && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">Belum ada rekam medis</p>
            <p className="text-sm">
              Pasien ini belum memiliki riwayat rekam medis
            </p>
          </div>
        )}

        {!recordsError && records && records.length > 0 && (
          <div className="divide-y">
            {records.map((record: any, index: number) => (
              <div key={record.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                        {records.length - index}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          📅 {formatDate(record.created_at)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.doctor?.full_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/medical-records/${record.id}`}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-sm"
                  >
                    Lihat Detail
                  </Link>
                </div>

                <div className="ml-11 space-y-3">
                  {/* Diagnosis */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Diagnosis:
                    </label>
                    <p className="text-gray-900">
                      {getPrimaryDiagnosis(record.diagnosis_icd10)}
                    </p>
                  </div>

                  {/* Chief Complaint */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Keluhan Utama:
                    </label>
                    <p className="text-gray-900">
                      {record.chief_complaint?.substring(0, 150)}
                      {record.chief_complaint?.length > 150 ? "..." : ""}
                    </p>
                  </div>

                  {/* Treatment Plan Summary */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Rencana Tindakan:
                    </label>
                    <p className="text-gray-900">
                      {record.treatment_plan?.substring(0, 150)}
                      {record.treatment_plan?.length > 150 ? "..." : ""}
                    </p>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {record.vital_signs?.bloodPressure && (
                      <span>
                        🩺 TD: {record.vital_signs.bloodPressure} mmHg
                      </span>
                    )}
                    {record.vital_signs?.temperature && (
                      <span>🌡️ Suhu: {record.vital_signs.temperature}°C</span>
                    )}
                    {record.attachments && record.attachments.length > 0 && (
                      <span>📎 {record.attachments.length} lampiran</span>
                    )}
                    {record.follow_up_date && (
                      <span>
                        📅 Kontrol: {formatDate(record.follow_up_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {records && records.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Menampilkan {records.length} rekam medis
        </div>
      )}
    </div>
  );
}
