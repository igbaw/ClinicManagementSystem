# Technical Architecture Document
## ENT Clinic Management System

**Version**: 1.0  
**Date**: November 2025

---

## 1. System Overview

### 1.1 Architecture Pattern
**Monolithic Full-Stack Application** with clear separation of concerns, designed for future microservices migration.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js 15 App Router (React 18)               │  │
│  │  - Server Components (default)                   │  │
│  │  - Client Components (interactive UI)           │  │
│  │  - Server Actions (mutations)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js API Routes + Server Actions             │  │
│  │  - Authentication middleware                      │  │
│  │  - Authorization (role-based)                     │  │
│  │  - Business logic                                 │  │
│  │  - Validation (Zod)                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │   Supabase     │  │  External APIs │               │
│  │  - PostgreSQL  │  │  - BPJS VClaim │               │
│  │  - Auth        │  │  - SATUSEHAT   │               │
│  │  - Storage     │  │  - Xendit/     │               │
│  │  - Realtime    │  │    Midtrans    │               │
│  └────────────────┘  └────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | Next.js | 15.x | SSR, RSC, routing |
| UI Library | React | 18.x | Component rendering |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Pre-built components |
| Forms | React Hook Form | 7.x | Form management |
| Validation | Zod | 3.x | Schema validation |
| State Management | Zustand | 4.x | Client state |
| Backend | Supabase | Latest | BaaS platform |
| Database | PostgreSQL | 15.x | Relational DB |
| Auth | Supabase Auth | Latest | Authentication |
| Storage | Supabase Storage | Latest | File storage |
| Payment Gateway | Xendit/Midtrans | Latest | Payment processing |
| PDF Generation | react-pdf | 3.x | PDF documents |
| Charts | Recharts | 2.x | Data visualization |
| Date/Time | date-fns | 3.x | Date manipulation |
| HTTP Client | Fetch API | Native | API calls |
| Deployment | Vercel | Latest | Hosting platform |

---

## 2. Project Structure

