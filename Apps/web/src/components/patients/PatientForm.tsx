"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientFormData, patientSchema } from "@/validations/patient";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      // Redirect to success page with MR number
      router.push(`/patients/success?mrNumber=${result.mrNumber}&patientId=${result.patient.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{serverError}</p>
        </div>
      )}
      
      {/* Photo Upload Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">Foto Pasien (Opsional)</label>
        <div className="flex items-start gap-4">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG. Max: 2MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Lengkap *</label>
          <input className="input" {...register('fullName')} />
          {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">NIK</label>
          <input className="input" maxLength={16} placeholder="16 digit angka (opsional)" {...register('nik')} />
          {errors.nik && <p className="text-red-600 text-sm">{errors.nik.message}</p>}
          {!errors.nik && <p className="text-xs text-gray-500 mt-1">Opsional - Format: 16 digit angka</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">No. BPJS</label>
          <input className="input" maxLength={13} placeholder="13 digit angka" {...register('bpjsNumber')} />
          {errors.bpjsNumber && <p className="text-red-600 text-sm">{errors.bpjsNumber.message}</p>}
          {!errors.bpjsNumber && <p className="text-xs text-gray-500 mt-1">Opsional - Format: 13 digit angka</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tanggal Lahir *</label>
<input type="date" className="input" {...register('dateOfBirth')} />
          {errors.dateOfBirth && <p className="text-red-600 text-sm">{errors.dateOfBirth.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Jenis Kelamin *</label>
          <select className="input" {...register('gender')}>
            <option value="">Pilih</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          {errors.gender && <p className="text-red-600 text-sm">{errors.gender.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">No. Telepon *</label>
          <input className="input" placeholder="08123456789 atau +628123456789" {...register('phone')} />
          {errors.phone && <p className="text-red-600 text-sm">{errors.phone.message}</p>}
          {!errors.phone && <p className="text-xs text-gray-500 mt-1">Format: 08xxx atau +628xxx</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" className="input" {...register('email')} />
          {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Alamat *</label>
        <textarea rows={3} className="input" maxLength={500} placeholder="Alamat lengkap tempat tinggal" {...register('address')} />
        {errors.address && <p className="text-red-600 text-sm">{errors.address.message}</p>}
        {!errors.address && <p className="text-xs text-gray-500 mt-1">Minimal 10 karakter, maksimal 500 karakter</p>}
      </div>

      <fieldset className="border-t pt-4">
        <legend className="text-sm font-medium text-gray-700">Kontak Darurat</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama</label>
            <input className="input" {...register('emergencyContact.name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hubungan</label>
            <input className="input" {...register('emergencyContact.relationship')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telepon</label>
            <input className="input" {...register('emergencyContact.phone')} />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end gap-4">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Batal
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50">
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <style jsx global>{`
        .input { @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
      `}</style>
    </form>
  );
}
