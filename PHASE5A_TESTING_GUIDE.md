# Phase 5A: Testing Guide - SatuSehat Billing Integration

**Date**: 2025-11-14
**Phase**: 5A (Testing & Validation)
**Status**: Foundation Ready for Manual Testing
**Focus**: Comprehensive testing procedures for Phases 1-3 implementation

---

## 📋 Overview

This guide covers manual testing procedures for the SatuSehat Billing Integration (Phases 1-3). The system includes:
- **Phase 1**: FHIR Resource Definitions & Database Schema
- **Phase 2**: BPJS Claim Builder (disabled foundation)
- **Phase 3**: Invoice PDF Generation & Storage

---

## 🔧 Prerequisites for Testing

### 1. Environment Setup

**Required Environment Variables** (`.env.local`):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Clinic Configuration (optional, for display in PDFs)
NEXT_PUBLIC_CLINIC_CODE=CLINIC001

# SatuSehat (Phase 5B)
NEXT_PUBLIC_SATUSEHAT_ORGANIZATION_ID=your_org_id
```

### 2. Database Migration

**Before Testing**: Apply the migration to Supabase

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of: Apps/web/supabase/migrations/20250115000000_add_satusehat_billing.sql
# 3. Run the SQL

# Option 2: Via CLI (if configured)
supabase migration up
```

**Verify Migration Success**:
```sql
-- Check tables created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'satusehat_%' OR tablename LIKE 'invoice_%' OR tablename = 'billing_access_logs';

-- Expected: satusehat_invoices, satusehat_claims, invoice_documents, billing_access_logs

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('satusehat_invoices', 'invoice_documents', 'billing_access_logs');
```

### 3. Dependencies Installed

```bash
cd Apps/web
npm install
# Should include: html2canvas, jspdf
npm list jspdf html2canvas
```

---

## ✅ Test Scenarios

### Test 1: Database Schema Validation

**Goal**: Verify all tables and policies are correctly created

#### 1.1 Table Existence
```sql
-- Run in Supabase SQL Editor

-- Check satusehat_invoices
SELECT * FROM information_schema.tables
WHERE table_name = 'satusehat_invoices';

-- Expected: 1 row with table_name = 'satusehat_invoices'

-- Check all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'satusehat_invoices'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid)
-- billing_id (uuid)
-- invoice_resource_id (text)
-- patient_id (uuid)
-- invoice_status (text)
-- total_net (numeric)
-- total_tax (numeric)
-- total_gross (numeric)
-- currency (text)
-- invoice_date (timestamp)
-- due_date (timestamp)
-- submission_id (uuid)
-- submitted_at (timestamp)
-- submitted_by (uuid)
-- created_at (timestamp)
-- updated_at (timestamp)
-- archived_at (timestamp)
-- archive_reason (text)
```

#### 1.2 RLS Policies
```sql
-- Check RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('satusehat_invoices', 'invoice_documents', 'billing_access_logs');

-- Expected: All should have relrowsecurity = true

-- Check policies exist
SELECT policyname, tablename
FROM pg_policies
WHERE tablename IN ('satusehat_invoices', 'invoice_documents', 'billing_access_logs')
ORDER BY tablename, policyname;

-- Expected: ~12 policies total (see migration file for complete list)
```

#### 1.3 Triggers and Functions
```sql
-- Check PL/pgSQL functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%log_%' OR routine_name LIKE '%satusehat_%';

-- Expected: log_billing_access, update_satusehat_invoices_updated_at, create_satusehat_invoice_from_submission
```

#### 1.4 Test Result
- [ ] All tables exist with correct columns
- [ ] RLS is enabled on all tables
- [ ] All policies are created
- [ ] All functions/triggers are created

---

### Test 2: Invoice Service (InvoiceBuilder)

**Goal**: Verify invoice conversion from billing records to FHIR format

#### 2.1 Setup Test Data

**Create a test patient** (if not exists):
```sql
INSERT INTO patients (full_name, nik, medical_record_number, address, phone, email, created_at)
VALUES (
  'Test Patient',
  '1234567890123456',
  'MRN-001',
  'Test Address',
  '081234567890',
  'test@example.com',
  NOW()
)
RETURNING id;
-- Note: Save the patient ID
```

