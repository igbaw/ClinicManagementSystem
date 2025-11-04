# Detailed Feature Specifications
## ENT Clinic Management System

**Version**: 1.0  
**Date**: November 2025

---

## Module 1: Authentication & Authorization

### Feature 1.1: User Login
**Priority**: P0 (Critical)  
**User Stories**: 
- As a user, I want to log in with email and password so that I can access the system

**Acceptance Criteria**:
- [ ] User enters email and password
- [ ] System validates credentials against Supabase Auth
- [ ] System redirects to appropriate dashboard based on role
- [ ] System shows error message for invalid credentials
- [ ] System implements rate limiting (5 attempts per 15 minutes)
- [ ] System remembers "keep me logged in" for 7 days

**UI Components**:
- Login form with email and password fields
- "Remember me" checkbox
- "Forgot password" link
- Submit button with loading state
- Error message display

**API Endpoints**:
```typescript
POST /api/auth/login
Body: { email: string, password: string, rememberMe: boolean }
Response: { user: User, session: Session } | { error: string }
```

**Validation Rules**:
- Email: valid email format, required
- Password: minimum 8 characters, required

**Test Cases**:
- TC-AUTH-001: Valid credentials login success
- TC-AUTH-002: Invalid email shows error
- TC-AUTH-003: Invalid password shows error
- TC-AUTH-004: Rate limiting after 5 failed attempts
- TC-AUTH-005: Remember me persists session

---

### Feature 1.2: Role-Based Access Control
**Priority**: P0 (Critical)

**User Stories**:
- As an admin, I want full system access
- As a doctor, I want access to medical records and prescriptions
- As front desk, I want access to registration and billing

**Access Matrix**:

| Feature | Admin | Doctor | Front Desk |
|---------|-------|--------|------------|
| User Management | ✅ | ❌ | ❌ |
| Patient Registration | ✅ | ✅ (read) | ✅ |
| Appointments | ✅ | ✅ (own) | ✅ |
| Medical Records | ✅ | ✅ (create/edit own) | ❌ |
| Prescriptions | ✅ | ✅ | ❌ |
| Billing | ✅ | ❌ | ✅ |
| Payments | ✅ | ❌ | ✅ |
| Inventory | ✅ | ✅ (read) | ✅ |
| Reports | ✅ | ✅ (limited) | ✅ (limited) |
| Settings | ✅ | ❌ | ❌ |

**Implementation**:
- Supabase RLS policies per table
- Next.js middleware for route protection
- Frontend component visibility based on role

---

## Module 2: Patient Management

### Feature 2.1: Patient Registration
**Priority**: P0 (Critical)

**User Stories**:
- As front desk staff, I want to register new patients quickly
- As front desk staff, I want to capture patient photos
- As front desk staff, I want to prevent duplicate registrations

**Acceptance Criteria**:
- [ ] Form includes all required patient demographics
- [ ] System auto-generates unique MR number (format: MR-YYYYMMDD-XXX)
- [ ] System validates NIK format (16 digits)
- [ ] System validates BPJS number format (13 digits) if provided
- [ ] System checks for duplicate NIK before saving
- [ ] System captures patient photo via webcam or file upload
- [ ] System saves patient data to database
- [ ] System shows success message with MR number
- [ ] System allows immediate appointment scheduling after registration

**Form Fields**:
```typescript
interface PatientRegistration {
  // Required
  fullName: string;
  nik: string; // 16 digits
  dateOfBirth: Date;
  gender: 'Laki-laki' | 'Perempuan';
  phone: string;
  address: string;
  
  // Optional
  bpjsNumber?: string; // 13 digits
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  photo?: File;
}
```

**Validation Rules**:
- fullName: min 3 chars, max 100 chars, required
- nik: exactly 16 digits, numeric only, unique, required
- dateOfBirth: valid date, not future date, age < 150, required
- gender: one of enum values, required
- phone: Indonesian format (08xxx or +628xxx), 10-15 digits, required
- address: min 10 chars, max 500 chars, required
- bpjsNumber: exactly 13 digits if provided, numeric only
- email: valid email format if provided

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Registrasi Pasien Baru                     │
├─────────────────────────────────────────────┤
│                                              │
│  Foto Pasien                                 │
│  [Kamera] [Upload]                           │
│                                              │
│  Data Diri                                   │
│  Nama Lengkap: [____________]                │
│  NIK: [____-____-____-____]                  │
│  No. BPJS: [___-___-___-___] (opsional)     │
│  Tanggal Lahir: [__/__/____]                 │
│  Jenis Kelamin: [○ Laki-laki ○ Perempuan]   │
│                                              │
│  Kontak                                      │
│  No. Telepon: [____________]                 │
│  Email: [____________] (opsional)            │
│  Alamat: [____________]                      │
│         [____________]                       │
│                                              │
│  Kontak Darurat                              │
│  Nama: [____________]                        │
│  Hubungan: [____________]                    │
│  Telepon: [____________]                     │
│                                              │
│  [Batal]              [Simpan dan Lanjut]   │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
POST /api/patients
Body: PatientRegistration
Response: { 
  patient: Patient, 
  medicalRecordNumber: string 
} | { error: string }

GET /api/patients/check-duplicate?nik=xxx
Response: { exists: boolean, patient?: Patient }
```

**Database Operations**:
```sql
INSERT INTO patients (
  id, medical_record_number, nik, bpjs_number,
  full_name, date_of_birth, gender, phone, email,
  address, emergency_contact, photo_url,
  created_at, updated_at, organization_id
) VALUES (...);
```

**Test Cases**:
- TC-PAT-001: Register patient with all required fields
- TC-PAT-002: Register patient with BPJS number
- TC-PAT-003: Reject duplicate NIK
- TC-PAT-004: Validate NIK format (16 digits)
- TC-PAT-005: Auto-generate MR number correctly
- TC-PAT-006: Upload patient photo successfully
- TC-PAT-007: Phone number validation (Indonesian format)

---

### Feature 2.2: Patient Search
**Priority**: P0 (Critical)

**User Stories**:
- As front desk staff, I want to quickly find existing patients
- As doctor, I want to search patient medical history

**Acceptance Criteria**:
- [ ] Search by name (partial match, case-insensitive)
- [ ] Search by MR number (exact match)
- [ ] Search by NIK (exact match)
- [ ] Search by BPJS number (exact match)
- [ ] Results show in real-time as user types (debounced)
- [ ] Results display: photo, name, MR number, age, last visit
- [ ] Click result to view patient detail
- [ ] Maximum 50 results per search

**UI Components**:
```
┌─────────────────────────────────────────────┐
│  Cari Pasien                                 │
│  [🔍 Cari nama, MR, NIK, atau BPJS...]      │
├─────────────────────────────────────────────┤
│  [📷] Ahmad Rizki                            │
│       MR-20251101-001 • 35 tahun            │
│       Kunjungan terakhir: 25 Okt 2025       │
├─────────────────────────────────────────────┤
│  [📷] Siti Aminah                            │
│       MR-20251028-045 • 42 tahun            │
│       Kunjungan terakhir: 20 Okt 2025       │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
GET /api/patients/search?q=xxx&limit=50
Response: { 
  patients: Patient[], 
  count: number 
}
```

**Search Implementation**:
```sql
SELECT 
  p.*,
  MAX(a.appointment_date) as last_visit
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
WHERE 
  p.full_name ILIKE '%' || $1 || '%'
  OR p.medical_record_number = $1
  OR p.nik = $1
  OR p.bpjs_number = $1
