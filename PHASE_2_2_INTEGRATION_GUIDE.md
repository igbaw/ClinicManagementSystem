# Phase 2.2: Integration Implementation Guide

This guide explains how to integrate SatuSehat hooks into your clinic's forms and workflows.

---

## Overview

Phase 2.2 provides three main integration points:

1. **Patient Registration** → Auto-sync to SatuSehat
2. **Medical Records Save** → Auto-submit Encounter + Clinical Data
3. **Prescription Save** → Auto-submit MedicationRequest

---

## Integration 1: Patient Registration Form

### Current State
Form saves patient to database but doesn't sync to SatuSehat yet.

### Target State
After patient is saved, automatically sync to SatuSehat with status feedback.

### Implementation Steps

#### Step 1: Import Hook
```typescript
// src/app/(dashboard)/patients/new/page.tsx
import { useSatuSehatSync } from '@/lib/hooks/useSatuSehatSync';
import { SubmissionBadge } from '@/components/satusehat/submission-badge';
import { validatePatientForSync } from '@/lib/api/satusehat/pre-submission-checks';
import { getErrorMessage, getSuccessMessage } from '@/lib/api/satusehat/error-messages';
```

#### Step 2: Add Hook to Component
```typescript
export default function NewPatientPage() {
  const [patientId, setPatientId] = useState<string | undefined>();

  const { status, triggerSync } = useSatuSehatSync({
    patientId,
    autoSync: true, // Auto-sync after patient created
    showToast: true,
  });

  // ... rest of component
}
```

#### Step 3: Add Sync Status Display
```typescript
// In JSX after patient saved:
<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <div className="flex items-center gap-3">
    <SubmissionBadge
      status={status}
      resourceType="Patient"
      submissionId={syncStatus.submissionId}
    />
    <div>
      <p className="text-sm font-medium">
        {status === 'queued' && 'Syncing to SatuSehat...'}
        {status === 'success' && 'Successfully synced to SatuSehat!'}
        {status === 'failed' && 'Sync failed. Click retry.'}
      </p>
      {syncStatus.error && (
        <p className="text-xs text-red-700 mt-1">
          {getErrorMessage(syncStatus.error).userMessage}
        </p>
      )}
    </div>
  </div>
</div>
```

#### Step 4: Trigger Sync on Save
```typescript
// In patient form submission:
async function handleSubmit(data: PatientFormData) {
  // 1. Validate patient data for SatuSehat
  const validation = validatePatientForSync({
    nik: data.nik,
    name: data.name,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
  });

  if (!validation.valid) {
    validation.errors.forEach(error => toast({ description: error, variant: 'destructive' }));
    return;
  }

  if (validation.warnings) {
    validation.warnings.forEach(warning => toast({ description: warning }));
  }

  // 2. Save patient to database
  const patientId = await savePatient(data);

  // 3. Trigger SatuSehat sync
  setPatientId(patientId);

  // 4. Show success and allow user to continue
  toast({ description: 'Patient registered. Syncing to SatuSehat...' });
  router.push(`/patients/${patientId}`);
}
```

#### Step 5: Handle Retry
```typescript
// Add manual retry button when failed:
{status === 'failed' && (
  <Button
    variant="outline"
    onClick={() => triggerSync(patientId!)}
  >
    Retry Sync
  </Button>
)}
```

---

## Integration 2: Medical Records Form

### Current State
Form saves medical record but doesn't submit clinical data to SatuSehat.

### Target State
After medical record is saved, automatically submit Encounter, Conditions, and Observations.

### Implementation Steps

#### Step 1: Import Hook
```typescript
// src/app/(dashboard)/medical-records/new/page.tsx
import { useSatuSehatClinicalSubmit } from '@/lib/hooks/useSatuSehatClinicalSubmit';
import { SubmissionBadge } from '@/components/satusehat/submission-badge';
import { validateMedicalRecordForSubmission } from '@/lib/api/satusehat/pre-submission-checks';
```

#### Step 2: Add Hook to Component
```typescript
export default function NewMedicalRecordPage() {
  const [medicalRecordId, setMedicalRecordId] = useState<string | undefined>();

  const {
    submitClinicalData,
    overallStatus,
    encounter,
    conditions,
    observations,
  } = useSatuSehatClinicalSubmit({
    medicalRecordId,
    autoSubmit: true, // Auto-submit after record created
  });

  // ... rest of component
}
```

