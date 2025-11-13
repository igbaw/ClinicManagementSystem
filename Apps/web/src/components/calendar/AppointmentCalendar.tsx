"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClinicCalendar from "./ClinicCalendar";
import Link from "next/link";
import VitalSignsModal, { VitalSigns } from "../modals/VitalSignsModal";
import { Calendar, Plus } from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  booking_code?: string;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
  patient: Array<{
    full_name: string;
    medical_record_number: string;
  }> | {
    full_name: string;
    medical_record_number: string;
  };
  doctor: Array<{
    full_name: string;
  }> | {
    full_name: string;
  };
}

interface AppointmentCalendarProps {
  doctorId?: string;
  onAppointmentSelect?: (appointment: Appointment) => void;
}

export default function AppointmentCalendar({ 
  doctorId, 
  onAppointmentSelect 
}: AppointmentCalendarProps) {
  // Use lazy initializer to create supabase client only once
  const [supabase] = useState(() => createClient());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [selectedAppointmentForCheckIn, setSelectedAppointmentForCheckIn] = useState<Appointment | null>(null);

  // Helper to safely access patient/doctor data
  const getPatient = (apt: Appointment) => Array.isArray(apt.patient) ? apt.patient[0] : apt.patient;
  const getDoctor = (apt: Appointment) => Array.isArray(apt.doctor) ? apt.doctor[0] : apt.doctor;

  const handleDateSelect = useCallback(async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      let query = supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          booking_code,
          status,
          patient:patients(full_name, medical_record_number),
          doctor:users!appointments_doctor_id_fkey(full_name)
        `)
        .eq("appointment_date", dateStr)
        .order("appointment_time");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading appointments:", error);
        alert(`Gagal memuat janji temu: ${error.message}`);
        setSelectedDateAppointments([]);
      } else {
        console.log("Loaded appointments:", data);
        setSelectedDateAppointments((data as unknown as Appointment[]) || []);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      setSelectedDateAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, supabase]);

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    onAppointmentSelect?.(appointment);
  }, [onAppointmentSelect]);

  const handleCheckInClick = (appointment: Appointment) => {
    setSelectedAppointmentForCheckIn(appointment);
    setShowVitalSignsModal(true);
  };

  const checkInAppointment = async (vitalSigns: VitalSigns) => {
    if (!selectedAppointmentForCheckIn) return;

    try {
      const response = await fetch("/api/checkin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          booking_code: selectedAppointmentForCheckIn.booking_code,
          vital_signs: {
            bloodPressure: vitalSigns.bloodPressure,
            pulse: vitalSigns.pulse ? parseInt(vitalSigns.pulse) : null,
            temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : null,
            weight: vitalSigns.weight ? parseFloat(vitalSigns.weight) : null,
            height: vitalSigns.height ? parseFloat(vitalSigns.height) : null,
          },
        }),
      });

      if (response.ok) {
        setShowVitalSignsModal(false);
        setSelectedAppointmentForCheckIn(null);
        // Refresh appointments for selected date
        if (selectedDate) {
          await handleDateSelect(selectedDate);
        }
      } else {
        const result = await response.json();
        alert(result.message || "Gagal check-in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Terjadi kesalahan saat check-in");
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Component */}
      <ClinicCalendar
        onDateSelect={handleDateSelect}
        onAppointmentClick={handleAppointmentClick}
        selectedDoctor={doctorId}
      />

      {/* Selected Date Appointments */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detail Janji Temu</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </p>
              </div>
              <Button variant="primary" size="sm" asChild>
                <Link href={`/appointments/new?date=${format(selectedDate, 'yyyy-MM-dd')}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Janji Baru
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat janji temu...
              </div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  Tidak ada janji temu pada tanggal ini
                </p>
                <Button variant="primary" asChild>
                  <Link href={`/appointments/new?date=${format(selectedDate, 'yyyy-MM-dd')}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Janji Temu Baru
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-700">
                          {appointment.appointment_time?.slice(0, 5)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {parseInt(appointment.appointment_time?.slice(0, 2) || '0') < 12 ? 'Pagi' : 
                           parseInt(appointment.appointment_time?.slice(0, 2) || '0') < 15 ? 'Siang' : 'Sore'}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {getPatient(appointment)?.full_name}
                          </span>
                          <Badge
                            variant={
                              appointment.status === 'scheduled' ? 'primary' :
                              appointment.status === 'checked_in' ? 'success' :
                              appointment.status === 'in_progress' ? 'warning' :
                              appointment.status === 'completed' ? 'gray' :
                              'error'
                            }
                          >
                            {appointment.status === 'scheduled' ? 'Terjadwal' :
                             appointment.status === 'checked_in' ? 'Check-in' :
                             appointment.status === 'in_progress' ? 'Berlangsung' :
                             appointment.status === 'completed' ? 'Selesai' :
                             'Dibatalkan'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getPatient(appointment)?.medical_record_number}
                          {getDoctor(appointment) && ` • Dr. ${getDoctor(appointment)?.full_name}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.status === 'scheduled' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleCheckInClick(appointment)}
                        >
                          Check-in
                        </Button>
                      )}
                      {appointment.status === 'checked_in' && (
                        <Button variant="secondary" size="sm" asChild>
                          <Link href="/queue">
                            Lihat Antrian
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/appointments/${appointment.id}`}>
                          Detail
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vital Signs Modal */}
      <VitalSignsModal
        isOpen={showVitalSignsModal}
        onClose={() => {
          setShowVitalSignsModal(false);
          setSelectedAppointmentForCheckIn(null);
        }}
        onSubmit={checkInAppointment}
        patientName={selectedAppointmentForCheckIn ? getPatient(selectedAppointmentForCheckIn)?.full_name || '' : ''}
      />
    </div>
  );
}
