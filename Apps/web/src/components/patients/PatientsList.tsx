"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PatientSearch from "./PatientSearch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <Button
          variant={showSearch ? "secondary" : "ghost"}
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? "Tutup Pencarian" : "Cari Pasien"}
        </Button>
      </div>

      {showSearch && (
        <Card>
          <CardContent className="pt-6">
            <PatientSearch onSelect={(p) => router.push(`/patients/${p.id}`)} />
          </CardContent>
        </Card>
      )}

      {initialPatients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada pasien terdaftar</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. RM</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Umur</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <TableCell className="font-medium text-primary hover:underline">
                      {patient.medical_record_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {patient.full_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {patient.nik}
                    </TableCell>
                    <TableCell>
                      {calculateAge(patient.date_of_birth)} tahun
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.gender === "Laki-laki" ? "primary" : "secondary"}>
                        {patient.gender}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {patient.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(patient.created_at)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          asChild
                        >
                          <Link href={`/appointments/new?patient=${patient.id}`}>
                            Janji Temu
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          asChild
                        >
                          <Link href={`/medical-records/new?patient=${patient.id}&walkin=true`}>
                            Walk-in
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
