# Billing Implementation Review & Recommendations

## Executive Summary

The billing system is **functionally complete** with a solid foundation, but has several **critical gaps** that should be addressed before production use. The core workflow (create bill → process payment → track status) works, but lacks essential features like invoice generation, payment gateway integration, and proper financial controls.

---

## ✅ Current Implementation Strengths

### 1. **Solid Data Model**
- Well-structured schema with proper foreign keys
- Supports multiple payment statuses: `pending`, `partial`, `paid`, `cancelled`
- Billing items properly normalized with type categorization
- Payments table tracks history with reference numbers
- BPJS claim number support for Indonesian healthcare system

### 2. **Complete User Interface**
- **List View** (`/billing`): Search, filter by status, preview items
- **Create Billing** (`/billing/new`): Auto-generate from medical records
- **Detail View** (`/billing/[id]`): Comprehensive bill details with payment history
- **Payment Processing** (`/billing/[id]/payment`): Multiple payment methods supported
- Good UX with Indonesian localization

### 3. **Payment Method Support**
Well-designed payment options:
- Cash (Tunai)
- QRIS
- Bank Transfer
- Debit/Credit Card
- E-Wallet
- BPJS

### 4. **Business Logic**
- Automatic price calculation (subtotal, discount, tax, total)
- BPJS pricing differentiation (regular vs BPJS rates)
- Partial payment support
- Payment status auto-updates based on amount paid

### 5. **Integration with Medical Records**
- Bills generated from medical records
- Auto-includes consultation service from `services` table
- Auto-includes prescription medications with proper pricing
- Links back to medical record for audit trail

---

## ❌ Critical Gaps & Issues

### 1. **🚨 Missing Invoice Generation (CRITICAL)**

**Issue**: Code references `/api/billings/${billing.id}/invoice` but this API endpoint **doesn't exist**.

**Impact**:
- Users can't print or download invoices
- No PDF generation capability
- Compliance issues (Indonesian tax law requires proper invoices)

**Evidence**:
```tsx
// billing/page.tsx:301 & billing/[id]/page.tsx:238
<Link href={`/api/billings/${billing.id}/invoice`} target="_blank">
  📄 Cetak Invoice
</Link>
```

**Recommendation**: Implement PDF invoice generation using `jspdf` library (already in dependencies).

---

### 2. **🚨 No Payment Gateway Integration (HIGH PRIORITY)**

**Issue**: Midtrans client is a stub with no implementation.

**Current State**:
```typescript
// lib/api/midtrans/client.ts
export class MidtransClient {
  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    this.baseURL = process.env.MIDTRANS_BASE_URL || "https://api.sandbox.midtrans.com";
  }
  // TODO: implement charge/create QRIS if needed later
}
```

**Impact**:
- QRIS payments require manual entry
- No payment verification/webhooks
- Cannot track payment status from gateway
- Risk of payment fraud (no validation)

**Recommendation**: Implement Midtrans Snap or Core API for:
- QRIS payment generation
- Card payment processing
- E-wallet integration
- Payment webhook handling

---

### 3. **🚨 Missing Doctor ID in Billings Table (DATA INTEGRITY)**

**Issue**: Billings table has no `doctor_id` field, but detail page tries to display it.

**Evidence**:
```sql
-- Schema has no doctor_id
CREATE TABLE billings (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  medical_record_id UUID REFERENCES medical_records(id),
  -- NO doctor_id field
  ...
);
```

But the code queries for it:
```typescript
// billing/[id]/page.tsx:92-94
doctor:users(full_name),
```

**Impact**:
- Cannot track which doctor provided the service
- Billing attribution issues
- Reporting incomplete (revenue by doctor)

**Recommendation**: Add `doctor_id` field to billings table via migration.

---

### 4. **Missing Payment Validation**

**Issue**: Payment processing has no server-side validation or security checks.

**Problems**:
- No amount validation on server side
- No concurrent payment handling (race conditions)
- No payment reversal capability
- No audit log for payment modifications
- Payment status update not transactional

**Code Location**: `billing/[id]/payment/page.tsx:99-152`

**Recommendation**:
- Move payment processing to API route with validation
- Add database transactions for payment + billing update
- Implement optimistic locking to prevent double payments
- Add payment audit trail

---

### 5. **No Receipt Generation**

**Issue**: After payment, no receipt is generated.

**Impact**:
- Cannot provide proof of payment to patients
- Accounting compliance issues

**Recommendation**: Generate PDF receipt after successful payment with:
- Payment date/time
- Amount paid
- Payment method
- Reference number
- Running balance

---

### 6. **Limited Reporting**

**Issue**: Daily revenue report is too basic.

**Current State**: Only shows total for a single day, no breakdowns.

