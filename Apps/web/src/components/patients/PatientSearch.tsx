"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  photo_url?: string;
  last_visit?: string;
}

export default function PatientSearch({ onSelect }: { onSelect: (p: Patient) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(search, 300);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("patients")
        .select(`
          *,
          appointments!appointments_patient_id_fkey(
            appointment_date
          )
        `)
        .or(
          `full_name.ilike.%${debounced}%,medical_record_number.eq.${debounced},nik.eq.${debounced},bpjs_number.eq.${debounced}`
        )
        .limit(50);
      
      // Process to get last visit
      const processedData = data?.map((patient: any) => {
        const appointments = patient.appointments || [];
        const lastVisit = appointments.length > 0
          ? appointments.reduce((latest: any, current: any) => {
              return new Date(current.appointment_date) > new Date(latest.appointment_date)
                ? current
                : latest;
            }).appointment_date
          : null;
        
        return {
          ...patient,
          last_visit: lastVisit,
          appointments: undefined // Remove from result
        };
      }) || [];
      
      setResults(processedData);
      setLoading(false);
    })();
  }, [debounced]);

  function age(dob: string) {
    const b = new Date(dob);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pasien (nama, MR, NIK, BPJS)..."
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      {loading && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg p-3">Mencari...</div>
      )}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-80 overflow-auto">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="font-medium">{p.full_name}</div>
              <div className="text-sm text-gray-500">
                {p.medical_record_number} • {age(p.date_of_birth)} tahun
                {p.last_visit && (
                  <> • Kunjungan terakhir: {new Date(p.last_visit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