#### Step 3: Add Clinical Data Status Section
```typescript
// After medical record save, show detailed status:
<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <h3 className="text-sm font-semibold mb-3">SatuSehat Submission Status</h3>

  <div className="space-y-3">
    {/* Encounter */}
    <div className="flex items-center gap-2">
      <SubmissionBadge
        status={encounter.status}
        resourceType="Encounter"
        compact
      />
      <span className="text-sm">
        {encounter.status === 'success' && 'Encounter submitted'}
        {encounter.status === 'submitting' && 'Submitting encounter...'}
        {encounter.status === 'failed' && `Error: ${encounter.error}`}
      </span>
    </div>

    {/* Conditions */}
    <div className="flex items-center gap-2">
      <SubmissionBadge
        status={conditions.status}
        resourceType="Condition"
        compact
      />
      <span className="text-sm">
        {conditions.status === 'success' && `${conditions.count} diagnoses submitted`}
        {conditions.status === 'submitting' && 'Submitting diagnoses...'}
        {conditions.status === 'failed' && `Error: ${conditions.error}`}
      </span>
    </div>

    {/* Observations */}
    <div className="flex items-center gap-2">
      <SubmissionBadge
        status={observations.status}
        resourceType="Observation"
        compact
      />
      <span className="text-sm">
        {observations.status === 'success' && `${observations.count} vital signs submitted`}
        {observations.status === 'submitting' && 'Submitting vital signs...'}
        {observations.status === 'failed' && `Error: ${observations.error}`}
      </span>
    </div>
  </div>

  {overallStatus === 'partial' && (
    <Button
      onClick={submitClinicalData}
      className="mt-3"
      size="sm"
    >
      Retry Failed
    </Button>
  )}
</div>
```

#### Step 4: Trigger Submission on Save
```typescript
// In medical record form submission:
async function handleSaveMedicalRecord(data: MedicalRecordFormData) {
  // 1. Validate data
  const validation = validateMedicalRecordForSubmission({
    patientIhsNumber: patient.ihs_number,
    doctorId: user.id,
    visitDate: data.visitDate,
    diagnoses: data.diagnoses,
    vitalSigns: data.vitalSigns,
  });

  if (!validation.valid) {
    showValidationErrors(validation.errors);
    return;
  }

  // 2. Save to database
  const recordId = await saveMedicalRecord(data);
  setMedicalRecordId(recordId);

  // 3. Auto-submit to SatuSehat (via hook)
  toast({ description: 'Medical record saved. Submitting to SatuSehat...' });
}
```

#### Step 5: Add Pre-Submission Checks
```typescript
// Before showing form:
const { canSubmit, missing } = checkPrerequisites({
  patientIhsNumber: patient.ihs_number,
  doctorId: user.id,
  organizationId: clinic.organizationId,
});

if (!canSubmit) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Cannot submit to SatuSehat</AlertTitle>
      <AlertDescription>
        {missing.map((msg, i) => (
          <div key={i}>• {msg}</div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
```

---

## Integration 3: Prescription Form

### Implementation Steps

#### Step 1: Create Hook for Medication Requests
```typescript
// In prescription save handler:
import { SubmissionBadge } from '@/components/satusehat/submission-badge';

async function handleSavePrescription(prescriptionData) {
  // 1. Save prescription
  const prescriptionId = await savePrescription(prescriptionData);

  // 2. Submit to SatuSehat for each medication
  for (const medication of prescriptionData.medications) {
    await fetch('/api/satusehat/medication-request/submit', {
      method: 'POST',
      body: JSON.stringify({
        prescriptionId,
        medicalRecordId: prescription.medicalRecordId,
        medication,
      }),
    });
  }

  toast({ description: 'Prescription saved and submitted to SatuSehat' });
}
```

#### Step 2: Show Status in Prescription View
```typescript
// In prescription detail page:
{prescription.satusehatSubmission && (
  <div className="mt-4">
    <h3 className="text-sm font-semibold mb-2">SatuSehat Status</h3>
    <SubmissionBadge
      status={prescription.satusehatSubmission.status}
      resourceType="MedicationRequest"
      onRetry={() => retrySubmission(prescription.id)}
    />
  </div>
)}
```

---

## User Experience Flow

### Patient Registration
```
1. User fills patient form
   ↓
2. Click "Register Patient"
   ↓
3. Validation check (NIK format, etc.)
   ↓
4. Save to database
   ↓
5. Show "Syncing to SatuSehat..." with spinner
   ↓
6. Auto-sync triggers (hook calls API)
   ↓
7. Poll status every 5 seconds
   ↓
8. Show result:
   ✓ "Successfully synced"  or  ✗ "Sync failed - Retry"
   ↓
9. User can continue (async in background)
```