GROUP BY p.id
ORDER BY p.full_name
LIMIT 50;
```

---

## Module 3: Appointment Management

### Feature 3.1: Schedule Appointment
**Priority**: P0 (Critical)

**User Stories**:
- As front desk staff, I want to schedule appointments for patients
- As front desk staff, I want to see available time slots

**Acceptance Criteria**:
- [ ] Select patient from search or register new
- [ ] Select doctor from dropdown
- [ ] Select date from calendar
- [ ] Select time slot from available slots (15-minute intervals)
- [ ] System prevents double-booking
- [ ] Add optional notes
- [ ] System creates appointment with "scheduled" status
- [ ] Show confirmation with appointment details
- [ ] Print appointment slip (optional)

**Business Rules**:
- Clinic hours: Monday-Saturday, 08:00-16:00
- Lunch break: 12:00-13:00 (no appointments)
- Each appointment slot: 15 minutes
- Maximum 4 appointments per hour per doctor
- Cannot schedule past appointments

**Form Fields**:
```typescript
interface AppointmentCreate {
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: Time; // HH:mm format
  notes?: string;
}
```

**UI Flow**:
```
Step 1: Select Patient
  ↓
Step 2: Select Doctor
  ↓
Step 3: Select Date & Time
  ↓
Step 4: Confirm & Save
```

**Calendar View**:
```
┌──────────────────────────────────────────────┐
│  Jadwal Dokter - Dr. Sarah Wijaya            │
│  ◄ Nov 2025 ►                                │
├──────────────────────────────────────────────┤
│  Sen  Sel  Rab  Kam  Jum  Sab  Min          │
│                  1    2    3    4            │
│   5    6    7    8    9   10   11            │
│  12   13   14   15   16  [17]  18            │
├──────────────────────────────────────────────┤
│  Sabtu, 17 November 2025                     │
│                                              │
│  ✅ 08:00 - Ahmad Rizki                      │
│  ✅ 08:15 - Siti Aminah                      │
│  ⬜ 08:30 - Tersedia                         │
│  ⬜ 08:45 - Tersedia                         │
│  ✅ 09:00 - Budi Santoso                     │
│  ...                                         │
└──────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
GET /api/appointments/availability?doctorId=xxx&date=YYYY-MM-DD
Response: { 
  slots: Array<{time: string, available: boolean, patient?: string}>
}

POST /api/appointments
Body: AppointmentCreate
Response: { appointment: Appointment } | { error: string }
```

**Test Cases**:
- TC-APT-001: Create appointment successfully
- TC-APT-002: Prevent double-booking same slot
- TC-APT-003: Show only available slots
- TC-APT-004: Cannot schedule during lunch break
- TC-APT-005: Cannot schedule outside clinic hours
- TC-APT-006: Cannot schedule past date/time

---

### Feature 3.2: Check-In Patient
**Priority**: P0 (Critical)

**User Stories**:
- As front desk staff, I want to check in patients when they arrive

**Acceptance Criteria**:
- [ ] View today's appointment list
- [ ] Click "Check-In" button for scheduled appointments
- [ ] Update appointment status to "checked_in"
- [ ] Show in doctor's queue
- [ ] Display queue number
- [ ] Show estimated wait time

**UI Components**:
```
┌──────────────────────────────────────────────┐
│  Daftar Pasien Hari Ini - 17 Nov 2025        │
├──────────────────────────────────────────────┤
│  08:00  Ahmad Rizki          [✓ Check-In]    │
│         MR-20251101-001                       │
│         Status: Dijadwalkan                   │
├──────────────────────────────────────────────┤
│  08:15  Siti Aminah         [Check-In]       │
│         MR-20251028-045                       │
│         Status: Dijadwalkan                   │
└──────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
PATCH /api/appointments/:id/check-in
Response: { appointment: Appointment }

GET /api/appointments/today
Response: { appointments: Appointment[] }
```

---

## Module 4: Medical Records

### Feature 4.1: Create Medical Record (SOAP Format)
**Priority**: P0 (Critical)

**User Stories**:
- As a doctor, I want to document patient examination following SOAP format
- As a doctor, I want to add ICD-10 diagnosis codes
- As a doctor, I want to attach photos to medical records

**SOAP Format**:
- **S (Subjective)**: Chief complaint, patient's symptoms, history
- **O (Objective)**: Physical examination findings, vital signs
- **A (Assessment)**: Diagnosis with ICD-10 codes
- **P (Plan)**: Treatment plan, prescriptions, follow-up

**Acceptance Criteria**:
- [ ] Select patient from checked-in queue
- [ ] Record vital signs (blood pressure, pulse, temperature, weight)
- [ ] Enter chief complaint (keluhan utama)
- [ ] Enter anamnesis (detailed symptoms and history)
- [ ] Record physical examination findings
- [ ] Search and add ICD-10 diagnosis codes
- [ ] Add multiple diagnoses if needed
- [ ] Enter treatment plan
- [ ] Attach photos (max 5 per visit)
- [ ] Link to appointment
- [ ] Save with timestamp and doctor signature (digital)
- [ ] Generate medical record PDF

**Form Fields**:
```typescript
interface MedicalRecordCreate {
  patientId: string;
  appointmentId: string;
  doctorId: string; // Auto-filled from session
  
  // Vital Signs
  vitalSigns: {
    bloodPressure?: string; // "120/80"
    pulse?: number; // BPM
    temperature?: number; // Celsius
    weight?: number; // kg
    height?: number; // cm
  };
  
  // SOAP
  chiefComplaint: string; // S
  anamnesis: string; // S
  physicalExamination: string; // O
  diagnosisICD10: Array<{
    code: string;
    nameIndonesian: string;
    nameEnglish: string;
    isPrimary: boolean;
  }>; // A
  treatmentPlan: string; // P
  
  // Additional
  notes?: string;
  attachments?: File[]; // Photos/documents
  followUpDate?: Date;
}
```

**ENT-Specific Examination Template**:
```typescript
interface ENTExamination {
  // Telinga (Ear)
  ear?: {
    left: {
      external: string;
      canal: string;
      tympanicMembrane: string;
      hearing: string;
    };
    right: {
      external: string;
      canal: string;
      tympanicMembrane: string;
      hearing: string;
    };
  };
  
  // Hidung (Nose)
  nose?: {
    external: string;
    cavity: string;
    septum: string;
    turbinate: string;
    sinus: string;
  };
  
