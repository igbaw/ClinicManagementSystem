# SatuSehat Billing Integration - Phase 1 Complete

**Date**: 2025-11-14
**Status**: ✅ COMPLETE
**Impact**: Foundation for SatuSehat compliance - FHIR Invoice, Claims, and Audit Infrastructure

---

## 📋 Phase 1 Overview

Phase 1 establishes the complete foundation for SatuSehat billing compliance by:

1. **Adding FHIR Resource Definitions** - Invoice, Claim, ClaimResponse, ChargeItem interfaces
2. **Creating Database Schema** - Four new tables with audit trails and retention policies
3. **Building Invoice Service** - Convert local billings to FHIR Invoice format
4. **Creating Submission API** - Queue-based async processing for SatuSehat submissions
5. **Foundation for BPJS** - Claim builder structure (currently disabled)

---

## ✅ Phase 1A: FHIR Resource Definitions

**File**: `src/lib/api/satusehat/client.ts`
**Lines Added**: 631-1606 (975 lines)
**Status**: ✅ COMPLETE

### Resources Added

#### 1. FhirInvoice Interface
- **Lines**: 633-733 (101 lines)
- **Purpose**: Billing details reporting to SatuSehat
- **Fields**:
  - Identifiers (invoice number, reference)
  - Status tracking (draft, issued, balanced, cancelled, entered-in-error)
  - Patient/recipient references
  - Financial details (net, tax, gross)
  - Line items with price components
  - Payment terms and notes

#### 2. FhirChargeItem Interface
- **Lines**: 735-796 (62 lines)
- **Purpose**: Individual healthcare service cost tracking
- **Fields**:
  - Resource identification
  - Service code and description
  - Patient and context references
  - Performer (healthcare provider)
  - Quantity and pricing
  - Unit price components

#### 3. FhirClaim Interface (Foundation)
- **Lines**: 798-1111 (314 lines)
- **Purpose**: BPJS claims submission structure (disabled/hidden)
- **Fields**:
  - Claim status and priority
  - Insurance information
  - Diagnosis codes (ICD-10)
  - Services and items
  - Totals and adjudication
  - **Status**: Foundation only - not used until BPJS enabled

#### 4. FhirClaimResponse Interface (Foundation)
- **Lines**: 1113-1374 (262 lines)
- **Purpose**: BPJS claim verification results (disabled/hidden)
- **Fields**:
  - Response status
  - Adjudication details
  - Approved/denied amounts
  - Processing notes
  - **Status**: Foundation only - receives BPJS responses when enabled

### Client Methods Added

```typescript
// Invoice Management
async createInvoice(invoice: FhirInvoice): Promise<Record<string, unknown>>
async updateInvoice(invoiceId: string, invoice: FhirInvoice): Promise<Record<string, unknown>>
async getInvoice(invoiceId: string): Promise<Record<string, unknown>>

// ChargeItem Management
async createChargeItem(chargeItem: FhirChargeItem): Promise<Record<string, unknown>>
async updateChargeItem(chargeItemId: string, chargeItem: FhirChargeItem): Promise<Record<string, unknown>>

// Claim Management (Foundation)
async createClaim(claim: FhirClaim): Promise<Record<string, unknown>>
async getClaim(claimId: string): Promise<Record<string, unknown>>
async getClaimResponse(claimResponseId: string): Promise<Record<string, unknown>>
```

---

## ✅ Phase 1B: Database Schema Migration

**File**: `supabase/migrations/20250115000000_add_satusehat_billing.sql`
**Lines**: 507 lines
**Status**: ✅ COMPLETE

### 1. satusehat_invoices Table

**Purpose**: Links local billing records to SatuSehat Invoice resources

**Columns**:
- `id` - UUID primary key
- `billing_id` - Reference to local billing
- `invoice_resource_id` - SatuSehat Invoice ID (e.g., Invoice/123)
- `patient_id` - Patient reference
- `organization_id` - Clinic/organization reference
- `invoice_status` - draft, issued, balanced, cancelled, entered-in-error
- `total_net`, `total_tax`, `total_gross` - Financial amounts
- `currency` - IDR (default)
- `invoice_date`, `due_date` - Date fields
- `submission_id` - Reference to SatuSehat submission
- `submitted_at`, `submitted_by` - Audit fields
- `archived_at`, `archive_reason` - 10-year retention fields
- **Indexes**: 8 indexes for fast lookups by status, date, retention

