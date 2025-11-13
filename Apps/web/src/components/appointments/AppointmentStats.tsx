"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle, User } from "lucide-react";

interface AppointmentStatsData {
  today: {
    total: number;
    pendingCheckIns: number;
    checkedIn: number;
    completed: number;
    cancelled: number;
  };
  thisMonth: {
    totalAppointments: number;
    cancelledAppointments: number;
    cancellationRate: number;
    mostBookedDoctor: {
      id: string;
      name: string;
      count: number;
    } | null;
  };
}

export default function AppointmentStats() {
  const [stats, setStats] = useState<AppointmentStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/appointments/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Today's Appointments */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Janji Temu Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.today.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.today.completed} selesai, {stats.today.cancelled} dibatalkan
          </p>
        </CardContent>
      </Card>

      {/* Pending Check-ins */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Menunggu Check-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-600">
            {stats.today.pendingCheckIns}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Belum check-in hari ini
          </p>
        </CardContent>
      </Card>

      {/* Checked-in/In Progress */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Sedang Berlangsung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {stats.today.checkedIn}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Check-in / dalam proses
          </p>
        </CardContent>
      </Card>

      {/* Most Booked Doctor */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Dokter Terpopuler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.thisMonth.mostBookedDoctor ? (
            <>
              <div className="text-lg font-bold truncate">
                {stats.thisMonth.mostBookedDoctor.name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.thisMonth.mostBookedDoctor.count} janji temu bulan ini
              </p>
            </>
          ) : (
            <>
              <div className="text-lg font-medium text-muted-foreground">
                Tidak ada data
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Belum ada janji temu
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