  // Tenggorokan (Throat)
  throat?: {
    oral: string;
    pharynx: string;
    larynx: string;
    tonsils: string;
  };
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Rekam Medis - Ahmad Rizki                  │
│  MR-20251101-001 • 35 tahun • Laki-laki     │
├─────────────────────────────────────────────┤
│  [Tab: Tanda Vital] [Tab: Anamnesis]        │
│  [Tab: Pemeriksaan] [Tab: Diagnosis]        │
│  [Tab: Rencana]                              │
├─────────────────────────────────────────────┤
│  TANDA VITAL                                 │
│  Tekanan Darah: [___/___] mmHg              │
│  Nadi: [___] x/menit                         │
│  Suhu: [___] °C                              │
│  Berat Badan: [___] kg                       │
│                                              │
│  SUBJECTIVE (S)                              │
│  Keluhan Utama:                              │
│  [_________________________________]         │
│                                              │
│  Anamnesis:                                  │
│  [_________________________________]         │
│  [_________________________________]         │
│                                              │
│  OBJECTIVE (O)                               │
│  Pemeriksaan Fisik:                          │
│  [Template ENT ▼]                            │
│  [_________________________________]         │
│                                              │
│  ASSESSMENT (A)                              │
│  Diagnosis (ICD-10):                         │
│  🔍 [Cari kode ICD-10...]                    │
│  ✅ H66.9 - Otitis Media (Primer)            │
│  [+ Tambah Diagnosis]                        │
│                                              │
│  PLAN (P)                                    │
│  Rencana Tindakan:                           │
│  [_________________________________]         │
│                                              │
│  Lampiran:                                   │
│  [📷 Upload Foto]                            │
│                                              │
│  [Batal]  [Draft]  [Simpan dan Resep]       │
└─────────────────────────────────────────────┘
```

**ICD-10 Search**:
```
Input: "otitis"
Results:
  H65.0 - Otitis media serosa akut (Acute serous otitis media)
  H65.1 - Otitis media serosa kronis (Chronic serous otitis media)
  H66.0 - Otitis media supuratif akut (Acute suppurative otitis media)
  H66.9 - Otitis media, tidak spesifik (Otitis media, unspecified)
```

**API Endpoints**:
```typescript
POST /api/medical-records
Body: MedicalRecordCreate
Response: { medicalRecord: MedicalRecord } | { error: string }

GET /api/icd10/search?q=xxx&lang=id
Response: { codes: ICD10Code[], count: number }

POST /api/medical-records/:id/attachments
Body: FormData (files)
Response: { urls: string[] }

GET /api/medical-records/:id/pdf
Response: PDF file
```

**Business Rules**:
- At least one diagnosis required
- Chief complaint required (min 10 chars)
- Physical examination required (min 20 chars)
- Treatment plan required (min 20 chars)
- Cannot edit after 24 hours (audit trail)
- Original record preserved, amendments added as addendum

**Test Cases**:
- TC-MR-001: Create complete medical record
- TC-MR-002: Search ICD-10 codes in Indonesian
- TC-MR-003: Add multiple diagnoses
- TC-MR-004: Upload examination photos
- TC-MR-005: Use ENT examination template
- TC-MR-006: Generate medical record PDF
- TC-MR-007: Validate required fields
- TC-MR-008: Prevent editing after 24 hours

---

### Feature 4.2: View Medical History
**Priority**: P1 (High)

**User Stories**:
- As a doctor, I want to view patient's complete medical history
- As a doctor, I want to see previous diagnoses and treatments

**Acceptance Criteria**:
- [ ] Display all visits chronologically (newest first)
- [ ] Show date, doctor, diagnosis, and treatment summary
- [ ] Expand to view full SOAP notes
- [ ] View attached images
- [ ] Filter by date range
- [ ] Filter by diagnosis
- [ ] Export history to PDF

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Riwayat Medis - Ahmad Rizki                │
│  MR-20251101-001                             │
├─────────────────────────────────────────────┤
│  Filter: [Semua Tanggal ▼] [Semua Dx ▼]    │
├─────────────────────────────────────────────┤
│  📋 17 Nov 2025 - Dr. Sarah Wijaya           │
│     Dx: Otitis Media (H66.9)                │
│     Rx: Amoxicillin 3x500mg, Obat tetes    │
│     [Lihat Detail]                           │
├─────────────────────────────────────────────┤
│  📋 10 Nov 2025 - Dr. Sarah Wijaya           │
│     Dx: Rhinitis Alergi (J30.1)             │
│     Rx: Cetirizine 1x10mg                   │
│     [Lihat Detail]                           │
├─────────────────────────────────────────────┤
│  [Export PDF]                                │
└─────────────────────────────────────────────┘
```

---

## Module 5: Prescription Management

### Feature 5.1: Create Prescription
**Priority**: P0 (Critical)

**User Stories**:
- As a doctor, I want to create prescriptions for patients
- As a doctor, I want to use dosage templates for common medications
- As a doctor, I want to check medication stock before prescribing

**Acceptance Criteria**:
- [ ] Link prescription to medical record
- [ ] Search medications from inventory
- [ ] Select medication and dosage
- [ ] Use dosage templates or enter custom
- [ ] Calculate quantity automatically based on duration
- [ ] Add multiple medications
- [ ] Check stock availability (show warning if low)
- [ ] Add instructions per medication
- [ ] Generate e-prescription PDF in Bahasa Indonesia
- [ ] Print prescription
- [ ] Update appointment status to "completed"

**Form Fields**:
```typescript
interface PrescriptionCreate {
  medicalRecordId: string;
  patientId: string;
  doctorId: string; // Auto-filled
  
  items: Array<{
    medicationId: string;
    medicationName: string;
    dosage: string; // "500mg"
    frequency: string; // "3x sehari"
    timing: string; // "sesudah makan"
    duration: string; // "7 hari"
    quantity: number; // Auto-calculated
    instructions?: string; // Additional notes
  }>;
  
  notes?: string; // General prescription notes
}
```

**Dosage Templates** (Indonesian):
```typescript
const dosageTemplates = {
  frequency: [
    "1x sehari",
    "2x sehari", 
    "3x sehari",
    "4x sehari",
    "Bila perlu"
  ],
  timing: [
    "Sebelum makan",
    "Sesudah makan",
    "Bersama makan",
    "Malam sebelum tidur",
    "Pagi hari",
    "Tidak tergantung makan"
  ],
  duration: [
    "3 hari",
    "5 hari",
    "7 hari",
    "14 hari",
    "30 hari"
  ]
};
```

**Quantity Calculation**:
```typescript
// Example: Tablet 3x sehari, 7 hari
// Quantity = 3 (frequency) × 7 (duration) = 21 tablet

function calculateQuantity(
  frequency: string, 
  duration: string, 
  dosageForm: string
): number {
  const freqNumber = parseInt(frequency.match(/\d+/)?[0] || "1");
  const durationDays = parseInt(duration.match(/\d+/)?.[0] || "1");
  return freqNumber * durationDays;
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Resep - Ahmad Rizki (H66.9 - Otitis Media) │
├─────────────────────────────────────────────┤
│  🔍 [Cari obat...]                           │
│                                              │
│  Obat yang diresepkan:                       │
│                                              │
│  1. Amoxicillin 500mg - Kapsul              │
│     Dosis: [500mg]                           │
│     Frekuensi: [3x sehari ▼]                 │
│     Waktu: [Sesudah makan ▼]                 │
│     Durasi: [7 hari ▼]                       │
│     Jumlah: 21 kapsul (dihitung otomatis)    │
│     Stok: 150 kapsul ✅                      │
│     [Hapus]                                  │
│                                              │
│  2. Tetes Telinga Otolin 10ml               │
│     Instruksi: Teteskan 3-4 tetes           │
│     ke telinga kanan 3x sehari              │
│     Jumlah: 1 botol                          │
│     Stok: 25 botol ✅                        │
│     [Hapus]                                  │
│                                              │
│  [+ Tambah Obat]                             │
│                                              │
│  Catatan Resep:                              │
│  [________________________________]          │
│                                              │
│  [Batal]  [Simpan Draft]  [Cetak Resep]     │
└─────────────────────────────────────────────┘
```

**E-Prescription PDF Format**:
```
┌─────────────────────────────────────────────┐
│         KLINIK THT DR. SARAH WIJAYA         │
│       Jl. Sudirman No. 123, Jakarta         │
│           Telp: (021) 1234-5678             │
│                                              │
│  RESEP OBAT                                  │
│                                              │
│  Nama Pasien : Ahmad Rizki                   │
│  Umur        : 35 tahun                      │
│  No. RM      : MR-20251101-001               │
│  Tanggal     : 17 November 2025              │
│                                              │
│  Diagnosis   : Otitis Media (H66.9)          │
│                                              │
│  R/                                          │
│  1. Amoxicillin 500mg - Kapsul              │
│     No. XXI (dua puluh satu)                 │
│     S 3 dd caps I pc (sesudah makan)        │
│                                              │
│  2. Tetes Telinga Otolin 10ml               │
│     No. I (satu botol)                       │
│     Teteskan 3-4 tetes ke telinga           │
│     kanan 3x sehari                          │
│                                              │
│  Pro: Penggunaan selama 7 hari              │
│                                              │
│                    Jakarta, 17 November 2025 │
│                                              │
│                    Dr. Sarah Wijaya, Sp.THT │
│                    SIP: 123/SIP/2024         │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
POST /api/prescriptions
Body: PrescriptionCreate
Response: { prescription: Prescription } | { error: string }

GET /api/prescriptions/:id/pdf
Response: PDF file

GET /api/medications/search?q=xxx&checkStock=true
Response: { 
  medications: Array<{
    id: string,
    name: string,
    genericName: string,
    unit: string,
    stockQuantity: number,
    price: number
  }>
}
```

**Business Rules**:
- Must be linked to medical record
- At least one medication required
- Quantity must be positive integer
- Check stock before saving (show warning, but allow if urgent)
- Auto-deduct stock when prescription dispensed
- Doctor can modify prescription within 2 hours of creation

**Test Cases**:
- TC-RX-001: Create prescription with single medication
- TC-RX-002: Create prescription with multiple medications
- TC-RX-003: Calculate quantity automatically
- TC-RX-004: Warn when medication stock low
- TC-RX-005: Generate e-prescription PDF correctly
- TC-RX-006: Use dosage templates
- TC-RX-007: Search medications by name
- TC-RX-008: Prevent saving without medications

---

## Module 6: Billing & Payments

### Feature 6.1: Generate Bill
**Priority**: P0 (Critical)

**User Stories**:
- As front desk staff, I want to automatically generate bills from medical records and prescriptions
- As front desk staff, I want to apply BPJS pricing for BPJS patients

**Acceptance Criteria**:
- [ ] Auto-populate bill from completed appointment
- [ ] Include consultation fee
- [ ] Include procedure fees (if any)
- [ ] Include medication costs from prescription
- [ ] Auto-detect patient type (BPJS / non-BPJS)
- [ ] Apply appropriate pricing (BPJS tariff vs regular price)
- [ ] Allow manual discount entry
- [ ] Calculate tax if applicable
- [ ] Show itemized breakdown
- [ ] Save bill with "pending" payment status
- [ ] Generate invoice PDF

**Pricing Logic**:
```typescript
interface BillingItem {
  itemType: 'consultation' | 'procedure' | 'medication' | 'lab_test';
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number; // Regular or BPJS price
  totalPrice: number;
}

interface BillCalculation {
  items: BillingItem[];
  subtotal: number;
  discount: number;
  tax: number; // 0% for healthcare in Indonesia
  totalAmount: number;
  patientType: 'bpjs' | 'non-bpjs';
}
```

**Auto-population Rules**:
```typescript
// From medical record:
- Add consultation fee based on doctor level
- Add procedure fees from medical record

// From prescription:
- Add each medication with quantity and price
- Use selling_price from medications table

// Pricing selection:
if (patient.bpjsNumber && useBPJS) {
  price = service.bpjs_price || service.price;
} else {
  price = service.price;
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Tagihan - Ahmad Rizki                      │
│  MR-20251101-001 • BPJS: 1234567890123     │
├─────────────────────────────────────────────┤
│  Jenis Pembayaran:                           │
│  ○ BPJS   ● Umum/Pribadi                    │
├─────────────────────────────────────────────┤
│  RINCIAN TAGIHAN                             │
│                                              │
│  Konsultasi Spesialis THT                   │
│  1 x Rp 150.000              Rp 150.000     │
│                                              │
│  Obat-obatan:                                │
│  Amoxicillin 500mg Kapsul                   │
│  21 x Rp 1.500               Rp  31.500     │
│                                              │
│  Tetes Telinga Otolin 10ml                  │
│  1 x Rp 45.000               Rp  45.000     │
│                                              │
│  ────────────────────────────────────────   │
│  Subtotal                    Rp 226.500     │
│  Diskon: [______] %          Rp       0     │
│  Pajak (0%)                  Rp       0     │
│  ────────────────────────────────────────   │
│  TOTAL                       Rp 226.500     │
│                                              │
│  [Batal]          [Lanjut ke Pembayaran]    │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
POST /api/billings/generate
Body: { 
  appointmentId: string,
  useBPJS: boolean 
}
Response: { billing: Billing }

GET /api/billings/:id
Response: { billing: Billing, items: BillingItem[] }

GET /api/billings/:id/invoice-pdf
Response: PDF file
```

**Test Cases**:
- TC-BILL-001: Generate bill for non-BPJS patient
- TC-BILL-002: Generate bill for BPJS patient with correct pricing
- TC-BILL-003: Calculate total correctly with discount
- TC-BILL-004: Include all medications from prescription
- TC-BILL-005: Generate invoice PDF

---

### Feature 6.2: Process Payment
**Priority**: P0 (Critical)

**User Stories**:
- As front desk staff, I want to record payments with different methods
- As front desk staff, I want to handle partial payments

**Acceptance Criteria**:
- [ ] View pending bills
- [ ] Select payment method
- [ ] Enter payment amount
- [ ] Support partial payments (track outstanding balance)
- [ ] Enter reference number for QRIS/transfer
- [ ] Update bill status (pending → partial → paid)
- [ ] Generate payment receipt
- [ ] Print receipt automatically
- [ ] Send receipt via WhatsApp (future)

**Payment Methods**:
```typescript
type PaymentMethod = 
  | 'cash'
  | 'qris'
  | 'bpjs'
  | 'debit_card'
  | 'bank_transfer'
  | 'gopay'
  | 'ovo'
  | 'dana'
  | 'shopeepay';

interface PaymentCreate {
  billingId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // For digital payments
  notes?: string;
}
```

**Payment Status Logic**:
```typescript
function calculatePaymentStatus(
  totalAmount: number,
  paidAmount: number
): 'pending' | 'partial' | 'paid' {
  if (paidAmount === 0) return 'pending';
  if (paidAmount < totalAmount) return 'partial';
  return 'paid';
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Pembayaran - Ahmad Rizki                   │
├─────────────────────────────────────────────┤
│  Total Tagihan:     Rp 226.500              │
│  Sudah Dibayar:     Rp       0              │
│  ────────────────────────────────────────   │
│  Sisa Tagihan:      Rp 226.500              │
│                                              │
│  Metode Pembayaran:                          │
│  [● Tunai  ○ QRIS  ○ Debit  ○ E-Wallet]    │
│                                              │
│  Jumlah Bayar:                               │
│  Rp [226.500___]                             │
│                                              │
│  Nomor Referensi: (opsional)                 │
│  [_________________]                         │
│                                              │
│  Catatan:                                    │
│  [_________________]                         │
│                                              │
│  [Batal]              [Proses Pembayaran]   │
└─────────────────────────────────────────────┘
```

**Receipt Format**:
```
┌─────────────────────────────────────────────┐
│         KLINIK THT DR. SARAH WIJAYA         │
│       Jl. Sudirman No. 123, Jakarta         │
│           Telp: (021) 1234-5678             │
│                                              │
│  KWITANSI PEMBAYARAN                         │
│  No: INV-20251117-001                        │
│                                              │
│  Tanggal    : 17 November 2025 14:30        │
│  Kasir      : Dewi (Front Desk)             │
│                                              │
│  Nama       : Ahmad Rizki                    │
│  No. RM     : MR-20251101-001                │
│                                              │
│  RINCIAN:                                    │
│  Konsultasi              Rp 150.000         │
│  Amoxicillin 21 kapsul   Rp  31.500         │
│  Tetes Telinga           Rp  45.000         │
│  ─────────────────────────────────          │
│  TOTAL                   Rp 226.500         │
│                                              │
│  Metode Pembayaran: Tunai                    │
│  Dibayar         : Rp 230.000                │
│  Kembali         : Rp   3.500                │
│                                              │
│  Terima kasih atas kunjungan Anda!          │
│                                              │
│  Simpan struk ini sebagai bukti pembayaran  │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
POST /api/payments
Body: PaymentCreate
Response: { payment: Payment, billing: Billing }

GET /api/payments/:id/receipt-pdf
Response: PDF file

GET /api/billings/outstanding
Response: { billings: Billing[] }
```

**Test Cases**:
- TC-PAY-001: Process full payment with cash
- TC-PAY-002: Process partial payment
- TC-PAY-003: Process QRIS payment with reference
- TC-PAY-004: Update billing status correctly
- TC-PAY-005: Generate receipt PDF
- TC-PAY-006: Calculate change for cash payment

---

### Feature 6.3: QRIS Payment Integration
**Priority**: P1 (High)

**User Stories**:
- As front desk staff, I want to generate QRIS code for patient payment
- As front desk staff, I want real-time payment confirmation

**Acceptance Criteria**:
- [ ] Generate QRIS code for bill amount
- [ ] Display QR code for patient to scan
- [ ] Poll for payment status
- [ ] Auto-update when payment confirmed
- [ ] Show success message
- [ ] Auto-print receipt

**Payment Gateway**: Xendit or Midtrans

**Flow**:
```
1. Front desk clicks "QRIS"
2. System creates QRIS invoice via API
3. Display QR code to patient
4. Patient scans with mobile banking/e-wallet
5. System polls for payment status
6. Webhook receives confirmation
7. Auto-update payment record
8. Print receipt
```

**API Integration** (Xendit example):
```typescript
// Create QRIS
POST https://api.xendit.co/qr_codes
Body: {
  external_id: "BILL-xxx",
  type: "DYNAMIC",
  callback_url: "https://yourdomain.com/api/webhooks/xendit",
  amount: 226500
}
Response: {
  id: "qr_xxx",
  qr_string: "00020101021226...",
  status: "ACTIVE"
}

// Webhook handler
POST /api/webhooks/xendit
Body: {
  id: "qr_xxx",
  external_id: "BILL-xxx",
  status: "COMPLETED",
  amount: 226500
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Pembayaran QRIS                             │
├─────────────────────────────────────────────┤
│  Total: Rp 226.500                           │
│                                              │
│      [QR CODE DISPLAYED HERE]                │
│                                              │
│  Silakan scan QR code dengan:                │
│  • Mobile Banking                            │
│  • GoPay, OVO, Dana, ShopeePay              │
│  • Aplikasi QRIS lainnya                     │
│                                              │
│  ⏱️ Menunggu pembayaran...                   │
│                                              │
│  [Batal]                                     │
└─────────────────────────────────────────────┘

// After payment confirmed:
┌─────────────────────────────────────────────┐
│  ✅ Pembayaran Berhasil!                     │
├─────────────────────────────────────────────┤
│  Jumlah: Rp 226.500                          │
│  Metode: QRIS (GoPay)                        │
│  Ref: QRIS123456789                          │
│                                              │
│  [Cetak Kwitansi]  [Tutup]                   │
└─────────────────────────────────────────────┘
```

**Test Cases**:
- TC-QRIS-001: Generate QRIS code successfully
- TC-QRIS-002: Receive payment webhook correctly
- TC-QRIS-003: Handle payment timeout (15 min)
- TC-QRIS-004: Handle cancelled payment

---

## Module 7: Inventory Management

### Feature 7.1: Medication Master Data
**Priority**: P1 (High)

**User Stories**:
- As admin, I want to add new medications to inventory
- As admin, I want to update medication prices

**Acceptance Criteria**:
- [ ] Add new medication with all details
- [ ] Update existing medication
- [ ] Deactivate medication (not delete)
- [ ] Search medications
- [ ] Set minimum stock threshold
- [ ] Track supplier information
- [ ] Upload medication image (optional)

**Form Fields**:
```typescript
interface MedicationCreate {
  name: string; // Brand name
  genericName: string;
  category: 'antibiotic' | 'analgesic' | 'antihistamine' | 'ear_drops' | 'nasal_spray' | 'other';
  unit: 'tablet' | 'kapsul' | 'botol' | 'tube' | 'ampul' | 'sachet';
  dosageForm: string; // "500mg", "10ml", etc.
  manufacturer?: string;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  expiryDate: Date;
  batchNumber?: string;
  isActive: boolean;
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Tambah Obat Baru                            │
├─────────────────────────────────────────────┤
│  Nama Dagang:                                │
│  [Amoxicillin Kimia Farma_____________]     │
│                                              │
│  Nama Generik:                               │
│  [Amoxicillin_________________________]     │
│                                              │
│  Kategori:                                   │
│  [Antibiotik ▼]                              │
│                                              │
│  Bentuk Sediaan:                             │
│  [Kapsul ▼] Dosis: [500mg___]               │
│                                              │
│  Pabrik:                                     │
│  [Kimia Farma_________________________]     │
│                                              │
│  Supplier:                                   │
│  [PT Distributor Obat ABC______________]     │
│                                              │
│  Harga Beli:        Rp [50.000____]         │
│  Harga Jual:        Rp [75.000____]         │
│  Margin: 50%                                 │
│                                              │
│  Stok Awal:         [100___] kapsul         │
│  Stok Minimum:      [20____] kapsul         │
│                                              │
│  Tanggal Kedaluwarsa: [__/__/____]          │
│  No. Batch:         [BATCH2025A_____]       │
│                                              │
│  [Batal]                         [Simpan]   │
└─────────────────────────────────────────────┘
```

**Validation Rules**:
- Name: required, min 3 chars
- Generic name: required
- Purchase price: positive number, required
- Selling price: must be >= purchase price
- Stock quantity: non-negative integer
- Minimum stock: positive integer
- Expiry date: must be future date

**API Endpoints**:
```typescript
POST /api/medications
Body: MedicationCreate
Response: { medication: Medication }

PUT /api/medications/:id
Body: Partial<MedicationCreate>
Response: { medication: Medication }

GET /api/medications?search=xxx&category=xxx&active=true
Response: { medications: Medication[], count: number }
```

---

### Feature 7.2: Stock Monitoring
**Priority**: P1 (High)

**User Stories**:
- As admin, I want to see medications with low stock
- As admin, I want to be alerted about expiring medications

**Acceptance Criteria**:
- [ ] Dashboard widget showing low stock items
- [ ] Dashboard widget showing expiring items (60 days)
- [ ] Color-coded stock levels (green/yellow/red)
- [ ] Click to view details and reorder

**Stock Status Logic**:
```typescript
function getStockStatus(
  quantity: number,
  minimumStock: number
): 'sufficient' | 'low' | 'critical' {
  if (quantity === 0) return 'critical';
  if (quantity <= minimumStock) return 'low';
  if (quantity <= minimumStock * 2) return 'low';
  return 'sufficient';
}
```

**UI Dashboard Widget**:
```
┌─────────────────────────────────────────────┐
│  ⚠️ Stok Menipis (5)                        │
├─────────────────────────────────────────────┤
│  🔴 Amoxicillin 500mg                       │
│      Stok: 5 kapsul (Min: 20)               │
│                                              │
│  🟡 Paracetamol 500mg                       │
│      Stok: 30 tablet (Min: 50)              │
│                                              │
│  [Lihat Semua]                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📅 Akan Kedaluwarsa (3)                    │
├─────────────────────────────────────────────┤
│  Cetirizine 10mg                             │
│  Kedaluwarsa: 15 Jan 2026 (45 hari lagi)   │
│                                              │
│  Tetes Mata Cendo                            │
│  Kedaluwarsa: 28 Jan 2026 (58 hari lagi)   │
│                                              │
│  [Lihat Semua]                               │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
GET /api/medications/low-stock
Response: { medications: Medication[], count: number }

GET /api/medications/expiring?days=60
Response: { medications: Medication[], count: number }
```

---

### Feature 7.3: Stock Adjustment
**Priority**: P1 (High)

**User Stories**:
- As admin, I want to record stock adjustments
- As admin, I want to track why stock was adjusted

**Acceptance Criteria**:
- [ ] Select medication
- [ ] Enter adjustment quantity (+/-)
- [ ] Select adjustment type (purchase, return, expired, damaged, correction)
- [ ] Enter notes/reason
- [ ] Update stock quantity
- [ ] Log adjustment in history

**Adjustment Types**:
```typescript
type AdjustmentType = 
  | 'purchase'      // New stock received
  | 'return'        // Return to supplier
  | 'expired'       // Remove expired stock
  | 'damaged'       // Remove damaged stock
  | 'dispensed'     // Given to patient (auto)
  | 'correction'    // Manual correction
  | 'lost';         // Lost/stolen

interface StockAdjustment {
  medicationId: string;
  adjustmentType: AdjustmentType;
  quantity: number; // Positive or negative
  reason: string;
  referenceNumber?: string; // PO number, etc.
  adjustedBy: string; // User ID
  adjustmentDate: Date;
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Penyesuaian Stok                            │
├─────────────────────────────────────────────┤
│  Obat:                                       │
│  🔍 [Cari obat...]                           │
│  ✓ Amoxicillin 500mg Kapsul                 │
│     Stok saat ini: 5 kapsul                  │
│                                              │
│  Jenis Penyesuaian:                          │
│  [Pembelian Baru ▼]                          │
│                                              │
│  Jumlah:                                     │
│  [+ 100_____] kapsul                         │
│                                              │
│  No. Referensi (PO/Invoice):                 │
│  [PO-2025-001______________]                 │
│                                              │
│  Alasan:                                     │
│  [Pembelian dari PT Distributor ABC]        │
│  [___________________________________]       │
│                                              │
│  Batch Baru:       [BATCH2025B______]       │
│  Kedaluwarsa Baru: [31/12/2026______]       │
│                                              │
│  Stok setelah penyesuaian: 105 kapsul       │
│                                              │
│  [Batal]                         [Simpan]   │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
POST /api/stock-adjustments
Body: StockAdjustment
Response: { 
  adjustment: StockAdjustment, 
  medication: Medication // with updated stock
}

GET /api/stock-adjustments?medicationId=xxx&startDate=xxx&endDate=xxx
Response: { adjustments: StockAdjustment[], count: number }
```

**Test Cases**:
- TC-INV-001: Add stock via purchase
- TC-INV-002: Reduce stock via expired removal
- TC-INV-003: View adjustment history
- TC-INV-004: Auto-deduct stock when prescription dispensed

---

## Module 8: BPJS Integration

### Feature 8.1: BPJS Eligibility Check
**Priority**: P1 (High)

**User Stories**:
- As front desk staff, I want to verify BPJS eligibility before appointment

**Acceptance Criteria**:
- [ ] Enter BPJS card number
- [ ] Call VClaim API to verify
- [ ] Display patient BPJS details
- [ ] Show eligibility status
- [ ] Display benefit class
- [ ] Show remaining benefits
- [ ] Handle API errors gracefully

**VClaim API Integration**:
```typescript
interface BPJSEligibilityRequest {
  noka: string; // BPJS card number (13 digits)
  tglSEP: string; // Service date (yyyy-MM-dd)
  noKartu: string; // Same as noka
  ppkPelayanan: string; // Clinic code
}

interface BPJSEligibilityResponse {
  response: {
    peserta: {
      cob: {
        nmAsuransi: string;
        noAsuransi: string;
        tglTAT: string;
        tglTMT: string;
      };
      hakKelas: {
        keterangan: string; // "Kelas I", "Kelas II", "Kelas III"
        kode: string;
      };
      informasi: {
        dinsos: string;
        noSKTM: string;
        prolanisPRB: string;
      };
      jenisPeserta: {
        keterangan: string;
        kode: string;
      };
      mr: {
        noMR: string;
        noTelepon: string;
      };
      nama: string;
      nik: string;
      noKartu: string;
      pisa: string;
      provUmum: {
        kdProvider: string;
        nmProvider: string;
      };
      sex: string;
      statusPeserta: {
        keterangan: string; // "AKTIF" or "TIDAK AKTIF"
        kode: string;
      };
      tglCetakKartu: string;
      tglLahir: string;
      tglTAT: string;
      tglTMT: string;
      umur: {
        umurSaatPelayanan: string;
        umurSekarang: string;
      };
    };
  };
  metaData: {
    code: string; // "200" if success
    message: string;
  };
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Verifikasi BPJS                             │
├─────────────────────────────────────────────┤
│  No. Kartu BPJS:                             │
│  [____-____-____-____]                       │
│  Tanggal Pelayanan: [17/11/2025____]        │
│                                              │
│  [Cek Eligibilitas]                          │
│                                              │
│  ✅ Status: AKTIF                            │
│                                              │
│  Nama          : Ahmad Rizki                 │
│  NIK           : 3201234567890123            │
│  Tanggal Lahir : 15 Januari 1990            │
│  Jenis Kelamin : Laki-laki                   │
│  Jenis Peserta : Pekerja Penerima Upah      │
│  Hak Kelas     : Kelas II                    │
│                                              │
│  Faskes I      : Klinik Pratama Sehat       │
│  Masa Berlaku  : s/d 31 Des 2025            │
│                                              │
│  [Lanjut ke Pendaftaran]                     │
└─────────────────────────────────────────────┘
```

**Error Handling**:
```typescript
const bpjsErrorMessages = {
  '201': 'Nomor kartu tidak ditemukan',
  '202': 'Peserta tidak aktif',
  '203': 'Faskes tidak sesuai',
  '204': 'Data peserta tidak lengkap',
  '401': 'Credentials tidak valid',
  '500': 'Server BPJS error, coba lagi'
};
```

**API Endpoints**:
```typescript
POST /api/bpjs/eligibility
Body: { 
  bpjsNumber: string,
  serviceDate: string 
}
Response: BPJSEligibilityResponse | { error: string }
```

**Test Cases**:
- TC-BPJS-001: Verify active BPJS card
- TC-BPJS-002: Handle inactive card
- TC-BPJS-003: Handle invalid card number
- TC-BPJS-004: Handle API timeout
- TC-BPJS-005: Display correct benefit class

---

### Feature 8.2: SEP (Surat Eligibilitas Peserta) Creation
**Priority**: P1 (High)

**User Stories**:
- As front desk staff, I want to create SEP for BPJS patients

**Acceptance Criteria**:
- [ ] Auto-populate patient data from eligibility check
- [ ] Select diagnosis (ICD-10)
- [ ] Select procedure (ICD-9-CM) if applicable
- [ ] Enter complaint
- [ ] Generate SEP via VClaim API
- [ ] Display SEP number
- [ ] Print SEP document
- [ ] Link SEP to appointment

**SEP Creation Data**:
```typescript
interface SEPCreateRequest {
  request: {
    t_sep: {
      noKartu: string;
      tglSep: string;
      ppkPelayanan: string;
      jnsPelayanan: string; // "2" = Rawat Jalan
      klsRawat: string; // "1", "2", "3"
      noMR: string;
      rujukan: {
        asalRujukan: string; // "1" = Faskes I
        tglRujukan: string;
        noRujukan: string;
        ppkRujukan: string;
      };
      catatan: string;
      diagAwal: string; // ICD-10 code
      poli: {
        tujuan: string; // Poly code
        eksekutif: string; // "0" = tidak
      };
      cob: {
        cob: string; // "0" = tidak ada COB
      };
      katarak: {
        katarak: string; // "0" = bukan katarak
      };
      jaminan: {
        lakaLantas: string; // "0" = bukan kecelakaan
        noLP: string;
        penjamin: {
          tglKejadian: string;
          keterangan: string;
          suplesi: {
            suplesi: string; // "0" = tidak
            noSepSuplesi: string;
            lokasiLaka: {
              kdPropinsi: string;
              kdKabupaten: string;
              kdKecamatan: string;
            };
          };
        };
      };
      tujuanKunj: string; // "0" = Normal
      flagProcedure: string; // "" = tidak ada
      kdPenunjang: string; // "" = tidak ada
      assesmentPel: string; // "" = tidak ada
      skdp: {
        noSurat: string;
        kodeDPJP: string;
      };
      dpjpLayan: string; // Doctor SIP number
      noTelp: string;
      user: string; // Username
    };
  };
}

interface SEPCreateResponse {
  response: {
    sep: {
      noSep: string; // SEP number
      tglSep: string;
      ppkPelayanan: string;
      jnsPelayanan: string;
      kelasRawat: string;
      noKartu: string;
      nama: string;
      tglLahir: string;
      poli: string;
      diagnosa: string;
      noRujukan: string;
      peserta: string;
      catatan: string;
    };
  };
  metaData: {
    code: string;
    message: string;
  };
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  Buat SEP BPJS                               │
├─────────────────────────────────────────────┤
│  Data Peserta                                │
│  No. Kartu   : 1234567890123                 │
│  Nama        : Ahmad Rizki                   │
│  Tgl Lahir   : 15/01/1990                    │
│  Hak Kelas   : Kelas II                      │
│                                              │
│  Data Pelayanan                              │
│  Tgl SEP     : [17/11/2025____]              │
│  Jenis       : [Rawat Jalan ▼]               │
│  Poli Tujuan : [THT ▼]                       │
│  DPJP        : [Dr. Sarah Wijaya ▼]          │
│                                              │
│  Data Rujukan                                │
│  Asal Rujukan: [Faskes I ▼]                  │
│  No. Rujukan : [0301R001240001234___]        │
│  Tgl Rujukan : [15/11/2025____]              │
│                                              │
│  Diagnosis Awal (ICD-10):                    │
│  🔍 [Cari diagnosis...]                      │
│  ✓ H66.9 - Otitis Media                     │
│                                              │
│  Keluhan:                                    │
│  [Telinga kanan sakit dan berdenging]       │
│  [___________________________________]       │
│                                              │
│  Catatan:                                    │
│  [___________________________________]       │
│                                              │
│  [Batal]                    [Buat SEP]      │
└─────────────────────────────────────────────┘

// After SEP created:
┌─────────────────────────────────────────────┐
│  ✅ SEP Berhasil Dibuat                     │
├─────────────────────────────────────────────┤
│  No. SEP: 0301R00108250000123                │
│  Tanggal: 17 November 2025                   │
│                                              │
│  [Cetak SEP]  [Lanjut ke Pemeriksaan]       │
└─────────────────────────────────────────────┘
```

**SEP Print Format** (Simplified):
```
┌─────────────────────────────────────────────┐
│  SURAT ELIGIBILITAS PESERTA (SEP)           │
│                   BPJS KESEHATAN             │
│                                              │
│  No. SEP        : 0301R00108250000123        │
│  Tgl. SEP       : 17-Nov-2025                │
│                                              │
│  No. Kartu      : 1234567890123              │
│  Nama Peserta   : Ahmad Rizki                │
│  Tgl. Lahir     : 15-Jan-1990                │
│  No. MR         : MR-20251101-001            │
│  Jenis Kelamin  : Laki-laki                  │
│  Jenis Peserta  : Pekerja Penerima Upah     │
│  Hak Kelas      : Kelas II                   │
│                                              │
│  Asal Rujukan   : Faskes I                   │
│  No. Rujukan    : 0301R001240001234          │
│  Tgl. Rujukan   : 15-Nov-2025                │
│  PPK Rujukan    : Klinik Pratama Sehat      │
│                                              │
│  Poli Tujuan    : THT                        │
│  DPJP           : Dr. Sarah Wijaya, Sp.THT  │
│  Diagnosa Awal  : H66.9 - Otitis Media      │
│                                              │
│  Catatan        : -                          │
│                                              │
│  Jakarta, 17 November 2025                   │
│  Petugas: Dewi                               │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
POST /api/bpjs/sep
Body: SEPCreateRequest
Response: SEPCreateResponse | { error: string }

GET /api/bpjs/sep/:sepNumber
Response: SEPCreateResponse

DELETE /api/bpjs/sep/:sepNumber
Body: { user: string, reason: string }
Response: { success: boolean }
```

**Test Cases**:
- TC-SEP-001: Create SEP successfully
- TC-SEP-002: Validate required fields
- TC-SEP-003: Handle duplicate SEP (same day, same card)
- TC-SEP-004: Print SEP correctly
- TC-SEP-005: Delete SEP with valid reason

---

## Module 9: SATUSEHAT Integration

### Feature 9.1: Patient Registration to SATUSEHAT
**Priority**: P2 (Medium)

**User Stories**:
- As system, I want to register/update patients to SATUSEHAT automatically

**Acceptance Criteria**:
- [ ] Register new patient to SATUSEHAT via FHIR API
- [ ] Verify NIK against SATUSEHAT database
- [ ] Store SATUSEHAT patient IHS number
- [ ] Update patient when demographics change
- [ ] Handle duplicate patient detection
- [ ] Queue failed submissions for retry

**FHIR Patient Resource**:
```typescript
interface SatuSehatPatient {
  resourceType: "Patient";
  identifier: [
    {
      use: "official";
      system: "https://fhir.kemkes.go.id/id/nik";
      value: string; // NIK
    }
  ];
  name: [
    {
      use: "official";
      text: string; // Full name
    }
  ];
  telecom: [
    {
      system: "phone";
      value: string;
      use: "mobile";
    }
  ];
  gender: "male" | "female";
  birthDate: string; // YYYY-MM-DD
  address: [
    {
      use: "home";
      line: [string];
      city: string;
      postalCode: string;
      country: "ID";
    }
  ];
  extension: [
    {
      url: "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace";
      valueAddress: {
        city: string;
        country: "ID";
      };
    }
  ];
}
```

**API Integration**:
```typescript
// OAuth 2.0 Authentication
POST https://api-satusehat.kemkes.go.id/oauth2/v1/accesstoken
Body: {
  client_id: "xxx",
  client_secret: "xxx"
}
Response: {
  access_token: "xxx",
  expires_in: 3600
}

// Create Patient
POST https://api-satusehat.kemkes.go.id/fhir-r4/v1/Patient
Headers: {
  Authorization: "Bearer xxx",
  Content-Type: "application/json"
}
Body: SatuSehatPatient
Response: {
  resourceType: "Patient",
  id: "IHS-NUMBER",
  ...
}

// Search Patient by NIK
GET https://api-satusehat.kemkes.go.id/fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik|3201234567890123
Response: {
  resourceType: "Bundle",
  entry: [...]
}
```

**Implementation Strategy**:
```typescript
// Queue-based submission
interface SatuSehatQueue {
  id: string;
  resourceType: 'Patient' | 'Encounter' | 'Observation' | 'MedicationAdministration';
  action: 'create' | 'update';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  processedAt?: Date;
}

// Background job processes queue every 5 minutes
async function processSatuSehatQueue() {
  const pending = await getPendingQueueItems();
  
  for (const item of pending) {
    try {
      await submitToSatuSehat(item);
      await markAsCompleted(item.id);
    } catch (error) {
      await handleError(item.id, error);
    }
  }
}
```

**Test Cases**:
- TC-SS-001: Register new patient successfully
- TC-SS-002: Detect existing patient by NIK
- TC-SS-003: Update patient demographics
- TC-SS-004: Queue failed submissions
- TC-SS-005: Retry failed submissions

---

### Feature 9.2: Encounter Reporting
**Priority**: P2 (Medium)

**User Stories**:
- As system, I want to report patient encounters to SATUSEHAT

**Acceptance Criteria**:
- [ ] Create Encounter resource when medical record completed
- [ ] Link to Patient IHS number
- [ ] Include diagnosis codes
- [ ] Include procedure codes if applicable
- [ ] Queue for submission
- [ ] Track submission status

**FHIR Encounter Resource**:
```typescript
interface SatuSehatEncounter {
  resourceType: "Encounter";
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/encounter/" + organizationId;
      value: string; // Internal appointment ID
    }
  ];
  status: "finished";
  class: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode";
    code: "AMB"; // Ambulatory (outpatient)
    display: "ambulatory";
  };
  subject: {
    reference: "Patient/" + ihsNumber;
    display: string; // Patient name
  };
  participant: [
    {
      type: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType";
              code: "ATND";
              display: "attender";
            }
          ];
        }
      ];
      individual: {
        reference: "Practitioner/" + doctorIHS;
        display: string; // Doctor name
      };
    }
  ];
  period: {
    start: string; // ISO datetime
    end: string;
  };
  location: [
    {
      location: {
        reference: "Location/" + locationIHS;
        display: string; // Clinic name
      };
    }
  ];
  diagnosis: [
    {
      condition: {
        reference: "Condition/" + conditionId;
        display: string; // Diagnosis text
      };
      use: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/diagnosis-role";
            code: "DD"; // Discharge diagnosis
            display: "Discharge diagnosis";
          }
        ];
      };
      rank: 1; // Primary diagnosis
    }
  ];
  statusHistory: [
    {
      status: "arrived";
      period: {
        start: string;
        end: string;
      };
    },
    {
      status: "in-progress";
      period: {
        start: string;
        end: string;
      };
    },
    {
      status: "finished";
      period: {
        start: string;
      };
    }
  ];
  serviceProvider: {
    reference: "Organization/" + organizationIHS;
  };
}
```

**API Endpoints**:
```typescript
POST /api/satusehat/encounter
Body: { medicalRecordId: string }
Response: { queueId: string }

GET /api/satusehat/queue/:id/status
Response: { 
  status: 'pending' | 'completed' | 'failed',
  ihsEncounterId?: string,
  error?: string
}
```

---

## Module 10: Reports & Analytics

### Feature 10.1: Daily Revenue Report
**Priority**: P1 (High)

**User Stories**:
- As admin, I want to see daily revenue summary

**Acceptance Criteria**:
- [ ] Select date
- [ ] Show total revenue
- [ ] Break down by payment method
- [ ] Show patient count
- [ ] Show BPJS vs non-BPJS revenue
- [ ] Export to PDF and Excel

**Report Layout**:
```
┌─────────────────────────────────────────────┐
│  LAPORAN PENDAPATAN HARIAN                   │
│  Tanggal: 17 November 2025                   │
├─────────────────────────────────────────────┤
│  RINGKASAN                                   │
│  Total Pendapatan    : Rp 5.450.000         │
│  Jumlah Pasien       : 24 orang             │
│  Rata-rata/Pasien    : Rp   227.083         │
│                                              │
│  BERDASARKAN JENIS PASIEN                    │
│  BPJS                : Rp 2.100.000 (12)    │
│  Umum/Pribadi        : Rp 3.350.000 (12)    │
│                                              │
│  BERDASARKAN METODE PEMBAYARAN               │
│  Tunai               : Rp 1.500.000         │
│  QRIS                : Rp 2.250.000         │
│  Debit Card          : Rp   900.000         │
│  E-Wallet            : Rp   800.000         │
│  BPJS                : Rp 2.100.000         │
│                                              │
│  RINCIAN LAYANAN                             │
│  Konsultasi          : Rp 3.600.000 (24)    │
│  Obat-obatan         : Rp 1.550.000         │
│  Tindakan            : Rp   300.000         │
│                                              │
│  TAGIHAN OUTSTANDING                         │
│  Belum Lunas         : Rp   150.000 (2)     │
│                                              │
│  [Export PDF]  [Export Excel]                │
└─────────────────────────────────────────────┘
```

**SQL Query**:
```sql
SELECT 
  DATE(b.billing_date) as date,
  COUNT(DISTINCT b.patient_id) as patient_count,
  SUM(b.total_amount) as total_revenue,
  SUM(CASE WHEN p.payment_method = 'bpjs' THEN p.amount ELSE 0 END) as bpjs_revenue,
  SUM(CASE WHEN p.payment_method != 'bpjs' THEN p.amount ELSE 0 END) as non_bpjs_revenue,
  SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END) as cash_revenue,
  SUM(CASE WHEN p.payment_method = 'qris' THEN p.amount ELSE 0 END) as qris_revenue
FROM billings b
LEFT JOIN payments p ON b.id = p.billing_id
WHERE DATE(b.billing_date) = $1
GROUP BY DATE(b.billing_date);
```

**API Endpoints**:
```typescript
GET /api/reports/daily-revenue?date=YYYY-MM-DD
Response: { report: DailyRevenueReport }

GET /api/reports/daily-revenue/pdf?date=YYYY-MM-DD
Response: PDF file

GET /api/reports/daily-revenue/excel?date=YYYY-MM-DD
Response: Excel file
```

---

### Feature 10.2: Top Diagnoses Report
**Priority**: P2 (Medium)

**User Stories**:
- As doctor/admin, I want to see most common diagnoses

**Acceptance Criteria**:
- [ ] Select date range
- [ ] Show top 10 diagnoses
- [ ] Include ICD-10 codes
- [ ] Show patient count per diagnosis
- [ ] Show percentage
- [ ] Visualize with chart

**Report Layout**:
```
┌─────────────────────────────────────────────┐
│  10 DIAGNOSIS TERBANYAK                      │
│  Periode: 1-30 November 2025                 │
├─────────────────────────────────────────────┤
│  1. H66.9 - Otitis Media                     │
│     45 pasien (25.7%) ███████████           │
│                                              │
│  2. J30.1 - Rhinitis Alergi                  │
│     38 pasien (21.7%) █████████             │
│                                              │
│  3. H65.0 - Otitis Media Serosa              │
│     22 pasien (12.6%) ██████                │
│                                              │
│  4. J02.9 - Faringitis Akut                  │
│     18 pasien (10.3%) █████                 │
│                                              │
│  5. H81.0 - Penyakit Meniere                 │
│     15 pasien (8.6%) ████                   │
│                                              │
│  6. J34.2 - Deviasi Septum Nasal             │
│     12 pasien (6.9%) ███                    │
│                                              │
│  7. H92.0 - Otalgia (Nyeri Telinga)          │
│     10 pasien (5.7%) ███                    │
│                                              │
│  8. J31.0 - Rhinitis Kronis                  │
│     8 pasien (4.6%) ██                      │
│                                              │
│  9. H61.2 - Serumen Obturans                 │
│     6 pasien (3.4%) ██                      │
│                                              │
│  10. J03.9 - Tonsilitis Akut                 │
│      5 pasien (2.9%) █                      │
│                                              │
│  Total: 175 diagnosis pada 179 kunjungan    │
│                                              │
│  [Export PDF]  [Export Excel]                │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
```typescript
GET /api/reports/top-diagnoses?startDate=xxx&endDate=xxx&limit=10
Response: { 
  diagnoses: Array<{
    icd10Code: string,
    nameIndonesian: string,
    count: number,
    percentage: number
  }>,
  totalDiagnoses: number,
  totalVisits: number
}
```

---

## Summary of All Features

### Priority P0 (Critical - MVP Phase 1)
1. ✅ User Authentication & Authorization
2. ✅ Patient Registration & Search
3. ✅ Appointment Scheduling & Check-in
4. ✅ Medical Records (SOAP format)
5. ✅ Prescription Management
6. ✅ Billing & Payment Processing
7. ✅ QRIS Payment Integration

### Priority P1 (High - MVP Phase 2)
8. ✅ Inventory Management (Master Data, Stock Monitoring, Adjustment)
9. ✅ BPJS Integration (Eligibility, SEP Creation)
10. ✅ Daily Revenue Report
11. ✅ Patient Medical History View
12. ✅ Invoice & Receipt Generation

### Priority P2 (Medium - Post-MVP)
13. ✅ SATUSEHAT Integration (Patient Registration, Encounter Reporting)
14. ✅ Top Diagnoses Report
15. ✅ Monthly Financial Summary
16. ✅ Medication Usage Report
17. ✅ Inventory Valuation Report

### Priority P3 (Low - Future Enhancement)
18. WhatsApp Notifications
19. SMS Appointment Reminders
20. Patient Portal
21. Telemedicine Module
22. Multi-clinic Management
23. Advanced Analytics Dashboard
24. API for Third-party Integration

---

**Next Document**: Technical Architecture Document