"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Patient = {
  id: string;
  full_name: string;
  medical_record_number: string;
  nik: string;
  phone: string;
};

type Doctor = {
  id: string;
  full_name: string;
};

export default function WalkInCheckInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    queue_number: number;
    patient_name: string;
    doctor_name: string;
  } | null>(null);

  // Load doctors on mount
  useEffect(() => {
    async function loadDoctors() {
      const { data } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "doctor")
        .order("full_name");
      
      setDoctors(data || []);
    }
    void loadDoctors();
  }, [supabase]);

  // Search patients
  const searchPatients = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setPatients([]);
        return;
      }

      setSearchLoading(true);
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, medical_record_number, nik, phone")
        .or(`full_name.ilike.%${query}%,medical_record_number.ilike.%${query}%,nik.ilike.%${query}%`)
        .limit(10);

      setPatients(data || []);
      setSearchLoading(false);
    },
    [supabase]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void searchPatients(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPatients]);

  const handleCheckIn = async () => {
    if (!selectedPatient || !selectedDoctor) {
      setError("Mohon pilih pasien dan dokter");
      return;
    }

    if (!chiefComplaint.trim()) {
      setError("Mohon masukkan keluhan utama");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/queue/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          doctor_id: selectedDoctor,
          chief_complaint: chiefComplaint,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal check-in");
      }

      // Show success message
      setSuccess({
        queue_number: result.data.queue_number,
        patient_name: result.data.patient.full_name,
        doctor_name: result.data.doctor.full_name,
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setSelectedPatient(null);
        setSearchQuery("");
        setSelectedDoctor("");
        setChiefComplaint("");
        setNotes("");
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">✓ Check-in Berhasil!</h2>
          <div className="my-6">
            <div className="text-sm text-green-700 mb-2">Nomor Antrian</div>
            <div className="text-6xl font-bold text-green-600">{success.queue_number}</div>
          </div>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Pasien:</strong> {success.patient_name}</p>
            <p><strong>Dokter:</strong> {success.doctor_name}</p>
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/queue"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Lihat Antrian
            </Link>
            <button
              onClick={() => setSuccess(null)}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
            >
              Check-in Pasien Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in Pasien Walk-in</h1>
          <p className="text-sm text-gray-600 mt-1">
            Daftarkan pasien yang datang tanpa janji temu
          </p>
        </div>
        <Link
          href="/queue"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Lihat Antrian
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6 space-y-6">
        {/* Step 1: Patient Search */}
        <div>
          <h3 className="text-lg font-semibold mb-3">1. Cari atau Daftar Pasien</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔍 Cari Pasien
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama, NIK, atau No. RM..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchLoading && (
                <p className="text-sm text-gray-500 mt-1">Mencari...</p>
              )}
            </div>

            {/* Search Results */}
            {patients.length > 0 && !selectedPatient && (
              <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSearchQuery("");
                      setPatients([]);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{patient.full_name}</div>
                      <div className="text-sm text-gray-600">
                        {patient.medical_record_number} | NIK: {patient.nik}
                      </div>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Patient */}
            {selectedPatient && (
              <div className="border-2 border-blue-500 rounded-md p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-900">
                      ✓ {selectedPatient.full_name}
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedPatient.medical_record_number} | {selectedPatient.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Ganti
                  </button>
                </div>
              </div>
            )}

            {/* Register New Patient Link */}
            <div className="text-center py-3 border-t">
              <p className="text-sm text-gray-600 mb-2">Pasien baru?</p>
              <Link
                href="/patients/new"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                + Daftar Pasien Baru
              </Link>
            </div>
          </div>
        </div>

        {/* Step 2: Doctor & Details */}
        {selectedPatient && (
          <>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">2. Pilih Dokter & Detail</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dokter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Dokter</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keluhan Utama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Contoh: Telinga kiri sakit sejak 2 hari"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tambahan..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Summary & Submit */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">3. Konfirmasi Check-in</h3>
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pasien:</span>
                    <span className="font-medium">{selectedPatient.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">No. RM:</span>
                    <span className="font-medium">{selectedPatient.medical_record_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dokter:</span>
                    <span className="font-medium">
                      {doctors.find((d) => d.id === selectedDoctor)?.full_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Keluhan:</span>
                    <span className="font-medium">{chiefComplaint || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchQuery("");
                    setSelectedDoctor("");
                    setChiefComplaint("");
                    setNotes("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={!selectedDoctor || !chiefComplaint.trim() || submitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? "Memproses..." : "✓ Check-in Walk-in"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