```
clinic-management/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx          # List patients
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Register new
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Patient detail
│   │   │   │       └── history/
│   │   │   │           └── page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── calendar/
│   │   │   │       └── page.tsx
│   │   │   ├── medical-records/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── prescriptions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── payment/
│   │   │   │           └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── medications/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── adjustments/
│   │   │   │       └── page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── daily-revenue/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── diagnoses/
│   │   │   │       └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── services/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx            # Dashboard layout
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   ├── patients/
│   │   │   │   ├── route.ts          # GET, POST
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts      # GET, PUT, DELETE
│   │   │   │   └── search/
│   │   │   │       └── route.ts
│   │   │   ├── appointments/
│   │   │   │   └── route.ts
│   │   │   ├── medical-records/
│   │   │   │   └── route.ts
│   │   │   ├── prescriptions/
│   │   │   │   └── route.ts
│   │   │   ├── billings/
│   │   │   │   └── route.ts
│   │   │   ├── payments/
│   │   │   │   └── route.ts
│   │   │   ├── medications/
│   │   │   │   └── route.ts
│   │   │   ├── bpjs/
│   │   │   │   ├── eligibility/
│   │   │   │   │   └── route.ts
│   │   │   │   └── sep/
│   │   │   │       └── route.ts
│   │   │   ├── satusehat/
│   │   │   │   ├── patient/
│   │   │   │   │   └── route.ts
│   │   │   │   └── encounter/
│   │   │   │       └── route.ts
│   │   │   ├── reports/
│   │   │   │   └── route.ts
│   │   │   └── webhooks/
│   │   │       └── xendit/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing/redirect
│   │   └── globals.css
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── patients/
│   │   │   ├── PatientForm.tsx
│   │   │   ├── PatientSearch.tsx
│   │   │   ├── PatientCard.tsx
│   │   │   └── PatientHistory.tsx
│   │   ├── appointments/
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   └── QueueList.tsx
│   │   ├── medical-records/
│   │   │   ├── MedicalRecordForm.tsx
│   │   │   ├── SOAPNoteEditor.tsx
│   │   │   ├── ICD10Search.tsx
│   │   │   └── VitalSignsInput.tsx
│   │   ├── prescriptions/
│   │   │   ├── PrescriptionForm.tsx
│   │   │   ├── MedicationSearch.tsx
│   │   │   └── PrescriptionPDF.tsx
│   │   ├── billing/
│   │   │   ├── BillingSummary.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── QRISPayment.tsx
│   │   │   └── ReceiptPDF.tsx
│   │   ├── inventory/
│   │   │   ├── MedicationList.tsx
│   │   │   ├── StockAlerts.tsx
│   │   │   └── AdjustmentForm.tsx
│   │   ├── reports/
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── DiagnosisChart.tsx
│   │   │   └── ReportExport.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardLayout.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── DataTable.tsx
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── api/
│   │   │   ├── bpjs/
│   │   │   │   ├── client.ts
│   │   │   │   ├── eligibility.ts
│   │   │   │   └── sep.ts
│   │   │   ├── satusehat/
│   │   │   │   ├── client.ts
│   │   │   │   ├── patient.ts
│   │   │   │   └── encounter.ts
│   │   │   └── xendit/
│   │   │       ├── client.ts
│   │   │       └── qris.ts
│   │   ├── utils/
│   │   │   ├── format.ts             # Formatting helpers
│   │   │   ├── validation.ts         # Common validations
│   │   │   ├── date.ts               # Date utilities
│   │   │   └── currency.ts           # Currency formatting
│   │   ├── pdf/
│   │   │   ├── prescription.ts
│   │   │   ├── receipt.ts
│   │   │   └── invoice.ts
│   │   └── db/
│   │       ├── queries.ts            # Database queries
│   │       └── migrations.ts         # Migration helpers
│   │
│   ├── types/                        # TypeScript types
│   │   ├── database.ts               # Supabase generated types
│   │   ├── patient.ts
│   │   ├── appointment.ts
│   │   ├── medical-record.ts
│   │   ├── prescription.ts
│   │   ├── billing.ts
│   │   ├── medication.ts
│   │   ├── bpjs.ts
│   │   ├── satusehat.ts
│   │   └── index.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useAppointments.ts
│   │   ├── useMedicalRecords.ts
│   │   ├── usePrescriptions.ts
│   │   ├── useBilling.ts
│   │   ├── useInventory.ts
│   │   └── useDebounce.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts
│   │   ├── patientStore.ts
│   │   └── uiStore.ts
│   │
│   └── validations/                  # Zod schemas
│       ├── patient.ts
│       ├── appointment.ts
│       ├── medical-record.ts
│       ├── prescription.ts
│       ├── billing.ts
│       └── medication.ts
│
├── supabase/                         # Supabase config
│   ├── migrations/
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250102000000_add_rls_policies.sql
│   │   ├── 20250103000000_seed_icd10.sql
│   │   └── 20250104000000_add_indexes.sql
│   ├── functions/                    # Edge functions
│   │   └── process-satusehat-queue/
│   └── config.toml
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local                        # Environment variables
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Database Architecture

### 3.1 PostgreSQL Schema Design

**Entity Relationship Diagram**:

```
┌─────────────┐         ┌─────────────┐
│   users     │────┐    │  patients   │
│             │    │    │             │
│ id (PK)     │    │    │ id (PK)     │
│ email       │    │    │ nik         │
│ role        │    │    │ bpjs_number │
│ full_name   │    │    │ full_name   │
└─────────────┘    │    └─────────────┘
                   │           │
                   │           │
                   │    ┌──────▼──────┐
                   │    │appointments │
                   │    │             │
                   └───►│ id (PK)     │
                        │ patient_id  │
                        │ doctor_id   │
                        │ status      │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────┐
                        │ medical_records │
                        │                 │
                        │ id (PK)         │
                        │ appointment_id  │
                        │ diagnosis_icd10 │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
            ┌───────▼────────┐      ┌────────▼────────┐
            │ prescriptions  │      │    billings     │
            │                │      │                 │
            │ id (PK)        │      │ id (PK)         │
            │ medical_rec_id │      │ medical_rec_id  │
            └───────┬────────┘      │ total_amount    │
                    │               │ payment_status  │
            ┌───────▼────────┐      └────────┬────────┘
            │prescription_   │               │
            │   items        │      ┌────────▼────────┐
            │                │      │    payments     │
            │ id (PK)        │      │                 │
            │ prescription_id│      │ id (PK)         │
            │ medication_id  │      │ billing_id      │
            └───────┬────────┘      │ amount          │
                    │               │ payment_method  │
            ┌───────▼────────┐      └─────────────────┘
            │  medications   │
            │                │
            │ id (PK)        │
            │ name           │
            │ stock_quantity │
            └────────────────┘
