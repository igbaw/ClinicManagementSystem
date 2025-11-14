# Phase 2.2: SatuSehat Integration Testing Guide

**Status**: Testing Phase
**Last Updated**: November 14, 2025
**Comprehensive Manual Testing & Integration Test Scenarios**

---

## Overview

This guide provides complete testing procedures for Phase 2.2 SatuSehat integration. Testing includes:

1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - End-to-end workflows
3. **Manual Testing** - User-facing features
4. **Performance Testing** - Load and response times
5. **Security Testing** - Authorization and data validation

---

## 1. Unit Tests

### 1.1 Hook Tests: `useSatuSehatSync`

**File**: `src/lib/hooks/useSatuSehatSync.ts`

#### Test Cases

```typescript
describe('useSatuSehatSync', () => {
  // Test 1: Hook initializes correctly
  test('initializes with idle status when patientId is undefined', () => {
    const { result } = renderHook(() => useSatuSehatSync({ patientId: undefined }));
    expect(result.current.status).toBe('idle');
    expect(result.current.isPolling).toBe(false);
  });

  // Test 2: Auto-sync triggers on patientId change
  test('triggers sync when autoSync=true and patientId is set', async () => {
    const { result, rerender } = renderHook(
      ({ patientId }) => useSatuSehatSync({ patientId, autoSync: true }),
      { initialProps: { patientId: undefined } }
    );

    rerender({ patientId: 'patient-123' });

    await waitFor(() => {
      expect(result.current.status).not.toBe('idle');
    });
  });

  // Test 3: Polling stops on success
  test('stops polling when status becomes success', async () => {
    const { result } = renderHook(() =>
      useSatuSehatSync({ patientId: 'patient-123', autoSync: true })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    // Verify no more poll requests
    expect(result.current.isPolling).toBe(false);
  });

  // Test 4: Manual trigger works
  test('triggerSync function works manually', async () => {
    const { result } = renderHook(() =>
      useSatuSehatSync({ patientId: 'patient-123', autoSync: false })
    );

    act(() => {
      result.current.triggerSync('patient-123');
    });

    await waitFor(() => {
      expect(result.current.status).not.toBe('idle');
    });
  });

  // Test 5: Toast notifications
  test('shows toast notifications when showToast=true', async () => {
    const { result } = renderHook(() =>
      useSatuSehatSync({ patientId: 'patient-123', showToast: true })
    );

    // Mock toast function
    const mockToast = jest.fn();

    // Verify toast called on status changes
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });
  });

  // Test 6: Error handling
  test('handles errors gracefully', async () => {
    const { result } = renderHook(() =>
      useSatuSehatSync({ patientId: 'invalid-id' })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('failed');
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### 1.2 Hook Tests: `useSatuSehatClinicalSubmit`

**File**: `src/lib/hooks/useSatuSehatClinicalSubmit.ts`

#### Test Cases

```typescript
describe('useSatuSehatClinicalSubmit', () => {
  // Test 1: Hook initializes with idle status
  test('initializes with idle status', () => {
    const { result } = renderHook(() =>
      useSatuSehatClinicalSubmit({ medicalRecordId: undefined })
    );
    expect(result.current.overallStatus).toBe('idle');
  });

  // Test 2: Auto-submit triggers
  test('auto-submits when medicalRecordId is set and autoSubmit=true', async () => {
    const { result, rerender } = renderHook(
      ({ medicalRecordId }) => useSatuSehatClinicalSubmit({ medicalRecordId, autoSubmit: true }),
      { initialProps: { medicalRecordId: undefined } }
    );

    rerender({ medicalRecordId: 'mr-123' });

    await waitFor(() => {
      expect(result.current.overallStatus).not.toBe('idle');
    });
  });

  // Test 3: Returns three-part status
  test('returns individual status for Encounter, Conditions, Observations', async () => {
    const { result } = renderHook(() =>
      useSatuSehatClinicalSubmit({ medicalRecordId: 'mr-123', autoSubmit: true })
    );

    await waitFor(() => {
      expect(result.current.encounter).toBeDefined();
      expect(result.current.conditions).toBeDefined();
      expect(result.current.observations).toBeDefined();
    });
  });

  // Test 4: Manual submit works
  test('submitClinicalData function works', async () => {
    const { result } = renderHook(() =>
      useSatuSehatClinicalSubmit({ medicalRecordId: 'mr-123', autoSubmit: false })
    );

    act(() => {
      result.current.submitClinicalData();
    });

    await waitFor(() => {
      expect(result.current.overallStatus).not.toBe('idle');
    });
  });

  // Test 5: Selective submission
  test('submits only specified types', async () => {
    const { result } = renderHook(() =>
      useSatuSehatClinicalSubmit({
        medicalRecordId: 'mr-123',
        submitTypes: ['encounter', 'conditions'],
        autoSubmit: true
      })
    );

    await waitFor(() => {
      expect(result.current.encounter).toBeDefined();
      expect(result.current.conditions).toBeDefined();
    });
  });
});
```

### 1.3 Validation Function Tests

**File**: `src/lib/api/satusehat/pre-submission-checks.ts`

#### Test Cases

```typescript
describe('Validation Functions', () => {
  // Test 1: NIK validation
  test('validatePatientForSync accepts valid 16-digit NIK', () => {
    const result = validatePatientForSync({
      nik: '1234567890123456',
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Laki-laki'
    });
    expect(result.valid).toBe(true);
  });

  test('validatePatientForSync rejects invalid NIK', () => {
    const result = validatePatientForSync({
      nik: '123456789', // Too short
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Laki-laki'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // Test 2: Name validation
  test('validatePatientForSync rejects short names', () => {
    const result = validatePatientForSync({
      nik: '1234567890123456',
      name: 'A', // Too short
      dateOfBirth: '1990-01-01',
      gender: 'Laki-laki'
    });
    expect(result.valid).toBe(false);
  });

  // Test 3: Age validation
  test('validatePatientForSync accepts reasonable ages', () => {
    const result = validatePatientForSync({
      nik: '1234567890123456',
      name: 'John Doe',
      dateOfBirth: '1990-01-01', // ~34 years old
      gender: 'Laki-laki'
    });
    expect(result.valid).toBe(true);
  });

  test('validatePatientForSync rejects unreasonable ages', () => {
    const result = validatePatientForSync({
      nik: '1234567890123456',
      name: 'John Doe',
      dateOfBirth: '1800-01-01', // ~224 years old
      gender: 'Laki-laki'
    });
    expect(result.valid).toBe(false);
  });

  // Test 4: Medical record validation
  test('validateMedicalRecordForSubmission checks all required fields', () => {
    const result = validateMedicalRecordForSubmission({
      patientIhsNumber: 'IHS-123456',
      doctorId: 'doc-123',
      visitDate: '2025-11-14',
      diagnoses: [{ code: 'A00', nameIndonesian: 'Kolera' }],
      vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
    });
    expect(result.valid).toBe(true);
  });

  // Test 5: Vital signs validation
  test('validateVitalSigns checks reasonable ranges', () => {
    const result = validateVitalSigns({
      bloodPressure: '120/80',
      pulse: 80,
      temperature: 37,
      weight: 70,
      height: 170
    });
    expect(result.valid).toBe(true);
  });

  test('validateVitalSigns rejects out-of-range values', () => {
    const result = validateVitalSigns({
      bloodPressure: '300/200', // Extremely high
      pulse: 80,
      temperature: 37,
      weight: 70,
      height: 170
    });
    expect(result.valid).toBe(false);
  });

  // Test 6: Prerequisites check
  test('checkPrerequisites verifies all requirements', () => {
    const { canSubmit, missing } = checkPrerequisites({
      patientIhsNumber: 'IHS-123456',
      doctorId: 'doc-123',
      organizationId: 'org-123'
    });
    expect(canSubmit).toBe(true);
    expect(missing).toHaveLength(0);
  });

  test('checkPrerequisites reports missing fields', () => {
    const { canSubmit, missing } = checkPrerequisites({
      patientIhsNumber: undefined,
      doctorId: undefined,
      organizationId: undefined
    });
    expect(canSubmit).toBe(false);
    expect(missing.length).toBeGreaterThan(0);
  });
});
```

### 1.4 Component Tests

**File**: `src/components/satusehat/sync-status-indicator.tsx`

#### Test Cases

```typescript
describe('SyncStatusIndicator Component', () => {
  // Test 1: Renders idle state
  test('renders idle status badge', () => {
    const { getByText } = render(
      <SyncStatusIndicator status="idle" entityType="Pasien" />
    );
    expect(getByText(/Idle|Menunggu/i)).toBeInTheDocument();
  });

  // Test 2: Renders pending state
  test('renders pending status with spinner', () => {
    const { container } = render(
      <SyncStatusIndicator status="pending" entityType="Pasien" />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Test 3: Renders success state
  test('renders success badge with checkmark', () => {
    const { getByTestId } = render(
      <SyncStatusIndicator status="success" entityType="Pasien" />
    );
    expect(getByTestId('success-icon')).toBeInTheDocument();
  });

  // Test 4: Renders failed state with retry button
  test('renders failed status with retry button', () => {
    const mockOnRetry = jest.fn();
    const { getByText } = render(
      <SyncStatusIndicator
        status="failed"
        entityType="Pasien"
        onRetry={mockOnRetry}
      />
    );
    const retryButton = getByText(/Coba Lagi|Retry/i);
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  // Test 5: Displays IHS number in tooltip
  test('shows IHS number in tooltip', () => {
    const { getByTitle } = render(
      <SyncStatusIndicator
        status="success"
        entityType="Pasien"
        ihsNumber="IHS-123456"
      />
    );
    expect(getByTitle(/IHS-123456/i)).toBeInTheDocument();
  });

  // Test 6: Size variations
  test('renders different sizes correctly', () => {
    const { rerender, container } = render(
      <SyncStatusIndicator status="idle" entityType="Pasien" size="sm" />
    );
    let badge = container.querySelector('.badge-sm');
    expect(badge).toBeInTheDocument();

    rerender(
      <SyncStatusIndicator status="idle" entityType="Pasien" size="lg" />
    );
    badge = container.querySelector('.badge-lg');
    expect(badge).toBeInTheDocument();
  });
});
```

---

## 2. Integration Tests

### 2.1 Patient Registration → Sync Workflow

**Scenario**: Register a new patient and verify SatuSehat sync

```typescript
describe('Patient Registration Integration', () => {
  test('E2E: Register patient and auto-sync to SatuSehat', async () => {
    // 1. Navigate to registration page
    render(<PatientRegistrationForm />);

    // 2. Fill form with valid data
    const nikInput = screen.getByLabelText(/NIK/i);
    fireEvent.change(nikInput, { target: { value: '1234567890123456' } });

    const nameInput = screen.getByLabelText(/Nama Lengkap/i);
    fireEvent.change(nameInput, { target: { value: 'Budi Santoso' } });

    const dobInput = screen.getByLabelText(/Tanggal Lahir/i);
    fireEvent.change(dobInput, { target: { value: '1990-05-15' } });

    const genderInput = screen.getByLabelText(/Jenis Kelamin/i);
    fireEvent.change(genderInput, { target: { value: 'Laki-laki' } });

    const phoneInput = screen.getByLabelText(/No. Telepon/i);
    fireEvent.change(phoneInput, { target: { value: '08123456789' } });

    const addressInput = screen.getByLabelText(/Alamat/i);
    fireEvent.change(addressInput, { target: { value: 'Jl. Merdeka No. 123, Jakarta' } });

    // 3. Submit form
    const submitButton = screen.getByText(/Simpan/i);
    fireEvent.click(submitButton);

    // 4. Wait for patient creation
    await waitFor(() => {
      expect(screen.getByText(/SatuSehat Sync Status/i)).toBeInTheDocument();
    });

    // 5. Verify sync status displays
    expect(screen.getByText(/Status Sinkronisasi/i)).toBeInTheDocument();

    // 6. Wait for successful sync
    await waitFor(() => {
      expect(screen.getByText(/success|Berhasil/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // 7. Verify database updated with IHS number
    // (Would check database in real test)
  });

  test('E2E: Handle sync failure and retry', async () => {
    // Mock API to return failure
    fetch.mockResponseOnce(JSON.stringify({ error: 'Network error' }), { status: 500 });

    render(<PatientRegistrationForm />);

    // Fill and submit form
    // ... form filling code ...

    // Wait for failed status
    await waitFor(() => {
      expect(screen.getByText(/failed|Gagal/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText(/Coba Lagi/i);
    fireEvent.click(retryButton);

    // Mock successful response on retry
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    // Verify success after retry
    await waitFor(() => {
      expect(screen.getByText(/success|Berhasil/i)).toBeInTheDocument();
    });
  });
});
```

### 2.2 Medical Record → Clinical Submission Workflow

**Scenario**: Create medical record with 3-part clinical data submission

```typescript
describe('Medical Record Integration', () => {
  test('E2E: Create medical record and submit clinical data', async () => {
    // 1. Navigate to new medical record page
    render(<NewMedicalRecordPage />);

    // 2. Wait for patient data to load
    await waitFor(() => {
      expect(screen.getByText(/Rekam Medis Baru/i)).toBeInTheDocument();
    });

    // 3. Fill SOAP form
    const anamnesisInput = screen.getByPlaceholderText(/Keluhan dan riwayat/i);
    fireEvent.change(anamnesisInput, {
      target: { value: 'Pasien mengeluh demam tinggi selama 3 hari' }
    });

    const physicalInput = screen.getByPlaceholderText(/Pemeriksaan THT/i);
    fireEvent.change(physicalInput, {
      target: { value: 'Suhu tubuh 39°C, tenggorokan hiperemis' }
    });

    const diagnosisInput = screen.getByPlaceholderText(/Diagnosis penyakit/i);
    fireEvent.change(diagnosisInput, {
      target: { value: 'Demam Berdarah Dengue' }
    });

    const therapyInput = screen.getByPlaceholderText(/Rencana pengobatan/i);
    fireEvent.change(therapyInput, {
      target: { value: 'Paracetamol 500mg 3x sehari, Istirahat total' }
    });

    // 4. Fill vital signs
    const bpInput = screen.getByPlaceholderText(/120\/80/i);
    fireEvent.change(bpInput, { target: { value: '110/70' } });

    // 5. Submit form
    const submitButton = screen.getByText(/Simpan Rekam Medis/i);
    fireEvent.click(submitButton);

    // 6. Wait for medical record creation
    await waitFor(() => {
      expect(screen.getByText(/Status Pengiriman ke SatuSehat/i)).toBeInTheDocument();
    });

    // 7. Verify three-part status appears
    expect(screen.getByText(/Encounter/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnosis|Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Vital Signs|Observations/i)).toBeInTheDocument();

    // 8. Wait for all three parts to complete
    await waitFor(() => {
      const successBadges = screen.getAllByText(/success|Berhasil/i);
      expect(successBadges.length).toBeGreaterThanOrEqual(3);
    }, { timeout: 15000 });
  });

  test('E2E: Handle missing prerequisites gracefully', async () => {
    // Mock patient without IHS number
    const patientWithoutIHS = { id: 'pat-123', ihs_number: null };

    render(<NewMedicalRecordPage />, {
      initialState: { patient: patientWithoutIHS }
    });

    // Fill and submit form
    // ... form filling code ...

    // Should show prerequisite warning
    await waitFor(() => {
      expect(screen.getByText(/Tidak bisa mengirim ke SatuSehat/i)).toBeInTheDocument();
    });
  });

  test('E2E: Partial submission when some fields missing', async () => {
    // Medical record without ICD-10 codes
    render(<NewMedicalRecordPage />);

    // Fill SOAP without ICD-10
    // ... form filling code ...

    // Submit
    fireEvent.click(screen.getByText(/Simpan Rekam Medis/i));

    // Should still submit Encounter and Observations (without Conditions)
    await waitFor(() => {
      expect(screen.getByText(/Status Pengiriman ke SatuSehat/i)).toBeInTheDocument();
    });

    // Verify partial status (2 of 3 parts)
    const statusBadges = screen.getAllByRole('img', { name: /status/i });
    expect(statusBadges.length).toBeGreaterThanOrEqual(2);
  });
});
```

### 2.3 Prescription → Medication Submission Workflow

**Scenario**: Create prescription with medication submissions

```typescript
describe('Prescription Integration', () => {
  test('E2E: Create prescription and submit medications', async () => {
    // 1. Navigate to new prescription page
    render(<NewPrescriptionPage />);

    // 2. Search and add medications
    const medSearchInput = screen.getByPlaceholderText(/Cari Obat/i);

    // Search for first medication
    fireEvent.change(medSearchInput, { target: { value: 'Amoxicillin' } });

    await waitFor(() => {
      expect(screen.getByText(/Amoxicillin/i)).toBeInTheDocument();
    });

    // Click to add
    fireEvent.click(screen.getByText(/Amoxicillin/i));

    // Add second medication
    fireEvent.change(medSearchInput, { target: { value: 'Paracetamol' } });

    await waitFor(() => {
      expect(screen.getByText(/Paracetamol/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Paracetamol/i));

    // 3. Fill prescription details
    const dosageInputs = screen.getAllByPlaceholderText(/500mg/i);
    fireEvent.change(dosageInputs[0], { target: { value: '500mg' } });
    fireEvent.change(dosageInputs[1], { target: { value: '500mg' } });

    // 4. Submit prescription
    const submitButton = screen.getByText(/Simpan Resep/i);
    fireEvent.click(submitButton);

    // 5. Wait for prescription creation
    await waitFor(() => {
      expect(screen.getByText(/Status Pengiriman ke SatuSehat/i)).toBeInTheDocument();
    });

    // 6. Verify submissions display
    expect(screen.getByText(/Obat yang Dikirim/i)).toBeInTheDocument();

    // 7. Wait for submission completion
    await waitFor(() => {
      const successBadges = screen.getAllByText(/success|Berhasil/i);
      expect(successBadges.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 10000 });
  });

  test('E2E: Handle partial medication submission', async () => {
    // Add 3 medications but API fails for 1
    render(<NewPrescriptionPage />);

    // Add 3 medications...
    // ... medication adding code ...

    // Mock partial failure
    fetch.mockResponses(
      [JSON.stringify({ success: true, submissionId: 'sub-1' }), { status: 200 }],
      [JSON.stringify({ error: 'Invalid medication data' }), { status: 400 }],
      [JSON.stringify({ success: true, submissionId: 'sub-3' }), { status: 200 }]
    );

    // Submit prescription
    fireEvent.click(screen.getByText(/Simpan Resep/i));

    // Wait for submission status
    await waitFor(() => {
      expect(screen.getByText(/Status Pengiriman ke SatuSehat/i)).toBeInTheDocument();
    });

    // Verify 2 successful, 1 failed
    const failedBadges = screen.getAllByText(/failed|Gagal/i);
    expect(failedBadges.length).toBeGreaterThanOrEqual(1);
  });
});
```

---

## 3. Manual Testing Scenarios

### 3.1 Patient Registration Workflow

**Objective**: Verify patient can register and sync to SatuSehat

**Steps**:

1. Login to clinic application
2. Navigate to **Pasien** → **Daftar Baru**
3. Fill registration form with:
   - NIK: Valid 16-digit number (e.g., 1234567890123456)
   - Name: At least 2 characters
   - Date of Birth: Valid date
   - Gender: Laki-laki or Perempuan
   - Phone: Valid format (08xx or +628xx)
   - Address: 10-500 characters
4. Click **Simpan**
5. Verify:
   - ✅ Patient created successfully
   - ✅ MR number generated
   - ✅ SatuSehat sync status shows (pending → success within 30 seconds)
   - ✅ IHS number assigned after sync
6. Check patient detail page:
   - ✅ IHS number visible
   - ✅ Sync timestamp recorded

**Expected Results**:
- Patient registration succeeds
- Automatic sync to SatuSehat completes within 30 seconds
- IHS number populated in patient record

**Failure Handling**:
- If sync fails: Click "Coba Lagi" button
- Verify retry updates status to success

---

### 3.2 Medical Record Workflow

**Objective**: Verify medical record can be created and submitted to SatuSehat

**Steps**:

1. Navigate to **Rekam Medis** → **Buat Baru**
2. Select or search for patient (should have IHS number)
3. Fill SOAP form:
   - **S (Anamnesis)**: Patient complaint and history
   - **O (Pemeriksaan Fisik)**: Physical examination findings
   - **A (Diagnosis)**: Primary diagnosis text
   - **P (Terapi)**: Treatment plan
4. Fill vital signs:
   - BP: 110/70
   - Pulse: 80
   - Temperature: 37
   - Weight: 70
   - Height: 170
5. (Optional) Add ICD-10 codes:
   - Click "Tambah Kode ICD-10"
   - Search and select diagnosis codes
6. Click **Simpan Rekam Medis**
7. Verify:
   - ✅ Medical record created
   - ✅ "Status Pengiriman ke SatuSehat" section appears
   - ✅ Three-part status shows (Encounter, Diagnosis, Vital Signs)
   - ✅ Status transitions: pending → processing → success (within 1-2 minutes)

**Expected Results**:
- Medical record saves successfully
- All three data types submit to SatuSehat
- Progress bar shows completion

**Failure Scenarios to Test**:

1. **Missing IHS number**: System should warn and skip SatuSehat submission
2. **Invalid vital signs**: System should warn but allow save (local validation only)
3. **Network error during submission**: Should queue for retry

---

### 3.3 Prescription Workflow

**Objective**: Verify prescriptions sync medications to SatuSehat

**Steps**:

1. Navigate to **Resep** → **Buat Resep Baru**
2. Search for medications:
   - Type medication name in search box
   - Select from suggestions
3. For each medication:
   - Enter dosage (e.g., 500mg)
   - Select frequency (3x sehari)
   - Select timing (Sesudah makan)
   - Select duration (7 hari)
   - Verify quantity auto-calculated
4. (Optional) Add prescription notes
5. Click **Simpan Resep**
6. Verify:
   - ✅ Prescription created
   - ✅ "Status Pengiriman ke SatuSehat" section appears
   - ✅ Medications listed with submission status
   - ✅ Status transitions to success within 1 minute

**Expected Results**:
- Prescription saves successfully
- Each medication sends to SatuSehat
- Submission status updates in real-time

**Failure Scenarios**:

1. **No medications selected**: Save button disabled
2. **Duplicate medication**: System prevents adding same drug twice
3. **Out of stock**: Warning shown but save allowed

---

### 3.4 Admin Dashboard Testing

**Objective**: Verify admin can monitor SatuSehat submissions

**Steps**:

1. Login as admin user
2. Navigate to **SatuSehat Dashboard**
3. Verify displays:
   - ✅ Total Submissions count
   - ✅ Success count (green)
   - ✅ Pending count (blue)
   - ✅ Failed count (red)
   - ✅ Success rate percentage
4. Check submission history table:
   - ✅ Sortable columns (date, type, status)
   - ✅ Filterable by status
   - ✅ Search functionality
   - ✅ Pagination
5. Test manual retry:
   - Find failed submission
   - Click retry button
   - Verify status updates
6. Test queue processing:
   - Click "Process Queue Now" button
   - Verify metrics update

**Expected Results**:
- Dashboard displays accurate metrics
- History table is sortable and searchable
- Retry and queue processing work correctly

---

## 4. Performance Testing

### 4.1 API Response Times

**Objectives**: Verify API endpoints meet performance targets

**Test Endpoints**:

```
Target: < 500ms response time
- POST /api/satusehat/patient/sync
- POST /api/satusehat/encounter/submit
- POST /api/satusehat/clinical-data/submit
- POST /api/satusehat/submission/retry
- GET /api/satusehat/submissions
```

**Testing Tools**: Postman, k6, or Apache JMeter

**Test Script** (k6):

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

export default function () {
  const patientId = 'patient-123';
  const url = 'http://localhost:3000/api/satusehat/patient/sync';
  const payload = JSON.stringify({ patientId });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token'
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### 4.2 UI Performance

**Objectives**: Verify UI renders and responds quickly

**Metrics**:
- Page load time: < 2 seconds
- Form submit: < 1 second
- Status update: < 100ms

**Testing Tools**: Chrome DevTools, Lighthouse

**Test Cases**:

```
1. Patient registration form:
   - Load time: ~1.5 seconds
   - Submit to success: ~5 seconds (includes sync)

2. Medical record form:
   - Load time: ~2 seconds
   - Submit to success: ~10 seconds (includes all 3 submissions)

3. Prescription form:
   - Load time: ~1 second
   - Submit to success: ~5 seconds per medication
```

### 4.3 Database Query Performance

**Objectives**: Verify database queries are optimized

**Monitor**:
- Query execution time: < 100ms
- Index usage
- N+1 query problems

**Queries to Test**:
- Patient load with IHS number
- Medical record submission list
- Prescription with medication details

---

## 5. Security Testing

### 5.1 Authentication & Authorization

**Objectives**: Verify access controls work correctly

**Test Cases**:

```typescript
describe('Security: Authentication', () => {
  test('Unauthenticated users cannot access dashboard', async () => {
    // Try to access /medical-records without auth
    const response = await fetch('/medical-records');
    expect(response.status).toBe(401);
  });

  test('Doctors cannot access admin dashboard', async () => {
    // Login as doctor
    // Try to access /satusehat (admin only)
    const response = await fetch('/satusehat', {
      headers: { 'Authorization': 'Bearer doctor-token' }
    });
    expect(response.status).toBe(403);
  });

  test('Users can only see their own medical records', async () => {
    // Login as doctor A
    // Try to access doctor B's records
    // Should get 403 Forbidden
  });

  test('Front desk cannot create medical records', async () => {
    // Login as front_desk
    // Try to create medical record
    // Should get 403 Forbidden
  });
});
```

### 5.2 Data Validation

**Objectives**: Verify input validation prevents attacks

**Test Cases**:

```typescript
describe('Security: Input Validation', () => {
  test('NIK field validates 16 digits', () => {
    // Test with: "", "abc", "123456789012345", "12345678901234567"
    // Should reject all except valid 16-digit
  });

  test('Name field prevents XSS', () => {
    // Test with: "<script>alert('xss')</script>"
    // Should sanitize or reject
  });

  test('Medical record prevents SQL injection', () => {
    // Test diagnosis field with: "; DROP TABLE patients; --"
    // Should sanitize or reject
  });

  test('Date fields validate ISO format', () => {
    // Test with: "invalid", "32-13-2025", "2025-13-01"
    // Should reject invalid dates
  });
});
```

### 5.3 Data Privacy

**Objectives**: Verify sensitive data is handled correctly

**Test Cases**:

```
1. IHS numbers are encrypted in transit and at rest
2. Error messages don't leak sensitive information
3. Audit logs don't expose PHI (Protected Health Information)
4. API responses don't include unnecessary patient data
5. Database backups are encrypted
```

---

## 6. Testing Checklist

### Before Production Deployment

- [ ] **Code Quality**
  - [ ] TypeScript compilation passes
  - [ ] ESLint passes
  - [ ] No console errors or warnings
  - [ ] Code reviewed by 2+ developers

- [ ] **Unit Tests**
  - [ ] useSatuSehatSync hook tests pass
  - [ ] useSatuSehatClinicalSubmit hook tests pass
  - [ ] Validation functions test pass
  - [ ] Component rendering tests pass
  - [ ] Code coverage > 80%

- [ ] **Integration Tests**
  - [ ] Patient registration → sync workflow passes
  - [ ] Medical record → 3-part submission passes
  - [ ] Prescription → medication submission passes
  - [ ] Error handling and retry logic passes
  - [ ] End-to-end tests pass with real API

- [ ] **Manual Testing**
  - [ ] Patient registration workflow tested
  - [ ] Medical record workflow tested
  - [ ] Prescription workflow tested
  - [ ] Admin dashboard tested
  - [ ] All workflows tested on mobile
  - [ ] Accessibility testing (keyboard, screen reader)

- [ ] **Performance**
  - [ ] API response times < 500ms
  - [ ] Page load times < 2 seconds
  - [ ] Database queries < 100ms
  - [ ] No memory leaks
  - [ ] Load test (10 concurrent users) passes

- [ ] **Security**
  - [ ] Authentication checks work
  - [ ] Authorization checks work
  - [ ] Input validation prevents attacks
  - [ ] Error messages don't leak info
  - [ ] Sensitive data encrypted
  - [ ] OWASP Top 10 checklist passed

- [ ] **Data Quality**
  - [ ] Patient data accurate
  - [ ] Medical records complete
  - [ ] Submission records logged
  - [ ] Audit trail present
  - [ ] Sync status accurate

- [ ] **Documentation**
  - [ ] Code commented
  - [ ] API documented
  - [ ] User guide written
  - [ ] Deployment guide written
  - [ ] Troubleshooting guide written

---

## 7. Bug Report Template

When testing, if you find an issue, report it with this template:

```
**Title**: [Component] Brief description

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected Result**:
...

**Actual Result**:
...

**Screenshots/Logs**:
...

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
- Build: Phase 2.2 - Nov 14, 2025
```

---

## 8. Test Execution Schedule

### Week 1 (Development Week)
- **Mon-Tue**: Unit tests (hooks, validation, components)
- **Wed-Thu**: Integration tests (workflows, error handling)
- **Fri**: Performance testing

### Week 2 (QA Week)
- **Mon-Tue**: Manual testing (all workflows)
- **Wed**: Security testing
- **Thu**: Admin dashboard testing
- **Fri**: Final regression testing

### Week 3 (Deployment Week)
- **Mon**: Staging deployment
- **Tue-Wed**: Staging validation
- **Thu**: Final approval
- **Fri**: Production deployment

---

## 9. Success Criteria

Phase 2.2 is ready for production when:

✅ All unit tests pass (100% pass rate)
✅ All integration tests pass (100% pass rate)
✅ Manual testing checklist 100% complete
✅ Performance metrics met (response times < 500ms)
✅ Security testing passed (no vulnerabilities)
✅ Code coverage > 80%
✅ Zero critical/high severity bugs remaining
✅ Documentation complete and reviewed

---

## 10. Support & Escalation

### Testing Issues
- **Hook issues**: Check mock data and API endpoints
- **Component rendering**: Verify props and state
- **API failures**: Check SatuSehat credentials and network
- **Performance issues**: Profile with DevTools and k6

### Escalation Path
1. Reproduce issue with minimal example
2. Check existing documentation
3. Report bug with template above
4. Escalate to senior developer if blocking

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
**Next Review**: After staging deployment

