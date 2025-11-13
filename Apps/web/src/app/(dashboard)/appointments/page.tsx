"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AppointmentCalendar from "@/components/calendar/AppointmentCalendar";
import AppointmentStats from "@/components/appointments/AppointmentStats";
import { Calendar, ListOrdered } from "lucide-react";

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
        <div>
          <h1 className="text-2xl font-semibold">Janji Temu</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal janji temu pasien
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href="/queue">
              <ListOrdered className="h-4 w-4 mr-2" />
              Lihat Antrian
            </Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/appointments/new">
              <Calendar className="h-4 w-4 mr-2" />
              Buat Janji Temu Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Appointment Statistics */}
      <AppointmentStats />

      {/* Doctor Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="doctor-filter" className="text-sm font-medium whitespace-nowrap">
              Filter Dokter:
            </Label>
            <select
              id="doctor-filter"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Semua Dokter</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Calendar */}
      <AppointmentCalendar
        doctorId={selectedDoctor || undefined}
        onAppointmentSelect={handleAppointmentSelect}
      />
    </div>
  );
}