**Create a test billing record**:
```sql
INSERT INTO billings (
  patient_id,
  billing_date,
  subtotal,
  discount,
  tax,
  total_amount,
  payment_status,
  created_by,
  created_at
) VALUES (
  'patient_id_from_above',
  NOW(),
  500000.00,
  50000.00,
  0.00,
  450000.00,
  'pending',
  'user_id_here',
  NOW()
)
RETURNING id;
-- Note: Save the billing ID
```

**Create billing items**:
```sql
INSERT INTO billing_items (
  billing_id,
  item_type,
  description,
  quantity,
  unit_price,
  total_price,
  created_at
) VALUES
('billing_id_from_above', 'consultation', 'Doctor Consultation', 1, 200000.00, 200000.00, NOW()),
('billing_id_from_above', 'procedure', 'Blood Test', 1, 250000.00, 250000.00, NOW());
```

#### 2.2 Test InvoiceBuilder Service

Create a test file `test-invoice-builder.ts`:

```typescript
import { InvoiceBuilder } from '@/lib/services/invoice-builder';

const clinicData = {
  name: 'Test Clinic',
  code: 'CLINIC001',
  address: 'Clinic Address',
  phone: '081234567890',
  email: 'clinic@example.com',
};

const submitterData = {
  id: 'user-123',
  email: 'user@example.com',
  full_name: 'Test User',
};

const patientData = {
  id: 'patient-123',
  full_name: 'Test Patient',
  nik: '1234567890123456',
  medical_record_number: 'MRN-001',
};

const billingData = {
  id: 'billing-123',
  billing_id: 'BILL-001',
  patient_id: 'patient-123',
  billing_date: '2025-01-15',
  subtotal: 500000,
  discount: 50000,
  tax: 0,
  total_amount: 450000,
  payment_status: 'pending' as const,
  created_by: 'user-123',
};

const billingItems = [
  {
    id: 'item-1',
    billing_id: 'billing-123',
    item_type: 'consultation' as const,
    description: 'Doctor Consultation',
    quantity: 1,
    unit_price: 200000,
    total_price: 200000,
    created_at: '2025-01-15',
  },
  {
    id: 'item-2',
    billing_id: 'billing-123',
    item_type: 'procedure' as const,
    description: 'Blood Test',
    quantity: 1,
    unit_price: 250000,
    total_price: 250000,
    created_at: '2025-01-15',
  },
];

// Test invoice building
const builder = new InvoiceBuilder(clinicData, submitterData);
const invoice = builder.buildInvoice(billingData, patientData, billingItems);

// Verify output
console.log('Invoice Number:', invoice.number); // Should be: INV-20250115-UUID
console.log('Status:', invoice.status); // Should be: 'draft'
console.log('Total Gross:', invoice.totalPriceComponent?.[2]?.amount?.value); // Should be: 450000
console.log('Tax:', invoice.totalPriceComponent?.[1]?.amount?.value); // Should be: 0
console.log('Line Items Count:', invoice.lineItem?.length); // Should be: 2

// Check FHIR compliance
console.assert(invoice.resourceType === 'Invoice', 'resourceType should be Invoice');
console.assert(invoice.status === 'draft', 'status should be draft');
console.assert(invoice.number !== undefined, 'number should be defined');
console.assert(invoice.totalPriceComponent?.length === 3, 'Should have 3 price components (net, tax, total)');

console.log('✅ Invoice Builder Test Passed');
```

**Expected Results**:
- [ ] Invoice has resourceType = 'Invoice'
- [ ] Invoice status = 'draft'
- [ ] Invoice has valid number format (INV-YYYYMMDD-UUID)
- [ ] Total price components include: net, tax (0), total
- [ ] Line items match billing items (2 items)
- [ ] All FHIR properties are present

---

### Test 3: PDF Generation

**Goal**: Verify invoice PDF is generated correctly and stored

#### 3.1 Test PDF Generation Endpoint

**Using cURL** (or Postman):
```bash
# Generate PDF for billing ID
curl -X POST http://localhost:3000/api/billing/generate-pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "billingId": "your-billing-id-here",
    "storePdf": true
  }' \
  --output invoice.pdf

# Expected: PDF file downloaded successfully
# Check file size: > 50KB (typical invoice PDF)
```

**Using Browser DevTools**:
1. Open http://localhost:3000/app/billing/[id]
2. Open DevTools (F12)
3. Go to Network tab
4. Click "Generate Invoice" button
5. Look for POST request to `/api/billing/generate-pdf`

