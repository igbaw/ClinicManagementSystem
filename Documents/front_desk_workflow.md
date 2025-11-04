# Front Desk Complete Workflow
**Document Type**: Operational Workflow  
**Date**: November 3, 2025  
**Version**: 1.0  
**Target Users**: Front Desk Staff

---

## Overview

This document describes the complete workflow for front desk staff to handle all patient scenarios: scheduled appointments, walk-in patients, and online bookings (future).

---

## Daily Workflow Summary

```
┌─────────────────────────────────────────────────┐
│         Morning: Prepare for the Day            │
│  1. Login to system                             │
│  2. Review today's appointments                 │
│  3. Prepare patient files if needed             │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│      Throughout Day: Handle Patients            │
│                                                  │
│  ┌────────────────┐      ┌──────────────────┐  │
│  │  Appointments  │      │   Walk-ins       │  │
│  │  (scheduled)   │      │  (no schedule)   │  │
│  └────────────────┘      └──────────────────┘  │
│          │                        │             │
│          └────────┬───────────────┘             │
│                   ▼                             │
│          Unified Queue Management               │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│       End of Day: Closing Procedures            │
│  1. Review completed visits                     │
│  2. Check outstanding payments                  │
│  3. Prepare next day's appointments             │
└─────────────────────────────────────────────────┘
```

---

## Scenario 1: Scheduled Appointment Arrives

### Patient: "Saya ada janji jam 8 pagi dengan Dr. Sarah"

**Steps**:

```
1. Search Patient
   ┌─────────────────────────────────────┐
   │ Page: /appointments                 │
   │ View today's schedule               │
   │ Find patient's name in list         │
   └─────────────────────────────────────┘
           │
           ▼
2. Verify Identity
   ┌─────────────────────────────────────┐
   │ Confirm: Name, NIK, or MR number    │
   │ Check appointment time              │
   │ Verify with doctor assignment       │
   └─────────────────────────────────────┘
           │
           ▼
3. Check-in
   ┌─────────────────────────────────────┐
   │ Click "✓ Check-in" button           │
   │ System generates queue number       │
   │ Status: scheduled → checked_in      │
   │                                     │
   │ Result: "Ahmad berhasil check-in    │
   │         dengan nomor antrian 3"     │
   └─────────────────────────────────────┘
           │
           ▼
4. Inform Patient
   ┌─────────────────────────────────────┐
   │ Tell patient their queue number     │
   │ "Nomor antrian Anda: 3"             │
   │ "Silakan tunggu, akan dipanggil"   │
   └─────────────────────────────────────┘
```

**Result**:
- ✅ Patient status: `checked_in`
- ✅ Queue number assigned: e.g., #3
- ✅ Appears in doctor's queue
- ✅ Linked to appointment record

---

## Scenario 2: Walk-in Patient (Existing Patient)

### Patient: "Saya mau periksa, tidak ada janji. Saya pasien lama."

**Current Workaround** (until walk-in UI is built):

```
1. Search Patient
   ┌─────────────────────────────────────┐
   │ Page: /patients or search bar       │
   │ Search by: Name, NIK, or MR number  │
   │ Verify patient identity              │
   └─────────────────────────────────────┘
           │
           ▼
2. Create "Virtual" Appointment (Workaround)
   ┌─────────────────────────────────────┐
   │ Page: /appointments/new              │
   │ Select: Patient ✓                    │
   │ Select: Doctor (who's available)     │
   │ Date: Today                          │
   │ Time: Current time or next slot      │
   │ Notes: "Walk-in patient"             │
   │ Click: Create                        │
   └─────────────────────────────────────┘
           │
           ▼
3. Immediately Check-in
   ┌─────────────────────────────────────┐
   │ Back to /appointments                │
   │ Find the appointment just created    │
   │ Click "✓ Check-in" immediately       │
   │ Queue number assigned                │
   └─────────────────────────────────────┘
           │
           ▼
4. Inform Patient
   ┌─────────────────────────────────────┐
   │ "Nomor antrian Anda: 5"             │
   │ "Silakan tunggu dipanggil"          │
   └─────────────────────────────────────┘
```

**Alternative** (if doctor creates record directly):