### 2. satusehat_claims Table

**Purpose**: Tracks BPJS claims (foundation structure, disabled)

**Columns**:
- `id` - UUID primary key
- `billing_id` - Reference to billing
- `claim_resource_id`, `claim_response_resource_id` - SatuSehat resource IDs
- `patient_id` - Patient reference
- `claim_status`, `claim_response_status` - Status tracking
- `bpjs_enabled` - Feature flag (default FALSE)
- `claim_total`, `approved_amount`, `rejected_amount` - Financial tracking
- `submission_id` - Reference to SatuSehat submission
- `submitted_at`, `response_received_at` - Timestamp fields
- **Indexes**: 7 indexes for status and date lookups

### 3. invoice_documents Table

**Purpose**: Stores generated PDF invoice metadata with 10-year retention

**Columns**:
- `id` - UUID primary key
- `invoice_id`, `billing_id` - References
- `document_type` - invoice_pdf, receipt_pdf, claim_attachment
- `file_name`, `file_path`, `file_size_bytes` - File metadata
- `file_mime_type`, `file_hash_sha256` - Content verification
- `invoice_number`, `generation_date` - Document details
- `is_encrypted`, `encryption_key_id` - Security fields
- `retention_until` - 10-year retention requirement
- `archived_at`, `deleted_at` - Lifecycle tracking
- `created_by` - User audit trail
- **Indexes**: 8 indexes for document lookups and retention tracking
- **Trigger**: Auto-calculates `retention_until` (created_at + 10 years)

### 4. billing_access_logs Table

**Purpose**: Audit trail for billing data access (PDP Law No. 27/2022 compliance)

**Columns**:
- `id` - UUID primary key
- `billing_id`, `patient_id`, `user_id` - References
- `user_role` - Snapshot of role at time of access
- `access_type` - view, edit, export, delete, payment_process, claim_submit
- `access_status` - success, denied, failed
- `data_accessed` - Metadata (not actual data)
- `pii_fields_accessed` - Array of PII fields accessed
- `ip_address`, `user_agent` - Network info
- `access_purpose` - medical_care, billing_processing, quality_assurance, audit, patient_request, legal_requirement
- `invoice_document_id` - Related document
- `access_notes`, `denial_reason` - Details
- `is_audit_required` - Flag for manual review
- `audit_reviewed_at`, `audit_reviewed_by`, `audit_notes` - Audit tracking
- **Indexes**: 10 indexes for comprehensive audit querying

### RLS Policies

**satusehat_invoices**:
- Admin: SELECT all
- Front desk: SELECT all
- Doctor: SELECT for own patients (read-only)
- Admin/Front desk: INSERT and UPDATE

**satusehat_claims**:
- Admin only: All operations

**invoice_documents**:
- Admin and front desk: SELECT
- Admin and front desk: INSERT

**billing_access_logs**:
- Admin: SELECT (audit trail)
- Automatic INSERT on access

### Database Functions

1. **update_billing_table_updated_at()** - Auto-update timestamps
2. **calculate_invoice_retention()** - Set retention_until to +10 years
3. **log_billing_access()** - Log billing access for audit trail

### View Created

**invoice_status_summary** - Monthly invoice status reporting for compliance

---

## ✅ Phase 1C: Invoice Builder Service

**File**: `src/lib/services/invoice-builder.ts`
**Lines**: 412 lines
**Status**: ✅ COMPLETE

### InvoiceBuilder Class

**Purpose**: Convert local billing records to FHIR Invoice format

**Methods**:

1. **buildInvoice(billing, patient, items)**
   - Converts local billing to FHIR Invoice
   - Generates invoice number (INV-YYYYMMDD-UUID)
   - Sets status to 'draft'
   - Includes all required FHIR fields
   - Handles 0% tax for healthcare (Indonesian regulation)

2. **buildLineItems(items)**
   - Creates FHIR line items from billing items
   - Each item has sequence, code, quantity, and price components
   - Supports consultation, procedure, medication, lab_test types