**Missing Reports**:
- Revenue by payment method
- Revenue by doctor
- Outstanding payments (aging report)
- BPJS vs non-BPJS revenue
- Payment trends over time
- Top services by revenue

**Recommendation**: Build comprehensive reporting dashboard.

---

### 7. **No Payment Refund/Void Capability**

**Issue**: Cannot handle refunds or voided payments.

**Impact**:
- Cannot correct payment errors
- Cannot handle cancellations after payment
- No way to reverse transactions

**Recommendation**: Add payment status field with values: `completed`, `refunded`, `voided`, `failed`.

---

### 8. **Missing Payment Reconciliation**

**Issue**: No way to reconcile payments with bank statements.

**Needs**:
- Daily payment summary by method
- Export to CSV/Excel
- Reconciliation tracking
- Discrepancy reporting

---

### 9. **No Billing Number Generation**

**Issue**: Billings use UUID as ID, not human-readable invoice numbers.

**Impact**:
- Difficult for accounting/bookkeeping
- Not compliant with Indonesian tax regulations
- Poor user experience

**Recommendation**: Add `invoice_number` field with format: `INV-YYYYMMDD-XXXX` (sequential per day).

---

### 10. **Security Issues**

**Issues**:
1. **No RLS policies verification** - Check if RLS properly restricts billing access
2. **No role-based access** - Front desk shouldn't see all financial data
3. **No payment method validation** - Any method can be selected without checking gateway status
4. **Client-side only validation** - Payment amount validation only on client

---

## 📋 Recommended Implementation Priority

### **Phase 1: Critical (Do First)**
1. ✅ **Invoice PDF Generation** - Implement `/api/billings/[id]/invoice` route
2. ✅ **Add doctor_id to billings** - Database migration + update queries
3. ✅ **Add invoice_number field** - With auto-generation logic
4. ✅ **Server-side payment validation** - Move to API route with transaction

### **Phase 2: High Priority (Next)**
5. ✅ **Receipt PDF Generation** - After payment success
6. ✅ **Midtrans QRIS Integration** - For digital payments
7. ✅ **Payment refund capability** - Add status + refund flow
8. ✅ **Enhanced reporting** - Revenue breakdowns

### **Phase 3: Important (Soon)**
9. ✅ **Payment reconciliation tools** - Daily summary, export
10. ✅ **RLS policies audit** - Security verification
11. ✅ **Payment webhook handling** - For gateway callbacks
12. ✅ **Overpayment handling** - Currently warns but doesn't prevent

### **Phase 4: Nice to Have**
13. Advanced analytics dashboard
14. Automated payment reminders
15. Subscription/recurring billing
16. Multiple currency support
17. Integration with accounting software (Jurnal, Accurate)

---

## 🛠️ Specific Code Fixes Needed

### Fix 1: Add doctor_id to billings table

**Migration**:
```sql
-- 20250112000000_add_doctor_to_billings.sql
ALTER TABLE billings ADD COLUMN doctor_id UUID REFERENCES users(id);

-- Backfill from medical_records
UPDATE billings b
SET doctor_id = mr.doctor_id
FROM medical_records mr
WHERE b.medical_record_id = mr.id;

-- Make NOT NULL after backfill
ALTER TABLE billings ALTER COLUMN doctor_id SET NOT NULL;
```

### Fix 2: Add invoice_number

**Migration**:
```sql
-- 20250112000001_add_invoice_number.sql
ALTER TABLE billings ADD COLUMN invoice_number TEXT UNIQUE;

-- Create sequence function
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  seq_num INTEGER;
BEGIN
  date_prefix := TO_CHAR(NEW.billing_date, 'YYYYMMDD');

  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 13) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM billings
  WHERE invoice_number LIKE 'INV-' || date_prefix || '-%';

  NEW.invoice_number := 'INV-' || date_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
BEFORE INSERT ON billings
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();
```

### Fix 3: Create Invoice API Route

