# AI Coding Agent Implementation Tasks
## ENT Clinic Management System

**Version**: 1.0  
**Date**: November 2025  
**Purpose**: Task breakdown optimized for AI coding agents (Claude Code, Warp AI, etc.)

---

## How to Use This Document

Each task is designed to be:
1. **Self-contained**: Can be completed independently
2. **Clearly scoped**: Specific inputs, outputs, and acceptance criteria
3. **AI-friendly**: Includes code snippets, schemas, and examples
4. **Testable**: Clear test cases to verify completion

**Recommended Workflow**:
```bash
# Start with setup tasks
Task 1.1 → 1.2 → 1.3 → 1.4

# Then build features in priority order
Phase 1 (P0): Tasks 2.x → 3.x → 4.x → 5.x → 6.x
Phase 2 (P1): Tasks 7.x → 8.x → 9.x
Phase 3 (P2): Tasks 10.x → 11.x
```

---

## Phase 0: Project Setup

### Task 1.1: Initialize Next.js Project
**Priority**: P0  
**Estimated Time**: 30 minutes  
**Dependencies**: None

**Instructions**:
```bash
# Create Next.js 16 project with TypeScript
npx create-next-app@latest clinic-management \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd clinic-management

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand react-hook-form @hookform/resolvers zod
npm install date-fns recharts jspdf
npm install lucide-react class-variance-authority clsx tailwind-merge

# Install shadcn/ui
npx shadcn-ui@latest init
```

**Configure**: Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
```

**Acceptance Criteria**:
- [ ] Project initialized with correct structure
- [ ] All dependencies installed without errors
- [ ] Dev server runs on `localhost:3000`
- [ ] TypeScript strict mode enabled

---

### Task 1.2: Setup Supabase Project
**Priority**: P0  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1.1

**Instructions**:
1. Create Supabase project at https://supabase.com
2. Copy connection details to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

3. Create Supabase client files:

**File**: `src/lib/supabase/client.ts`
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const createClient = () => 
  createClientComponentClient<Database>();
```

**File**: `src/lib/supabase/server.ts`
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies });
```

**File**: `src/lib/supabase/middleware.ts`
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}
```

**Acceptance Criteria**:
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Client files created
- [ ] Connection test successful

---

### Task 1.3: Database Schema Creation
**Priority**: P0  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.2

**Instructions**: Create migration file in Supabase SQL Editor

**File**: `migrations/20250101000000_initial_schema.sql`
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'front_desk')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_number TEXT UNIQUE NOT NULL,
  nik TEXT UNIQUE NOT NULL,
  bpjs_number TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  emergency_contact JSONB,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medical records table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  visit_date TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- SOAP format
  chief_complaint TEXT NOT NULL,
  anamnesis TEXT NOT NULL,
  physical_examination JSONB NOT NULL,
  diagnosis_icd10 JSONB[] NOT NULL,
  treatment_plan TEXT NOT NULL,
  
  -- Additional fields
  vital_signs JSONB,
  notes TEXT,
  follow_up_date DATE,
  attachments TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'dispensed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medications table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  dosage_form TEXT,
  manufacturer TEXT,
  supplier TEXT,
  purchase_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE,
  batch_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prescription items table
CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id),
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  instructions TEXT,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Billings table
CREATE TABLE billings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  medical_record_id UUID REFERENCES medical_records(id),
  billing_date TIMESTAMP NOT NULL DEFAULT NOW(),
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'partial', 'paid', 'cancelled')),
  payment_method TEXT,
  bpjs_claim_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing items table
CREATE TABLE billing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('consultation', 'procedure', 'medication', 'lab_test')),
  item_id UUID,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID NOT NULL REFERENCES billings(id),
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) NOT NULL,
  bpjs_price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ICD-10 codes table
CREATE TABLE icd10_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_id TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Stock adjustments table
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id),
  adjustment_type TEXT NOT NULL 
    CHECK (adjustment_type IN ('purchase', 'return', 'expired', 'damaged', 'dispensed', 'correction', 'lost')),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_number TEXT,
  adjusted_by UUID REFERENCES users(id),
  adjustment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_patients_nik ON patients(nik);