```

### 3.2 Key Database Features

**Row-Level Security (RLS) Policies**:
```sql
-- Example: Medical records access control
CREATE POLICY "Doctors can view their own records"
ON medical_records
FOR SELECT
USING (
  auth.uid() = doctor_id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Doctors can create records"
ON medical_records
FOR INSERT
WITH CHECK (
  auth.uid() = doctor_id
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('doctor', 'admin')
  )
);
```

**Indexes for Performance**:
```sql
-- Frequently queried fields
CREATE INDEX idx_patients_nik ON patients(nik);
CREATE INDEX idx_patients_bpjs ON patients(bpjs_number);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_billings_date ON billings(billing_date);
CREATE INDEX idx_medications_name ON medications(name);

-- Full-text search
CREATE INDEX idx_patients_search ON patients 
USING gin(to_tsvector('indonesian', full_name));

CREATE INDEX idx_medications_search ON medications 
USING gin(to_tsvector('indonesian', name || ' ' || generic_name));
```

**Database Functions**:
```sql
-- Auto-generate MR number
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
CREATE TRIGGER set_mr_number
BEFORE INSERT ON patients
FOR EACH ROW
WHEN (NEW.medical_record_number IS NULL)
EXECUTE FUNCTION set_mr_number_trigger();
```

---

## 4. Authentication & Authorization

### 4.1 Supabase Auth Flow

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const createClient = () => 
  createClientComponentClient<Database>();

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies });
```

### 4.2 Middleware Protection

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if accessing protected route
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Check if accessing auth route while logged in
  if (req.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

### 4.3 Role-Based Access

```typescript
// lib/auth/permissions.ts
export type UserRole = 'admin' | 'doctor' | 'front_desk';

export const permissions = {
  admin: ['*'], // All permissions
  doctor: [
    'patients:read',
    'appointments:read',
    'appointments:update_own',
    'medical_records:create',
    'medical_records:read',
    'medical_records:update_own',
    'prescriptions:create',
    'prescriptions:read',
    'inventory:read',
    'reports:read_limited',
  ],
  front_desk: [
    'patients:create',
    'patients:read',
    'patients:update',
    'appointments:create',
    'appointments:read',
    'appointments:update',
    'billing:create',
    'billing:read',
    'billing:update',
    'payments:create',
    'payments:read',
    'inventory:read',
    'inventory:update',
    'reports:read_limited',
  ],
} as const;

export function hasPermission(
  userRole: UserRole,
  permission: string
): boolean {
  const userPermissions = permissions[userRole];
  return (
    userPermissions.includes('*') || 
    userPermissions.includes(permission as any)
  );
}

// Hook for client-side
export function usePermission(permission: string) {
  const { user } = useAuth();
  return hasPermission(user?.role, permission);
}
```

---

## 5. API Architecture

### 5.1 API Route Structure

```typescript
// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { patientCreateSchema } from '@/validations/patient';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,medical_record_number.eq.${search},nik.eq.${search}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ patients: data });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication & authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = patientCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('patients')
      .insert(validationResult.data)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ patient: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5.2 Server Actions (Alternative to API Routes)

```typescript
// app/actions/patients.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { patientCreateSchema } from '@/validations/patient';
import { revalidatePath } from 'next/cache';

export async function createPatient(formData: FormData) {
  const supabase = createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    fullName: formData.get('fullName'),
    nik: formData.get('nik'),
    // ... other fields
  };

  const validationResult = patientCreateSchema.safeParse(rawData);
  if (!validationResult.success) {
    return { error: validationResult.error.flatten() };
  }

  const { data, error } = await supabase
    .from('patients')
    .insert(validationResult.data)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/patients');
  return { data };
}
```

---

## 6. External API Integration

### 6.1 BPJS VClaim API Client

```typescript
// lib/api/bpjs/client.ts
import crypto from 'crypto';