### Medical Record Save
```
1. Doctor completes medical record
   ↓
2. Shows checklist:
   ☐ Patient synced?
   ☐ Doctor registered?
   ☐ All diagnoses valid?
   ↓
3. Click "Save & Submit to SatuSehat"
   ↓
4. Save to database
   ↓
5. Show three-part progress:
   📊 Encounter: [pending] → [synced] ✓
   📋 Conditions: 3 items [pending] → [synced] ✓
   📈 Observations: [pending] → [synced] ✓
   ↓
6. Final result: "All clinical data synced"
   ↓
7. If failed: "Retry" button available
```

---

## Error Handling Examples

### Invalid Patient Data
```typescript
const validation = validatePatientForSync({
  nik: '123', // Invalid: only 3 digits
  name: 'John',
  dateOfBirth: '1990-01-01',
  gender: 'male',
});

// Result:
// {
//   valid: false,
//   errors: ['Patient NIK must be 16 digits. Current: 3']
// }
```

### Missing Prerequisites
```typescript
const { canSubmit, missing } = checkPrerequisites({
  patientIhsNumber: undefined, // Not synced yet
  doctorId: 'doctor-123',
  organizationId: 'org-123',
});

// Result:
// {
//   canSubmit: false,
//   missing: ['Patient must be synced to SatuSehat first']
// }
```

### Suspicious Vital Signs
```typescript
const validation = validateMedicalRecordForSubmission({
  // ...
  vitalSigns: {
    blood_pressure: '250/150', // Too high
    temperature: 45, // Too high
    heart_rate: 200, // Too high
  },
});

// Result includes warnings:
// Blood pressure 250/150 is outside normal range
// Temperature 45°C is outside normal range
// Heart rate 200 is outside normal range
```

---

## Testing These Integrations

### Manual Testing Checklist

#### Patient Registration
- [ ] Fill patient form with valid data
- [ ] Validate NIK format check works
- [ ] See "Syncing..." status
- [ ] Verify submission in SatuSehat table
- [ ] Check `ihs_number` stored in patient record
- [ ] Test retry on simulated failure
- [ ] Verify user can proceed even if sync pending

#### Medical Records
- [ ] Fill medical record form
- [ ] See pre-submission checklist
- [ ] Submit and see three-part status
- [ ] Verify all 3 submissions created (Encounter, Conditions, Observations)
- [ ] Check status updates as they sync
- [ ] Test failed submission retry

#### Prescriptions
- [ ] Create prescription with medications
- [ ] Verify MedicationRequest submission triggered
- [ ] See status in prescription view
- [ ] Test manual retry

---

## Troubleshooting

### "Patient not synced to SatuSehat"
**Cause**: `patient.ihs_number` is null
**Solution**: Patient must be synced first. Show sync button in medical record form.

### "Doctor not registered in SatuSehat"
**Cause**: Practitioner not in `satusehat_practitioners` table
**Solution**: This is a Phase 3 feature. For now, manual registration via admin.

### Submission stuck in "processing"
**Cause**: Queue processor hasn't run yet
**Solution**: Manually call `/api/satusehat/queue/process` or wait 5 minutes for cron.

### Validation warnings but still submits
**Correct behavior**: Warnings don't block submission, only errors do. Vital signs like BP can vary.

---

## Performance Considerations

### Polling
- Default: 5 seconds
- Can be adjusted per hook
- Auto-stops when complete
- Unsubscribes on unmount

### API Calls
- Patient sync: 1 API call
- Medical record: Up to 3 API calls (encounter, conditions, observations)
- Prescription: 1 API call per medication
- Status polling: Shared endpoint, optimized query

### Database Queries
- Submissions table: Indexed on status, created_at
- Queue table: Indexed on status, next_retry_at
- Minimal impact on main operations

---

## Next Steps

1. **Implement Patient Registration Integration** (Tomorrow)
2. **Implement Medical Records Integration** (Tomorrow)
3. **Implement Prescription Integration** (Day after)
4. **Test All Integrations** (Day after)
5. **Add Dashboard** (Next phase)

---

## Support

For issues or questions about integration:
1. Check error message in UI (user-friendly)
2. Check browser console (technical details)
3. Check Supabase logs (server-side)
4. Refer to code comments in hooks
5. Check pre-submission validation functions

---

**Ready to start integration!**