```
1. Search & Note Patient Info
   ┌─────────────────────────────────────┐
   │ Search patient to get MR number     │
   │ Tell doctor: "Walk-in patient ready"│
   │ Give patient queue number (manual)  │
   └─────────────────────────────────────┘
           │
           ▼
2. Doctor Creates Medical Record
   ┌─────────────────────────────────────┐
   │ Doctor goes to medical record form  │
   │ Selects patient manually            │
   │ Leaves appointment field EMPTY      │
   │ Creates medical record              │
   └─────────────────────────────────────┘
```

**Result**:
- ✅ Patient in queue (either via appointment or direct)
- ✅ Queue number assigned
- ⚠️ Less ideal: requires workaround until walk-in UI exists

---

## Scenario 3: Walk-in Patient (New Patient)

### Patient: "Saya mau periksa, ini kali pertama saya ke sini"

**Steps**:

```
1. Register New Patient
   ┌─────────────────────────────────────┐
   │ Page: /patients/new                 │
   │ Fill form:                           │
   │  - Full name                         │
   │  - NIK (16 digits)                   │
   │  - BPJS number (if applicable)       │
   │  - Date of birth                     │
   │  - Gender                            │
   │  - Phone number                      │
   │  - Address                           │
   │  - Photo (optional)                  │
   │ Click: Save                          │
   │                                      │
   │ Result: MR number generated          │
   │ "MR-20251103-001"                    │
   └─────────────────────────────────────┘
           │
           ▼
2. Create Appointment (Workaround for Walk-in)
   ┌─────────────────────────────────────┐
   │ Page: /appointments/new              │
   │ Select: Patient (just registered)    │
   │ Select: Doctor                       │
   │ Date: Today                          │
   │ Time: Current time                   │
   │ Notes: "Walk-in - new patient"       │
   │ Click: Create & Check-in             │
   └─────────────────────────────────────┘
           │
           ▼
3. Immediate Check-in
   ┌─────────────────────────────────────┐
   │ Check-in immediately after creation  │
   │ Queue number assigned                │
   └─────────────────────────────────────┘
           │
           ▼
4. Inform Patient
   ┌─────────────────────────────────────┐
   │ "Nomor rekam medis Anda:            │
   │  MR-20251103-001"                   │
   │ "Nomor antrian: 6"                  │
   │ "Silakan tunggu"                    │
   └─────────────────────────────────────┘
```

**Result**:
- ✅ New patient registered
- ✅ MR number generated
- ✅ In queue with queue number
- ✅ Ready for doctor examination

---

## Scenario 4: Online Booking (Future)

### Patient books via mobile app

**Automatic Process**:

```
┌─────────────────────────────────────────┐
│ Patient Books Online (Mobile App)       │
│ - Selects doctor                         │
│ - Selects date & time slot              │
│ - Provides reason for visit             │
│ - Confirms booking                       │
└──────────────┬──────────────────────────┘
               │
               ▼ (Automatic)
┌─────────────────────────────────────────┐
│ System Creates Appointment              │
│ - Status: "scheduled"                   │
│ - Sends SMS confirmation to patient     │
│ - Appears in front desk schedule        │
└──────────────┬──────────────────────────┘
               │
               ▼ (Day of appointment)
┌─────────────────────────────────────────┐
│ Patient Arrives at Clinic               │
│ Front desk checks them in               │
│ (Same as Scenario 1)                    │
└─────────────────────────────────────────┘
```

**Front Desk Sees**:
```
Appointments List - Today
────────────────────────────────────
08:00  Ahmad Rizki         [Check-in]  
       📱 Booked online
08:15  Siti Aminah         [Check-in]  
       👤 Booked by staff
08:30  Budi Santoso        [Check-in]  
       📱 Booked online
```

---

## Queue Management

### Unified Queue Display

All patients (appointment + walk-in) appear in **one queue**:

```
┌──────────────────────────────────────────────┐
│  Antrian Dr. Sarah Wijaya - 3 Nov 2025       │
├──────────────────────────────────────────────┤
│  Status: Checked-in (Waiting for doctor)     │
├──────────────────────────────────────────────┤
│  #1  08:00  Ahmad Rizki      [Janji Temu]    │
│      MR-20251101-001                          │
│      Status: Checked-in 07:55                │
│                                               │
│  #2  08:15  Siti Aminah      [Janji Temu]    │
│      MR-20251028-045                          │
│      Status: Checked-in 08:10                │
│                                               │
│  #3  --:--  Budi Santoso     [Walk-in]       │
│      MR-20251015-012                          │
│      Status: Checked-in 08:20                │
│                                               │
│  #4  08:30  Linda Wijaya     [Janji Temu]    │
│      MR-20251102-008                          │
│      Status: Checked-in 08:25                │
│                                               │
│  #5  --:--  Joko Susilo      [Walk-in]       │
│      MR-20251103-001                          │
│      Status: Checked-in 08:28                │
└──────────────────────────────────────────────┘

Doctor Actions:
- Click "Mulai Pemeriksaan" to start consultation
- Patient status changes: checked_in → in_progress
```