export class BPJSClient {
  private consID: string;
  private secretKey: string;
  private baseURL: string;
  private userKey: string;

  constructor() {
    this.consID = process.env.BPJS_CONS_ID!;
    this.secretKey = process.env.BPJS_SECRET_KEY!;
    this.userKey = process.env.BPJS_USER_KEY!;
    this.baseURL = process.env.BPJS_BASE_URL!;
  }

  private generateSignature(timestamp: string): string {
    const data = `${this.consID}&${timestamp}`;
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(data);
    return crypto.enc.Base64.stringify(hmac.digest());
  }

  private getHeaders(): Record<string, string> {
    const timestamp = String(Date.now());
    const signature = this.generateSignature(timestamp);

    return {
      'X-cons-id': this.consID,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': this.userKey,
      'Content-Type': 'application/json',
    };
  }

  async checkEligibility(
    bpjsNumber: string,
    serviceDate: string
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/Peserta/${bpjsNumber}/tglSEP/${serviceDate}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`BPJS API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createSEP(sepData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/SEP/2.0/insert`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sepData),
    });

    if (!response.ok) {
      throw new Error(`BPJS API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### 6.2 SATUSEHAT FHIR API Client

```typescript
// lib/api/satusehat/client.ts
export class SatuSehatClient {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.SATUSEHAT_CLIENT_ID!;
    this.clientSecret = process.env.SATUSEHAT_CLIENT_SECRET!;
    this.baseURL = process.env.SATUSEHAT_BASE_URL!;
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(
      `${this.baseURL}/oauth2/v1/accesstoken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get SATUSEHAT access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }

  async createPatient(patientData: any): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseURL}/fhir-r4/v1/Patient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SATUSEHAT API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async createEncounter(encounterData: any): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseURL}/fhir-r4/v1/Encounter`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encounterData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SATUSEHAT API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async searchPatientByNIK(nik: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseURL}/fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik|${nik}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search patient');
    }

    return response.json();
  }
}
```

### 6.3 Payment Gateway (Xendit) Client

```typescript
// lib/api/xendit/client.ts
export class XenditClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.XENDIT_API_KEY!;
    this.baseURL = process.env.XENDIT_BASE_URL || 'https://api.xendit.co';
  }

  private getHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async createQRIS(params: {
    externalId: string;
    amount: number;
    callbackUrl: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseURL}/qr_codes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        external_id: params.externalId,
        type: 'DYNAMIC',
        callback_url: params.callbackUrl,
        amount: params.amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create QRIS');
    }

    return response.json();
  }

  async getQRISStatus(qrId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/qr_codes/${qrId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get QRIS status');
    }

    return response.json();
  }
}
```

---

## 7. State Management

### 7.1 Zustand Store Example

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));

// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  openConfirmDialog: (dialog: Omit<UIState['confirmDialog'], 'open'>) => void;
  closeConfirmDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  confirmDialog: null,
  openConfirmDialog: (dialog) => 
    set({ confirmDialog: { ...dialog, open: true } }),
  closeConfirmDialog: () => set({ confirmDialog: null }),
}));
```