**Expected in Network Tab**:
- [ ] Status: 200
- [ ] Content-Type: application/pdf
- [ ] Content-Length: > 50000 bytes
- [ ] Response time: < 5 seconds

#### 3.2 Verify PDF Content

**Check generated PDF contains**:
- [ ] Invoice title and number
- [ ] Clinic information (name, code, address)
- [ ] Patient information (name, NIK, MRN)
- [ ] Invoice date
- [ ] Line items table with:
  - Description, Quantity, Unit Price, Total
  - Doctor Consultation, 1, 200,000, 200,000
  - Blood Test, 1, 250,000, 250,000
- [ ] Financial summary:
  - Subtotal: 500,000
  - Discount: -50,000
  - Tax: 0%
  - Total: 450,000
- [ ] Footer with compliance info (10-year retention, Indonesian standards)
- [ ] Page numbers

#### 3.3 Verify Storage

**Check database records**:
```sql
-- Verify invoice_documents record created
SELECT id, file_name, file_size, retention_until, uploaded_by
FROM invoice_documents
WHERE billing_id = 'your-billing-id'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1 record with:
-- - file_size > 50000
-- - retention_until = (today + 10 years)
-- - uploaded_by = current user id
```

**Check Supabase Storage**:
1. Go to Supabase Dashboard → Storage
2. Select `invoice_documents` bucket
3. Navigate to `invoices/2025/[patient-id]/`
4. Verify PDF file exists with correct size

#### 3.4 Test Result
- [ ] PDF generated successfully
- [ ] PDF contains all required information
- [ ] Invoice document record created in database
- [ ] File stored in Supabase Storage bucket
- [ ] Retention date set to 10 years in future
- [ ] File accessible from storage

---

### Test 4: PDF Retrieval and Access Logging

**Goal**: Verify PDF retrieval, access logging, and audit trail

#### 4.1 Retrieve PDF

**Using API**:
```bash
# Download stored PDF
curl "http://localhost:3000/api/billing/generate-pdf?documentId=doc-id&action=download" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  --output invoice-retrieved.pdf

# Expected: PDF downloads successfully
```

#### 4.2 Verify Access Logging

**Check audit logs**:
```sql
-- Verify access log created
SELECT user_id, document_id, action, timestamp, ip_address
FROM billing_access_logs
WHERE document_id = 'doc-id'
ORDER BY timestamp DESC;

-- Expected: 1 record with:
-- - action = 'download'
-- - timestamp = recent
-- - user_id = current user
```

#### 4.3 Verify Access Count Updated

```sql
-- Check access count incremented
SELECT id, access_count, last_accessed_at
FROM invoice_documents
WHERE id = 'doc-id';

-- Expected:
-- - access_count = 1 (or more if downloaded multiple times)
-- - last_accessed_at = recent timestamp
```

#### 4.4 Test Result
- [ ] PDF retrieves successfully from storage
- [ ] Access log entry created
- [ ] Access count incremented
- [ ] Last accessed timestamp updated
- [ ] Audit trail contains IP address and user agent

---

### Test 5: SatuSehat Invoice Submission (Phase 1D)

**Goal**: Verify invoice submission to SatuSehat queue

#### 5.1 Submit Invoice to SatuSehat

**Create test satusehat_invoice record first**:
```bash
curl -X POST http://localhost:3000/api/billing/submit-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "billingId": "your-billing-id"
  }'

# Expected Response (202 Accepted):
# {
#   "submissionId": "submission-uuid",
#   "status": "queued",
#   "queueId": "queue-uuid",
#   "message": "Invoice submitted for processing"
# }
```

#### 5.2 Verify Database Records

**Check satusehat_invoices**:
```sql
SELECT id, invoice_resource_id, invoice_status, submission_id
FROM satusehat_invoices
WHERE billing_id = 'your-billing-id';

-- Expected:
-- - invoice_resource_id = Invoice/uuid
-- - invoice_status = 'issued'
-- - submission_id = submission-uuid
```

**Check satusehat_submissions**:
```sql
SELECT id, resource_type, resource_id, status, created_at
FROM satusehat_submissions
WHERE id = 'submission-uuid';

-- Expected:
-- - resource_type = 'Invoice'
-- - status = 'queued'
-- - created_at = recent
```

**Check satusehat_queue**:
```sql
SELECT id, submission_id, resource_type, status, retry_count
FROM satusehat_queue
WHERE submission_id = 'submission-uuid';

-- Expected:
-- - status = 'pending'
-- - retry_count = 0
```

