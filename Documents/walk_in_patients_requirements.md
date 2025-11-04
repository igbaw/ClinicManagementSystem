# Walk-in Patient Requirements
**Document Type**: Requirements Addendum  
**Date**: November 3, 2025  
**Version**: 1.0  
**Status**: Approved

## Overview

This document specifies requirements for handling walk-in patients (patients who arrive without prior appointments). This is a common scenario in Indonesian clinics and must be properly supported.

---

## 1. Definition

**Walk-in Patient**: A patient who arrives at the clinic without a scheduled appointment and requests immediate consultation.

**Characteristics**:
- No prior appointment in the system
- May be new patient (first visit) or returning patient
- Requires immediate queue placement
- Should follow same medical record documentation standards

---

## 2. Functional Requirements

### FR-WI-001: Walk-in Patient Registration
**Priority**: P0 (Critical)

**Description**: System shall allow front desk to register walk-in patients without creating an appointment first.

**Acceptance Criteria**:
- [ ] Front desk can register new walk-in patient directly
- [ ] System marks visit as "walk-in" (no appointment_id)
- [ ] Patient receives queue number immediately after registration
- [ ] Walk-in patients appear in doctor's queue alongside appointment patients

**User Story**:
> As front desk staff, I want to register walk-in patients quickly so that they can join the queue without needing a formal appointment.

### FR-WI-002: Walk-in Patient Check-in
**Priority**: P0 (Critical)

**Description**: System shall support immediate check-in for walk-in patients.

**Acceptance Criteria**:
- [ ] Front desk can check-in walk-in patients directly
- [ ] System generates queue number for walk-in patients
- [ ] Walk-in queue number follows same sequence as appointment patients
- [ ] Doctor sees all patients (appointment + walk-in) in single unified queue

**User Story**:
> As front desk staff, I want to check-in walk-in patients immediately so that they don't have to wait longer than necessary.

### FR-WI-003: Walk-in Medical Records
**Priority**: P0 (Critical)

**Description**: Doctors shall create medical records for walk-in patients without linked appointments.

**Acceptance Criteria**:
- [ ] Medical records can be created with `appointment_id = NULL`
- [ ] Medical record stores `patient_id` and `visit_date`
- [ ] Multiple walk-in visits allowed per patient per day (different times)
- [ ] Walk-in medical records follow same SOAP format
- [ ] Walk-in records appear in patient's medical history

**User Story**:
> As a doctor, I want to document walk-in patient examinations the same way as scheduled appointments so that medical records are consistent.

### FR-WI-004: Walk-in Billing
**Priority**: P0 (Critical)

**Description**: System shall generate bills for walk-in patients.

**Acceptance Criteria**:
- [ ] Bills can be created without linked appointment
- [ ] Walk-in patients can use BPJS (if SEP generated)
- [ ] Walk-in patients can pay cash or other methods
- [ ] Receipt generation works for walk-in patients

**User Story**:
> As front desk staff, I want to bill walk-in patients the same way as appointment patients so that payment processing is consistent.

---

## 3. Workflow

### Scenario 1: New Walk-in Patient

```
┌──────────────────────────────────────────┐
│ Patient arrives without appointment      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Front Desk: Register new patient         │
│ - Capture demographics (NIK, name, etc)  │
│ - Mark as walk-in visit                  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ System: Generate queue number            │
│ - Add to doctor's queue                  │
│ - Status: "checked_in"                   │
│ - No appointment_id (NULL)               │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Patient waits in queue                   │
│ - Sees queue number on display           │
│ - Waits for doctor to call               │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Doctor: Examine & document               │
│ - Create medical record (no appointment) │
│ - Write prescription if needed           │
│ - Complete examination                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Front Desk: Process payment              │
│ - Generate bill                          │
│ - Accept payment                         │
│ - Print receipt                          │
└──────────────────────────────────────────┘
```

### Scenario 2: Returning Patient Walk-in

```
┌──────────────────────────────────────────┐
│ Returning patient arrives (has MR #)     │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Front Desk: Search existing patient      │
│ - Search by name, NIK, or MR number      │
│ - Confirm patient identity               │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Front Desk: Create walk-in visit         │
│ - Link to existing patient record        │
│ - Generate queue number                  │
│ - Add to queue (no appointment)          │
└──────────────┬───────────────────────────┘
               │
               ▼
      (Continue same as new walk-in)
```

---

## 4. Database Schema Requirements

### Walk-in Queue Table (New)

```sql
CREATE TABLE walk_in_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  queue_number INTEGER NOT NULL,
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(queue_date, queue_number)
);
```

**Alternative Approach** (Recommended):
- Reuse existing `appointments` table
- Allow `appointment_date` + `appointment_time` to be NULL for walk-ins
- Use `status = 'checked_in'` to indicate active walk-in
- No schema changes needed

### Medical Records for Walk-ins

**Current Schema**: ✅ Already supports walk-ins
```sql
CREATE TABLE medical_records (
  -- ...
  appointment_id UUID REFERENCES appointments(id), -- Can be NULL
  -- ...
);
```

**Constraint**: 
- Unique constraint only applies when `appointment_id IS NOT NULL`
- Walk-ins can have multiple medical records (different visits)

---

## 5. UI/UX Requirements

### 5.1 Walk-in Check-in Form

**Location**: New page `/walk-in-checkin` or `/patients/walk-in`

