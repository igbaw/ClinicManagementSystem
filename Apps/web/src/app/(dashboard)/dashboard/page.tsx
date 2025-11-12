import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Activity,
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch dashboard statistics
  const [
    { count: totalPatients },
    { count: todayQueue },
    { data: todayAppointments },
    { data: recentPatients },
    { data: lowStockMedications },
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_date", today)
      .in("status", ["waiting", "in_progress"]),
    supabase
      .from("appointments")
      .select("*, patient:patients(full_name)")
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true })
      .limit(5),
    supabase
      .from("patients")
      .select("id, full_name, medical_record_number, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("medications")
      .select("id, name, stock_quantity, unit")
      .lt("stock_quantity", 10)
      .order("stock_quantity", { ascending: true })
      .limit(5),
  ]);

  const stats = [
    {
      title: "Antrian Hari Ini",
      value: todayQueue || 0,
      description: "Pasien yang menunggu",
      icon: Clock,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
    },
    {
      title: "Total Pasien",
      value: totalPatients || 0,
      description: "Terdaftar di sistem",
      icon: Users,
      color: "text-secondary-600",
      bgColor: "bg-secondary-100",
    },
    {
      title: "Janji Temu Hari Ini",
      value: todayAppointments?.length || 0,
      description: "Appointment terjadwal",
      icon: Calendar,
      color: "text-success-600",
      bgColor: "bg-success-100",
    },
    {
      title: "Stok Menipis",
      value: lowStockMedications?.length || 0,
      description: "Obat perlu restock",
      icon: Package,
      color: "text-warning-600",
      bgColor: "bg-warning-100",
    },
  ];

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Manajemen Klinik THT Aion
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Pilih tindakan yang ingin dilakukan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="primary" className="w-full justify-start" asChild>
              <Link href="/walk-in">
                <Activity className="mr-2 h-4 w-4" />
                Check-in Pasien Walk-in
              </Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/patients/new">
                <Users className="mr-2 h-4 w-4" />
                Registrasi Pasien Baru
              </Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/appointments/new">
                <Calendar className="mr-2 h-4 w-4" />
                Buat Janji Temu
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/queue">
                <Clock className="mr-2 h-4 w-4" />
                Lihat Antrian
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Janji Temu Hari Ini</CardTitle>
            <CardDescription>
              {todayAppointments && todayAppointments.length > 0
                ? `${todayAppointments.length} appointment terjadwal`
                : "Belum ada appointment"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{apt.patient?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(apt.appointment_time)}
                      </p>
                    </div>
                    <Badge variant={apt.status === "confirmed" ? "success" : "warning"}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/appointments">
                    Lihat Semua
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Tidak ada appointment hari ini
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Pasien Terbaru</CardTitle>
            <CardDescription>5 pasien terakhir yang terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPatients && recentPatients.length > 0 ? (
              <div className="space-y-3">
                {recentPatients.map((patient: any) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/patients/${patient.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {patient.medical_record_number}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(patient.created_at)}
                    </p>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/patients">
                    Lihat Semua Pasien
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Belum ada pasien terdaftar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning-600" />
              Peringatan Stok
            </CardTitle>
            <CardDescription>Obat dengan stok menipis</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockMedications && lowStockMedications.length > 0 ? (
              <div className="space-y-3">
                {lowStockMedications.map((med: any) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between p-3 border border-warning-200 bg-warning-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Sisa: {med.stock_quantity} {med.unit}
                      </p>
                    </div>
                    <Badge variant="warning">
                      Stok Rendah
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/inventory">
                    Kelola Inventori
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Semua obat stok aman
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
