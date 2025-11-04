"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Prescription = {
  id: string;
  created_at: string;
  status: string;
  notes: string | null;
  patient: {
    full_name: string;
    medical_record_number: string;
    date_of_birth: string;
    phone: string;
    address: string;
  } | null;
  doctor: { full_name: string } | null;
  medical_record: {
    visit_date: string;
    diagnosis_icd10: string;
  } | null;
  prescription_items: Array<{
    id: string;
    medication_id: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration: string;
    quantity: number;
    instructions: string;
    price: number;
    medication: {
      name: string;
      generic_name: string;
      unit: string;
    } | null;
  }>;
};

export default function PrescriptionDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchPrescription = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        created_at,
        status,
        notes,
        patient:patients(
          full_name,
          medical_record_number,
          date_of_birth,
          phone,
          address
        ),
        doctor:users!prescriptions_doctor_id_fkey(
          full_name
        ),
        medical_record:medical_records(
          visit_date,
          diagnosis_icd10
        ),
        prescription_items(
          id,
          medication_id,
          dosage,
          frequency,
          timing,
          duration,
          quantity,
          instructions,
          price,
          medication:medications(
            name,
            generic_name,
            unit
          )
        )
      `)
      .eq("id", prescriptionId)
      .single();

    if (error) {
      console.error("Error fetching prescription:", error);
      router.push("/prescriptions");
      return;
    }

    setPrescription(data as unknown as Prescription);
    setLoading(false);
  }, [supabase, prescriptionId, router]);

  useEffect(() => {
    void fetchPrescription();
  }, [fetchPrescription]);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    
    // If marking as dispensed, deduct stock first
    if (newStatus === "dispensed") {
      try {
        // Fetch prescription items to deduct stock
        const { data: items } = await supabase
          .from("prescription_items")
          .select("medication_id, quantity")
          .eq("prescription_id", prescriptionId);

        if (items) {
          // Deduct stock for each medication
          for (const item of items) {
            const { error } = await supabase.rpc("deduct_medication_stock", {
              p_medication_id: item.medication_id,
              p_quantity: item.quantity
            });
            
            if (error) {
              console.error("Stock deduction error:", error);
              // Continue with status update even if stock deduction fails
              // but log the error for admin review
            }
          }
        }
      } catch (error) {
        console.error("Error during stock deduction:", error);
      }
    }

    // Update prescription status
    const { error } = await supabase
      .from("prescriptions")
      .update({ status: newStatus })
      .eq("id", prescriptionId);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      await fetchPrescription();
    }
    setUpdating(false);
  }

  function calculateAge(dateOfBirth: string): string {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${age - 1} tahun`;
    }
    return `${age} tahun`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            ⏳ Pending
          </span>
        );
      case "dispensed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
            ✅ Diserahkan
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
            ❌ Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
            {status}
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-gray-500">Memuat data resep...</div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Resep tidak ditemukan</p>
        <Link
          href="/prescriptions"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Kembali ke daftar resep
        </Link>
      </div>
    );
  }

  const totalAmount = prescription.prescription_items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/prescriptions"
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Kembali ke Daftar Resep
          </Link>
          <h1 className="text-2xl font-semibold">Detail Resep</h1>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(prescription.status)}
          <Link
            href={`/api/prescriptions/${prescription.id}/pdf`}
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            📄 Cetak PDF
          </Link>
        </div>
      </div>

      {/* Patient and Doctor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Informasi Pasien</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Nama:</span>{" "}
              {prescription.patient?.full_name || "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">No. RM:</span>{" "}
              {prescription.patient?.medical_record_number || "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Usia:</span>{" "}
              {prescription.patient?.date_of_birth
                ? calculateAge(prescription.patient.date_of_birth)
                : "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Telepon:</span>{" "}
              {prescription.patient?.phone || "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Alamat:</span>{" "}
              {prescription.patient?.address || "-"}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Informasi Dokter & Kunjungan</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Dokter:</span>{" "}
              {prescription.doctor?.full_name || "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Tanggal Resep:</span>{" "}
              {new Date(prescription.created_at).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm">
              <span className="font-medium">Tanggal Kunjungan:</span>{" "}
              {prescription.medical_record?.visit_date
                ? new Date(prescription.medical_record.visit_date).toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Diagnosis:</span>{" "}
              {prescription.medical_record?.diagnosis_icd10 || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Prescription Items */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-3">Obat yang Diresepkan</h2>
        <div className="space-y-4">
          {prescription.prescription_items.map((item, idx) => (
            <div key={item.id} className="border-b pb-3 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{item.medication?.name || "Unknown"}</h3>
                <span className="text-sm text-gray-600">
                  Rp {item.price?.toLocaleString("id-ID")} × {item.quantity}{" "}
                  {item.medication?.unit} ={" "}
                  <span className="font-semibold">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Dosis:</span> {item.dosage || "-"}
                </p>
                <p>
                  <span className="font-medium">Frekuensi:</span> {item.frequency}
                </p>
                <p>
                  <span className="font-medium">Waktu:</span> {item.timing}
                </p>
                <p>
                  <span className="font-medium">Durasi:</span> {item.duration}
                </p>
              </div>
              {item.instructions && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Instruksi:</span> {item.instructions}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-3 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Biaya Obat:</span>
            <span className="font-semibold text-lg">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {prescription.notes && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Catatan Resep</h2>
          <p className="text-sm text-gray-700">{prescription.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {prescription.status === "pending" && (
          <>
            <button
              onClick={() => updateStatus("dispensed")}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? "Memproses..." : "Tandai Diserahkan"}
            </button>
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {updating ? "Memproses..." : "Batalkan Resep"}
            </button>
          </>
        )}
        <Link
          href="/prescriptions"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
        >
          Kembali
        </Link>
      </div>
    </div>
  );
}