### Queue Number Rules

**How Queue Numbers Work**:
1. **Sequential per day**: #1, #2, #3, #4...
2. **Shared between appointment & walk-in**: Both get next number
3. **Assigned at check-in time**: Not at booking time
4. **Per doctor**: Each doctor has their own queue

**Example Timeline**:
```
07:55 - Ahmad (appointment 08:00) checks in → Queue #1
08:10 - Siti (appointment 08:15) checks in → Queue #2
08:20 - Budi (walk-in) checks in → Queue #3
08:25 - Linda (appointment 08:30) checks in → Queue #4
08:28 - Joko (walk-in) checks in → Queue #5
```

---

## Medical Record Creation

### Doctor's Workflow

**From Queue Page** (`/queue`):

```
┌──────────────────────────────────────────┐
│  Queue Display                            │
│  #3  Budi Santoso  [Walk-in]             │
│      [Mulai Pemeriksaan] ← Doctor clicks │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Medical Record Form                      │
│  /medical-records/new?appointment=xxx    │
│  (or patient=xxx for walk-in)            │
│                                           │
│  Pre-filled:                              │
│  - Patient info (name, MR, age, gender)  │
│  - Doctor (current user)                 │
│  - Appointment (if exists)               │
│                                           │
│  Doctor fills:                            │
│  - Vital signs                            │
│  - Chief complaint                        │
│  - Physical examination                   │
│  - Diagnosis (ICD-10)                     │
│  - Treatment plan                         │
│  - Attachments (photos)                   │
│                                           │
│  Click: "Simpan Rekam Medis"             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Medical Record Saved                     │
│  - Linked to patient                      │
│  - Linked to appointment (if exists)      │
│  - Appointment status → "completed"       │
│  - Patient removed from queue             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Optional: Create Prescription           │
│  If patient needs medication             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Front Desk: Process Payment             │
│  Patient returns to front desk           │
└──────────────────────────────────────────┘
```

### Key Points:

**For Appointments**:
- ✅ Medical record has `appointment_id`
- ✅ One medical record per appointment (enforced)
- ✅ Cannot create duplicate

**For Walk-ins**:
- ✅ Medical record has `appointment_id = NULL`
- ✅ Multiple medical records allowed (different visits)
- ✅ Identified by `patient_id` + `visit_date`

---

## Billing & Payment

### After Medical Record Completed

**Steps**:

```
1. Patient Returns to Front Desk
   ┌─────────────────────────────────────┐
   │ Doctor finishes examination         │
   │ Tells patient: "Silakan ke kasir"  │
   └─────────────────────────────────────┘
           │
           ▼
2. Front Desk Generates Bill
   ┌─────────────────────────────────────┐
   │ Page: /billing/new                  │
   │ Or: Auto-suggested after med record │
   │                                     │
   │ Bill includes:                      │
   │  - Consultation fee                 │
   │  - Medications (from prescription)  │
   │  - Procedures (if any)              │
   │                                     │
   │ Auto-calculated based on:           │
   │  - BPJS vs Non-BPJS pricing        │
   │  - Discount (if applicable)         │
   └─────────────────────────────────────┘
           │
           ▼
3. Process Payment
   ┌─────────────────────────────────────┐
   │ Select payment method:              │
   │  - Cash                             │
   │  - QRIS                             │
   │  - Debit Card                       │
   │  - E-wallet                         │
   │  - BPJS (free for patient)          │
   │                                     │
   │ Enter amount paid                   │
   │ System calculates change            │
   └─────────────────────────────────────┘
           │
           ▼
4. Print Receipt
   ┌─────────────────────────────────────┐
   │ Print payment receipt               │
   │ Give medicine (if available)        │
   │ Schedule follow-up (if needed)      │
   └─────────────────────────────────────┘
```

**Works the same for**:
- ✅ Appointment patients
- ✅ Walk-in patients
- ✅ BPJS patients
- ✅ Non-BPJS patients

---

