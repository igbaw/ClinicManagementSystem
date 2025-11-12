"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientFormData, patientSchema } from "@/validations/patient";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

interface PatientFormProps {
  action: (formData: FormData) => Promise<any>;
  defaultValues?: Partial<PatientFormData>;
}

export default function PatientForm({ action, defaultValues }: PatientFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = async (data: PatientFormData) => {
    setServerError(null);
    const fd = new FormData();
    fd.append("fullName", data.fullName);
    if (data.nik) fd.append("nik", data.nik);
    if (data.bpjsNumber) fd.append("bpjsNumber", data.bpjsNumber);
    fd.append("dateOfBirth", data.dateOfBirth);
    fd.append("gender", data.gender);
    fd.append("phone", data.phone);
    if (data.email) fd.append("email", data.email);
    fd.append("address", data.address);
    if (data.emergencyContact?.name) {
      fd.append("emergencyContact.name", data.emergencyContact.name);
      fd.append("emergencyContact.relationship", data.emergencyContact.relationship);
      fd.append("emergencyContact.phone", data.emergencyContact.phone);
    }
    if (photoFile) {
      fd.append("photo", photoFile);
    }

    const result = await action(fd);

    if (result?.error) {
      if (result.duplicate) {
        setServerError(`${result.error}: ${result.duplicate.name} (${result.duplicate.mrNumber})`);
      } else {
        setServerError(result.error);
      }
    } else if (result?.success) {
      router.push(`/patients/success?mrNumber=${result.mrNumber}&patientId=${result.patient.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{serverError}</p>
          </div>
        </div>
      )}

      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto Pasien (Opsional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                >
                  ×
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-muted rounded-lg flex items-center justify-center bg-muted/20">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">Format: JPG, PNG. Max: 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap *</Label>
              <Input id="fullName" {...register('fullName')} />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input id="nik" maxLength={16} placeholder="16 digit angka (opsional)" {...register('nik')} />
              {errors.nik && <p className="text-sm text-destructive">{errors.nik.message}</p>}
              {!errors.nik && <p className="text-xs text-muted-foreground">Opsional - Format: 16 digit angka</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpjsNumber">No. BPJS</Label>
              <Input id="bpjsNumber" maxLength={13} placeholder="13 digit angka" {...register('bpjsNumber')} />
              {errors.bpjsNumber && <p className="text-sm text-destructive">{errors.bpjsNumber.message}</p>}
              {!errors.bpjsNumber && <p className="text-xs text-muted-foreground">Opsional - Format: 13 digit angka</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Tanggal Lahir *</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin *</Label>
              <select id="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" {...register('gender')}>
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon *</Label>
              <Input id="phone" placeholder="08123456789 atau +628123456789" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              {!errors.phone && <p className="text-xs text-muted-foreground">Format: 08xxx atau +628xxx</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat *</Label>
            <Textarea id="address" rows={3} maxLength={500} placeholder="Alamat lengkap tempat tinggal" {...register('address')} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            {!errors.address && <p className="text-xs text-muted-foreground">Minimal 10 karakter, maksimal 500 karakter</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kontak Darurat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Nama</Label>
              <Input id="emergencyName" {...register('emergencyContact.name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyRelationship">Hubungan</Label>
              <Input id="emergencyRelationship" {...register('emergencyContact.relationship')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Telepon</Label>
              <Input id="emergencyPhone" {...register('emergencyContact.phone')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
