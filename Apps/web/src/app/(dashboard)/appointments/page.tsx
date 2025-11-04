"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AppointmentCalendar from "@/components/calendar/AppointmentCalendar";

interface Doctor {
  id: string;
  full_name: string;
}

export default function AppointmentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Load doctors
  const loadDoctors = useCallback(async () => {
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "doctor")
      .order("full_name");
    setDoctors(data || []);
  }, [supabase]);

  // Load doctors on mount
  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const handleAppointmentSelect = useCallback((appointment: any) => {
    // Handle appointment selection - could open modal or navigate
    console.log("Selected appointment:", appointment);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Janji Temu</h1>
        <div className="flex gap-3">
          <Link
            href="/queue"
            className="rounded-md border border-green-600 text-green-600 px-4 py-2 hover:bg-green-50"
          >
            Lihat Antrian
          </Link>
          <Link
            href="/appointments/new"
            className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            + Buat Janji Temu Baru
          </Link>
        </div>
      </div>

      {/* Doctor Filter */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Filter Dokter:
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Semua Dokter</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enhanced Calendar */}
      <AppointmentCalendar
        doctorId={selectedDoctor || undefined}
        onAppointmentSelect={handleAppointmentSelect}
      />
    </div>
  );
}
