import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    const { appointmentIds, reason } = await request.json();

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return NextResponse.json(
        { error: "No appointment IDs provided" },
        { status: 400 }
      );
    }

    // Validate appointments exist and are not already cancelled
    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status")
      .in("id", appointmentIds);

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    // Filter out already cancelled appointments
    const validAppointmentIds = appointments
      ?.filter((apt) => apt.status !== "cancelled")
      .map((apt) => apt.id) || [];

    if (validAppointmentIds.length === 0) {
      return NextResponse.json(
        { error: "All selected appointments are already cancelled" },
        { status: 400 }
      );
    }

    // Bulk update appointments
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_reason: reason || "Bulk cancellation",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .in("id", validAppointmentIds);

    if (updateError) {
      console.error("Error cancelling appointments:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel appointments" },
        { status: 500 }
      );
    }

    // Also cancel any associated queue entries
    await supabase
      .from("queue_entries")
      .update({ status: "cancelled" })
      .in("appointment_id", validAppointmentIds);

    return NextResponse.json({
      message: `Successfully cancelled ${validAppointmentIds.length} appointment(s)`,
      cancelledCount: validAppointmentIds.length,
      skippedCount: appointmentIds.length - validAppointmentIds.length,
    });
  } catch (error) {
    console.error("Error in bulk cancel API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
