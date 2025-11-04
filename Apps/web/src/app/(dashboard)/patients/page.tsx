import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import PatientsList from "@/components/patients/PatientsList";

export default async function PatientsPage() {
  const supabase = await createServerClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Daftar Pasien</h1>
        <div className="flex gap-3">
          <Link href="/appointments/new" className="rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700">
            + Janji Temu Baru
          </Link>
          <Link href="/patients/new" className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">
            Registrasi Baru
          </Link>
        </div>
      </div>
      <PatientsList initialPatients={patients || []} />
    </div>
  );
}
