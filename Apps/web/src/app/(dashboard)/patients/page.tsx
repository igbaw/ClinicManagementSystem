import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import PatientsList from "@/components/patients/PatientsList";
import { Button } from "@/components/ui/button";

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
          <Button variant="success" asChild>
            <Link href="/appointments/new">
              + Janji Temu Baru
            </Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/patients/new">
              Registrasi Baru
            </Link>
          </Button>
        </div>
      </div>
      <PatientsList initialPatients={patients || []} />
    </div>
  );
}
