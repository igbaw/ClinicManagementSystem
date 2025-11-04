import { z } from 'zod';

export const patientSchema = z.object({
  fullName: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  nik: z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK harus angka'),
  bpjsNumber: z.string().length(13, 'No. BPJS harus 13 digit').regex(/^\d+$/).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Tanggal lahir wajib diisi').refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    // Check if not future date
    if (birthDate > today) {
      return false;
    }
    
    // Check if age is reasonable (< 150 years)
    if (age > 150) {
      return false;
    }
    
    return true;
  }, { message: 'Tanggal lahir tidak valid (tidak boleh tanggal masa depan atau lebih dari 150 tahun)' }),
  gender: z.enum(['Laki-laki', 'Perempuan']),
  phone: z.string().regex(/^(08|\+628)\d{8,12}$/, 'Format telepon tidak valid (contoh: 08123456789 atau +628123456789)'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  address: z.string().min(10, 'Alamat minimal 10 karakter').max(500, 'Alamat maksimal 500 karakter'),
  emergencyContact: z
    .object({
      name: z.string().min(3),
      relationship: z.string(),
      phone: z.string().regex(/^(08|\+628)\d{8,12}$/, 'Format telepon tidak valid'),
    })
    .optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
