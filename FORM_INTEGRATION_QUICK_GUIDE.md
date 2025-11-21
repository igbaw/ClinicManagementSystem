# Form Integration Quick Guide

Complete guide to integrating SatuSehat hooks into forms. Copy-paste ready examples.

---

## 1. Patient Registration Form Integration

### Step 1: Add Imports
```typescript
// At top of your patient form component file
import { useSatuSehatSync } from '@/lib/hooks/useSatuSehatSync';
import { SyncStatusIndicator } from '@/components/satusehat/sync-status-indicator';
import { validatePatientForSync } from '@/lib/api/satusehat/pre-submission-checks';
import { getErrorMessage } from '@/lib/api/satusehat/error-messages';
```

### Step 2: Initialize Hook
```typescript
export default function PatientRegistrationForm() {
  const [patientId, setPatientId] = useState<string | undefined>();
  const { status, triggerSync } = useSatuSehatSync({
    patientId,
    autoSync: true, // Auto-sync after patient created
    showToast: true,
  });

  // ... rest of component
}
```

### Step 3: Add Validation Before Save
```typescript
// In your form submit handler
async function handleSubmit(data: PatientFormData) {
  // 1. Validate for SatuSehat
  const validation = validatePatientForSync({
    nik: data.nik,
    name: data.fullName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
  });

  if (!validation.valid) {
    validation.errors.forEach(error => {
      toast({
        description: error,
        variant: 'destructive',
      });
    });
    return;
  }

  // 2. Save to database
  const savedPatient = await savePatientToDatabase(data);

  // 3. Trigger sync (hook will auto-sync)
  setPatientId(savedPatient.id);

  // 4. Show success and redirect
  toast({ description: 'Patient registered. Syncing to SatuSehat...' });
  router.push(`/patients/${savedPatient.id}`);
}
```

### Step 4: Add Status Display
```typescript
// In JSX, after patient is saved:
{patientId && (
  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="font-semibold text-sm mb-2">SatuSehat Sync Status</h3>
    <SyncStatusIndicator
      status={status}
      entityType="Patient"
      ihsNumber={patient?.ihs_number}
      showLabel={true}
      size="md"
    />
    {status === 'failed' && (
      <Button
        onClick={() => triggerSync(patientId)}
        size="sm"
        className="mt-3"
      >
        Retry Sync
      </Button>
    )}
  </div>
)}
```

---

## 2. Medical Records Form Integration

### Step 1: Add Imports
```typescript
import { useSatuSehatClinicalSubmit } from '@/lib/hooks/useSatuSehatClinicalSubmit';
import { ClinicalDataStatusSection } from '@/components/satusehat/clinical-data-status-section';
import { validateMedicalRecordForSubmission, checkPrerequisites } from '@/lib/api/satusehat/pre-submission-checks';
```

### Step 2: Initialize Hook
```typescript
export default function MedicalRecordForm() {
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

### Step 3: Add Pre-Submission Checks
```typescript
// Before rendering form
const { canSubmit, missing } = checkPrerequisites({
  patientIhsNumber: patient?.ihs_number,
  doctorId: user?.id,
  organizationId: clinic?.satusehat_organization_id,
});

