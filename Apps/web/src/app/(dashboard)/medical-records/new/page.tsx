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
  const [activeTab, setActiveTab] = useState("vital");

  // Form state
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [diagnosisResults, setDiagnosisResults] = useState<any[]>([]);
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load appointment/queue and patient data
  useEffect(() => {
    if (queueId) {
      // Load from queue entry (for both appointments and walk-ins)
      (async () => {
        // First check if medical record already exists for this queue entry
        const { data: existingRecord } = await supabase
          .from("medical_records")
          .select("id")
          .eq("queue_entry_id", queueId)
          .single();

        if (existingRecord) {
          setErrors({ 
            submit: "Rekam medis untuk pasien ini sudah ada. Anda akan dialihkan ke halaman detail..." 
          });
          setTimeout(() => {
            router.push(`/medical-records/${existingRecord.id}`);
          }, 2000);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("queue_entries")
          .select(`
            id,
            entry_type,
            chief_complaint,
            appointment_id,
            patient:patients(
              id,
              medical_record_number,
              full_name,
              date_of_birth,
              gender
            ),
            appointment:appointments(
              id,
              appointment_time,
              booking_code
            )
          `)
          .eq("id", queueId)
          .single();

        if (data) {
          setQueueEntry(data);
          if (data.patient) {
            // Supabase returns patient as object for foreign key relationship
            // Handle both array and object cases
            const patientData = Array.isArray(data.patient) ? data.patient[0] : data.patient;
            if (patientData) {
              setPatient(patientData as Patient);
            } else {
              setErrors({ 
                submit: "Data pasien tidak ditemukan. Pastikan queue entry memiliki data pasien yang valid." 
              });
            }
          } else {
            setErrors({ 
              submit: "Data pasien tidak ditemukan. Pastikan queue entry memiliki data pasien yang valid." 
            });
          }
          // Pre-fill chief complaint if from queue
          if (data.chief_complaint) {
            setChiefComplaint(data.chief_complaint);
          }
        } else {
          setErrors({ 
            submit: "Queue entry tidak ditemukan." 
          });
        }
        setLoading(false);
      })();
    } else if (appointmentId) {
      // Legacy: Load from appointment ID directly (for backwards compatibility)
      (async () => {
        // First check if medical record already exists for this appointment
        const { data: existingRecord } = await supabase
          .from("medical_records")
          .select("id")
          .eq("appointment_id", appointmentId)
          .single();

        if (existingRecord) {
          setErrors({ 
            submit: "Rekam medis untuk appointment ini sudah ada. Anda akan dialihkan ke halaman detail..." 
          });
          setTimeout(() => {
            router.push(`/medical-records/${existingRecord.id}`);
          }, 2000);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("appointments")
          .select(`
            *,
            patient:patients(
              id,
              medical_record_number,
              full_name,
              date_of_birth,
              gender
            )
          `)
          .eq("id", appointmentId)
          .single();

        if (data?.patient) {
          setPatient(data.patient as Patient);
        }
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [appointmentId, queueId, supabase, router]);

  // ICD-10 Search from database
  const searchICD10 = async (query: string) => {
    if (query.length < 2) {
      setDiagnosisResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('icd10_codes')
        .select('code, name_id, name_en, category')
        .or(`code.ilike.%${query}%,name_id.ilike.%${query}%`)
        .eq('is_active', true)
        .order('code')
        .limit(20);

      if (error) throw error;

      const formatted = (data || []).map(d => ({
        code: d.code,
        nameIndonesian: d.name_id,
        nameEnglish: d.name_en,
      }));

      setDiagnosisResults(formatted);
    } catch (error) {
      console.error('Error searching ICD-10:', error);
      setDiagnosisResults([]);
    }
  };

  const addDiagnosis = (diag: any) => {
    if (!diagnoses.find((d) => d.code === diag.code)) {
      setDiagnoses([
        ...diagnoses,
        {
          code: diag.code,
          nameIndonesian: diag.nameIndonesian,
          isPrimary: diagnoses.length === 0,
        },
      ]);
      setDiagnosisSearch("");
      setDiagnosisResults([]);
    }
  };

  const removeDiagnosis = (code: string) => {
    setDiagnoses(diagnoses.filter((d) => d.code !== code));
  };

  const setPrimaryDiagnosis = (code: string) => {
    setDiagnoses(
      diagnoses.map((d) => ({
        ...d,
        isPrimary: d.code === code,
      }))
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (attachments.length + files.length > 5) {
      setErrors({ ...errors, attachments: "Maksimal 5 foto per kunjungan" });
      return;
    }
    
    // Validate file types (images only)
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setErrors({ ...errors, attachments: "Hanya file gambar yang diperbolehkan" });
      return;
    }
    
    setAttachments([...attachments, ...validFiles]);
    setErrors({ ...errors, attachments: "" });
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (medicalRecordId: string) => {
    if (attachments.length === 0) return [];
    
    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of attachments) {
        const fileName = `${medicalRecordId}-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('medical-attachments')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('medical-attachments')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }
    } finally {
      setUploadingPhotos(false);
    }
    
    return uploadedUrls;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!chiefComplaint || chiefComplaint.length < 10) {
      newErrors.chiefComplaint = "Keluhan utama minimal 10 karakter";
    }

    if (!physicalExam || physicalExam.length < 20) {
      newErrors.physicalExam = "Pemeriksaan fisik minimal 20 karakter";
    }

    if (diagnoses.length === 0) {
      newErrors.diagnoses = "Minimal satu diagnosis harus ditambahkan";
    }

    if (!treatmentPlan || treatmentPlan.length < 20) {
      newErrors.treatmentPlan = "Rencana tindakan minimal 20 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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
        chief_complaint: chiefComplaint,
        anamnesis,
        physical_examination: { text: physicalExam },
        diagnosis_icd10: diagnoses.map(d => ({
          code: d.code,
          nameIndonesian: d.nameIndonesian,
          isPrimary: d.isPrimary
        })),
        treatment_plan: treatmentPlan,
        notes,
        follow_up_date: followUpDate ? followUpDate.toISOString().split('T')[0] : null,
      };

      const { data, error } = await supabase
        .from("medical_records")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Upload attachments if any
      if (attachments.length > 0 && data) {
        const uploadedUrls = await uploadAttachments(data.id);
        
        // Update medical record with attachment URLs
        await supabase
          .from("medical_records")
          .update({ attachments: uploadedUrls })
          .eq("id", data.id);
      }

      // Update queue status to completed
      if (queueId) {
        await supabase
          .from("queue_entries")
          .update({ status: "completed" })
          .eq("id", queueId);
      }

      // Update appointment status to completed (if from appointment)
      if (appointmentId || queueEntry?.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", appointmentId || queueEntry?.appointment_id);
      }

      // Show success message
      setSuccessMessage("Rekam medis berhasil disimpan!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/queue?success=true`);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      setErrors({ submit: `Gagal menyimpan: ${error.message || 'Terjadi kesalahan'}` });
      
      // Scroll to top to show error
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12">Patient not found</div>;
  }

  // Helper to check if tab has errors
  const getTabErrors = (tabId: string) => {
    switch (tabId) {
      case "vital":
        return errors.chiefComplaint ? true : false;
      case "objective":
        return errors.physicalExam ? true : false;
      case "assessment":
        return errors.diagnoses ? true : false;
      case "plan":
        return errors.treatmentPlan ? true : false;
      default:
        return false;
    }
  };

  const tabs = [
    { id: "vital", label: "Tanda Vital & Subjektif" },
    { id: "objective", label: "Objektif" },
    { id: "assessment", label: "Diagnosis" },
    { id: "plan", label: "Rencana" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-green-800 font-medium">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-600 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-red-800 font-medium">Gagal menyimpan rekam medis</p>
              <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Only render form if patient data is loaded */}
      {!loading && patient && (
        <>
          {/* Patient Header */}
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
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  📋 {queueEntry.appointment.booking_code}
                </div>
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

      {/* Tabs */}
      <div className="bg-white border rounded-lg">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const hasError = getTabErrors(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : hasError
                      ? "border-transparent text-red-500 hover:text-red-700 hover:border-red-300"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {hasError && (
                    <span className="absolute top-3 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab 1: Vital Signs & Subjective */}
          {activeTab === "vital" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tanda-Tanda Vital</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tekanan Darah (mmHg)
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nadi (x/menit)
                    </label>
                    <input
                      type="number"
                      placeholder="80"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
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
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Berat Badan (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tinggi Badan (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="170"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Subjektif (S)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keluhan Utama *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Telinga kanan sakit sejak 3 hari"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    {errors.chiefComplaint && (
                      <p className="text-red-600 text-sm mt-1">{errors.chiefComplaint}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anamnesis
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Riwayat penyakit sekarang, riwayat penyakit dahulu, riwayat keluarga..."
                      value={anamnesis}
                      onChange={(e) => setAnamnesis(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Objective */}
          {activeTab === "objective" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Objektif (O)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pemeriksaan Fisik *
                </label>
                <textarea
                  rows={10}
                  placeholder="Hasil pemeriksaan fisik THT (telinga, hidung, tenggorokan)..."
                  value={physicalExam}
                  onChange={(e) => setPhysicalExam(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                {errors.physicalExam && (
                  <p className="text-red-600 text-sm mt-1">{errors.physicalExam}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Minimal 20 karakter</p>
              </div>
            </div>
          )}

          {/* Tab 3: Assessment (Diagnosis) */}
          {activeTab === "assessment" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Assessment (A) - Diagnosis</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Kode ICD-10 *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama penyakit atau kode ICD-10..."
                    value={diagnosisSearch}
                    onChange={(e) => {
                      setDiagnosisSearch(e.target.value);
                      searchICD10(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  
                  {diagnosisResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {diagnosisResults.map((diag) => (
                        <button
                          key={diag.code}
                          type="button"
                          onClick={() => addDiagnosis(diag)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="font-medium">{diag.code}</div>
                          <div className="text-sm text-gray-600">{diag.nameIndonesian}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.diagnoses && (
                  <p className="text-red-600 text-sm mt-1">{errors.diagnoses}</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Diagnosis Terpilih:</h4>
                {diagnoses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Belum ada diagnosis ditambahkan</p>
                ) : (
                  <div className="space-y-2">
                    {diagnoses.map((diag) => (
                      <div
                        key={diag.code}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-medium">{diag.code}</span>
                            <span>-</span>
                            <span>{diag.nameIndonesian}</span>
                            {diag.isPrimary && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                Primer
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!diag.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryDiagnosis(diag.code)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Set Primer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDiagnosis(diag.code)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Plan */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Plan (P) - Rencana Tindakan</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rencana Tindakan *
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Rencana pengobatan, edukasi pasien, tindakan lanjutan..."
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {errors.treatmentPlan && (
                    <p className="text-red-600 text-sm mt-1">{errors.treatmentPlan}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Minimal 20 karakter</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={4}
                  placeholder="Catatan khusus atau informasi tambahan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Kontrol
                </label>
                <DatePicker
                  value={followUpDate}
                  onChange={(date) => setFollowUpDate(date)}
                  minDate={new Date()}
                  placeholder="Pilih tanggal kontrol"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Opsional - untuk jadwal kontrol berikutnya</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lampiran Foto/Dokumen
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
            </div>
          )}
        </div>


        {/* Action Buttons */}
        <div className="border-t px-6 py-4 flex justify-between">
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
        </>
      )}
    </div>
  );
}
