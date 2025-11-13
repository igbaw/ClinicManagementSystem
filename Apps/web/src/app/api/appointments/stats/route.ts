import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Get today's appointments count
    const { count: todayCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", today)
      .neq("status", "cancelled");

    // Get pending check-ins (scheduled appointments for today)
    const { count: pendingCheckIns } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", today)
      .eq("status", "scheduled");

    // Get checked-in appointments today
    const { count: checkedInCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", today)
      .in("status", ["checked_in", "in_progress"]);

    // Get completed appointments today
    const { count: completedCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", today)
      .eq("status", "completed");

    // Get cancelled appointments today
    const { count: cancelledCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", today)
      .eq("status", "cancelled");

    // Get most booked doctor this month
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

    const { data: doctorStats } = await supabase
      .from("appointments")
      .select("doctor_id, users!appointments_doctor_id_fkey(full_name)")
      .gte("appointment_date", firstDayOfMonth)
      .neq("status", "cancelled");

    // Count appointments per doctor
    const doctorCounts: Record<string, { name: string; count: number }> = {};
    doctorStats?.forEach((apt: any) => {
      const doctorId = apt.doctor_id;
      const doctorName = apt.users?.full_name || "Unknown";
      if (!doctorCounts[doctorId]) {
        doctorCounts[doctorId] = { name: doctorName, count: 0 };
      }
      doctorCounts[doctorId].count++;
    });

    // Find the doctor with most appointments
    let mostBookedDoctor = null;
    let maxCount = 0;
    for (const [doctorId, data] of Object.entries(doctorCounts)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostBookedDoctor = { id: doctorId, name: data.name, count: data.count };
      }
    }

    // Calculate cancellation rate for this month
    const { count: totalMonthAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_date", firstDayOfMonth);

    const { count: cancelledMonthCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_date", firstDayOfMonth)
      .eq("status", "cancelled");

    const cancellationRate =
      totalMonthAppointments && totalMonthAppointments > 0
        ? ((cancelledMonthCount || 0) / totalMonthAppointments) * 100
        : 0;

    return NextResponse.json({
      today: {
        total: todayCount || 0,
        pendingCheckIns: pendingCheckIns || 0,
        checkedIn: checkedInCount || 0,
        completed: completedCount || 0,
        cancelled: cancelledCount || 0,
      },
      thisMonth: {
        totalAppointments: totalMonthAppointments || 0,
        cancelledAppointments: cancelledMonthCount || 0,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        mostBookedDoctor,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment statistics" },
      { status: 500 }
    );
  }
}
