import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateTimeSlots } from "@/config/clinic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "doctorId and date are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get all appointments for the doctor on the date
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("appointment_time, patient_id, patients(full_name)")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", date)
      .in("status", ["scheduled", "checked_in", "in_progress"]);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    const allSlots = generateTimeSlots();
    const bookedTimes = new Set(
      appointments?.map((apt) => apt.appointment_time?.slice(0, 5)) || []
    );

    const slots = allSlots.map((time) => {
      const isBooked = bookedTimes.has(time);
      const appointment = appointments?.find(
        (apt) => apt.appointment_time?.slice(0, 5) === time
      );

      return {
        time,
        available: !isBooked,
        patient: isBooked && appointment 
          ? (Array.isArray(appointment.patients) 
              ? (appointment.patients[0] as any)?.full_name 
              : (appointment.patients as any)?.full_name) 
          : null,
      };
    });

    return NextResponse.json({
      doctorId,
      date,
      slots,
      totalSlots: allSlots.length,
      availableSlots: slots.filter((s) => s.available).length,
      bookedSlots: slots.filter((s) => !s.available).length,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
