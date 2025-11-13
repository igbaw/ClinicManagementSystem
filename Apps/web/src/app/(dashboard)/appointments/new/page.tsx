"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PatientSelector from "@/components/appointments/PatientSelector";
import DatePicker from "@/components/calendar/DatePicker";
import { generateTimeSlots, getClinicHoursString } from "@/config/clinic";
import { Calendar, Clock, FileText, CheckCircle } from "lucide-react";

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

  // BPJS fields (optional)
  const [isBPJS, setIsBPJS] = useState(false);
  const [bpjsCardNumber, setBpjsCardNumber] = useState("");
  const [rujukanNumber, setRujukanNumber] = useState("");
  const [rujukanDate, setRujukanDate] = useState<Date | null>(null);
  const [rujukanPPKCode, setRujukanPPKCode] = useState("");

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

      const appointmentData: any = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: dateStr,
        appointment_time: `${time}:00`,
        status: "scheduled",
        notes: notes || null,
      };

      // Add BPJS fields if enabled
      if (isBPJS) {
        appointmentData.bpjs_card_number = bpjsCardNumber || null;
        appointmentData.rujukan_number = rujukanNumber || null;
        appointmentData.rujukan_date = rujukanDate ? rujukanDate.toISOString().split('T')[0] : null;
        appointmentData.rujukan_ppk_code = rujukanPPKCode || null;
      }

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
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
        <Card className="shadow-lg">
          <CardContent className="pt-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>

            <h1 className="text-3xl font-bold mb-2">
              Janji Temu Berhasil Dibuat!
            </h1>
            <p className="text-muted-foreground mb-6">
              Janji temu telah terdaftar dalam sistem
            </p>

            <Card className="bg-primary/5 border-primary/20 mb-6 text-left">
              <CardHeader>
                <CardTitle className="text-lg">Detail Janji Temu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pasien:</span>
                  <span className="font-medium">{createdAppointment.patient?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. RM:</span>
                  <span className="font-medium">{createdAppointment.patient?.medical_record_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dokter:</span>
                  <span className="font-medium">{createdAppointment.doctor?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal:</span>
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
                  <span className="text-muted-foreground">Waktu:</span>
                  <span className="font-medium">{createdAppointment.appointment_time?.slice(0, 5)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => router.push("/appointments")}
              >
                Lihat Daftar Janji Temu
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSuccess(false);
                  setPatientId("");
                  setSelectedPatient(null);
                  setTime("");
                  setNotes("");
                  setIsBPJS(false);
                  setBpjsCardNumber("");
                  setRujukanNumber("");
                  setRujukanDate(null);
                  setRujukanPPKCode("");
                  setCreatedAppointment(null);
                }}
              >
                Buat Janji Temu Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buat Janji Temu Baru</h1>
        <p className="text-muted-foreground">Jadwalkan kunjungan pasien dengan dokter</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Janji Temu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.submit && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
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
        <div className="space-y-2">
          <Label htmlFor="doctor">Dokter *</Label>
          <select
            id="doctor"
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setErrors({ ...errors, doctor: "" });
            }}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Pilih Dokter</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
          {errors.doctor && <p className="text-sm text-destructive mt-1">{errors.doctor}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal *</Label>
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
              <p className="text-sm text-destructive mt-1">{errors.date}</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Waktu *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select
                id="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setErrors({ ...errors, time: "" });
                }}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
            </div>
            {errors.time && <p className="text-sm text-destructive mt-1">{errors.time}</p>}
            <p className="text-xs text-muted-foreground">
              Jam operasional: {clinicHoursText}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Catatan (Opsional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Tambahkan catatan untuk janji temu ini..."
          />
        </div>

        <Separator />

        {/* BPJS Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-bpjs"
              checked={isBPJS}
              onChange={(e) => setIsBPJS(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="is-bpjs" className="cursor-pointer">
              Pasien BPJS (Opsional)
            </Label>
          </div>

          {isBPJS && (
            <div className="space-y-4 pl-6 border-l-2 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpjs-card">No. Kartu BPJS</Label>
                  <Input
                    id="bpjs-card"
                    value={bpjsCardNumber}
                    onChange={(e) => setBpjsCardNumber(e.target.value)}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rujukan-number">No. Rujukan</Label>
                  <Input
                    id="rujukan-number"
                    value={rujukanNumber}
                    onChange={(e) => setRujukanNumber(e.target.value)}
                    placeholder="Nomor rujukan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rujukan-date">Tanggal Rujukan</Label>
                  <DatePicker
                    value={rujukanDate || new Date()}
                    onChange={(date) => setRujukanDate(date)}
                    placeholder="Pilih tanggal rujukan"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rujukan-ppk">Kode PPK Rujukan</Label>
                  <Input
                    id="rujukan-ppk"
                    value={rujukanPPKCode}
                    onChange={(e) => setRujukanPPKCode(e.target.value)}
                    placeholder="Kode PPK"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Buat Janji Temu
          </Button>
        </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
