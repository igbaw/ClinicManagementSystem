"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/calendar/DatePicker";
import { generateTimeSlots, getClinicHoursString } from "@/config/clinic";
import { ArrowLeft, Calendar, Clock, User, Save } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: string;
  patient: {
    full_name: string;
    medical_record_number: string;
  };
}

export default function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slots = generateTimeSlots();
  const clinicHoursText = getClinicHoursString();

  // Initialize params
  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params;
      setAppointmentId(id);
    };
    initializeParams();
  }, [params]);

  // Load appointment data
  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
      loadDoctors();
    }
  }, [appointmentId]);

  const loadAppointment = async () => {
    if (!appointmentId) return;

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(full_name, medical_record_number)
        `)
        .eq("id", appointmentId)
        .single();

      if (error) throw error;

      const apt = data as unknown as Appointment;
      setAppointment(apt);
      setDoctorId(apt.doctor_id);
      setDate(new Date(apt.appointment_date));
      setTime(apt.appointment_time.slice(0, 5));
      setNotes(apt.notes || "");
    } catch (error) {
      console.error("Error loading appointment:", error);
      alert("Gagal memuat data janji temu");
      router.push("/appointments");
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "doctor")
      .order("full_name");
    setDoctors(data || []);
  };

  // Load booked slots when doctor or date changes
  const loadBookedSlots = useCallback(async () => {
    if (!doctorId || !date || !appointmentId) return;

    const dateStr = date.toISOString().split('T')[0];

    const { data } = await supabase
      .from("appointments")
      .select("appointment_time, id")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", dateStr)
      .in("status", ["scheduled", "checked_in", "in_progress"]);

    const slots = new Set<string>();
    data?.forEach((apt) => {
      // Don't mark current appointment slot as booked
      if (apt.id !== appointmentId) {
        const timeStr = apt.appointment_time?.slice(0, 5);
        if (timeStr) slots.add(timeStr);
      }
    });
    setBookedSlots(slots);
  }, [doctorId, date, appointmentId, supabase]);

  useEffect(() => {
    void loadBookedSlots();
  }, [loadBookedSlots]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!doctorId) {
      newErrors.doctor = "Dokter harus dipilih";
    }

    if (!date) {
      newErrors.date = "Tanggal harus dipilih";
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

    if (!validateForm() || !appointmentId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStr = date.toISOString().split('T')[0];

      const { error } = await supabase
        .from("appointments")
        .update({
          doctor_id: doctorId,
          appointment_date: dateStr,
          appointment_time: `${time}:00`,
          notes: notes || null,
        })
        .eq("id", appointmentId);

      if (error) throw error;

      alert("Janji temu berhasil diperbarui");
      router.push(`/appointments/${appointmentId}`);
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      setErrors({ submit: error.message || "Gagal memperbarui janji temu" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Janji Temu</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui informasi janji temu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informasi Janji Temu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.submit && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                    {errors.submit}
                  </div>
                )}

                {/* Patient Info (Read-only) */}
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Pasien</label>
                  </div>
                  <p className="font-medium">{appointment.patient.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    No. RM: {appointment.patient.medical_record_number}
                  </p>
                </div>

                {/* Doctor Selection */}
                <div className="space-y-2">
                  <Label htmlFor="doctor">Dokter *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <select
                      id="doctor"
                      value={doctorId}
                      onChange={(e) => {
                        setDoctorId(e.target.value);
                        setErrors({ ...errors, doctor: "" });
                      }}
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Pilih Dokter</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.doctor && (
                    <p className="text-sm text-destructive">{errors.doctor}</p>
                  )}
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
                      placeholder="Pilih tanggal"
                      className="w-full"
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date}</p>
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
                    {errors.time && (
                      <p className="text-sm text-destructive">{errors.time}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Jam operasional: {clinicHoursText}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Tambahkan catatan untuk janji temu ini..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
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
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">Perubahan Tersimpan</p>
                  <p className="text-muted-foreground text-xs">
                    Semua perubahan akan tercatat dalam riwayat janji temu
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">Slot Waktu</p>
                  <p className="text-muted-foreground text-xs">
                    Slot yang sudah terisi tidak dapat dipilih
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {appointment.status !== "scheduled" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Perhatian:</strong> Janji temu ini sudah dalam status{" "}
                  <strong>{appointment.status}</strong>. Pastikan perubahan yang Anda buat sudah benar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
