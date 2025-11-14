"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CancelAppointmentModal from "@/components/appointments/CancelAppointmentModal";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Edit,
  XCircle,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  booking_code: string;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  cancelled_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  patient: {
    id: string;
    full_name: string;
    medical_record_number: string;
    phone: string;
    date_of_birth: string;
    nik: string;
  };
  doctor: {
    id: string;
    full_name: string;
  };
  cancelled_by_user?: {
    full_name: string;
  };
}

interface AppointmentHistory {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by_user: {
    full_name: string;
  } | null;
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    loadAppointment();
    loadHistory();
  }, [params?.id]);

  const loadAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(
            id,
            full_name,
            medical_record_number,
            phone,
            date_of_birth,
            nik
          ),
          doctor:users!appointments_doctor_id_fkey(id, full_name),
          cancelled_by_user:users!appointments_cancelled_by_fkey(full_name)
        `)
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setAppointment(data as unknown as Appointment);
    } catch (error) {
      console.error("Error loading appointment:", error);
      alert("Gagal memuat detail janji temu");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("appointment_history")
        .select(`
          *,
          changed_by_user:users(full_name)
        `)
        .eq("appointment_id", params.id)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      setHistory((data as unknown as AppointmentHistory[]) || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleCancelAppointment = async (reason: string) => {
    try {
      const response = await fetch(`/api/appointments/${params.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel appointment");
      }

      // Reload appointment data
      await loadAppointment();
      await loadHistory();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      alert(error.message || "Gagal membatalkan janji temu");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Memuat detail janji temu...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Janji Temu Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Janji temu yang Anda cari tidak ditemukan atau telah dihapus.
            </p>
            <Button onClick={() => router.push("/appointments")}>
              Kembali ke Daftar Janji Temu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: { variant: "primary" as const, label: "Terjadwal" },
      checked_in: { variant: "success" as const, label: "Check-in" },
      in_progress: { variant: "warning" as const, label: "Berlangsung" },
      completed: { variant: "gray" as const, label: "Selesai" },
      cancelled: { variant: "error" as const, label: "Dibatalkan" },
    };
    const config = variants[status as keyof typeof variants] || variants.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.slice(0, 5) || "";
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Janji Temu</h1>
            <p className="text-sm text-muted-foreground">
              Booking Code: <span className="font-mono font-semibold">{appointment.booking_code}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {appointment.status !== "cancelled" && appointment.status !== "completed" && (
            <>
              <Button variant="secondary" asChild>
                <Link href={`/appointments/${appointment.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowCancelModal(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Batalkan
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informasi Janji Temu
                </CardTitle>
                {getStatusBadge(appointment.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Tanggal</label>
                  <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Waktu</label>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatTime(appointment.appointment_time)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm text-muted-foreground">Dokter</label>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {appointment.doctor.full_name}
                </p>
              </div>

              {appointment.notes && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Catatan
                    </label>
                    <p className="mt-1 text-sm">{appointment.notes}</p>
                  </div>
                </>
              )}

              {appointment.status === "cancelled" && appointment.cancelled_reason && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <label className="text-sm font-medium text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Alasan Pembatalan
                    </label>
                    <p className="mt-1 text-sm">{appointment.cancelled_reason}</p>
                    {appointment.cancelled_at && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Dibatalkan pada {new Date(appointment.cancelled_at).toLocaleString("id-ID")}
                        {appointment.cancelled_by_user && ` oleh ${appointment.cancelled_by_user.full_name}`}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pasien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                  <p className="font-medium">{appointment.patient.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">No. Rekam Medis</label>
                  <p className="font-mono font-medium">{appointment.patient.medical_record_number}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">NIK</label>
                  <p className="font-mono text-sm">{appointment.patient.nik}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tanggal Lahir</label>
                  <p className="text-sm">
                    {new Date(appointment.patient.date_of_birth).toLocaleDateString("id-ID")}
                    <span className="text-muted-foreground ml-2">
                      ({calculateAge(appointment.patient.date_of_birth)} tahun)
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telepon
                  </label>
                  <p className="font-medium">{appointment.patient.phone}</p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/patients/${appointment.patient.id}`}>
                    Lihat Detail Pasien
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/patients/${appointment.patient.id}/history`}>
                    Riwayat Kunjungan
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appointment History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Perubahan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          {new Date(item.changed_at).toLocaleString("id-ID")}
                          {item.changed_by_user && ` • ${item.changed_by_user.full_name}`}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium">{item.field_name}</span> diubah
                          {item.old_value && item.new_value && (
                            <span>
                              {" "}dari <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{item.old_value}</span>
                              {" "}ke <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{item.new_value}</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointment.status === "scheduled" && (
                <Button variant="success" className="w-full" asChild>
                  <Link href={`/appointments?checkin=${appointment.booking_code}`}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check-in Pasien
                  </Link>
                </Button>
              )}
              {appointment.status === "checked_in" && (
                <Button variant="primary" className="w-full" asChild>
                  <Link href="/queue">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Lihat Antrian
                  </Link>
                </Button>
              )}
              <Button variant="secondary" className="w-full" asChild>
                <Link href={`/appointments/new?patient=${appointment.patient.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Buat Janji Temu Baru
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <label className="text-muted-foreground">Dibuat pada</label>
                <p>{new Date(appointment.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <label className="text-muted-foreground">ID Janji Temu</label>
                <p className="font-mono text-xs break-all">{appointment.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelAppointmentModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelAppointment}
        appointmentDetails={{
          patientName: appointment.patient.full_name,
          date: formatDate(appointment.appointment_date),
          time: formatTime(appointment.appointment_time),
        }}
      />
    </div>
  );
}
