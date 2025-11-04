"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PatientSearch from "./PatientSearch";

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
  photo_url?: string;
  created_at: string;
}

export default function PatientsList({ initialPatients }: { initialPatients: Patient[] }) {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          {showSearch ? "Tutup Pencarian" : "Cari Pasien"}
        </button>
      </div>

      {showSearch && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <PatientSearch onSelect={(p) => router.push(`/patients/${p.id}`)} />
        </div>
      )}

      {initialPatients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-gray-500">Belum ada pasien terdaftar</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">No. RM</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nama Lengkap</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">NIK</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Umur</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Jenis Kelamin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Telepon</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Terdaftar</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50"
                >
                  <td 
                    className="px-4 py-3 text-sm cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {patient.medical_record_number}
                  </td>
                  <td 
                    className="px-4 py-3 text-sm font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {patient.full_name}
                  </td>
                  <td 
                    className="px-4 py-3 text-sm cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {patient.nik}
                  </td>
                  <td 
                    className="px-4 py-3 text-sm cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {calculateAge(patient.date_of_birth)} tahun
                  </td>
                  <td 
                    className="px-4 py-3 text-sm cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {patient.gender}
                  </td>
                  <td 
                    className="px-4 py-3 text-sm cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {patient.phone}
                  </td>
                  <td 
                    className="px-4 py-3 text-sm text-gray-500 cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    {formatDate(patient.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-1">
                      <Link
                        href={`/appointments/new?patient=${patient.id}`}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        title="Buat Janji Temu"
                      >
                        Janji
                      </Link>
                      <Link
                        href={`/medical-records/new?patient=${patient.id}&walkin=true`}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Walk-in"
                      >
                        Walk-in
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