#### 5.3 Test Result
- [ ] Submission created with 202 status
- [ ] satusehat_invoices record created
- [ ] satusehat_submissions record created
- [ ] satusehat_queue entry created automatically
- [ ] All records linked correctly

---

### Test 6: RLS Policies (Security)

**Goal**: Verify Row Level Security policies work correctly

#### 6.1 Test Front Desk Access

**Scenario**: Front desk user can view/edit their clinic's data

```sql
-- As front desk user (role = 'front_desk')
SELECT id, invoice_status, total_gross
FROM satusehat_invoices;

-- Expected: Can see invoices

-- Try to insert
INSERT INTO satusehat_invoices (billing_id, invoice_resource_id, patient_id, invoice_status)
VALUES ('billing-id', 'Invoice/123', 'patient-id', 'draft');

-- Expected: Success
```

#### 6.2 Test Doctor Access

**Scenario**: Doctor can only view, not edit

```sql
-- As doctor user (role = 'doctor')
SELECT id, invoice_status
FROM satusehat_invoices;

-- Expected: Can view

-- Try to delete
DELETE FROM satusehat_invoices WHERE id = 'id';

-- Expected: Error (RLS denies access)
```

#### 6.3 Test Access Logs

**Scenario**: Can view access logs for own clinic

```sql
-- As authenticated user
SELECT user_id, action, timestamp
FROM billing_access_logs;

-- Expected: Can view
```

#### 6.4 Test Result
- [ ] Front desk can create/view/update invoices
- [ ] Doctor cannot modify invoices (read-only)
- [ ] Admin can access everything
- [ ] Data is clinic-scoped (RLS enforced)

---

### Test 7: BPJS Claim Builder (Phase 2A - Disabled)

**Goal**: Verify BPJS foundation is disabled but ready

#### 7.1 Test Feature Flag

```typescript
import { BpjsClaimBuilder, getBpjsConfig } from '@/lib/services/bpjs-claim-builder';

const config = getBpjsConfig();
const builder = new BpjsClaimBuilder(config);

// Test 1: Feature is disabled
console.assert(!builder.isFeatureEnabled(), 'BPJS should be disabled');

// Test 2: Cannot build claims while disabled
const claim = builder.buildClaimForBpjs(
  'claim-id',
  { name: 'Test' },
  [{ code: 'A00', description: 'Cholera' }],
  [],
  '2025-01-15',
  'Clinic'
);

// Should return error or null
console.assert(!claim, 'Should not build claim when disabled');

// Test 3: Status message indicates disabled
const status = builder.getStatusMessage();
console.assert(status.includes('disabled'), 'Status should indicate disabled');

console.log('✅ BPJS Disabled Test Passed');
```

#### 7.2 Test Result
- [ ] BPJS feature flag is false
- [ ] Cannot build claims when disabled
- [ ] Status message indicates disabled state
- [ ] No errors thrown (graceful degradation)

---

### Test 8: Error Handling

**Goal**: Verify proper error handling and user feedback

#### 8.1 Test Invalid Billing ID

```bash
curl -X POST http://localhost:3000/api/billing/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"billingId": "invalid-uuid"}'

# Expected Response (404):
# {"error": "Billing record not found"}
```

#### 8.2 Test Missing Authorization

```bash
curl -X POST http://localhost:3000/api/billing/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"billingId": "valid-id"}'

# Expected Response (401):
# {"error": "Unauthorized"}
```

#### 8.3 Test Malformed Request

```bash
curl -X POST http://localhost:3000/api/billing/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# Expected Response (400):
# {"error": "..."}
```

#### 8.4 Test Result
- [ ] Invalid ID returns 404
- [ ] Missing auth returns 401
- [ ] Malformed request returns 400
- [ ] Error messages are descriptive
- [ ] No stack traces in error responses

---

## 📊 Test Execution Checklist

### Manual Testing Workflow

```
Week 1:
├── Day 1: Run Tests 1-2 (Database & Services)
├── Day 2: Run Tests 3-4 (PDF Generation & Retrieval)
├── Day 3: Run Tests 5-6 (Submissions & Security)
└── Day 4: Run Tests 7-8 (BPJS & Error Handling)

Week 2:
├── Day 1: Stress testing (100 PDFs)
├── Day 2: Concurrent requests
├── Day 3: Edge cases and boundary testing
└── Day 4: Performance profiling
```