if (!canSubmit) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Cannot Submit to SatuSehat</AlertTitle>
      <AlertDescription>
        {missing.map((msg, i) => (
          <div key={i}>• {msg}</div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
```

### Step 4: Add Submit Handler
```typescript
async function handleSaveMedicalRecord(formData: MedicalRecordFormData) {
  // 1. Validate data
  const validation = validateMedicalRecordForSubmission({
    patientIhsNumber: patient?.ihs_number,
    doctorId: user?.id,
    visitDate: formData.visitDate,
    diagnoses: formData.diagnoses,
    vitalSigns: formData.vitalSigns,
  });

  if (!validation.valid) {
    validation.errors.forEach(error => {
      toast({ description: error, variant: 'destructive' });
    });
    return;
  }

  // 2. Save medical record
  const record = await saveMedicalRecord(formData);
  setMedicalRecordId(record.id);

  // 3. Auto-submission triggered by hook
  toast({ description: 'Medical record saved. Submitting to SatuSehat...' });
  router.push(`/medical-records/${record.id}`);
}
```

### Step 5: Add Status Display
```typescript
// In JSX after record saved:
{medicalRecordId && (
  <ClinicalDataStatusSection
    status={{
      status: overallStatus,
      encounter,
      conditions,
      observations,
    }}
    onRetry={(type) => submitClinicalData()}
    showDetails={true}
  />
)}
```

---

## 3. Prescription Form Integration

### Step 1: Add Submission Handler
```typescript
async function handleSavePrescription(prescriptionData: PrescriptionFormData) {
  // 1. Save prescription
  const prescription = await savePrescriptionToDatabase(prescriptionData);

  // 2. Submit each medication to SatuSehat
  const submissions: string[] = [];
  for (const med of prescriptionData.medications) {
    try {
      const response = await fetch('/api/satusehat/medication-request/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: prescription.id,
          medicalRecordId: prescription.medical_record_id,
          medication: med,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        submissions.push(result.submissionId);
      }
    } catch (error) {
      console.error('Failed to submit medication:', error);
    }
  }

  // 3. Show result
  if (submissions.length > 0) {
    toast({
      description: `Prescription saved. ${submissions.length} medication(s) submitted to SatuSehat`,
    });
  }

  router.push(`/prescriptions/${prescription.id}`);
}
```

### Step 2: Show Status in Prescription View
```typescript
// In prescription detail page
{prescription?.satusehat_submissions && prescription.satusehat_submissions.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>SatuSehat Submission Status</CardTitle>
    </CardHeader>
    <CardContent>
      <SubmissionHistoryTable
        submissions={prescription.satusehat_submissions}
        onRetry={handleRetry}
      />
    </CardContent>
  </Card>
)}
```

---

## 4. Form Validation Examples

### Patient NIK Validation
```typescript
// Show error if NIK invalid
if (!isValidNIK(formData.nik)) {
  <p className="text-sm text-red-600">NIK must be 16 digits</p>
}
```

### ICD-10 Validation
```typescript
// Show warning for invalid ICD-10
{diagnosis.icd10_code && !isValidICD10Code(diagnosis.icd10_code) && (
  <Alert>Invalid ICD-10 code: {diagnosis.icd10_code}</Alert>
)}
```

### Date Validation
```typescript
// Show error for invalid date
if (!isValidISODate(formData.dateOfBirth)) {
  <p className="text-sm text-red-600">Date must be in YYYY-MM-DD format</p>
}
```

### Vital Signs Validation
```typescript
// Show warnings for unusual values
const validation = validateVitalSigns(formData.vitalSigns);
{validation.warnings.map(warning => (
  <Alert key={warning}>{warning}</Alert>
))}
```

---

## 5. Error Handling in Forms

### Display User-Friendly Errors
```typescript
import { getErrorMessage } from '@/lib/api/satusehat/error-messages';

try {
  await submitToSatuSehat(data);
} catch (error) {
  const { userMessage, suggestedAction } = getErrorMessage(error);

  toast({
    title: 'Submission Error',
    description: userMessage,
    action: suggestedAction ? {
      label: suggestedAction,
      onClick: () => handleRetry(),
    } : undefined,
  });
}
```

---

## 6. Status Display Examples

### Inline Status Badge
```typescript
<SyncStatusIndicator
  status={patient?.satusehat_sync_status || 'idle'}
  entityType="Patient"
  ihsNumber={patient?.ihs_number}
  showLabel={true}
  size="sm"
/>
```

### Full Status Section
```typescript
<SubmissionStatusSection
  submissions={medicalRecord?.satusehat_submissions || []}
  title="SatuSehat Submission History"
  onRetry={handleRetry}
  isLoading={isLoading}
/>
```

### Clinical Data Status
```typescript
<ClinicalDataStatusSection
  status={clinicalSubmissionStatus}
  onRetry={(type) => retrySubmission(type)}
  showDetails={isAdmin}
/>
```

---

## 7. Complete Form Example (Patient Registration)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

import { useSatuSehatSync } from '@/lib/hooks/useSatuSehatSync';
import { SyncStatusIndicator } from '@/components/satusehat/sync-status-indicator';
import { validatePatientForSync } from '@/lib/api/satusehat/pre-submission-checks';

const patientSchema = z.object({
  nik: z.string().length(16),
  fullName: z.string().min(2),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female']),
  phone: z.string(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function PatientRegistrationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [patientId, setPatientId] = useState<string>();

  const { status } = useSatuSehatSync({
    patientId,
    autoSync: true,
    showToast: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  async function onSubmit(data: PatientFormData) {
    // Validate for SatuSehat
    const validation = validatePatientForSync({
      nik: data.nik,
      name: data.fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
    });

    if (!validation.valid) {
      validation.errors.forEach(error => {
        toast({ description: error, variant: 'destructive' });
      });
      return;
    }

    // Save patient
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const savedPatient = await response.json();
      setPatientId(savedPatient.id);

      toast({ description: 'Patient registered. Syncing to SatuSehat...' });
      router.push(`/patients/${savedPatient.id}`);
    } catch (error) {
      toast({
        description: 'Failed to save patient',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Patient</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nik">NIK *</Label>
            <Input id="nik" {...register('nik')} placeholder="16-digit NIK" />
            {errors.nik && <p className="text-sm text-red-600">{errors.nik.message}</p>}
          </div>

          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gender">Gender *</Label>
            <select {...register('gender')} className="w-full border rounded p-2">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Register Patient'}
          </Button>

          {patientId && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <SyncStatusIndicator
                status={status}
                entityType="Patient"
                showLabel={true}
              />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Quick Checklist

### Patient Registration
- [ ] Add hook import
- [ ] Initialize hook with `patientId`
- [ ] Add validation before save
- [ ] Trigger `setPatientId()` after save
- [ ] Display `SyncStatusIndicator`
- [ ] Add retry button
- [ ] Test end-to-end

### Medical Records
- [ ] Add hook import
- [ ] Check prerequisites
- [ ] Add validation
- [ ] Initialize hook with `medicalRecordId`
- [ ] Display `ClinicalDataStatusSection`
- [ ] Add retry handling
- [ ] Test end-to-end

### Prescriptions
- [ ] Create submission endpoint call
- [ ] Handle response
- [ ] Show submission status
- [ ] Add retry button
- [ ] Test end-to-end

---

## Testing

After integration, test:
1. ✅ Form submits successfully
2. ✅ Status indicator shows
3. ✅ Auto-submission works
4. ✅ Retry button functions
5. ✅ Validation works
6. ✅ Error messages display
7. ✅ Mobile responsive

---

**Ready to integrate!** Use the examples above as copy-paste templates.
