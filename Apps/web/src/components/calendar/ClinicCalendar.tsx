"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, getDay, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
  patient: {
    full_name: string;
    medical_record_number: string;
  };
  doctor: {
    full_name: string;
  };
}

interface ClinicCalendarProps {
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  selectedDoctor?: string;
  initialDate?: Date;
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  checked_in: "bg-green-100 text-green-800 border-green-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusDotColors = {
  scheduled: "bg-blue-500",
  checked_in: "bg-green-500",
  in_progress: "bg-yellow-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-500",
};

export default function ClinicCalendar({ 
  onDateSelect, 
  onAppointmentClick, 
  selectedDoctor,
  initialDate = new Date()
}: ClinicCalendarProps) {
  // Use lazy initializer to create supabase client only once
  const [supabase] = useState(() => createClient());
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const spinnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);

  // For week view, show current week around selectedDate or currentMonth
  const weekStart = startOfWeek(selectedDate || currentMonth, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate || currentMonth, { weekStartsOn: 1 });

  // Use different start/end based on view mode
  const startDate = viewMode === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = viewMode === "week" ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  }, [startDate, endDate]);

  // Load appointments for the current month view with debounce and spinner delay
  useEffect(() => {
    // Clear pending debounce
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    // Debounce fetch to avoid rapid re-queries when month/filters change
    fetchDebounceRef.current = setTimeout(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        // Only show spinner if loading takes >150ms to reduce flicker
        spinnerTimerRef.current = setTimeout(() => {
          if (!cancelled) setShowSpinner(true);
        }, 150);

        try {
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');

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
            .gte("appointment_date", startDateStr)
            .lte("appointment_date", endDateStr)
            .order("appointment_time");

          if (selectedDoctor) {
            query = query.eq("doctor_id", selectedDoctor);
          }

          const { data } = await query;

          if (cancelled) return;

          // Group appointments by date
          const groupedAppointments: Record<string, Appointment[]> = {};
          data?.forEach((apt: any) => {
            const dateKey = apt.appointment_date;
            if (!groupedAppointments[dateKey]) {
              groupedAppointments[dateKey] = [];
            }
            groupedAppointments[dateKey].push(apt);
          });

          setAppointments(groupedAppointments);
        } catch (error) {
          if (!cancelled) console.error("Error loading appointments:", error);
        } finally {
          if (!cancelled) {
            setLoading(false);
            setShowSpinner(false);
            if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
          }
        }
      };
      void run();
      return () => {
        cancelled = true;
      };
    }, 100); // 100ms debounce

    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    };
  }, [startDate, endDate, selectedDoctor, supabase]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return appointments[dateKey] || [];
  };

  const getAppointmentStats = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date);
    return {
      total: dayAppointments.length,
      scheduled: dayAppointments.filter(a => a.status === 'scheduled').length,
      completed: dayAppointments.filter(a => a.status === 'completed').length,
      cancelled: dayAppointments.filter(a => a.status === 'cancelled').length,
    };
  };

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === "month" 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Bulan
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === "week" 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Minggu
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                handleDateClick(today);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Dijadwalkan</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Dalam Proses</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Selesai</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Dibatalkan</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {showSpinner && loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Memuat jadwal...</div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date) => {
              const stats = getAppointmentStats(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);
              const dayAppointments = getAppointmentsForDate(date);

              const dayKey = format(date, 'yyyy-MM-dd');
              return (
                <div
                  key={dayKey}
                  onClick={() => handleDateClick(date)}
                  className={`
                    bg-white p-2 min-h-[80px] cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                    ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                    ${isCurrentDay ? 'bg-blue-100' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${
                      isCurrentDay ? 'text-blue-600' : ''
                    }`}>
                      {format(date, 'd')}
                    </span>
                    {stats.total > 0 && (
                      <span className="text-xs text-gray-500">
                        {stats.total}
                      </span>
                    )}
                  </div>

                  {/* Appointment indicators */}
                  {stats.total > 0 && (
                    <div className="space-y-1">
                      {/* Show dots for appointment status */}
                      <div className="flex gap-1">
                        {stats.scheduled > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                        {dayAppointments.some(a => a.status === 'checked_in') && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        )}
                        {dayAppointments.some(a => a.status === 'in_progress') && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                        )}
                        {stats.completed > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        )}
                        {stats.cancelled > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        )}
                      </div>

                      {/* Show first appointment if any */}
                      {dayAppointments.length > 0 && (
                        <div className="text-xs text-gray-600 truncate">
                          {dayAppointments[0].appointment_time?.slice(0, 5)} {dayAppointments[0].patient.full_name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">
              Jadwal {format(selectedDate, 'd MMMM yyyy', { locale: id })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Tidak ada janji temu pada tanggal ini
              </p>
            ) : (
              getAppointmentsForDate(selectedDate).map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => onAppointmentClick?.(appointment)}
                  className="flex items-center justify-between p-2 bg-white rounded border hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusDotColors[appointment.status]}`}></div>
                    <div>
                      <p className="text-sm font-medium">{appointment.patient.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {appointment.patient.medical_record_number} • {appointment.appointment_time?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[appointment.status]}`}>
                    {appointment.status === 'scheduled' ? 'Dijadwalkan' :
                     appointment.status === 'checked_in' ? 'Check-in' :
                     appointment.status === 'in_progress' ? 'Dalam Proses' :
                     appointment.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