CREATE INDEX idx_patients_bpjs ON patients(bpjs_number);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_billings_date ON billings(billing_date);
CREATE INDEX idx_medications_name ON medications(name);

-- Full-text search indexes
CREATE INDEX idx_patients_search ON patients 
USING gin(to_tsvector('indonesian', full_name));

CREATE INDEX idx_medications_search ON medications 
USING gin(to_tsvector('indonesian', name || ' ' || generic_name));

-- Function to generate MR number
CREATE OR REPLACE FUNCTION generate_mr_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  sequence_num INT;
  mr_number TEXT;
BEGIN
  today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(medical_record_number FROM 13) AS INT)
  ), 0) + 1
  INTO sequence_num
  FROM patients
  WHERE medical_record_number LIKE 'MR-' || today || '%';
  
  mr_number := 'MR-' || today || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN mr_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate MR number
CREATE OR REPLACE FUNCTION set_mr_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.medical_record_number IS NULL THEN
    NEW.medical_record_number := generate_mr_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mr_number_trigger
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION set_mr_number();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON medical_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON medications
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billings_updated_at
BEFORE UPDATE ON billings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Acceptance Criteria**:
- [ ] All tables created successfully
- [ ] Indexes created
- [ ] Triggers working
- [ ] No SQL errors
- [ ] Test MR number generation

---

### Task 1.4: Setup RLS Policies
**Priority**: P0  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.3

**Instructions**: Create RLS policies migration

**File**: `migrations/20250102000000_add_rls_policies.sql`
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage users" ON users
  FOR ALL USING (get_user_role() = 'admin');

-- Patients table policies
CREATE POLICY "All authenticated users can view patients" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Front desk and admin can create patients" ON patients
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'front_desk')
  );

CREATE POLICY "Front desk and admin can update patients" ON patients
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Appointments table policies
CREATE POLICY "All authenticated users can view appointments" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Front desk and admin can manage appointments" ON appointments
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Medical records table policies
CREATE POLICY "Doctors and admin can view medical records" ON medical_records
  FOR SELECT USING (
    get_user_role() IN ('admin', 'doctor') OR doctor_id = auth.uid()
  );

CREATE POLICY "Doctors can create their own medical records" ON medical_records
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid() AND get_user_role() IN ('doctor', 'admin')
  );

CREATE POLICY "Doctors can update their own records within 24 hours" ON medical_records
  FOR UPDATE USING (
    doctor_id = auth.uid() 
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Prescriptions table policies
CREATE POLICY "Doctors and admin can view prescriptions" ON prescriptions
  FOR SELECT USING (
    get_user_role() IN ('admin', 'doctor', 'front_desk')
  );

CREATE POLICY "Doctors can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid() AND get_user_role() IN ('doctor', 'admin')
  );

-- Medications table policies
CREATE POLICY "All authenticated users can view medications" ON medications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and front desk can manage medications" ON medications
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Billing policies
CREATE POLICY "Front desk and admin can manage billings" ON billings
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Services and ICD-10 (read-only for most users)
CREATE POLICY "All authenticated users can view services" ON services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage services" ON services
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "All authenticated users can view ICD-10 codes" ON icd10_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage ICD-10 codes" ON icd10_codes
  FOR ALL USING (get_user_role() = 'admin');
```

**Acceptance Criteria**:
- [ ] RLS enabled on all tables
- [ ] Policies created without errors
- [ ] Test access control for each role
- [ ] Verify permissions work correctly

---

## Phase 1: Core Features (MVP)

### Task 2.1: Build Authentication Pages
**Priority**: P0  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.4

**Create Login Page**:

**File**: `src/app/(auth)/login/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Masuk ke Sistem</CardTitle>
          <CardDescription>
            Sistem Manajemen Klinik THT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Create Dashboard Layout**:

**File**: `src/app/(dashboard)/layout.tsx`
```typescript
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.Node;
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Login page renders correctly
- [ ] Login with valid credentials works
- [ ] Error messages display for invalid credentials
- [ ] Redirect to dashboard after login
- [ ] Dashboard layout protects routes
- [ ] Logout functionality works

---

### Task 2.2: Build Patient Registration Form
**Priority**: P0  
**Estimated Time**: 4 hours  
**Dependencies**: Task 2.1

**Create Validation Schema**:

**File**: `src/validations/patient.ts`
```typescript
import { z } from 'zod';

