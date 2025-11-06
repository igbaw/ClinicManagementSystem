"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DatePicker from "@/components/calendar/DatePicker";
import Link from "next/link";

interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  nik: string;
  bpjs_number?: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patientId = params.id as string;

  // Load patient data
  const loadPatient = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) {
        console.error("Error loading patient:", error);
        router.push("/patients");
        return;
      }

      setPatient(data);
      setDateOfBirth(new Date(data.date_of_birth));
    } catch (error) {
      console.error("Error loading patient:", error);
      router.push("/patients");
    } finally {
      setLoading(false);
    }
  }, [patientId, supabase, router]);

  useEffect(() => {
    void loadPatient();
  }, [loadPatient]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const updateData = {
        full_name: formData.get("full_name"),
        nik: formData.get("nik"),
        bpjs_number: formData.get("bpjs_number") || null,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : patient?.date_of_birth,
        gender: formData.get("gender"),
        phone: formData.get("phone"),
        email: formData.get("email") || null,
        address: formData.get("address"),
        emergency_contact_name: formData.get("emergency_contact_name") || null,
        emergency_contact_relationship: formData.get("emergency_contact_relationship") || null,
        emergency_contact_phone: formData.get("emergency_contact_phone") || null,
      };

      const { error } = await supabase
        .from("patients")
        .update(updateData)
        .eq("id", patientId);

      if (error) {
        setErrors({ submit: error.message });
        return;
      }

      router.push(`/patients/${patientId}`);
    } catch (error: any) {
      setErrors({ submit: error.message || "Gagal memperbarui data pasien" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Memuat data pasien...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Pasien tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/patients/${patientId}`} className="text-blue-600 hover:underline text-sm">
              ← Kembali ke Detail Pasien
            </Link>
            <h1 className="text-2xl font-bold mt-2">Edit Data Pasien</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {errors.submit}
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Informasi Pribadi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Rekam Medis
              </label>
              <input
                type="text"
                value={patient.medical_record_number}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="full_name"
                defaultValue={patient.full_name}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIK
              </label>
              <input
                type="text"
                name="nik"
                defaultValue={patient.nik || ""}
                maxLength={16}
                placeholder="16 digit angka (opsional)"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. BPJS
              </label>
              <input
                type="text"
                name="bpjs_number"
                defaultValue={patient.bpjs_number || ""}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Lahir *
              </label>
              <DatePicker
                value={dateOfBirth || new Date(patient.date_of_birth)}
                onChange={(date) => setDateOfBirth(date)}
                placeholder="Pilih tanggal lahir"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kelamin *
              </label>
              <select
                name="gender"
                defaultValue={patient.gender}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Informasi Kontak</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon *
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={patient.phone}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={patient.email || ""}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat *
              </label>
              <textarea
                name="address"
                defaultValue={patient.address}
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Kontak Darurat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                defaultValue={patient.emergency_contact?.name || ""}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hubungan
              </label>
              <input
                type="text"
                name="emergency_contact_relationship"
                defaultValue={patient.emergency_contact?.relationship || ""}
                placeholder="Suami, Istri, Anak, dll"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                defaultValue={patient.emergency_contact?.phone || ""}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href={`/patients/${patientId}`}
            className="px-6 py-2 border rounded-md hover:bg-gray-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