### Pass/Fail Criteria

**Phase 1 & 2** (Foundation):
- [ ] All database tables created
- [ ] All RLS policies working
- [ ] Invoice builder produces valid FHIR
- [ ] Submission queue working

**Phase 3** (PDF & Storage):
- [ ] PDFs generate successfully
- [ ] Files stored in Supabase
- [ ] Access logging working
- [ ] 10-year retention tracked

**Overall**: ✅ All tests pass with zero failures

---

## 🐛 Common Issues & Solutions

### Issue 1: "Table not found" error

**Cause**: Migration not applied
**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run migration SQL file
3. Wait for completion
4. Verify tables with: `SELECT * FROM information_schema.tables WHERE table_name LIKE 'satusehat_%';`

### Issue 2: "Unauthorized" error on API

**Cause**: Missing or invalid auth token
**Solution**:
1. Ensure user is logged in
2. Check session cookie exists
3. Test with valid JWT token

### Issue 3: PDF file not found in storage

**Cause**: Upload failed silently
**Solution**:
1. Check file path: `invoices/[year]/[patient-id]/invoice-*.pdf`
2. Verify bucket name: `invoice_documents`
3. Check bucket policies in Supabase
4. Look at API response for document_id in headers

### Issue 4: "Column not found" in query

**Cause**: Migration incomplete or column name mismatch
**Solution**:
1. Run migration from beginning
2. Check for typos in column names
3. Verify all 20 columns created in invoice_documents table

---

## 📈 Performance Testing

### Load Test: Generate 100 Invoices

```bash
#!/bin/bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/billing/generate-pdf \
    -H "Content-Type: application/json" \
    -d "{\"billingId\": \"billing-$i\"}" &
done
wait
echo "100 invoices generated"
```

**Expected**:
- All requests complete within 5 seconds each
- No database connection errors
- No memory leaks

### Concurrent Requests Test

```bash
ab -n 50 -c 10 \
  -p '{"billingId":"test"}' \
  -T 'application/json' \
  'http://localhost:3000/api/billing/generate-pdf'
```

**Expected**:
- All requests succeed
- < 5% failure rate
- Response time < 3 seconds

---

## 📝 Test Report Template

**Session**: [Date]
**Tester**: [Name]
**Duration**: [Time]

### Summary
- Total Tests: 8
- Passed: [ ]
- Failed: [ ]
- Skipped: [ ]
- Pass Rate: [ ]%

### Detailed Results

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Schema | ✅ | All tables created |
| Test 2: Services | ✅ | Invoice builder working |
| Test 3: PDF Gen | ✅ | PDFs generated |
| Test 4: Retrieval | ✅ | Access logging working |
| Test 5: Submission | ⏳ | Awaiting SatuSehat sandbox |
| Test 6: Security | ✅ | RLS policies enforced |
| Test 7: BPJS | ✅ | Disabled as expected |
| Test 8: Errors | ✅ | Error handling correct |

### Issues Found
- [ ] None
- [ ] Minor (cosmetic)
- [ ] Major (blocking)

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Proceed to Phase 5B: SatuSehat Sandbox Testing
2. Document any deviations from expected behavior
3. Prepare for Phase 6: Production Deployment

### If Tests Fail ❌
1. Document failure in detail
2. Check CLAUDE.md for setup issues
3. Review test prerequisites
4. Retry failing tests
5. Escalate if persistent issues

---

## 📞 Support & Documentation

**Related Files**:
- `PHASE1_2_SESSION_SUMMARY.md` - Implementation details
- `SATUSEHAT_PHASE1_COMPLETE.md` - Phase 1 technical details
- `CLAUDE.md` - Project setup and patterns
- `Apps/web/supabase/migrations/20250115000000_add_satusehat_billing.sql` - Database schema

**Key Endpoints**:
- `POST /api/billing/generate-pdf` - Generate invoice PDF
- `GET /api/billing/generate-pdf` - Download/preview invoice
- `POST /api/billing/submit-invoice` - Submit to SatuSehat
- `GET /api/billing/submit-invoice` - Check submission status

---

**Phase 5A Status**: ✅ Testing Guide Complete
**Ready for**: Manual testing by QA/development team
**Estimated Duration**: 4-5 days for comprehensive testing
**Next Phase**: 5B (SatuSehat Sandbox Testing)