## Common Scenarios & Solutions

### 1. "Patient has appointment but arrives early"

**Solution**: Check them in immediately
- They get queue number in order of check-in
- Even if appointment is at 08:30, if they check in at 08:00, they might be #1

### 2. "Patient has appointment but arrives late"

**Solution**: Check them in when they arrive
- They get queue number at check-in time
- May be behind walk-ins who checked in earlier
- Doctor can prioritize if needed

### 3. "Multiple walk-ins arrive at same time"

**Solution**: Check in one by one
- First come, first served (FIFO)
- Each gets sequential queue number
- Register new patients first, then check in

### 4. "Walk-in patient wants specific doctor who is fully booked"

**Solution Options**:
1. Add to that doctor's queue anyway (longer wait)
2. Suggest available doctor
3. Schedule appointment for another day

### 5. "Patient checks in but leaves before seeing doctor"

**Solution**: 
- Change appointment status to "cancelled"
- Remove from queue
- Medical record not created = no billing

### 6. "Emergency patient arrives"

**Solution**:
- Front desk can mark as priority (future feature)
- Or doctor can see out of queue order (manual)
- Still create proper medical record

---

## Best Practices

### For Front Desk Staff:

✅ **DO**:
- Check in appointments as patients arrive (don't assume they'll arrive at scheduled time)
- Register new walk-ins promptly
- Verify patient identity before check-in
- Inform patients of their queue number
- Keep queue display visible to patients
- Process payments immediately after consultation

❌ **DON'T**:
- Don't check in patients who haven't arrived yet
- Don't skip queue numbers
- Don't create appointments for past times
- Don't create duplicate patient records
- Don't let patients leave without payment

### For Doctors:

✅ **DO**:
- See patients in queue order (or prioritize as needed)
- Complete medical records before next patient
- Link prescriptions to medical records
- Update appointment status appropriately

❌ **DON'T**:
- Don't skip patients in queue without reason
- Don't forget to save medical records
- Don't create medical records without patient examination

---

## Future Improvements

### Phase 2: Dedicated Walk-in UI

**New Page**: `/walk-in-checkin`

```
┌──────────────────────────────────────────┐
│  Check-in Pasien Walk-in                 │
├──────────────────────────────────────────┤
│  [●] Pasien Lama   [○] Pasien Baru      │
│                                          │
│  🔍 [Cari nama, NIK, atau MR...]        │
│  ┌────────────────────────────────────┐ │
│  │ MR-20251101-001 - Ahmad Rizki     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Pilih Dokter: [Dr. Sarah Wijaya ▼]     │
│  Keluhan: [___________________]          │
│                                          │
│  [Batal]            [Check-in]           │
└──────────────────────────────────────────┘
```

**Benefits**:
- ✅ No need to create fake appointments
- ✅ Direct walk-in to queue
- ✅ Clearer workflow
- ✅ Better reporting (walk-in vs appointment stats)

---

## Quick Reference

### Front Desk Dashboard Layout

```
┌────────────────────────────────────────────────┐
│  🏠 Dashboard - Front Desk                     │
├────────────────────────────────────────────────┤
│                                                │
│  📅 Today's Appointments (15)                  │
│  ├─ Checked-in: 5                             │
│  ├─ Waiting: 8                                │
│  └─ Completed: 2                              │
│                                                │
│  👥 Quick Actions                              │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Register New │  │ Check-in     │          │
│  │ Patient      │  │ Walk-in      │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ View Queue   │  │ Process      │          │
│  │              │  │ Payment      │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  🔔 Alerts                                     │
│  ├─ 3 patients waiting > 30 minutes           │
│  └─ 2 outstanding payments                    │
└────────────────────────────────────────────────┘
```

---

## Summary Table

| Scenario | Registration | Appointment | Check-in | Queue# | Medical Record |
|----------|-------------|-------------|----------|--------|----------------|
| **Scheduled Appointment** | Already done | Has appointment_id | At arrival | Auto | Linked to appointment |
| **Walk-in (Existing)** | Already done | Create workaround | Immediately | Auto | appointment_id = NULL |
| **Walk-in (New)** | Register first | Create workaround | Immediately | Auto | appointment_id = NULL |
| **Online Booking** | Already done | Has appointment_id | At arrival | Auto | Linked to appointment |

---

**Document Status**: ✅ Current workflow (with workarounds)  
**Future Update**: Will be simplified when walk-in UI is implemented