### 7.2 Custom Hooks

```typescript
// hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const { user, setUser, setLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, setUser]);

  return { user, isLoading: useAuthStore((state) => state.isLoading) };
}

// hooks/usePatients.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Patient } from '@/types';

export function usePatients(search?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        let query = supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (search) {
          query = query.or(
            `full_name.ilike.%${search}%,medical_record_number.eq.${search},nik.eq.${search}`
          );
        }

        const { data, error } = await query;

        if (error) throw error;
        setPatients(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [search]);

  return { patients, loading, error };
}

// hooks/useDebounce.ts
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

---

## 8. Validation Schemas

```typescript
// validations/patient.ts
import { z } from 'zod';

export const patientCreateSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d+$/, 'NIK harus berupa angka'),
  
  bpjsNumber: z
    .string()
    .length(13, 'Nomor BPJS harus 13 digit')
    .regex(/^\d+$/, 'Nomor BPJS harus berupa angka')
    .optional()
    .or(z.literal('')),
  
  dateOfBirth: z
    .date()
    .max(new Date(), 'Tanggal lahir tidak boleh di masa depan'),
  
  gender: z.enum(['Laki-laki', 'Perempuan']),
  
  phone: z
    .string()
    .regex(/^(08|\+628)\d{8,12}$/, 'Format nomor telepon tidak valid'),
  
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  
  address: z
    .string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  
  emergencyContact: z
    .object({
      name: z.string().min(3),
      relationship: z.string(),
      phone: z.string().regex(/^(08|\+628)\d{8,12}$/),
    })
    .optional(),
});

export type PatientCreate = z.infer<typeof patientCreateSchema>;

// validations/medical-record.ts
import { z } from 'zod';

export const medicalRecordCreateSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  
  vitalSigns: z.object({
    bloodPressure: z.string().regex(/^\d+\/\d+$/).optional(),
    pulse: z.number().min(40).max(200).optional(),
    temperature: z.number().min(35).max(42).optional(),
    weight: z.number().min(0).max(300).optional(),
    height: z.number().min(0).max(250).optional(),
  }),
  
  chiefComplaint: z
    .string()
    .min(10, 'Keluhan utama minimal 10 karakter'),
  
  anamnesis: z
    .string()
    .min(20, 'Anamnesis minimal 20 karakter'),
  
  physicalExamination: z
    .string()
    .min(20, 'Pemeriksaan fisik minimal 20 karakter'),
  
  diagnosisICD10: z
    .array(
      z.object({
        code: z.string(),
        nameIndonesian: z.string(),
        nameEnglish: z.string(),
        isPrimary: z.boolean(),
      })
    )
    .min(1, 'Minimal 1 diagnosis diperlukan'),
  
  treatmentPlan: z
    .string()
    .min(20, 'Rencana tindakan minimal 20 karakter'),
  
  notes: z.string().optional(),
  followUpDate: z.date().optional(),
});

export type MedicalRecordCreate = z.infer<typeof medicalRecordCreateSchema>;
```

---

## 9. PDF Generation

```typescript
// lib/pdf/prescription.ts
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PrescriptionData {
  patient: {
    name: string;
    age: number;
    mrNumber: string;
  };
  doctor: {
    name: string;
    specialization: string;
    sipNumber: string;
  };
  clinic: {
    name: string;
    address: string;
    phone: string;
  };
  diagnosis: string;
  date: Date;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration: string;
    quantity: number;
    instructions?: string;
  }>;
  notes?: string;
}