export const patientSchema = z.object({
  fullName: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  nik: z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK harus angka'),
  bpjsNumber: z.string().length(13, 'No. BPJS harus 13 digit').regex(/^\d+$/).optional().or(z.literal('')),
  dateOfBirth: z.date().max(new Date(), 'Tanggal lahir tidak valid'),
  gender: z.enum(['Laki-laki', 'Perempuan']),
  phone: z.string().regex(/^(08|\+628)\d{8,12}$/, 'Format telepon tidak valid'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  address: z.string().min(10, 'Alamat minimal 10 karakter'),
  emergencyContact: z.object({
    name: z.string().min(3),
    relationship: z.string(),
    phone: z.string().regex(/^(08|\+628)\d{8,12}$/),
  }).optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
```

**Create Patient Form Component**:

**File**: `src/components/patients/PatientForm.tsx`
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormData } from '@/validations/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function PatientForm({ onSubmit, defaultValues }: {
  onSubmit: (data: PatientFormData) => Promise<void>;
  defaultValues?: Partial<PatientFormData>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Nama Lengkap *</Label>
          <Input {...register('fullName')} />
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="nik">NIK *</Label>
          <Input {...register('nik')} maxLength={16} />
          {errors.nik && (
            <p className="text-red-500 text-sm">{errors.nik.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bpjsNumber">No. BPJS</Label>
          <Input {...register('bpjsNumber')} maxLength={13} />
          {errors.bpjsNumber && (
            <p className="text-red-500 text-sm">{errors.bpjsNumber.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Tanggal Lahir *</Label>
          <Input type="date" {...register('dateOfBirth', {
            valueAsDate: true
          })} />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="gender">Jenis Kelamin *</Label>
          <Select {...register('gender')}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Laki-laki">Laki-laki</SelectItem>
              <SelectItem value="Perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-red-500 text-sm">{errors.gender.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">No. Telepon *</Label>
          <Input {...register('phone')} />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">Alamat *</Label>
        <Textarea {...register('address')} rows={3} />
        {errors.address && (
          <p className="text-red-500 text-sm">{errors.address.message}</p>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-4">Kontak Darurat</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="emergencyContact.name">Nama</Label>
            <Input {...register('emergencyContact.name')} />
          </div>
          <div>
            <Label htmlFor="emergencyContact.relationship">Hubungan</Label>
            <Input {...register('emergencyContact.relationship')} />
          </div>
          <div>
            <Label htmlFor="emergencyContact.phone">Telepon</Label>
            <Input {...register('emergencyContact.phone')} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
```

**Create Patient Registration Page**:

**File**: `src/app/(dashboard)/patients/new/page.tsx`
```typescript
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PatientForm from '@/components/patients/PatientForm';

export default function NewPatientPage() {
  async function createPatient(formData: FormData) {
    'use server';
    
    const supabase = createServerClient();
    
    const data = {
      full_name: formData.get('fullName'),
      nik: formData.get('nik'),
      bpjs_number: formData.get('bpjsNumber') || null,
      date_of_birth: formData.get('dateOfBirth'),
      gender: formData.get('gender'),
      phone: formData.get('phone'),
      email: formData.get('email') || null,
      address: formData.get('address'),
      emergency_contact: {
        name: formData.get('emergencyContact.name'),
        relationship: formData.get('emergencyContact.relationship'),
        phone: formData.get('emergencyContact.phone'),
      },
    };

    const { error } = await supabase
      .from('patients')
      .insert(data);

    if (error) {
      throw new Error(error.message);
    }

    redirect('/dashboard/patients');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Registrasi Pasien Baru</h1>
      <PatientForm onSubmit={createPatient} />
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Form renders with all fields
- [ ] Validation works correctly
- [ ] Error messages display properly
- [ ] NIK validation (16 digits)
- [ ] BPJS validation (13 digits)
- [ ] Phone validation (Indonesian format)
- [ ] MR number auto-generated
- [ ] Success redirect to patients list
- [ ] Duplicate NIK detection

---

### Task 2.3: Build Patient Search Component
**Priority**: P0  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.2

**File**: `src/components/patients/PatientSearch.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { createClient } from '@/lib/supabase/client';

interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  photo_url?: string;
}

export default function PatientSearch({ 
  onSelect 
}: { 
  onSelect: (patient: Patient) => void 
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch.length < 3) {
      setResults([]);
      return;
    }

    searchPatients(debouncedSearch);
  }, [debouncedSearch]);

  async function searchPatients(query: string) {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`full_name.ilike.%${query}%,medical_record_number.eq.${query},nik.eq.${query},bpjs_number.eq.${query}`)
      .limit(10);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  }

  function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari pasien (nama, MR, NIK, atau BPJS)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg p-4">
          Mencari...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-auto">
          {results.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onSelect(patient)}
              className="w-full text-left p-4 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {patient.photo_url ? (
                  <img
                    src={patient.photo_url}
                    alt={patient.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    {patient.full_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{patient.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {patient.medical_record_number} • {calculateAge(patient.date_of_birth)} tahun
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Create useDebounce Hook**:

**File**: `src/hooks/useDebounce.ts`
```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Acceptance Criteria**:
- [ ] Search input renders correctly
- [ ] Debouncing works (300ms delay)
- [ ] Search by name (partial match, case-insensitive)
- [ ] Search by MR number (exact match)
- [ ] Search by NIK (exact match)
- [ ] Search by BPJS number (exact match)
- [ ] Results display with photo and details
- [ ] Age calculated correctly
- [ ] Click result triggers onSelect callback
- [ ] Maximum 10 results shown

---

### Task 2.4: Build Appointment Calendar
**Priority**: P0  
**Estimated Time**: 5 hours  
**Dependencies**: Task 2.3

**File**: `src/components/appointments/AppointmentCalendar.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient: {
    full_name: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

export default function AppointmentCalendar({ 
  doctorId 
}: { 
  doctorId: string 
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, doctorId]);

  async function loadAppointments() {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(full_name)')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
      .order('appointment_time');

    if (!error && data) {
      setAppointments(data);
    }
    setLoading(false);
  }

  function generateTimeSlots(): string[] {
    const slots: string[] = [];
    
    // Morning: 08:00 - 12:00
    for (let hour = 8; hour < 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    // Afternoon: 13:00 - 16:00
    for (let hour = 13; hour < 16; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    return slots;
  }

  function getSlotStatus(time: string): TimeSlot {
    const appointment = appointments.find(
      (apt) => apt.appointment_time === time
    );

    return {
      time,
      available: !appointment,
      appointment,
    };
  }

  function previousWeek() {
    setWeekStart(addDays(weekStart, -7));
  }

  function nextWeek() {
    setWeekStart(addDays(weekStart, 7));
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Week navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={previousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMMM yyyy', { locale: id })}
        </h2>
        <Button variant="ghost" size="sm" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-6 border-b">
        {weekDays.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => setSelectedDate(day)}
            className={`p-4 text-center border-r last:border-r-0 ${
              isSameDay(day, selectedDate)
                ? 'bg-blue-50 border-b-2 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="text-sm text-gray-500">
              {format(day, 'EEE', { locale: id })}
            </div>
            <div className="text-2xl font-semibold">
              {format(day, 'd')}
            </div>
          </button>
        ))}
      </div>

      {/* Time slots for selected day */}
      <div className="p-4">
        <h3 className="font-medium mb-4">
          {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
        </h3>

        {loading ? (
          <div className="text-center py-8">Memuat jadwal...</div>
        ) : (
          <div className="space-y-2">
            {timeSlots.map((time) => {
              const slot = getSlotStatus(time);
              return (
                <div
                  key={time}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    slot.available
                      ? 'bg-white hover:bg-gray-50 cursor-pointer'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{time}</span>
                    {slot.appointment && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium">
                          {slot.appointment.patient.full_name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          slot.appointment.status === 'checked_in'
                            ? 'bg-green-100 text-green-700'
                            : slot.appointment.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {slot.appointment.status === 'scheduled' && 'Terjadwal'}
                          {slot.appointment.status === 'checked_in' && 'Check-in'}
                          {slot.appointment.status === 'in_progress' && 'Sedang Diperiksa'}
                          {slot.appointment.status === 'completed' && 'Selesai'}
                        </span>
                      </>
                    )}
                    {slot.available && (
                      <span className="text-gray-400">Tersedia</span>
                    )}
                  </div>
                  {slot.available && (
                    <Button size="sm">Jadwalkan</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Calendar shows current week (Mon-Sat)
- [ ] Navigate between weeks
- [ ] Select date to view time slots
- [ ] Time slots: 08:00-12:00, 13:00-16:00 (15-min intervals)
- [ ] Show booked appointments with patient names
- [ ] Status indicators (scheduled, checked-in, in-progress, completed)
- [ ] Available slots are clickable
- [ ] Booked slots show patient info
- [ ] No slots during lunch (12:00-13:00)
- [ ] No slots on Sunday

---

### Task 2.5: Build Medical Record Form
**Priority**: P0  
**Estimated Time**: 6 hours  
**Dependencies**: Task 2.4

**File**: `src/validations/medical-record.ts`
```typescript
import { z } from 'zod';

export const medicalRecordSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  
  vitalSigns: z.object({
    bloodPressure: z.string().regex(/^\d+\/\d+$/).optional(),
    pulse: z.number().min(40).max(200).optional(),
    temperature: z.number().min(35).max(42).optional(),
    weight: z.number().min(0).max(300).optional(),
    height: z.number().min(0).max(250).optional(),
  }),
  
  chiefComplaint: z.string().min(10, 'Keluhan minimal 10 karakter'),
  anamnesis: z.string().min(20, 'Anamnesis minimal 20 karakter'),
  physicalExamination: z.string().min(20, 'Pemeriksaan minimal 20 karakter'),
  
  diagnosisICD10: z.array(z.object({
    code: z.string(),
    nameIndonesian: z.string(),
    nameEnglish: z.string(),
    isPrimary: z.boolean(),
  })).min(1, 'Minimal 1 diagnosis'),
  
  treatmentPlan: z.string().min(20, 'Rencana minimal 20 karakter'),
  notes: z.string().optional(),
  followUpDate: z.date().optional(),
});
```

**File**: `src/components/medical-records/ICD10Search.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { createClient } from '@/lib/supabase/client';

interface ICD10Code {
  code: string;
  name_id: string;
  name_en: string;
}

export default function ICD10Search({
  onSelect,
  selectedCodes,
}: {
  onSelect: (code: ICD10Code) => void;
  selectedCodes: string[];
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ICD10Code[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    searchICD10(debouncedSearch);
  }, [debouncedSearch]);

  async function searchICD10(query: string) {
    const supabase = createClient();

    const { data } = await supabase
      .from('icd10_codes')
      .select('*')
      .or(`code.ilike.%${query}%,name_id.ilike.%${query}%,name_en.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10);

    if (data) {
      setResults(data);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari kode ICD-10 atau diagnosis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((code) => {
            const isSelected = selectedCodes.includes(code.code);
            return (
              <button
                key={code.code}
                onClick={() => !isSelected && onSelect(code)}
                disabled={isSelected}
                className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 ${
                  isSelected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="font-medium text-sm">
                  {code.code} - {code.name_id}
                </div>
                <div className="text-xs text-gray-500">{code.name_en}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**File**: `src/components/medical-records/MedicalRecordForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicalRecordSchema } from '@/validations/medical-record';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ICD10Search from './ICD10Search';
import { X } from 'lucide-react';

export default function MedicalRecordForm({
  patientId,
  appointmentId,
  onSubmit,
}: {
  patientId: string;
  appointmentId: string;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      patientId,
      appointmentId,
    },
  });

  function addDiagnosis(code: any) {
    setDiagnoses([
      ...diagnoses,
      {
        code: code.code,
        nameIndonesian: code.name_id,
        nameEnglish: code.name_en,
        isPrimary: diagnoses.length === 0,
      },
    ]);
  }

  function removeDiagnosis(code: string) {
    setDiagnoses(diagnoses.filter((d) => d.code !== code));
  }

  async function handleFormSubmit(data: any) {
    await onSubmit({
      ...data,
      diagnosisICD10: diagnoses,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="vitals">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="vitals">Tanda Vital</TabsTrigger>
          <TabsTrigger value="subjective">Subjective</TabsTrigger>
          <TabsTrigger value="objective">Objective</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <h3 className="font-medium">Tanda Vital</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tekanan Darah (mmHg)</Label>
              <Input 
                {...register('vitalSigns.bloodPressure')}
                placeholder="120/80"
              />
            </div>
            <div>
              <Label>Nadi (x/menit)</Label>
              <Input 
                type="number"
                {...register('vitalSigns.pulse', { valueAsNumber: true })}
                placeholder="80"
              />
            </div>
            <div>
              <Label>Suhu (°C)</Label>
              <Input 
                type="number"
                step="0.1"
                {...register('vitalSigns.temperature', { valueAsNumber: true })}
                placeholder="36.5"
              />
            </div>
            <div>
              <Label>Berat Badan (kg)</Label>
              <Input 
                type="number"
                step="0.1"
                {...register('vitalSigns.weight', { valueAsNumber: true })}
                placeholder="70"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subjective" className="space-y-4">
          <div>
            <Label>Keluhan Utama *</Label>
            <Input {...register('chiefComplaint')} />
            {errors.chiefComplaint && (
              <p className="text-red-500 text-sm">{errors.chiefComplaint.message}</p>
            )}
          </div>
          <div>
            <Label>Anamnesis *</Label>
            <Textarea {...register('anamnesis')} rows={6} />
            {errors.anamnesis && (
              <p className="text-red-500 text-sm">{errors.anamnesis.message}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="objective" className="space-y-4">
          <div>
            <Label>Pemeriksaan Fisik *</Label>
            <Textarea {...register('physicalExamination')} rows={10} />
            {errors.physicalExamination && (
              <p className="text-red-500 text-sm">{errors.physicalExamination.message}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <div>
            <Label>Diagnosis (ICD-10) *</Label>
            <ICD10Search
              onSelect={addDiagnosis}
              selectedCodes={diagnoses.map((d) => d.code)}
            />
          </div>

          {diagnoses.length > 0 && (
            <div className="space-y-2">
              {diagnoses.map((diagnosis, index) => (
                <div
                  key={diagnosis.code}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {diagnosis.code} - {diagnosis.nameIndonesian}
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                          Primer
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {diagnosis.nameEnglish}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiagnosis(diagnosis.code)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <div>
            <Label>Rencana Tindakan *</Label>
            <Textarea {...register('treatmentPlan')} rows={6} />
            {errors.treatmentPlan && (
              <p className="text-red-500 text-sm">{errors.treatmentPlan.message}</p>
            )}
          </div>
          <div>
            <Label>Catatan Tambahan</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>
          <div>
            <Label>Tanggal Kontrol</Label>
            <Input type="date" {...register('followUpDate', { valueAsDate: true })} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline">
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || diagnoses.length === 0}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan dan Lanjut ke Resep'}
        </Button>
      </div>
    </form>
  );
}
```

**Acceptance Criteria**:
- [ ] Tabbed interface for SOAP format
- [ ] Vital signs input with validation
- [ ] ICD-10 search with Indonesian names
- [ ] Multiple diagnosis support
- [ ] Primary diagnosis marked
- [ ] Physical examination textarea
- [ ] Treatment plan textarea
- [ ] Follow-up date picker
- [ ] Form validation works
- [ ] Save and redirect to prescription

---

## Summary

This document provides:
1. **Clear task breakdown** for each major feature
2. **Complete code examples** that AI agents can use directly
3. **Acceptance criteria** for testing
4. **Dependency tracking** to maintain proper build order
5. **Estimated time** for planning

**Next Tasks to Create**:
- Task 2.6: Build Prescription Form
- Task 2.7: Build Billing System
- Task 2.8: Build Payment Processing
- Task 3.x: Inventory Management Tasks
- Task 4.x: BPJS Integration Tasks
- Task 5.x: SATUSEHAT Integration Tasks
- Task 6.x: Reports Tasks

**Usage with AI Agents**:
```bash
# With Claude Code
claude-code "Implement Task 2.1: Build Authentication Pages following the specification in ai_tasks_roadmap.md"

# With Cursor/Windsurf
# Copy the relevant task section and paste into the AI chat
```

Each task is self-contained and can be implemented independently by AI coding agents!