**Fields**:
```
┌──────────────────────────────────────────┐
│  Check-in Pasien Walk-in                 │
├──────────────────────────────────────────┤
│                                          │
│  [●] Pasien Baru   [○] Pasien Lama      │
│                                          │
│  Search Pasien (jika lama):              │
│  🔍 [Cari nama, NIK, atau No. RM...]    │
│                                          │
│  Pilih Dokter: [Dr. Sarah Wijaya ▼]     │
│                                          │
│  Catatan (opsional):                     │
│  [____________________________]          │
│                                          │
│  [Batal]           [Check-in]            │
└──────────────────────────────────────────┘
```

### 5.2 Queue Display

**Unified Queue**: Shows both appointment and walk-in patients

```
┌──────────────────────────────────────────┐
│  Antrian Dr. Sarah Wijaya - 3 Nov 2025   │
├──────────────────────────────────────────┤
│  #1  08:00  Ahmad Rizki       [Janji]    │
│  #2  08:15  Siti Aminah       [Janji]    │
│  #3  --:--  Budi Santoso      [Walk-in]  │
│  #4  08:30  Linda Wijaya      [Janji]    │
│  #5  --:--  Joko Susilo       [Walk-in]  │
└──────────────────────────────────────────┘
```

**Legend**:
- `[Janji]` = Scheduled appointment
- `[Walk-in]` = Walk-in patient
- Time shown for appointments, `--:--` for walk-ins

---

## 6. Business Rules

### BR-WI-001: Queue Number Assignment
- Walk-ins receive next available queue number
- Queue numbers are sequential per day per doctor
- Walk-ins and appointments share same queue sequence

### BR-WI-002: Priority
- Appointments have priority over walk-ins at scheduled time
- Walk-ins serve in order of check-in (FIFO)
- Doctor can see all patients in queue order

### BR-WI-003: Multiple Walk-ins
- Same patient can have multiple walk-in visits per day
- Each visit is separate (different medical record)
- Useful for follow-up or different complaints

### BR-WI-004: BPJS for Walk-ins
- Walk-in patients can use BPJS
- Must generate SEP at check-in time
- SEP required before examination starts

---

## 7. Implementation Phases

### Phase 1 (MVP) - Basic Walk-in Support
**Status**: ✅ Already Supported (unintentionally)

- [x] Medical records can be created without appointments
- [x] Database allows `appointment_id = NULL`
- [x] Queue system works with or without appointments

**What's Missing**:
- [ ] UI for walk-in check-in
- [ ] Clear labeling in queue (appointment vs walk-in)
- [ ] Walk-in patient selection workflow

### Phase 2 - Enhanced Walk-in Experience
**Timeline**: Post-MVP

- [ ] Dedicated walk-in check-in page
- [ ] Walk-in vs appointment indicators in queue
- [ ] Walk-in statistics in reports
- [ ] Walk-in patient analytics

### Phase 3 - Advanced Features
**Timeline**: Future

- [ ] Walk-in appointment conversion (schedule follow-up)
- [ ] Walk-in patient trends analysis
- [ ] Peak hour predictions based on walk-ins
- [ ] SMS notifications for walk-in queue position

---

## 8. Testing Requirements

### Test Scenarios

**TS-WI-001**: New walk-in patient registration and queue
- Register new patient as walk-in
- Verify queue number assigned
- Verify appears in doctor's queue
- Complete medical record without appointment

**TS-WI-002**: Returning patient walk-in
- Search existing patient
- Check-in as walk-in
- Verify multiple medical records per day allowed
- Verify medical history shows all visits

**TS-WI-003**: Mixed queue (appointments + walk-ins)
- Schedule 2 appointments for 08:00 and 08:30
- Add 2 walk-ins at 08:10 and 08:20
- Verify queue shows all 4 patients
- Verify sequential queue numbers

**TS-WI-004**: Walk-in with BPJS
- Register walk-in BPJS patient
- Generate SEP
- Create medical record
- Process BPJS billing

---

## 9. Migration from Current State

### Current Implementation
✅ System already supports walk-ins technically:
- `appointment_id` can be NULL in medical_records
- Queue system doesn't require appointments
- Billing works without appointments

### Required Changes

**High Priority**:
1. Add walk-in check-in UI
2. Add walk-in indicator in queue display
3. Update documentation for users

**Medium Priority**:
1. Add walk-in statistics to reports
2. Add walk-in filters to medical records list
3. Track walk-in vs appointment metrics

**Low Priority**:
1. Walk-in specific templates
2. Walk-in patient follow-up suggestions
3. Walk-in peak hour analysis

---

## 10. References

- **Related Requirements**: FR-AM (Appointment Management), FR-MR (Medical Records)
- **Related Features**: Feature 3.1 (Schedule Appointment), Feature 3.2 (Check-In)
- **Database**: `medical_records` table, `appointments` table (optional for walk-ins)
- **Regulations**: Same as regular patients (Permenkes 269/2008)

---

## 11. Acceptance Criteria Summary

For MVP completion, walk-in support is considered **complete** when:

- [ ] Front desk can check-in walk-in patients
- [ ] Walk-ins receive queue numbers
- [ ] Doctors can create medical records for walk-ins
- [ ] Billing works for walk-in patients
- [ ] Medical history shows walk-in visits
- [ ] Queue displays both appointment and walk-in patients clearly
- [ ] System prevents confusion between walk-ins and appointments

---

## Appendix A: Indonesian Terminology

- **Walk-in Patient**: "Pasien Walk-in" or "Pasien Tanpa Janji"
- **Queue**: "Antrian"
- **Check-in**: "Daftar" or "Check-in"
- **Visit**: "Kunjungan"
- **Appointment**: "Janji Temu"

---

**Document History**:
- v1.0 (2025-11-03): Initial documentation for walk-in patient support