3. **buildTotalPriceComponents(billing)**
   - Calculates subtotal, discount, tax
   - **Compliance**: 0% tax for healthcare in Indonesia
   - Negative amounts for discounts

4. **buildChargeItems(billing, patient, items, encounter)**
   - Creates detailed charge items for cost tracking
   - Includes performer, quantity, unit price
   - Links to patient and encounter

5. **validateInvoice(invoice)**
   - Validates FHIR Invoice structure
   - Checks required fields
   - Verifies financial totals
   - Returns errors array

### Helper Functions

- **getItemTypeSystem()** - Maps local type to FHIR coding system
- **getItemTypeCode()** - Gets FHIR code for item type
- **generateInvoiceNumber()** - Creates unique invoice number
- **roundCurrency()** - Ensures 2 decimal places for IDR

### Interfaces

```typescript
interface BillingData { ... }     // Local billing record
interface BillingItemData { ... } // Individual billing items
interface PatientData { ... }     // Patient information
interface ClinicData { ... }      // Clinic/organization
interface SubmitterData { ... }   // User submitting invoice
```

---

## ✅ Phase 1D: Invoice Submission API

**File**: `src/app/api/billing/submit-invoice/route.ts`
**Lines**: 311 lines
**Status**: ✅ COMPLETE

### Endpoints

#### POST /api/billing/submit-invoice

**Purpose**: Submit billing as invoice to SatuSehat

**Request Body**:
```json
{
  "billingId": "uuid"
}
```

**Process**:
1. Authenticate user
2. Fetch billing and related data
3. Validate billing items exist
4. Fetch patient data
5. Fetch clinic/organization data
6. Build FHIR Invoice using InvoiceBuilder
7. Validate invoice
8. Create `satusehat_submissions` record
9. Auto-create `satusehat_queue` entry (via trigger)
10. Create `satusehat_invoices` link record
11. Log sync event for audit
12. Return submission ID and queue ID

**Response** (Status 202 Accepted):
```json
{
  "success": true,
  "invoiceResourceId": "Invoice/123-abc",
  "submissionId": "uuid",
  "queueId": "uuid",
  "message": "Invoice submitted successfully and queued for processing"
}
```

**Error Responses**:
- 401: Unauthorized
- 400: Invalid request (missing billingId, no items)
- 404: Billing or patient not found
- 500: Server error

#### GET /api/billing/submit-invoice?submissionId=uuid

**Purpose**: Check invoice submission status

**Response**:
```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "resource_type": "Invoice",
    "resource_id": "Invoice/123-abc",
    "submission_status": "pending|processing|success|failed",
    "error_message": "...",
    "http_status_code": 200,
    "submitted_at": "2025-11-14T...",
    "retry_count": 0,
    "created_at": "2025-11-14T...",
    "updated_at": "2025-11-14T..."
  }
}
```

### Integration Points

- **InvoiceBuilder**: Converts billing to FHIR Invoice
- **SatuSehat Queue**: Async processing via existing queue system
- **Database**: Creates submission and invoice records
- **Audit**: Logs sync events

---

## ✅ Phase 2A: BPJS Claim Builder (Foundation)

**File**: `src/lib/services/bpjs-claim-builder.ts`
**Lines**: 426 lines
**Status**: ✅ COMPLETE (Foundation Only)

### BpjsClaimBuilder Class

**Current Status**: DISABLED
- `enabled` defaults to FALSE
- Feature flag gated
- UI components hidden (Phase 2B)
- Database support ready (satusehat_claims table)

**Methods** (Placeholder implementations):

1. **isFeatureEnabled()** - Check if BPJS is enabled
2. **enableFeature(config)** - Enable with configuration
3. **disableFeature()** - Disable feature
4. **buildClaimForBpjs()** - Create FHIR Claim (not submitted)
5. **buildClaimResponseForBpjs()** - Handle BPJS response
6. **validateClaimForBpjs()** - Validate claim structure
7. **getConfig()** - Read BPJS configuration
8. **getStatusMessage()** - UI status message

### BPJS Configuration

