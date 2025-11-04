"use client";

import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import ClinicCalendar from "./ClinicCalendarOptimized";
import Link from "next/link";

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
  const supabase = useMemo(() => createClient(), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

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
          status,
          patient:patients(full_name, medical_record_number),
          doctor:users(full_name)
        `)
        .eq("appointment_date", dateStr)
        .order("appointment_time");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data } = await query;
      setSelectedDateAppointments((data as unknown as Appointment[]) || []);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [doctorId, supabase]);

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    onAppointmentSelect?.(appointment);
  }, [onAppointmentSelect]);

  const checkInAppointment = async (appointmentId: string, bookingCode: string) => {
    try {
      const response = await fetch("/api/checkin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_code: bookingCode }),
      });

      if (response.ok) {
        // Refresh appointments for selected date
        if (selectedDate) {
          await handleDateSelect(selectedDate);
        }
      }
    } catch (error) {
      console.error("Check-in error:", error);
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
        <div className="bg-white rounded-lg shadow border">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Detail Janji Temu
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </span>
                <Link
                  href={`/appointments/new?date=${format(selectedDate, 'yyyy-MM-dd')}`}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  + Janji Baru
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Memuat janji temu...
              </div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-500 mb-4">
                  Tidak ada janji temu pada tanggal ini
                </p>
                <Link
                  href={`/appointments/new?date=${format(selectedDate, 'yyyy-MM-dd')}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Buat Janji Temu Baru
                </Link>
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
                          <span className="font-medium text-gray-900">
                            {getPatient(appointment)?.full_name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status === 'scheduled' ? 'Terjadwal' :
                             appointment.status === 'checked_in' ? 'Check-in' :
                             appointment.status === 'in_progress' ? 'Berlangsung' :
                             appointment.status === 'completed' ? 'Selesai' :
                             'Dibatalkan'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {getPatient(appointment)?.medical_record_number}
                          {getDoctor(appointment) && ` • Dr. ${getDoctor(appointment)?.full_name}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => checkInAppointment(appointment.id, appointment.booking_code || '')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Check-in
                        </button>
                      )}
                      {appointment.status === 'checked_in' && (
                        <Link
                          href="/queue"
                          className="px-3 py-1 border border-green-600 text-green-600 text-sm rounded-md hover:bg-green-50"
                        >
                          Lihat Antrian
                        </Link>
                      )}
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="px-3 py-1 text-blue-600 text-sm hover:bg-blue-50 rounded-md"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