export function generatePrescriptionPDF(data: PrescriptionData): Blob {
  const doc = new jsPDF();
  let y = 20;

  // Clinic header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clinic.name.toUpperCase(), 105, y, { align: 'center' });
  
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clinic.address, 105, y, { align: 'center' });
  
  y += 5;
  doc.text(`Telp: ${data.clinic.phone}`, 105, y, { align: 'center' });
  
  y += 10;
  doc.line(20, y, 190, y);
  
  y += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESEP OBAT', 105, y, { align: 'center' });

  // Patient info
  y += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Pasien : ${data.patient.name}`, 20, y);
  
  y += 6;
  doc.text(`Umur        : ${data.patient.age} tahun`, 20, y);
  
  y += 6;
  doc.text(`No. RM      : ${data.patient.mrNumber}`, 20, y);
  
  y += 6;
  doc.text(
    `Tanggal     : ${format(data.date, 'dd MMMM yyyy', { locale: id })}`,
    20,
    y
  );
  
  y += 6;
  doc.text(`Diagnosis   : ${data.diagnosis}`, 20, y);

  // Medications
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('R/', 20, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  data.medications.forEach((med, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${med.name}`, 20, y);
    
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`    No. ${numberToWords(med.quantity)}`, 20, y);
    
    y += 6;
    doc.text(
      `    S ${med.frequency} ${med.dosage} ${med.timing}`,
      20,
      y
    );
    
    if (med.instructions) {
      y += 6;
      doc.text(`    ${med.instructions}`, 20, y);
    }
    
    y += 10;
  });

  // Footer notes
  if (data.notes) {
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(`Pro: ${data.notes}`, 20, y);
  }

  // Doctor signature
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${data.clinic.address.split(',')[1]?.trim() || 'Jakarta'}, ${format(
      data.date,
      'dd MMMM yyyy',
      { locale: id }
    )}`,
    140,
    y
  );
  
  y += 20;
  doc.text(data.doctor.name, 140, y);
  
  y += 6;
  doc.text(data.doctor.sipNumber, 140, y);

  return doc.output('blob');
}

function numberToWords(num: number): string {
  // Convert number to Indonesian words for prescription
  const ones = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
  ];
  const tens = [
    '',
    'sepuluh',
    'dua puluh',
    'tiga puluh',
    'empat puluh',
    'lima puluh',
    'enam puluh',
    'tujuh puluh',
    'delapan puluh',
    'sembilan puluh',
  ];

  if (num < 10) return ones[num];
  if (num < 20) return 'sebelas';
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  }
  return num.toString();
}
```

---

## 10. Security Considerations

### 10.1 Environment Variables

```bash
# .env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# BPJS VClaim
BPJS_CONS_ID=xxxxx
BPJS_SECRET_KEY=xxxxx
BPJS_USER_KEY=xxxxx
BPJS_BASE_URL=https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev

# SATUSEHAT
SATUSEHAT_CLIENT_ID=xxxxx
SATUSEHAT_CLIENT_SECRET=xxxxx
SATUSEHAT_BASE_URL=https://api-satusehat-stg.dto.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=xxxxx

# Xendit
XENDIT_API_KEY=xxxxx
XENDIT_WEBHOOK_TOKEN=xxxxx
XENDIT_BASE_URL=https://api.xendit.co

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 10.2 Security Best Practices

1. **Input Validation**: Always validate on server-side with Zod
2. **SQL Injection Prevention**: Use Supabase parameterized queries
3. **XSS Prevention**: React escapes by default, sanitize user HTML
4. **CSRF Protection**: Next.js handles CSRF for Server Actions
5. **Rate Limiting**: Implement for API routes (consider Upstash)
6. **Encryption**: Sensitive data encrypted at rest in Supabase
7. **HTTPS Only**: Force HTTPS in production
8. **Audit Logging**: Log all data modifications
9. **RLS Policies**: Enforce database-level access control
10. **API Key Rotation**: Regular rotation schedule

---

## 11. Performance Optimization

### 11.1 Caching Strategy

```typescript
// Use Next.js cache
export const revalidate = 3600; // Revalidate every hour

// Use React cache for deduplication
import { cache } from 'react';

