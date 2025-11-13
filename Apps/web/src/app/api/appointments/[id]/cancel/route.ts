import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { reason } = await request.json();
    const { id } = await params;
    const appointmentId = id;

    // Check if appointment exists
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, appointment_date, appointment_time")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment already cancelled" },
        { status: 400 }
      );
    }

    // Update appointment to cancelled
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_reason: reason || "No reason provided",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error cancelling appointment:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel appointment" },
        { status: 500 }
      );
    }

    // If appointment was checked in, also cancel the queue entry
    if (appointment.status === "checked_in" || appointment.status === "in_progress") {
      await supabase
        .from("queue_entries")
        .update({ status: "cancelled" })
        .eq("appointment_id", appointmentId);
    }

    return NextResponse.json({
      message: "Appointment cancelled successfully",
      appointmentId,
    });
  } catch (error) {
    console.error("Error in cancel appointment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