**File**: `Apps/web/src/app/api/billings/[id]/invoice/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();

  // Fetch billing data
  const { data: billing, error } = await supabase
    .from('billings')
    .select(`
      *,
      patient:patients(*),
      doctor:users(full_name),
      billing_items(*),
      payments(*)
    `)
    .eq('id', params.id)
    .single();

  if (error || !billing) {
    return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
  }

  // Generate PDF
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Invoice #: ${billing.invoice_number}`, 20, 40);
  doc.text(`Date: ${new Date(billing.billing_date).toLocaleDateString('id-ID')}`, 20, 46);

  // Patient info
  doc.text('Patient:', 20, 60);
  doc.text(billing.patient.full_name, 20, 66);
  doc.text(`MR: ${billing.patient.medical_record_number}`, 20, 72);

  // Items table
  let yPos = 90;
  doc.text('Description', 20, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 150, yPos);
  doc.text('Total', 180, yPos);

  yPos += 6;
  billing.billing_items.forEach((item: any) => {
    doc.text(item.description, 20, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(`Rp ${item.unit_price.toLocaleString('id-ID')}`, 150, yPos);
    doc.text(`Rp ${item.total_price.toLocaleString('id-ID')}`, 180, yPos);
    yPos += 6;
  });

  // Totals
  yPos += 10;
  doc.text(`Subtotal: Rp ${billing.subtotal.toLocaleString('id-ID')}`, 150, yPos);
  yPos += 6;
  doc.text(`Discount: Rp ${billing.discount.toLocaleString('id-ID')}`, 150, yPos);
  yPos += 6;
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: Rp ${billing.total_amount.toLocaleString('id-ID')}`, 150, yPos);

  // Return PDF
  const pdfBuffer = doc.output('arraybuffer');

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${billing.invoice_number}.pdf"`,
    },
  });
}
```

### Fix 4: Move Payment Processing to API Route

**File**: `Apps/web/src/app/api/billings/[id]/payment/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();
  const body = await request.json();

  const { payment_method, amount, reference_number, notes } = body;

  // Validation
  if (!payment_method || amount <= 0) {
    return NextResponse.json(
      { error: 'Invalid payment data' },
      { status: 400 }
    );
  }

  // Start transaction (using Supabase RPC)
  const { data: result, error } = await supabase.rpc('process_payment', {
    p_billing_id: params.id,
    p_amount: amount,
    p_payment_method: payment_method,
    p_reference_number: reference_number,
    p_notes: notes
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result });
}
```

**Database Function** (add to migration):
```sql
CREATE OR REPLACE FUNCTION process_payment(
  p_billing_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_reference_number TEXT,
  p_notes TEXT
) RETURNS JSON AS $$
DECLARE
  v_billing RECORD;
  v_total_paid NUMERIC;
  v_new_status TEXT;
  v_payment_id UUID;
BEGIN
  -- Get billing with lock
  SELECT * INTO v_billing
  FROM billings
  WHERE id = p_billing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing not found';
  END IF;

  -- Check if overpayment
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE billing_id = p_billing_id AND status = 'completed';

  IF (v_total_paid + p_amount) > v_billing.total_amount THEN
    RAISE EXCEPTION 'Payment amount exceeds total';
  END IF;

  -- Insert payment
  INSERT INTO payments (
    billing_id, payment_method, amount, reference_number, notes, status
  ) VALUES (
    p_billing_id, p_payment_method, p_amount, p_reference_number, p_notes, 'completed'
  ) RETURNING id INTO v_payment_id;

  -- Update billing status
  v_total_paid := v_total_paid + p_amount;

  IF v_total_paid >= v_billing.total_amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE billings
  SET payment_status = v_new_status,
      payment_method = p_payment_method,
      updated_at = NOW()
  WHERE id = p_billing_id;

  RETURN json_build_object(
    'payment_id', v_payment_id,
    'status', v_new_status,
    'total_paid', v_total_paid
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Testing Checklist

Before considering billing production-ready:

- [ ] Create billing from medical record
- [ ] Verify BPJS pricing applied correctly
- [ ] Process full payment (cash)
- [ ] Process partial payment
- [ ] Process second partial payment to complete
- [ ] Generate and verify invoice PDF
- [ ] Generate and verify receipt PDF
- [ ] Test concurrent payment attempts
- [ ] Verify payment history displays correctly
- [ ] Test filtering and search
- [ ] Verify RLS policies (different user roles)
- [ ] Test BPJS claim number generation
- [ ] Test discount application
- [ ] Test payment refund flow
- [ ] Verify reporting data accuracy

---

## 💰 Financial Compliance Considerations (Indonesia)

For production use in Indonesia, ensure:

1. **Faktur Format** - Invoice must have:
   - Sequential invoice number
   - Tax ID (NPWP) if applicable
   - Company stamp/signature

2. **Tax Reporting** - Healthcare services typically 0% VAT but:
   - Track for reporting purposes
   - Different rates for non-medical items

3. **BPJS Requirements**:
   - Proper claim documentation
   - SEP number validation
   - Price differentiation tracking

4. **Audit Trail**:
   - All financial transactions logged
   - Cannot delete payment records
   - User attribution for all changes

---

## 🎯 Conclusion

**Overall Assessment**: The billing system has a **solid foundation (7/10)** but needs **critical features (invoice generation, payment security)** before production use.

**Effort Estimate**:
- Phase 1 fixes: ~3-5 days
- Phase 2 features: ~5-7 days
- Phase 3 enhancements: ~3-5 days
- **Total to production-ready**: ~2-3 weeks

**Recommendation**: Prioritize Phase 1 immediately, especially invoice generation since it's referenced in the UI but doesn't work.
