# Queue System Implementation Plan
**Document Type**: Technical Implementation Plan  
**Date**: November 3, 2025  
**Version**: 1.0  
**Status**: Approved for Implementation

---

## Executive Summary

This document outlines the complete implementation plan for a unified queue management system that properly supports both scheduled appointments and walk-in patients without technical debt or workarounds.

**Goals**:
- ✅ Eliminate "virtual appointment" workaround for walk-ins
- ✅ Single unified queue for appointments and walk-ins
- ✅ Clean database design with proper separation of concerns
- ✅ Scalable architecture for future features
- ✅ Maintain backward compatibility with existing data

**Timeline**: 3-4 days (including testing)

---

## Table of Contents

1. [Current System Analysis](#1-current-system-analysis)
2. [Proposed Architecture](#2-proposed-architecture)
3. [Database Design](#3-database-design)
4. [API Design](#4-api-design)
5. [UI/UX Changes](#5-uiux-changes)
6. [Implementation Phases](#6-implementation-phases)
7. [Migration Strategy](#7-migration-strategy)
8. [Testing Plan](#8-testing-plan)
9. [Rollback Plan](#9-rollback-plan)

---

## 1. Current System Analysis

### 1.1 Current Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Current System                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Appointments Table                                  │
│  ├─ id, patient_id, doctor_id                       │
│  ├─ appointment_date, appointment_time              │
│  ├─ status, queue_number                            │
│  └─ notes, created_at                               │
│                                                      │
│  Problem: Walk-ins need fake appointments!          │
│                                                      │
│  Medical Records Table                               │
│  ├─ id, patient_id, doctor_id                       │
│  ├─ appointment_id (can be NULL)                    │
│  ├─ diagnosis, treatment, etc.                      │
│  └─ ✅ Already supports walk-ins                    │
└─────────────────────────────────────────────────────┘
```

### 1.2 Current Workflow Issues

**Problem 1**: Walk-in patients require creating fake appointments
```
Walk-in → Create appointment → Check-in → Queue
          ❌ Unnecessary step
```

**Problem 2**: Queue number stored in appointments table
- Appointments table is overloaded (both scheduling and queue)
- Queue logic mixed with appointment logic

**Problem 3**: No clear distinction in queue display
- Cannot easily identify walk-ins vs appointments
- Reporting is confusing

### 1.3 What Works Well ✅

- Medical records already support `appointment_id = NULL`
- Queue number generation logic is sound
- Billing works independently of appointments
- RLS policies are properly set up

---

## 2. Proposed Architecture

### 2.1 Conceptual Model

```
┌─────────────────────────────────────────────────────┐
│              New Unified Queue System                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Appointments Table (Scheduling Only)                │
│  ├─ id, patient_id, doctor_id                       │
│  ├─ appointment_date, appointment_time              │
│  ├─ status (scheduled/completed/cancelled)          │
│  └─ notes, created_at                               │
│      ⬇️ (when checked in)                            │
│                                                      │
│  Queue Entries Table (Unified Queue)                 │
│  ├─ id, patient_id, doctor_id                       │
│  ├─ appointment_id (nullable - links if from appt)  │
│  ├─ queue_date, queue_number                        │
│  ├─ entry_type (appointment/walk-in)                │
│  ├─ status (waiting/in_progress/completed)          │
│  ├─ check_in_time, notes                            │
│  └─ ✅ Single source of truth for queue             │
│      ⬇️ (doctor examines)                            │
│                                                      │
│  Medical Records Table                               │
│  ├─ queue_entry_id (links to queue)                 │
│  ├─ appointment_id (optional - for reporting)       │
│  ├─ patient_id, doctor_id                           │
│  └─ diagnosis, treatment, etc.                      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Key Design Principles

1. **Separation of Concerns**:
   - `appointments` = Scheduling system only
   - `queue_entries` = Queue management only
   - `medical_records` = Clinical documentation only

2. **Single Source of Truth**:
   - Queue state lives in `queue_entries` only
   - No duplicate queue information in appointments

3. **Unified Queue**:
   - Both appointments and walk-ins create queue entries
   - Same queue number sequence
   - Same workflow for doctors

4. **Traceability**:
   - Walk-ins: `appointment_id = NULL`
   - Appointments: `appointment_id` links back to scheduling
   - Medical records link to both queue and appointment (if exists)

---

## 3. Database Design

### 3.1 New Table: `queue_entries`

```sql
CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient & Doctor
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Queue Information
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  queue_number INTEGER NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('appointment', 'walk-in')),
  
  -- Link to appointment (if from scheduled appointment)
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  
  -- Timestamps
  check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Additional info
  chief_complaint TEXT, -- What patient says when checking in
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(queue_date, doctor_id, queue_number),
  
  -- Check: appointment entries must have appointment_id
  CONSTRAINT check_appointment_has_id 
    CHECK (entry_type != 'appointment' OR appointment_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_queue_entries_date_status 
  ON queue_entries(queue_date, status);

CREATE INDEX idx_queue_entries_doctor_date 
  ON queue_entries(doctor_id, queue_date, queue_number);

CREATE INDEX idx_queue_entries_patient 
  ON queue_entries(patient_id, queue_date);

CREATE INDEX idx_queue_entries_appointment 
  ON queue_entries(appointment_id) WHERE appointment_id IS NOT NULL;

-- Comments
COMMENT ON TABLE queue_entries IS 
  'Unified queue system for both scheduled appointments and walk-in patients';

COMMENT ON COLUMN queue_entries.entry_type IS 
  'appointment = checked-in from scheduled appointment, walk-in = patient without appointment';

COMMENT ON COLUMN queue_entries.appointment_id IS 
  'Links to appointment if this queue entry originated from a scheduled appointment. NULL for walk-ins.';
```

### 3.2 Modified Table: `appointments`

```sql
-- Remove queue_number from appointments (moved to queue_entries)
ALTER TABLE appointments DROP COLUMN IF EXISTS queue_number;

-- Update status to only track appointment lifecycle
-- Status values: scheduled, cancelled, completed
-- (no more 'checked_in' or 'in_progress' - those are in queue_entries)

COMMENT ON COLUMN appointments.status IS 
  'Appointment lifecycle: scheduled (future), completed (done), cancelled (not attended). 
   Check-in status tracked in queue_entries table.';
```

### 3.3 Modified Table: `medical_records`

```sql
-- Add queue_entry_id to link medical record to queue
ALTER TABLE medical_records 
ADD COLUMN queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL;

-- Keep appointment_id for backward compatibility and reporting
-- appointment_id can be NULL (walk-ins) or populated (appointments)

CREATE INDEX idx_medical_records_queue_entry 
  ON medical_records(queue_entry_id);

COMMENT ON COLUMN medical_records.queue_entry_id IS 
  'Links to the queue entry this medical record was created from';

COMMENT ON COLUMN medical_records.appointment_id IS 
  'Optional link to appointment. NULL for walk-ins. Used for reporting and traceability.';
```

### 3.4 RLS Policies for `queue_entries`

```sql
-- Enable RLS
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view queue entries for their assigned doctor
CREATE POLICY "Users can view their doctor's queue"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'front_desk')
    )
  );

-- Policy: Users can create queue entries
CREATE POLICY "Authorized users can create queue entries"
  ON queue_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('doctor', 'admin', 'front_desk')
    )
  );

-- Policy: Users can update their own queue entries
CREATE POLICY "Users can update their queue entries"
  ON queue_entries FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'front_desk')
    )
  );

-- Policy: Only admins can delete
CREATE POLICY "Admins can delete queue entries"
  ON queue_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

---

## 4. API Design

### 4.1 POST `/api/queue/walk-in`

**Purpose**: Check in a walk-in patient and add to queue

**Request**:
```json
{
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "chief_complaint": "Telinga sakit sejak 2 hari",
  "notes": "BPJS patient"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "queue_entry_id": "uuid",
    "queue_number": 5,
    "queue_date": "2025-11-03",
    "entry_type": "walk-in",
    "patient": {
      "full_name": "Ahmad Rizki",
      "medical_record_number": "MR-20251101-001"
    },
    "doctor": {
      "full_name": "Dr. Sarah Wijaya"
    }
  }
}
```

**Logic**:
1. Validate patient exists
2. Validate doctor exists and is available
3. Generate next queue number (count + 1 for that doctor/date)
4. Create queue_entry with `entry_type = 'walk-in'`
5. Return queue information

### 4.2 POST `/api/queue/check-in-appointment`

**Purpose**: Check in a scheduled appointment

**Request**:
```json
{
  "appointment_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "queue_entry_id": "uuid",
    "queue_number": 3,
    "queue_date": "2025-11-03",
    "entry_type": "appointment",
    "appointment": {
      "id": "uuid",
      "appointment_time": "08:00:00"
    },
    "patient": {
      "full_name": "Siti Aminah",
      "medical_record_number": "MR-20251028-045"
    }
  }
}
```

**Logic**:
1. Validate appointment exists and status = 'scheduled'
2. Check appointment hasn't already been checked in
3. Generate queue number
4. Create queue_entry with `entry_type = 'appointment'` and link to appointment
5. Update appointment status to 'checked_in' (or keep as 'scheduled')
6. Return queue information

### 4.3 GET `/api/queue?date=YYYY-MM-DD&doctor_id=uuid`

**Purpose**: Get queue for a specific doctor and date

**Response**:
```json
{
  "success": true,
  "data": {
    "queue_date": "2025-11-03",
    "doctor": {
      "id": "uuid",
      "full_name": "Dr. Sarah Wijaya"
    },
    "entries": [
      {
        "id": "uuid",
        "queue_number": 1,
        "entry_type": "appointment",
        "status": "waiting",
        "check_in_time": "2025-11-03T07:55:00Z",
        "appointment_time": "08:00",
        "patient": {
          "id": "uuid",
          "full_name": "Ahmad Rizki",
          "medical_record_number": "MR-20251101-001",
          "age": 35
        },
        "chief_complaint": "Kontrol rutin"
      },
      {
        "id": "uuid",
        "queue_number": 2,
        "entry_type": "walk-in",
        "status": "waiting",
        "check_in_time": "2025-11-03T08:10:00Z",
        "appointment_time": null,
        "patient": {
          "id": "uuid",
          "full_name": "Budi Santoso",
          "medical_record_number": "MR-20251015-012",
          "age": 42
        },
        "chief_complaint": "Telinga kanan sakit"
      }
    ],
    "summary": {
      "total": 5,
      "waiting": 3,
      "in_progress": 1,
      "completed": 1
    }
  }
}
```

### 4.4 PATCH `/api/queue/:id/status`

**Purpose**: Update queue entry status

**Request**:
```json
{
  "status": "in_progress" // or "completed" or "cancelled"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "in_progress",
    "started_at": "2025-11-03T08:15:00Z"
  }
}
```

---

## 5. UI/UX Changes

### 5.1 New Page: Walk-in Check-in (`/walk-in`)

**Location**: Main navigation, accessible by front desk and doctors

**Layout**:
```
┌────────────────────────────────────────────────────┐
│  Check-in Pasien Walk-in                           │
├────────────────────────────────────────────────────┤
│                                                    │
│  Langkah 1: Cari atau Daftar Pasien                │
│  ┌──────────────────────────────────────────────┐ │
│  │ [●] Pasien Lama    [○] Pasien Baru          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  {IF PASIEN LAMA}                                  │
│  🔍 Cari Pasien                                    │
│  [_______________________________________]          │
│  Cari berdasarkan nama, NIK, atau No. RM          │
│                                                    │
│  {Search Results Dropdown}                         │
│  ┌──────────────────────────────────────────────┐ │
│  │ ✓ Ahmad Rizki                                │ │
│  │   MR-20251101-001 | NIK: 32010198...         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  {IF PASIEN BARU}                                  │
│  [Tombol: Daftar Pasien Baru] → /patients/new     │
│                                                    │
│  ─────────────────────────────────────────────────│
│                                                    │
│  Langkah 2: Pilih Dokter & Detail                  │
│  Dokter: [Dr. Sarah Wijaya ▼]                     │
│                                                    │
│  Keluhan Utama:                                    │
│  [________________________________________]        │
│  Contoh: "Telinga kiri sakit sejak 2 hari"        │
│                                                    │
│  Catatan (opsional):                               │
│  [________________________________________]        │
│                                                    │
│  ─────────────────────────────────────────────────│
│                                                    │
│  📋 Ringkasan Check-in                             │
│  Pasien: Ahmad Rizki (MR-20251101-001)             │
│  Dokter: Dr. Sarah Wijaya                          │
│  Keluhan: Telinga kiri sakit sejak 2 hari          │
│  Estimasi antrian: #5 (3 pasien sebelumnya)        │
│                                                    │
│  [Batal]                    [Check-in Walk-in]     │
└────────────────────────────────────────────────────┘
```

**Features**:
- Real-time patient search with autocomplete
- Shows estimated queue position
- Quick link to register new patient
- Chief complaint capture at check-in
- Doctor selection with availability indicator

**Success Flow**:
```
Check-in → Show success message with queue number
         → Option to print queue ticket
         → Redirect to /queue or stay for next patient
```

### 5.2 Updated Page: Queue Display (`/queue`)

**Changes**:
- Fetch from `queue_entries` instead of `appointments`
- Show `entry_type` badge (Janji Temu / Walk-in)
- Show appointment time only for appointment types
- Show chief complaint for all entries

**Layout**:
```
┌────────────────────────────────────────────────────┐
│  Antrian Dr. Sarah Wijaya - 3 Nov 2025             │
│  ─────────────────────────────────────────────────│
│  Total: 5 pasien | Menunggu: 3 | Sedang diperiksa: 1│
│                                                    │
│  [Filter: ⚪ Semua  ⚫ Menunggu  ⚪ Selesai]        │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐ │
│  │ #1  [Janji Temu - 08:00]                     │ │
│  │ Ahmad Rizki • MR-20251101-001 • 35 tahun     │ │
│  │ Keluhan: Kontrol rutin                       │ │
│  │ Status: ✅ Menunggu (Check-in 07:55)          │ │
│  │                 [Mulai Pemeriksaan]          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ #2  [Walk-in]                                │ │
│  │ Budi Santoso • MR-20251015-012 • 42 tahun    │ │
│  │ Keluhan: Telinga kanan sakit                 │ │
│  │ Status: 🔵 Sedang Diperiksa (Mulai 08:05)    │ │
│  │                 [Lihat Rekam Medis]          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ #3  [Janji Temu - 08:15]                     │ │
│  │ Siti Aminah • MR-20251028-045 • 28 tahun     │ │
│  │ Keluhan: Pilek berkepanjangan                │ │
│  │ Status: ✅ Menunggu (Check-in 08:12)          │ │
│  │                 [Mulai Pemeriksaan]          │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Badge Colors**:
- 🟦 **[Janji Temu - XX:XX]** - Blue badge for appointments (shows time)
- 🟨 **[Walk-in]** - Yellow badge for walk-ins

**Status Icons**:
- ✅ Menunggu - Green checkmark
- 🔵 Sedang Diperiksa - Blue dot
- ✔️ Selesai - Gray checkmark

### 5.3 Updated Page: Appointments (`/appointments`)

**Changes**:
- Check-in button now creates queue_entry
- Shows "Sudah Check-in" badge if queue_entry exists
- Links to queue entry instead of just status change

**Status Flow**:
```
scheduled → [Check-in button]
         ↓
Queue entry created
         ↓
Show: "✓ Check-in" with queue number
Link to: /queue
```

### 5.4 Updated: Medical Records Form

**Changes**:
- Accepts `?queue_entry=uuid` parameter
- Pre-fills patient and doctor from queue entry
- Links medical record to both queue_entry and appointment (if exists)
- Shows entry type in header (Walk-in / Appointment)

**Header**:
```
┌────────────────────────────────────────────┐
│ Rekam Medis Baru                            │
│ [Walk-in] Ahmad Rizki • MR-20251101-001    │
│ Antrian #5 • Check-in: 08:10               │
│ Keluhan: Telinga kiri sakit sejak 2 hari  │
└────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Database & Backend (Day 1)

**Tasks**:
1. ✅ Create migration for `queue_entries` table
2. ✅ Update `appointments` table (remove queue_number, add booking_code)
3. ✅ Update `medical_records` table (add queue_entry_id)
4. ✅ Set up RLS policies
5. ✅ Create booking code generation function and trigger
6. ✅ Create API endpoint: POST `/api/queue/walk-in`
7. ✅ Create API endpoint: POST `/api/queue/check-in-appointment`
8. ✅ Create API endpoint: POST `/api/checkin/booking` (quick check-in)
9. ✅ Create API endpoint: GET `/api/queue`
10. ✅ Create API endpoint: PATCH `/api/queue/:id/status`

**Testing**:
- Test walk-in check-in via API
- Test appointment check-in via API
- Test queue retrieval
- Test RLS policies

### Phase 2: Walk-in UI (Day 2)

**Tasks**:
1. ✅ Create `/walk-in` page
2. ✅ Build patient search component with autocomplete
3. ✅ Implement doctor selection dropdown
4. ✅ Add chief complaint and notes fields
5. ✅ Integrate with POST `/api/queue/walk-in`
6. ✅ Add success message with queue number
7. ✅ Add navigation links

**Testing**:
- Test walk-in check-in flow
- Test patient search
- Test error handling

### Phase 3: Queue Display Update (Day 2-3)

**Tasks**:
1. ✅ Update queue page to fetch from `queue_entries`
2. ✅ Add entry_type badges
3. ✅ Update status indicators
4. ✅ Add chief complaint display
5. ✅ Update "Mulai Pemeriksaan" link to pass queue_entry_id
6. ✅ Add filters (all/waiting/completed)

**Testing**:
- Test unified queue display
- Test appointment and walk-in entries show correctly
- Test status updates

### Phase 4: Appointments Integration (Day 3)

**Tasks**:
1. ✅ Update appointments check-in to use new API
2. ✅ Remove queue_number logic from appointments page
3. ✅ Add link to queue after check-in
4. ✅ Update success messages

**Testing**:
- Test appointment check-in creates queue entry
- Test queue number generation
- Test navigation to queue

### Phase 5: Medical Records Update (Day 3-4)

**Tasks**:
1. ✅ Update medical record form to accept queue_entry_id
2. ✅ Pre-fill data from queue entry
3. ✅ Link medical record to queue_entry
4. ✅ Update completion logic to mark queue as completed
5. ✅ Show entry type in form header

**Testing**:
- Test medical record creation from appointment queue
- Test medical record creation from walk-in queue
- Test queue status updates after completion

### Phase 6: Documentation & Testing (Day 4)

**Tasks**:
1. ✅ Update technical documentation
2. ✅ Update front desk workflow docs
3. ✅ Update user guides
4. ✅ End-to-end testing
5. ✅ Performance testing
6. ✅ User acceptance testing

---

## 7. Migration Strategy

### 7.1 Data Migration Plan

**Objective**: Migrate existing appointments with queue_number to new queue_entries table

**Migration Script**:
```sql
-- Step 1: Create queue_entries from checked-in appointments
INSERT INTO queue_entries (
  patient_id,
  doctor_id,
  queue_date,
  queue_number,
  entry_type,
  appointment_id,
  status,
  check_in_time,
  created_at
)
SELECT 
  patient_id,
  doctor_id,
  appointment_date as queue_date,
  queue_number,
  'appointment' as entry_type,
  id as appointment_id,
  CASE 
    WHEN status = 'checked_in' THEN 'waiting'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status = 'completed' THEN 'completed'
    ELSE 'completed'
  END as status,
  created_at as check_in_time, -- Approximate
  created_at
FROM appointments
WHERE queue_number IS NOT NULL
  AND appointment_date >= CURRENT_DATE - INTERVAL '7 days'; -- Only recent

-- Step 2: Link medical records to queue entries
UPDATE medical_records mr
SET queue_entry_id = qe.id
FROM queue_entries qe
WHERE mr.appointment_id = qe.appointment_id
  AND qe.entry_type = 'appointment';

-- Step 3: Update appointment statuses
UPDATE appointments
SET status = 'completed'
WHERE status IN ('checked_in', 'in_progress')
  AND appointment_date < CURRENT_DATE;

-- Step 4: Remove queue_number from appointments (in separate migration)
-- ALTER TABLE appointments DROP COLUMN queue_number;
```

### 7.2 Rollback Procedure

If migration fails:

```sql
-- Restore queue_number to appointments from queue_entries
UPDATE appointments a
SET queue_number = qe.queue_number
FROM queue_entries qe
WHERE a.id = qe.appointment_id;

-- Delete queue_entries
TRUNCATE TABLE queue_entries CASCADE;

-- Remove queue_entry_id from medical_records
UPDATE medical_records
SET queue_entry_id = NULL;
```

### 7.3 Backward Compatibility

**During Transition**:
- Keep queue_number in appointments for 1 week
- Both systems work in parallel
- Gradually switch frontend to use queue_entries
- Monitor for issues

**After Transition**:
- Remove queue_number column
- Remove old queue logic
- Full switch to new system

---

## 8. Testing Plan

### 8.1 Unit Tests

**Database**:
- ✅ Queue entry creation
- ✅ Queue number generation (sequential)
- ✅ Unique constraint enforcement
- ✅ RLS policies
- ✅ Foreign key constraints

**API**:
- ✅ Walk-in check-in endpoint
- ✅ Appointment check-in endpoint
- ✅ Queue retrieval endpoint
- ✅ Status update endpoint
- ✅ Error handling

### 8.2 Integration Tests

**Scenario 1: Scheduled Appointment Flow**
```
1. Create appointment (status: scheduled)
2. Check-in appointment → Creates queue entry
3. Verify queue entry exists with entry_type = 'appointment'
4. Verify queue number assigned
5. Doctor starts examination → Status = 'in_progress'
6. Create medical record → Links to queue entry
7. Complete examination → Status = 'completed'
```

**Scenario 2: Walk-in Patient Flow**
```
1. Search/register patient
2. Check-in as walk-in → Creates queue entry
3. Verify queue entry with entry_type = 'walk-in'
4. Verify no appointment_id
5. Verify queue number assigned
6. Doctor examines and creates medical record
7. Complete examination
```

**Scenario 3: Mixed Queue**
```
1. Check-in 2 appointments (08:00, 08:15)
2. Check-in 1 walk-in
3. Check-in 1 more appointment (08:30)
4. Check-in 1 more walk-in
5. Verify queue shows all 5 in order
6. Verify queue numbers are 1, 2, 3, 4, 5
7. Verify badges show correctly
```

### 8.3 End-to-End Tests

**Test Case 1**: Complete appointment patient journey
**Test Case 2**: Complete walk-in patient journey
**Test Case 3**: Multiple patients same time
**Test Case 4**: BPJS walk-in patient
**Test Case 5**: Patient cancellation

### 8.4 Performance Tests

- ✅ Queue retrieval with 50+ entries
- ✅ Concurrent check-ins (10 simultaneous)
- ✅ Queue number generation under load
- ✅ Search performance with 10,000+ patients

### 8.5 User Acceptance Tests

**Front Desk**:
- Can check-in walk-ins easily?
- Can find patients quickly?
- Understands queue display?

**Doctors**:
- Can see unified queue?
- Can distinguish appointment vs walk-in?
- Medical record form is clear?

---

## 9. Rollback Plan

### 9.1 Rollback Triggers

**Trigger rollback if**:
- Migration fails with data corruption
- Critical bugs in queue management
- Performance degrades significantly
- User feedback is overwhelmingly negative

### 9.2 Rollback Steps

**Step 1**: Stop new queue entries creation
```sql
-- Revoke INSERT permission temporarily
REVOKE INSERT ON queue_entries FROM authenticated;
```

**Step 2**: Restore appointments queue logic
```sql
-- Restore queue_number from queue_entries
UPDATE appointments a
SET queue_number = qe.queue_number
FROM queue_entries qe
WHERE a.id = qe.appointment_id;
```

**Step 3**: Revert frontend
- Deploy previous version from git
- Switch back to old appointment check-in logic

**Step 4**: Keep queue_entries for audit
- Don't drop table
- Keep data for analysis
- Investigate issues

### 9.3 Post-Rollback Analysis

- Identify root cause
- Fix issues
- Test thoroughly
- Re-attempt migration

---

## 10. Success Metrics

### 10.1 Technical Metrics

- ✅ Zero data loss during migration
- ✅ < 200ms queue retrieval time
- ✅ 100% uptime during transition
- ✅ All tests passing

### 10.2 User Metrics

- ✅ Walk-in check-in time < 30 seconds
- ✅ Zero front desk confusion incidents
- ✅ Positive user feedback
- ✅ No workflow disruption

### 10.3 Business Metrics

- ✅ Walk-in patients properly tracked
- ✅ Accurate reporting (appointment vs walk-in)
- ✅ Queue management efficiency improved
- ✅ Staff satisfaction increased

---

## 11. Future Enhancements

### Phase 2+ Features

**Queue Management**:
- Priority queue (emergency cases)
- Queue position updates via SMS
- Estimated wait time calculation
- Queue transfer (change doctor)

**Analytics**:
- Walk-in vs appointment ratio
- Peak hours analysis
- Doctor utilization rates
- Average wait time tracking

**Patient Experience**:
- Digital queue display screen
- Queue position tracking for patients
- SMS notifications when near their turn
- Online queue check

**Integration**:
- Integration with BPJS bridging system
- Integration with pharmacy for prescription
- Integration with lab for test orders
- Mobile app for patients

---

## 12. Appendices

### Appendix A: API Examples

See section 4 for detailed API specifications.

### Appendix B: Database Schema

See section 3 for complete schema definitions.

### Appendix C: UI Mockups

See section 5 for detailed UI specifications.

### Appendix D: Migration Scripts

All migration scripts will be in:
`Apps/web/supabase/migrations/20250103XXXXXX_*.sql`

---

**Document Status**: ✅ Ready for Implementation  
**Approved By**: [To be filled]  
**Start Date**: [To be filled]  
**Target Completion**: [To be filled]

---

**Change Log**:
- v1.0 (2025-11-03): Initial implementation plan created