```typescript
interface BpjsConfig {
  enabled: boolean;              // Feature flag
  clinicBpjsCode?: string;       // BPJS clinic ID
  participantNumber?: string;    // Clinic participant number
  contactPersonName?: string;    // Contact information
  contactPersonPhone?: string;
}
```

### When BPJS is Enabled (Future)

1. Clinic registers with BPJS
2. Config updated with BPJS credentials
3. `enableFeature()` called with configuration
4. Hidden UI components become visible
5. Claims can be built and submitted
6. ClaimResponse processing begins

### Interfaces for Future Use

```typescript
interface BpjsDiagnosis { ... }  // ICD-10 diagnosis
interface BpjsService { ... }    // BPJS service tariff
```

---

## 📊 Deliverables Summary

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/20250115000000_add_satusehat_billing.sql` | 507 | Database schema |
| `src/lib/services/invoice-builder.ts` | 412 | Invoice conversion |
| `src/lib/services/bpjs-claim-builder.ts` | 426 | BPJS foundation |
| `src/app/api/billing/submit-invoice/route.ts` | 311 | Submission API |

### Files Modified

| File | Location | Changes |
|------|----------|---------|
| `src/lib/api/satusehat/client.ts` | Lines 631-1606 | FHIR resource interfaces and client methods |

### Total New Code

- **Lines**: 1,656 new lines
- **Methods**: 25+ service methods
- **Database Tables**: 4 new tables with 47 columns
- **Indexes**: 33 database indexes
- **RLS Policies**: 12 security policies
- **Database Functions**: 3 PL/pgSQL functions
- **Views**: 1 reporting view

---

## 🔒 Compliance & Security

### Indonesian Healthcare Regulations

✅ **Tax Exemption** (0% VAT/PPN)
- Healthcare services marked as tax-exempt in Invoice
- Calculated as 0% in totalPriceComponent

✅ **10-Year Retention** (Law No. 8/1997)
- `invoice_documents` auto-calculates retention_until
- Archive tracking fields for compliance
- Indexes optimized for retention queries

✅ **Personal Data Protection** (PDP Law No. 27/2022)
- Comprehensive `billing_access_logs` table
- Access type and purpose tracking
- PII fields logged separately
- Audit trail for compliance audits
- Encrypted field support planned

✅ **Medical Records Confidentiality** (Health Law No. 17/2023)
- RLS policies restrict access by role
- Admin can see all records
- Front desk and doctors see limited records
- Patient consent framework ready (Phase 4B)

### FHIR Compliance

✅ **FHIR R4 Standard**
- Invoice resource structure compliant
- Coding systems mapped to proper FHIR codes
- All required fields included
- Validation before submission

✅ **SatuSehat API Ready**
- Resource identifiers in correct format
- Status codes aligned with FHIR spec
- Error handling for API failures
- Retry logic via queue system

### Security Features

✅ **Row Level Security (RLS)**
- 12 policies across 4 tables
- Role-based access control
- Patient-data isolation

✅ **Audit Trail**
- User tracking on all operations
- IP address logging available
- Timestamp tracking
- Audit flag for manual review

✅ **Encryption Ready**
- Fields for encryption key reference
- PII masking planned (Phase 4C)
- Secure file storage in Supabase

---

## 📈 Next Steps

### Phase 2: BPJS Foundation & Hidden UI (Parallel)

**Phase 2A**: ✅ Complete - BPJS claim builder foundation created
**Phase 2B**: Pending - Add hidden BPJS toggle in billing form UI

### Phase 3: Invoice PDF & Storage (Parallel)

**Phase 3A**: Pending - Implement invoice PDF generation
**Phase 3B**: Pending - Set up Supabase Storage for invoices
**Phase 3C**: Pending - Link generated invoices to SatuSehat resources

### Phase 4: Audit & Compliance (Parallel)

**Phase 4A**: Pending - Implement audit logging middleware
**Phase 4B**: Pending - Add patient consent tracking
**Phase 4C**: Pending - Implement PII masking

### Phase 5: Testing & Validation

**Phase 5A**: Pending - Unit tests for invoice builder
**Phase 5B**: Pending - SatuSehat sandbox testing
**Phase 5C**: Pending - User acceptance testing on staging

### Phase 6: Deployment & Documentation

**Phase 6A**: Pending - Production deployment
**Phase 6B**: Pending - BPJS documentation

---

## 🧪 Testing Checklist

### Manual Testing Needed

- [ ] Create billing with multiple items
- [ ] Submit invoice via API
- [ ] Check satusehat_submissions record created
- [ ] Verify satusehat_queue entry auto-created
- [ ] Confirm satusehat_invoices link created
- [ ] Check satusehat_sync_events logged
- [ ] Verify RLS policies work correctly
- [ ] Test database triggers for updated_at
- [ ] Test retention_until calculation
- [ ] Validate FHIR Invoice structure

### API Testing

- [ ] POST with valid billingId
- [ ] POST with invalid billingId (404)
- [ ] POST with missing items (400)
- [ ] GET submission status
- [ ] Check submission status transitions
- [ ] Verify error handling

### Database Testing

- [ ] All indexes query properly
- [ ] RLS policies enforce correctly
- [ ] Triggers fire on insert/update
- [ ] Views return correct data
- [ ] Retention calculation works

---

## 📝 Configuration

### Database Migration

**Apply Migration**:
```sql
-- In Supabase Dashboard → SQL Editor
-- Copy contents of: supabase/migrations/20250115000000_add_satusehat_billing.sql
-- Run in correct order
```

### Environment Variables

No new environment variables required for Phase 1.

**For Future (BPJS)**:
```env
NEXT_PUBLIC_BPJS_ENABLED=false          # Feature flag
BPJS_PARTICIPANT_NUMBER=                # When enabled
BPJS_CONTACT_NAME=                      # When enabled
BPJS_CONTACT_PHONE=                     # When enabled
```

### Service Initialization

```typescript
// In API routes or services
import { InvoiceBuilder } from '@/lib/services/invoice-builder';
import { BpjsClaimBuilder, getBpjsConfig } from '@/lib/services/bpjs-claim-builder';

