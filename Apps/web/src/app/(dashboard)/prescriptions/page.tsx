"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Prescription = {
  id: string;
  created_at: string;
  status: string;
  notes: string | null;
  patient: Array<{ full_name: string; medical_record_number: string }> | { full_name: string; medical_record_number: string } | null;
  doctor: Array<{ full_name: string }> | { full_name: string } | null;
  prescription_items: Array<{
    medication_id: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }>;
};

export default function PrescriptionsPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Helper to safely access patient/doctor data (handles both array and object)
  const getPatient = (p: Prescription) => Array.isArray(p.patient) ? p.patient[0] : p.patient;
  const getDoctor = (p: Prescription) => Array.isArray(p.doctor) ? p.doctor[0] : p.doctor;

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [searchParams]);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("prescriptions")
      .select(`
        id,
        created_at,
        status,
        notes,
        patient:patients(full_name, medical_record_number),
        doctor:users!prescriptions_doctor_id_fkey(full_name),
        prescription_items(medication_id, dosage, frequency, duration, quantity)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setPrescriptions((data as unknown as Prescription[]) || []);
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    void fetchPrescriptions();
  }, [fetchPrescriptions]);

  async function updateStatus(prescriptionId: string, newStatus: string) {
    // If marking as dispensed, deduct stock first
    if (newStatus === "dispensed") {
      // Fetch prescription items to deduct stock
      const { data: items } = await supabase
        .from("prescription_items")
        .select("medication_id, quantity")
        .eq("prescription_id", prescriptionId);

      if (items) {
        // Deduct stock for each medication
        for (const item of items) {
          await supabase.rpc("deduct_medication_stock", {
            p_medication_id: item.medication_id,
            p_quantity: item.quantity
          });
        }
      }
    }

    // Update prescription status
    await supabase
      .from("prescriptions")
      .update({ status: newStatus })
      .eq("id", prescriptionId);
    void fetchPrescriptions();
  }

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patient = getPatient(p);
    return (
      patient?.full_name.toLowerCase().includes(query) ||
      patient?.medical_record_number.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Resep</h1>
      </div>

      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Resep berhasil disimpan!
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari nama atau nomor rekam medis..."
            className="input w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="dispensed">Sudah Diserahkan</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat...</div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada resep ditemukan
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {getPatient(prescription)?.full_name || "Unknown Patient"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    MR: {getPatient(prescription)?.medical_record_number || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dokter: {getDoctor(prescription)?.full_name || "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(prescription.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {prescription.status === "pending" && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      ⏳ Pending
                    </span>
                  )}
                  {prescription.status === "dispensed" && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      ✅ Diserahkan
                    </span>
                  )}
                  {prescription.status === "cancelled" && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      ❌ Dibatalkan
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium mb-2">
                  Obat yang Diresepkan ({prescription.prescription_items.length}
                  ):
                </p>
                <div className="space-y-1">
                  {prescription.prescription_items.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-sm text-gray-700">
                      • {item.dosage} - {item.frequency} - {item.duration} ({item.quantity} unit)
                    </p>
                  ))}
                  {prescription.prescription_items.length > 3 && (
                    <p className="text-sm text-gray-500 italic">
                      +{prescription.prescription_items.length - 3} obat lainnya
                    </p>
                  )}
                </div>
              </div>

              {prescription.notes && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Catatan:</span> {prescription.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {prescription.status === "pending" && (
                  <button
                    onClick={() => updateStatus(prescription.id, "dispensed")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    Tandai Diserahkan
                  </button>
                )}
                {prescription.status === "pending" && (
                  <button
                    onClick={() => updateStatus(prescription.id, "cancelled")}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                  >
                    Batalkan
                  </button>
                )}
                <Link
                  href={`/prescriptions/${prescription.id}`}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                >
                  Lihat Detail
                </Link>
                <Link
                  href={`/api/prescriptions/${prescription.id}/pdf`}
                  target="_blank"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  📄 Cetak Resep
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .input {
          @apply px-3 py-2 border rounded-md;
        }
      `}</style>
    </div>
  );
}
