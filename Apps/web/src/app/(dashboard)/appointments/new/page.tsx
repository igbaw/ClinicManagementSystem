"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import PatientSelector from "@/components/appointments/PatientSelector";
import DatePicker from "@/components/calendar/DatePicker";
import { generateTimeSlots, getClinicHoursString } from "@/config/clinic";

interface Doctor {
  id: string;
  full_name: string;
}

interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
}


export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [patientId, setPatientId] = useState(searchParams.get("patient") || "");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState<Date>(
    searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date()
  );
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);

  const slots = generateTimeSlots();
  const clinicHoursText = getClinicHoursString();

  // Load doctors
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "doctor")
        .order("full_name");
      setDoctors(data || []);
      if (data && data.length > 0) {
        setDoctorId(data[0].id);
      }
    })();
  }, [supabase]);

  // Load booked slots when doctor or date changes
  const loadBookedSlots = useCallback(async () => {
    if (!doctorId || !date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    const { data } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", dateStr)
      .in("status", ["scheduled", "checked_in", "in_progress"]);

    const slots = new Set<string>();
    data?.forEach((apt) => {
      const timeStr = apt.appointment_time?.slice(0, 5);
      if (timeStr) slots.add(timeStr);
    });
    setBookedSlots(slots);
  }, [doctorId, date, supabase]);

  useEffect(() => {
    void loadBookedSlots();
  }, [loadBookedSlots]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patient = "Pasien harus dipilih";
    }

    if (!doctorId) {
      newErrors.doctor = "Dokter harus dipilih";
    }

    if (!date) {
      newErrors.date = "Tanggal harus dipilih";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = "Tidak dapat menjadwalkan janji temu di masa lalu";
      }
    }

    if (!time) {
      newErrors.time = "Waktu harus dipilih";
    } else if (bookedSlots.has(time)) {
      newErrors.time = "Slot waktu ini sudah terisi, pilih waktu lain";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: dateStr,
          appointment_time: `${time}:00`,
          status: "scheduled",
          notes: notes || null,
        })
        .select(`
          *,
          patient:patients(full_name, medical_record_number),
          doctor:users!appointments_doctor_id_fkey(full_name)
        `)
        .single();

      if (error) throw error;

      setCreatedAppointment(appointment);
      setShowSuccess(true);
    } catch (error: any) {
      setErrors({ submit: error.message || "Gagal membuat janji temu" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess && createdAppointment) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white border rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Janji Temu Berhasil Dibuat!
          </h1>
          <p className="text-gray-600 mb-6">
            Janji temu telah terdaftar dalam sistem
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-lg mb-4">Detail Janji Temu</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pasien:</span>
                <span className="font-medium">{createdAppointment.patient?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. RM:</span>
                <span className="font-medium">{createdAppointment.patient?.medical_record_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dokter:</span>
                <span className="font-medium">{createdAppointment.doctor?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium">
                  {new Date(createdAppointment.appointment_date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu:</span>
                <span className="font-medium">{createdAppointment.appointment_time?.slice(0, 5)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/appointments")}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Lihat Daftar Janji Temu
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setPatientId("");
                setSelectedPatient(null);
                setTime("");
                setNotes("");
                setCreatedAppointment(null);
              }}
              className="px-6 py-2 border rounded-md hover:bg-gray-50"
            >
              Buat Janji Temu Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Janji Temu Baru</h1>
        <p className="text-gray-600">Jadwalkan kunjungan pasien dengan dokter</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {errors.submit}
          </div>
        )}

        {/* Patient Selection */}
        <PatientSelector
          value={patientId}
          onChange={(id, patient) => {
            setPatientId(id);
            setSelectedPatient(patient);
            setErrors({ ...errors, patient: "" });
          }}
          error={errors.patient}
        />

        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dokter *
          </label>
          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setErrors({ ...errors, doctor: "" });
            }}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Pilih Dokter</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
          {errors.doctor && <p className="text-red-600 text-sm mt-1">{errors.doctor}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal *
            </label>
            <DatePicker
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                setErrors({ ...errors, date: "" });
              }}
              minDate={new Date()}
              placeholder="Pilih tanggal janji temu"
              className="w-full"
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waktu *
            </label>
            <select
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setErrors({ ...errors, time: "" });
              }}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih Waktu</option>
              {slots.map((slot) => (
                <option
                  key={slot}
                  value={slot}
                  disabled={bookedSlots.has(slot)}
                >
                  {slot} {bookedSlots.has(slot) ? "(Terisi)" : ""}
                </option>
              ))}
            </select>
            {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Jam operasional: {clinicHoursText}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Tambahkan catatan untuk janji temu ini..."
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Membuat..." : "Buat Janji Temu"}
          </button>
        </div>
      </form>
    </div>
  );
}
