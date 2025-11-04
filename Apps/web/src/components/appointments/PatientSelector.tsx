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
}

interface PatientSelectorProps {
  value: string;
  onChange: (patientId: string, patient: Patient | null) => void;
  error?: string;
}

export default function PatientSelector({ value, onChange, error }: PatientSelectorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounced = useDebounce(search, 300);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("patients")
        .select("id, medical_record_number, full_name, date_of_birth, phone")
        .or(
          `full_name.ilike.%${debounced}%,medical_record_number.eq.${debounced},nik.eq.${debounced}`
        )
        .limit(10);
      setResults(data || []);
      setLoading(false);
    })();
  }, [debounced]);

  // Load selected patient if value provided
  useEffect(() => {
    if (value && !selectedPatient) {
      (async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("patients")
          .select("id, medical_record_number, full_name, date_of_birth, phone")
          .eq("id", value)
          .single();
        if (data) {
          setSelectedPatient(data);
        }
      })();
    }
  }, [value, selectedPatient]);

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    onChange(patient.id, patient);
    setSearch("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    onChange("", null);
    setSearch("");
  };

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pasien *
      </label>
      
      {selectedPatient ? (
        <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{selectedPatient.full_name}</p>
              <p className="text-sm text-gray-600">
                {selectedPatient.medical_record_number} • {calculateAge(selectedPatient.date_of_birth)} tahun
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Ubah
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Cari nama, MR, atau NIK pasien..."
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {loading && isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
              Mencari...
            </div>
          )}
          
          {results.length > 0 && isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelect(patient)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{patient.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {patient.medical_record_number} • {calculateAge(patient.date_of_birth)} tahun
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {!selectedPatient && !error && (
        <p className="text-xs text-gray-500 mt-1">
          Ketik minimal 2 karakter untuk mencari pasien
        </p>
      )}
    </div>
  );
}