export const getPatient = cache(async (id: string) => {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  return data;
});
```

### 11.2 Database Optimization

```sql
-- Materialized view for reports
CREATE MATERIALIZED VIEW daily_revenue_summary AS
SELECT 
  DATE(billing_date) as date,
  COUNT(DISTINCT patient_id) as patient_count,
  SUM(total_amount) as total_revenue,
  SUM(CASE WHEN payment_method = 'bpjs' THEN total_amount ELSE 0 END) as bpjs_revenue
FROM billings
WHERE payment_status = 'paid'
GROUP BY DATE(billing_date);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_revenue_summary()
RETURNS void AS $
BEGIN
  REFRESH MATERIALIZED VIEW daily_revenue_summary;
END;
$ LANGUAGE plpgsql;

-- Schedule with pg_cron
SELECT cron.schedule('refresh-revenue', '0 1 * * *', 'SELECT refresh_revenue_summary()');
```

### 11.3 Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={patient.photoUrl}
  alt={patient.name}
  width={150}
  height={150}
  className="rounded-full"
  priority={false}
/>
```

---

## 12. Deployment Architecture

### 12.1 Production Setup

```
┌──────────────────────────────────────┐
│         Cloudflare (DNS/CDN)         │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│       Vercel (Next.js Frontend)      │
│  - Auto-scaling                      │
│  - Edge Functions                    │
│  - CDN                               │
└────────────────┬─────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────▼────────┐  ┌───▼──────────────┐
│  Supabase Cloud │  │  External APIs   │
│  - PostgreSQL   │  │  - BPJS VClaim   │
│  - Auth         │  │  - SATUSEHAT     │
│  - Storage      │  │  - Xendit        │
│  - Edge Funcs   │  │                  │
└─────────────────┘  └──────────────────┘
```

### 12.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
          vercel-args: '--prod'
```

### 12.3 Monitoring & Logging

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});

// Usage
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
// __tests__/lib/utils/format.test.ts
import { formatCurrency, formatPhone } from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('should format IDR currency correctly', () => {
    expect(formatCurrency(1000000)).toBe('Rp 1.000.000');
    expect(formatCurrency(500)).toBe('Rp 500');
  });
});

describe('formatPhone', () => {
  it('should format Indonesian phone numbers', () => {
    expect(formatPhone('081234567890')).toBe('0812-3456-7890');
    expect(formatPhone('+6281234567890')).toBe('+62 812-3456-7890');
  });
});
```

### 13.2 Integration Tests

```typescript
// __tests__/api/patients.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/patients/route';

describe('/api/patients', () => {
  it('GET should return patients list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await GET(req);
    
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('patients');
  });

  it('POST should create new patient', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        fullName: 'Test Patient',
        nik: '1234567890123456',
        // ... other fields
      },
    });

    await POST(req);
    
    expect(res._getStatusCode()).toBe(201);
  });
});
```

---

## 14. Migration to Multi-Tenant SaaS

### 14.1 Database Changes

```sql
-- Add organization table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  max_users INTEGER DEFAULT 1,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add organization_id to all tables
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE patients ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ... repeat for all tables

-- Update RLS policies
CREATE POLICY "Users can only access their org data"
ON patients
FOR ALL
USING (organization_id = (
  SELECT organization_id FROM users WHERE id = auth.uid()
));
```

### 14.2 Subdomain Routing

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host');
  const subdomain = hostname?.split('.')[0];

  // Check if valid subdomain
  if (subdomain && subdomain !== 'www') {
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();

    if (!org) {
      return NextResponse.redirect(new URL('/404', req.url));
    }

    // Store org context
    const response = NextResponse.next();
    response.cookies.set('organization_id', org.id);
    return response;
  }

  return NextResponse.next();
}
```

---

**End of Technical Architecture Document**

This architecture is designed to be:
- **Scalable**: Can handle growth from single clinic to multi-tenant SaaS
- **Maintainable**: Clear separation of concerns, typed interfaces
- **Secure**: RLS policies, validation, audit logs
- **Performant**: Caching, indexes, optimized queries
- **Observable**: Logging, monitoring, error tracking