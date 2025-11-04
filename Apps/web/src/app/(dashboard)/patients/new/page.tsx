import PatientForm from "@/components/patients/PatientForm";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const createSchema = z.object({
  fullName: z.string(),
  nik: z.string(),
  bpjsNumber: z.string().optional(),
  dateOfBirth: z.coerce.date(),
  gender: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  address: z.string(),
  "emergencyContact.name": z.string().optional(),
  "emergencyContact.relationship": z.string().optional(),
  "emergencyContact.phone": z.string().optional(),
});

async function generateMRNumber(supabase: any): Promise<string> {
  "use server";
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const prefix = `MR-${dateStr}-`;

  // Get the last MR number for today
  const { data: lastPatient } = await supabase
    .from("patients")
    .select("medical_record_number")
    .like("medical_record_number", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let sequence = 1;
  if (lastPatient?.medical_record_number) {
    const lastSequence = parseInt(lastPatient.medical_record_number.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`;
}

async function createPatient(formData: FormData) {
  "use server";
  const supabase = await createServerClient();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Validasi gagal", details: parsed.error.issues };
  }

  const data = parsed.data;

  // Check for duplicate NIK
  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id, full_name, medical_record_number")
    .eq("nik", data.nik)
    .single();

  if (existingPatient) {
    return { 
      error: "NIK sudah terdaftar", 
      duplicate: {
        name: existingPatient.full_name,
        mrNumber: existingPatient.medical_record_number
      }
    };
  }

  // Generate MR number
  const mrNumber = await generateMRNumber(supabase);

  // Handle photo upload
  let photoUrl = null;
  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const fileExt = photo.name.split(".").pop();
    const fileName = `${mrNumber}.${fileExt}`;
    const filePath = `patient-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("patients")
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("patients")
        .getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }
  }

  const payload = {
    medical_record_number: mrNumber,
    full_name: data.fullName,
    nik: data.nik,
    bpjs_number: data.bpjsNumber || null,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    phone: data.phone,
    email: data.email || null,
    address: data.address,
    photo_url: photoUrl,
    emergency_contact: data["emergencyContact.name"]
      ? {
          name: data["emergencyContact.name"],
          relationship: data["emergencyContact.relationship"],
          phone: data["emergencyContact.phone"],
        }
      : null,
  } as const;

  const { data: newPatient, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("id, medical_record_number, full_name")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { 
    success: true, 
    patient: newPatient,
    mrNumber: newPatient.medical_record_number
  };
}

export default function NewPatientPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Registrasi Pasien Baru</h1>
      <PatientForm action={createPatient} />
    </div>
  );
}
