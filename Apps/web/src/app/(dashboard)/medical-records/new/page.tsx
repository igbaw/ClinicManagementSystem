"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DatePicker from "@/components/calendar/DatePicker";

interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
}

interface Diagnosis {
  code: string;
  nameIndonesian: string;
  isPrimary: boolean;
}

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const appointmentId = searchParams.get("appointment");
  const queueId = searchParams.get("queue");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const [vitalSignsEditable, setVitalSignsEditable] = useState(false);

  // Form state - Vital Signs
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  
  // SOAP fields
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [diagnosisText, setDiagnosisText] = useState("");
  const [therapy, setTherapy] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  
  // ICD-10 (optional)
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [diagnosisResults, setDiagnosisResults] = useState<any[]>([]);
  const [showICD10, setShowICD10] = useState(false);
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load appointment/queue and patient data
  useEffect(() => {
    if (queueId) {
      (async () => {
        const { data: existingRecord } = await supabase
          .from("medical_records")
          .select("id")
          .eq("queue_entry_id", queueId)
          .single();

        if (existingRecord) {
          setErrors({ submit: "Rekam medis untuk pasien ini sudah ada. Anda akan dialihkan ke halaman detail..." });
          setTimeout(() => router.push(`/medical-records/${existingRecord.id}`), 2000);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("queue_entries")
          .select(`
            id, entry_type, chief_complaint, appointment_id,
            patient:patients(id, medical_record_number, full_name, date_of_birth, gender),
            appointment:appointments(id, appointment_time, booking_code)
          `)
          .eq("id", queueId)
          .single();

        if (data) {
          setQueueEntry(data);
          const patientData = Array.isArray(data.patient) ? data.patient[0] : data.patient;
          if (patientData) {
            setPatient(patientData as Patient);
          } else {
            setErrors({ submit: "Data pasien tidak ditemukan." });
          }
          if (data.chief_complaint) {
            setAnamnesis(data.chief_complaint);
          }
        } else {
          setErrors({ submit: "Queue entry tidak ditemukan." });
        }
        setLoading(false);
      })();
    } else if (appointmentId) {
      (async () => {
        const { data: existingRecord } = await supabase
          .from("medical_records")
          .select("id")
          .eq("appointment_id", appointmentId)
          .single();

        if (existingRecord) {
          setErrors({ submit: "Rekam medis untuk appointment ini sudah ada." });
          setTimeout(() => router.push(`/medical-records/${existingRecord.id}`), 2000);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("appointments")
          .select(`*, patient:patients(id, medical_record_number, full_name, date_of_birth, gender)`)
          .eq("id", appointmentId)
          .single();

        if (data?.patient) setPatient(data.patient as Patient);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [appointmentId, queueId, supabase, router]);

  const searchICD10 = async (query: string) => {
    if (query.length < 2) {
      setDiagnosisResults([]);
      return;
    }
    try {
      const { data } = await supabase
        .from('icd10_codes')
        .select('code, name_id, name_en')
        .or(`code.ilike.%${query}%,name_id.ilike.%${query}%`)
        .eq('is_active', true)
        .order('code')
        .limit(20);
      setDiagnosisResults((data || []).map(d => ({ code: d.code, nameIndonesian: d.name_id, nameEnglish: d.name_en })));
    } catch (error) {
      console.error('Error searching ICD-10:', error);
      setDiagnosisResults([]);
    }
  };

  const addDiagnosis = (diag: any) => {
    if (!diagnoses.find(d => d.code === diag.code)) {
      setDiagnoses([...diagnoses, { code: diag.code, nameIndonesian: diag.nameIndonesian, isPrimary: diagnoses.length === 0 }]);
      setDiagnosisSearch("");
      setDiagnosisResults([]);
    }
  };

  const removeDiagnosis = (code: string) => setDiagnoses(diagnoses.filter(d => d.code !== code));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 5) {
      setErrors({ ...errors, attachments: "Maksimal 5 foto per kunjungan" });
      return;
    }
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setErrors({ ...errors, attachments: "Hanya file gambar yang diperbolehkan" });
      return;
    }
    setAttachments([...attachments, ...validFiles]);
    setErrors({ ...errors, attachments: "" });
  };

  const removeAttachment = (index: number) => setAttachments(attachments.filter((_, i) => i !== index));

  const uploadAttachments = async (medicalRecordId: string) => {
    if (attachments.length === 0) return [];
    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];
    try {
      for (const file of attachments) {
        const fileName = `${medicalRecordId}-${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('medical-attachments').upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('medical-attachments').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    } finally {
      setUploadingPhotos(false);
    }
    return uploadedUrls;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!anamnesis || anamnesis.length < 10) newErrors.anamnesis = "Anamnesis minimal 10 karakter";
    if (!physicalExam || physicalExam.length < 5) newErrors.physicalExam = "Pemeriksaan fisik minimal 5 karakter";
    if (!diagnosisText || diagnosisText.length < 3) newErrors.diagnosisText = "Diagnosis minimal 3 karakter";
    if (!therapy || therapy.length < 10) newErrors.therapy = "Terapi minimal 10 karakter";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        patient_id: patient?.id,
        queue_entry_id: queueId || null,
        appointment_id: queueEntry?.appointment_id || appointmentId || null,
        doctor_id: user?.id,
        vital_signs: {
          bloodPressure,
          pulse: pulse ? parseInt(pulse) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
        },
        chief_complaint: anamnesis,
        anamnesis,
        physical_examination: { text: physicalExam },
        diagnosis_text: diagnosisText,
        diagnosis_icd10: diagnoses.length > 0 ? diagnoses.map(d => ({ code: d.code, nameIndonesian: d.nameIndonesian, isPrimary: d.isPrimary })) : null,
        treatment_plan: therapy,
        notes,
        follow_up_date: followUpDate ? followUpDate.toISOString().split('T')[0] : null,
      };

      const { data, error } = await supabase.from("medical_records").insert(payload).select().single();
      if (error) throw error;

      if (attachments.length > 0 && data) {
        const uploadedUrls = await uploadAttachments(data.id);
        await supabase.from("medical_records").update({ attachments: uploadedUrls }).eq("id", data.id);
      }

      if (queueId) await supabase.from("queue_entries").update({ status: "completed" }).eq("id", queueId);
      if (appointmentId || queueEntry?.appointment_id) {
        await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId || queueEntry?.appointment_id);
      }

      setSuccessMessage("Rekam medis berhasil disimpan!");
      setTimeout(() => router.push(`/queue?success=true`), 1500);
    } catch (error: any) {
      console.error('Error saving:', error);
      setErrors({ submit: `Gagal menyimpan: ${error.message || 'Terjadi kesalahan'}` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  if (loading) return <div className="flex items-center justify-center h-64">Memuat data...</div>;
  if (!patient) return <div className="text-center py-12">Data pasien tidak ditemukan</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-red-800 font-medium">Gagal menyimpan rekam medis</p>
              <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Rekam Medis Baru</h1>
            <div className="flex items-center text-gray-600">
              <span className="font-medium">{patient.full_name}</span>
              <span className="mx-2">•</span>
              <span>{patient.medical_record_number}</span>
              <span className="mx-2">•</span>
              <span>{calculateAge(patient.date_of_birth)} tahun</span>
              <span className="mx-2">•</span>
              <span>{patient.gender}</span>
            </div>
          </div>
          {queueEntry && (
            <div className="text-right">
              {queueEntry.entry_type === 'appointment' ? (
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  📅 Janji Temu{queueEntry.appointment?.appointment_time && ` - ${queueEntry.appointment.appointment_time.slice(0, 5)}`}
                </span>
              ) : (
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                  🚶 Walk-in
                </span>
              )}
              {queueEntry.appointment?.booking_code && (
                <div className="mt-2 text-xs text-gray-500 font-mono">📋 {queueEntry.appointment.booking_code}</div>
              )}
            </div>
          )}
        </div>
        {queueEntry?.chief_complaint && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <span className="text-sm font-medium text-blue-900">Keluhan saat check-in: </span>
            <span className="text-sm text-blue-800">{queueEntry.chief_complaint}</span>
          </div>
        )}
      </div>

      {/* Single Page Form - No Tabs */}
      <div className="bg-white border rounded-lg p-6 space-y-8">
        
        {/* Vital Signs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tanda Vital</h3>
            <button
              type="button"
              onClick={() => setVitalSignsEditable(!vitalSignsEditable)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {vitalSignsEditable ? "🔓 Kunci" : "✏️ Edit Vital Signs"}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tekanan Darah
              </label>
              <input
                type="text"
                placeholder="120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                disabled={!vitalSignsEditable}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nadi (x/mnt)
              </label>
              <input
                type="number"
                placeholder="80"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                disabled={!vitalSignsEditable}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suhu (°C)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                disabled={!vitalSignsEditable}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BB (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={!vitalSignsEditable}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TB (cm)
              </label>
              <input
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                disabled={!vitalSignsEditable}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>
          {!vitalSignsEditable && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Vital signs diisi oleh perawat/front desk. Klik "Edit" jika perlu mengubah.
            </p>
          )}
        </div>

        <div className="border-t pt-6"></div>

        {/* S - Anamnesis */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            S - ANAMNESIS <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">Keluhan dan riwayat pasien</p>
          <textarea
            rows={6}
            placeholder="Contoh: Pasien mengeluh telinga kanan sakit sejak 3 hari yang lalu, disertai keluar cairan. Riwayat berenang 1 minggu lalu..."
            value={anamnesis}
            onChange={(e) => setAnamnesis(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors.anamnesis ? 'border-red-500' : ''}`}
          />
          {errors.anamnesis && (
            <p className="text-red-600 text-sm mt-1">{errors.anamnesis}</p>
          )}
        </div>

        <div className="border-t pt-6"></div>

        {/* O - Pemeriksaan Fisik */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            O - PEMERIKSAAN FISIK <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">Hasil pemeriksaan THT</p>
          <textarea
            rows={8}
            placeholder="Contoh:&#10;Telinga: Aurikula normal, liang telinga lapang, membran timpani hiperemis&#10;Hidung: Septum deviasi (-), konka eutrofi&#10;Tenggorokan: Faring hiperemis (-), tonsil T1-T1"
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${errors.physicalExam ? 'border-red-500' : ''}`}
          />
          {errors.physicalExam && (
            <p className="text-red-600 text-sm mt-1">{errors.physicalExam}</p>
          )}
        </div>

        <div className="border-t pt-6"></div>

        {/* A - Diagnosis */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            A - DIAGNOSIS <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">Diagnosis penyakit</p>
          <input
            type="text"
            placeholder="Contoh: Otitis Media Akut"
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors.diagnosisText ? 'border-red-500' : ''}`}
          />
          {errors.diagnosisText && (
            <p className="text-red-600 text-sm mt-1">{errors.diagnosisText}</p>
          )}

          {/* Optional ICD-10 */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowICD10(!showICD10)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showICD10 ? "▼ Sembunyikan" : "▶ Tambah Kode ICD-10 (Opsional, untuk BPJS)"}
            </button>
            
            {showICD10 && (
              <div className="mt-3 p-4 bg-gray-50 border rounded-lg">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari kode ICD-10..."
                    value={diagnosisSearch}
                    onChange={(e) => {
                      setDiagnosisSearch(e.target.value);
                      searchICD10(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {diagnosisResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {diagnosisResults.map((result) => (
                        <button
                          key={result.code}
                          type="button"
                          onClick={() => addDiagnosis(result)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <div className="font-medium text-sm">{result.code}</div>
                          <div className="text-xs text-gray-600">{result.nameIndonesian}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {diagnoses.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {diagnoses.map((d) => (
                      <div key={d.code} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{d.code}</span>
                          <span className="text-sm text-gray-600 ml-2">{d.nameIndonesian}</span>
                          {d.isPrimary && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Primer</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDiagnosis(d.code)}
                          className="text-red-600 hover:text-red-700 text-sm ml-2"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ Kode ICD-10 diperlukan untuk klaim BPJS
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6"></div>

        {/* P - Terapi */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            P - TERAPI <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">Rencana pengobatan dan tindakan</p>
          <textarea
            rows={6}
            placeholder="Contoh:&#10;- Amoxicillin 500mg 3x1 selama 7 hari&#10;- Tetes telinga Otolin 3x sehari&#10;- Paracetamol 500mg bila demam&#10;- Kontrol 3 hari lagi"
            value={therapy}
            onChange={(e) => setTherapy(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors.therapy ? 'border-red-500' : ''}`}
          />
          {errors.therapy && (
            <p className="text-red-600 text-sm mt-1">{errors.therapy}</p>
          )}
        </div>

        <div className="border-t pt-6"></div>

        {/* Keterangan (Notes) */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            KETERANGAN
          </label>
          <p className="text-sm text-gray-600 mb-3">Catatan tambahan (opsional)</p>
          <textarea
            rows={4}
            placeholder="Catatan khusus, alergi, atau informasi penting lainnya..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Kontrol (Opsional)
          </label>
          <DatePicker
            value={followUpDate}
            onChange={(date) => setFollowUpDate(date)}
            minDate={new Date()}
            placeholder="Pilih tanggal kontrol"
            className="w-full"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lampiran Foto (Opsional)
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100">
                <span>📷 Upload Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <span className="ml-3 text-sm text-gray-500">
                Maksimal 5 foto ({attachments.length}/5)
              </span>
            </div>
            
            {errors.attachments && (
              <p className="text-red-600 text-sm">{errors.attachments}</p>
            )}
            
            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {attachments.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-6 flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploadingPhotos}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (uploadingPhotos ? "Mengupload foto..." : "Menyimpan...") : "Simpan Rekam Medis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}