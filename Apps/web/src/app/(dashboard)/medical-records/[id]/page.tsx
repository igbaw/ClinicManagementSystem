import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function MedicalRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: record, error } = await supabase
    .from("medical_records")
    .select(`
      *,
      patient:patients(
        id,
        medical_record_number,
        full_name,
        date_of_birth,
        gender,
        phone
      ),
      doctor:users!medical_records_doctor_id_fkey(
        full_name
      ),
      appointment:appointments(
        appointment_date,
        appointment_time
      ),
      prescriptions(
        id,
        created_at,
        status,
        notes,
        prescription_items(
          medication_id,
          dosage,
          frequency,
          timing,
          duration,
          quantity,
          medication:medications(name, unit)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !record) {
    notFound();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(time: string) {
    return time.substring(0, 5);
  }

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  const canEdit = () => {
    const createdAt = new Date(record.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/medical-records"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Kembali ke Daftar Rekam Medis
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Rekam Medis</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/prescriptions/new?mrId=${id}&patientId=${record.patient_id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            💊 Buat Resep
          </Link>
          <Link
            href={`/billing/new?mrId=${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            💰 Buat Tagihan
          </Link>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              {record.patient?.full_name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>{record.patient?.medical_record_number}</span>
              <span>•</span>
              <span>
                {calculateAge(record.patient?.date_of_birth || "")} tahun
              </span>
              <span>•</span>
              <span>{record.patient?.gender}</span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-medium">
              {formatDate(record.appointment?.appointment_date || record.created_at)}
            </p>
            <p>
              Pukul{" "}
              {record.appointment?.appointment_time
                ? formatTime(record.appointment.appointment_time)
                : new Date(record.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </p>
            <p className="mt-2">{record.doctor?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Vital Signs */}
      {record.vital_signs && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Tanda-Tanda Vital</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {record.vital_signs.bloodPressure && (
              <div>
                <label className="text-sm text-gray-500">Tekanan Darah</label>
                <p className="font-medium">{record.vital_signs.bloodPressure} mmHg</p>
              </div>
            )}
            {record.vital_signs.pulse && (
              <div>
                <label className="text-sm text-gray-500">Nadi</label>
                <p className="font-medium">{record.vital_signs.pulse} x/menit</p>
              </div>
            )}
            {record.vital_signs.temperature && (
              <div>
                <label className="text-sm text-gray-500">Suhu</label>
                <p className="font-medium">{record.vital_signs.temperature} °C</p>
              </div>
            )}
            {record.vital_signs.weight && (
              <div>
                <label className="text-sm text-gray-500">Berat Badan</label>
                <p className="font-medium">{record.vital_signs.weight} kg</p>
              </div>
            )}
            {record.vital_signs.height && (
              <div>
                <label className="text-sm text-gray-500">Tinggi Badan</label>
                <p className="font-medium">{record.vital_signs.height} cm</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOAP Notes */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Catatan SOAP</h3>

        <div className="space-y-6">
          {/* Subjective */}
          <div>
            <h4 className="font-semibold text-green-700 mb-2">
              Subjektif (S)
            </h4>
            <div className="pl-4 space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Keluhan Utama:
                </label>
                <p className="text-gray-900">{record.chief_complaint}</p>
              </div>
              {record.anamnesis && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Anamnesis:
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {record.anamnesis}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Objective */}
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Objektif (O)</h4>
            <div className="pl-4">
              <label className="text-sm font-medium text-gray-700">
                Pemeriksaan Fisik:
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">
                {typeof record.physical_examination === 'object' && record.physical_examination?.text
                  ? record.physical_examination.text
                  : record.physical_examination}
              </p>
            </div>
          </div>

          {/* Assessment */}
          <div>
            <h4 className="font-semibold text-purple-700 mb-2">
              Assessment (A)
            </h4>
            <div className="pl-4">
              <label className="text-sm font-medium text-gray-700">
                Diagnosis:
              </label>
              {record.diagnosis_icd10 && record.diagnosis_icd10.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {record.diagnosis_icd10.map((diag: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-purple-50 border border-purple-200 rounded-md"
                    >
                      <span className="font-mono font-medium">{diag.code}</span>
                      <span>-</span>
                      <span>{diag.nameIndonesian}</span>
                      {diag.isPrimary && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                          Primer
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Tidak ada diagnosis</p>
              )}
            </div>
          </div>

          {/* Plan */}
          <div>
            <h4 className="font-semibold text-orange-700 mb-2">Plan (P)</h4>
            <div className="pl-4">
              <label className="text-sm font-medium text-gray-700">
                Rencana Tindakan:
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">
                {record.treatment_plan}
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          {record.notes && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Catatan Tambahan
              </h4>
              <p className="pl-4 text-gray-900 whitespace-pre-wrap">
                {record.notes}
              </p>
            </div>
          )}

          {/* Follow-up Date */}
          {record.follow_up_date && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Tanggal Kontrol
              </h4>
              <p className="pl-4 text-gray-900">
                {formatDate(record.follow_up_date)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prescriptions */}
      {record.prescriptions && record.prescriptions.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Resep ({record.prescriptions.length})
          </h3>
          <div className="space-y-4">
            {record.prescriptions.map((prescription: any) => (
              <div key={prescription.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(prescription.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {prescription.notes && (
                      <p className="text-sm text-gray-700 mt-1">{prescription.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {prescription.status === "pending" && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        ⏳ Pending
                      </span>
                    )}
                    {prescription.status === "dispensed" && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        ✅ Diserahkan
                      </span>
                    )}
                    {prescription.status === "cancelled" && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        ❌ Dibatalkan
                      </span>
                    )}
                    <Link
                      href={`/prescriptions/${prescription.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
                <div className="space-y-2">
                  {prescription.prescription_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm bg-gray-50 p-3 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.medication?.name || "Unknown"}</p>
                        <p className="text-gray-600">
                          {item.dosage} • {item.frequency} • {item.timing} • {item.duration}
                        </p>
                        {item.instructions && (
                          <p className="text-gray-600 italic">"{item.instructions}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity} {item.medication?.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {record.attachments && record.attachments.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Lampiran ({record.attachments.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {record.attachments.map((url: string, index: number) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-32 object-cover rounded border hover:opacity-75 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Aksi</h3>
        <div className="flex gap-3">
          <Link
            href={`/patients/${record.patient?.id}`}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Lihat Data Pasien
          </Link>
          <button
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
            disabled
          >
            Download PDF (Coming Soon)
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-sm text-gray-500 text-center pb-6">
        Dibuat pada {formatDate(record.created_at)}
      </div>
    </div>
  );
}