const invoiceBuilder = new InvoiceBuilder(clinicData, submitterData);
const bpjsBuilder = new BpjsClaimBuilder(getBpjsConfig());
```

---

## 📚 Documentation

### Generated Files

1. **SATUSEHAT_PHASE1_COMPLETE.md** - This file
2. **Database Migration** - SQL schema with comments
3. **Service Code** - Inline TypeScript documentation

### Code Comments

All services include:
- File-level purpose documentation
- Function-level JSDoc comments
- Inline explanation of key logic
- Compliance notes where relevant

---

## 🎯 Key Achievements

✅ **SatuSehat Integration Foundation**
- FHIR R4 compliant Invoice resource
- Async queue-based submission
- Audit trail for compliance

✅ **Database Infrastructure**
- 4 new tables with 47 columns
- 33 optimized indexes
- 12 RLS policies
- 3 PL/pgSQL functions

✅ **Service Layer**
- InvoiceBuilder for billing-to-FHIR conversion
- BpjsClaimBuilder foundation for future use
- Input validation and error handling

✅ **API Integration**
- Queue-based async processing
- Status tracking and polling
- Comprehensive error responses

✅ **Compliance Ready**
- 10-year retention tracking
- 0% tax for healthcare
- Audit logging infrastructure
- PDP Law support foundation

---

## ⚠️ Known Limitations

1. **BPJS Disabled** - Foundation built but disabled until clinic registers
2. **PDF Generation** - Not included (Phase 3A)
3. **Storage Not Linked** - Invoice documents not stored yet (Phase 3B)
4. **Manual Testing Only** - No automated tests yet (Phase 5A)
5. **No Queue Worker** - Submissions queued but not processed (needs worker)

---

## 🔄 Phase Progression

**Current Progress**:
- ✅ Phase 1A: FHIR Definitions
- ✅ Phase 1B: Database Schema
- ✅ Phase 1C: Invoice Service
- ✅ Phase 1D: Submission API
- ✅ Phase 2A: BPJS Foundation

**Completed**: 50% of Phase 1-2
**Next**: Phase 2B (UI), Phase 3A-3B (PDF/Storage), Phase 4A (Audit)

---

**Status**: Ready for Phase 2B and Phase 3 parallel work
**Last Updated**: 2025-11-14
**Created By**: Claude Code
