-- Add SatuSehat Billing Integration Tables
-- Phase 1B: Database schema for Invoice tracking, Claims management, and Audit logging
-- This migration establishes the foundation for SatuSehat compliance billing

-- 1. Create satusehat_invoices table
-- Links local billing records to SatuSehat Invoice FHIR resources
CREATE TABLE IF NOT EXISTS satusehat_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE RESTRICT,
  invoice_resource_id TEXT UNIQUE NOT NULL, -- SatuSehat Invoice resource ID (e.g., Invoice/123)
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  organization_id UUID REFERENCES satusehat_organization(id) ON DELETE SET NULL,

  -- Invoice status tracking
  invoice_status TEXT NOT NULL DEFAULT 'draft' CHECK (invoice_status IN (
    'draft',           -- Not yet submitted to SatuSehat
    'issued',          -- Submitted and accepted
    'balanced',        -- Payment received/fully processed
    'cancelled',       -- Cancelled
    'entered-in-error' -- Erroneous entry
  )),

  -- Financial details
  total_net DECIMAL(12, 2), -- Amount before tax
  total_tax DECIMAL(12, 2), -- Tax amount (usually 0 for healthcare in Indonesia)
  total_gross DECIMAL(12, 2), -- Total amount
  currency TEXT DEFAULT 'IDR',

  -- Invoice metadata
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  payment_terms TEXT, -- e.g., "Due upon receipt"

  -- SatuSehat submission tracking
  submission_id UUID REFERENCES satusehat_submissions(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Compliance: 10-year retention requirement
  archived_at TIMESTAMP WITH TIME ZONE,
  archive_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_billing_id ON satusehat_invoices(billing_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_patient_id ON satusehat_invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_invoice_resource_id ON satusehat_invoices(invoice_resource_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_invoice_status ON satusehat_invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_created_at ON satusehat_invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_submitted_at ON satusehat_invoices(submitted_at);
CREATE INDEX IF NOT EXISTS idx_satusehat_invoices_archived_at ON satusehat_invoices(archived_at);

-- 2. Create satusehat_claims table
-- Tracks BPJS claims via E-Klaim system (foundation structure, currently disabled)
CREATE TABLE IF NOT EXISTS satusehat_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE RESTRICT,
  claim_resource_id TEXT UNIQUE, -- SatuSehat Claim resource ID (e.g., Claim/456)
  claim_response_resource_id TEXT UNIQUE, -- SatuSehat ClaimResponse resource ID
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,

  -- Claim status
  claim_status TEXT NOT NULL DEFAULT 'draft' CHECK (claim_status IN (
    'draft',           -- Not yet submitted
    'active',          -- Submitted to BPJS
    'cancelled',       -- Cancelled
    'entered-in-error' -- Erroneous
  )),

  claim_response_status TEXT CHECK (claim_response_status IN (
    'active',          -- Claim received and being processed
    'cancelled',       -- Claim cancelled by BPJS
    'error'            -- Error in claim processing
  )),

  -- BPJS Integration (hidden/disabled for now)
  bpjs_enabled BOOLEAN DEFAULT FALSE, -- Feature flag for BPJS integration

  -- Claim financial details
  claim_total DECIMAL(12, 2), -- Total amount claimed
  approved_amount DECIMAL(12, 2), -- Amount approved by BPJS
  rejected_amount DECIMAL(12, 2), -- Amount rejected by BPJS

  -- SatuSehat submission tracking
  submission_id UUID REFERENCES satusehat_submissions(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Response tracking
  response_received_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_claims_billing_id ON satusehat_claims(billing_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_claims_patient_id ON satusehat_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_claims_claim_resource_id ON satusehat_claims(claim_resource_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_claims_claim_status ON satusehat_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_satusehat_claims_bpjs_enabled ON satusehat_claims(bpjs_enabled);
CREATE INDEX IF NOT EXISTS idx_satusehat_claims_created_at ON satusehat_claims(created_at);
CREATE INDEX IF NOT EXISTS idx_satusehat_claims_submitted_at ON satusehat_claims(submitted_at);

-- 3. Create invoice_documents table
-- Stores generated PDF invoice metadata with retention tracking
CREATE TABLE IF NOT EXISTS invoice_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES satusehat_invoices(id) ON DELETE CASCADE,
  billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,

  -- Document metadata
  document_type TEXT NOT NULL DEFAULT 'invoice_pdf' CHECK (document_type IN (
    'invoice_pdf',     -- Original invoice PDF
    'receipt_pdf',     -- Payment receipt
    'claim_attachment' -- Attachment for BPJS claim
  )),

  -- File storage
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage (e.g., invoices/2025/01/invoice_xyz.pdf)
  file_size_bytes INTEGER,
  file_mime_type TEXT DEFAULT 'application/pdf',
  file_hash_sha256 TEXT, -- For integrity verification

  -- Document content metadata
  invoice_number TEXT, -- Invoice reference number
  generation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Access and compliance tracking
  is_encrypted BOOLEAN DEFAULT FALSE, -- Encryption status
  encryption_key_id TEXT, -- Reference to encryption key (not the key itself)

  -- Retention and archival (10-year requirement)
  retention_until TIMESTAMP WITH TIME ZONE NOT NULL, -- Calculated as created_at + 10 years
  archived_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_documents_invoice_id ON invoice_documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_billing_id ON invoice_documents(billing_id);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_document_type ON invoice_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_file_path ON invoice_documents(file_path);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_generation_date ON invoice_documents(generation_date);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_retention_until ON invoice_documents(retention_until);
CREATE INDEX IF NOT EXISTS idx_invoice_documents_archived_at ON invoice_documents(archived_at);

-- 4. Create billing_access_logs table
-- Audit trail for billing data access (compliance with Indonesian PDP Law No. 27/2022)
CREATE TABLE IF NOT EXISTS billing_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,

  -- User who accessed the data
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_role TEXT NOT NULL, -- Snapshot of role at time of access

  -- Access details
  access_type TEXT NOT NULL CHECK (access_type IN (
    'view',            -- Read-only access
    'edit',            -- Modification
    'export',          -- Export/download
    'delete',          -- Deletion attempt
    'payment_process', -- Payment processing
    'claim_submit'     -- Claim submission
  )),

  access_status TEXT NOT NULL DEFAULT 'success' CHECK (access_status IN (
    'success',         -- Access allowed
    'denied',          -- Access denied (permission check failed)
    'failed'           -- Access attempt failed (error)
  )),

  -- Data sensitivity tracking
  data_accessed JSONB, -- Metadata about what data was accessed (not the actual data)
  pii_fields_accessed TEXT[], -- Array of PII fields accessed (e.g., ['phone', 'address'])

  -- Network and security info
  ip_address TEXT,
  user_agent TEXT,

  -- Purpose/reason tracking (for compliance)
  access_purpose TEXT CHECK (access_purpose IN (
    'medical_care',         -- Direct medical care
    'billing_processing',   -- Billing/payment processing
    'quality_assurance',    -- Quality assurance
    'audit',                -- Audit/compliance
    'patient_request',      -- Patient data access request
    'legal_requirement'     -- Legal/court requirement
  )),

  -- Related document/action
  invoice_document_id UUID REFERENCES invoice_documents(id) ON DELETE SET NULL,
  related_resource_id TEXT, -- Reference to SatuSehat resource ID if applicable

  -- Notes and reason for access denial/failure
  access_notes TEXT,
  denial_reason TEXT,

  -- Timestamp
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Compliance metadata
  is_audit_required BOOLEAN DEFAULT FALSE, -- Flag for manual audit
  audit_reviewed_at TIMESTAMP WITH TIME ZONE,
  audit_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  audit_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_billing_access_logs_billing_id ON billing_access_logs(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_patient_id ON billing_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_user_id ON billing_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_access_type ON billing_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_access_status ON billing_access_logs(access_status);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_accessed_at ON billing_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_is_audit_required ON billing_access_logs(is_audit_required);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_access_purpose ON billing_access_logs(access_purpose);
CREATE INDEX IF NOT EXISTS idx_billing_access_logs_ip_address ON billing_access_logs(ip_address);

-- 5. Enable Row Level Security (RLS) on new billing tables
ALTER TABLE satusehat_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE satusehat_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_access_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for satusehat_invoices
-- Admin can see all invoices
CREATE POLICY satusehat_invoices_admin_select ON satusehat_invoices
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Front desk can see invoices for patients they manage
CREATE POLICY satusehat_invoices_frontdesk_select ON satusehat_invoices
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'front_desk'
  );

-- Doctors can see invoices for their patients (read-only)
CREATE POLICY satusehat_invoices_doctor_select ON satusehat_invoices
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'doctor' AND
    patient_id IN (
      SELECT DISTINCT patient_id FROM appointments
      WHERE doctor_id = auth.uid()
    )
  );

-- Only admin and front_desk can insert/update invoices
CREATE POLICY satusehat_invoices_admin_write ON satusehat_invoices
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'front_desk')
  );

CREATE POLICY satusehat_invoices_admin_update ON satusehat_invoices
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'front_desk')
  );

-- 7. Create RLS Policies for satusehat_claims
-- Admin only for claims (BPJS feature)
CREATE POLICY satusehat_claims_admin_select ON satusehat_claims
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY satusehat_claims_admin_write ON satusehat_claims
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY satusehat_claims_admin_update ON satusehat_claims
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 8. Create RLS Policies for invoice_documents
-- Admin and front_desk can access
CREATE POLICY invoice_documents_admin_select ON invoice_documents
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY invoice_documents_frontdesk_select ON invoice_documents
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'front_desk'
  );

-- Only admin and front_desk can insert
CREATE POLICY invoice_documents_write ON invoice_documents
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'front_desk')
  );

-- 9. Create RLS Policies for billing_access_logs
-- Only admin can see access logs (compliance requirement)
CREATE POLICY billing_access_logs_admin_select ON billing_access_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Automatic insert on any billing access (via triggers/functions)
CREATE POLICY billing_access_logs_auto_insert ON billing_access_logs
  FOR INSERT WITH CHECK (true);

-- 10. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_billing_table_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_satusehat_invoices_updated_at
  BEFORE UPDATE ON satusehat_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_table_updated_at();

CREATE TRIGGER trigger_satusehat_claims_updated_at
  BEFORE UPDATE ON satusehat_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_table_updated_at();

CREATE TRIGGER trigger_invoice_documents_updated_at
  BEFORE UPDATE ON invoice_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_table_updated_at();

-- 11. Create function to calculate invoice retention until date (10 years)
CREATE OR REPLACE FUNCTION calculate_invoice_retention()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.retention_until IS NULL THEN
    NEW.retention_until := NEW.created_at + INTERVAL '10 years';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_documents_retention
  BEFORE INSERT ON invoice_documents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_retention();

-- 12. Create function to log billing access
-- This function will be called whenever billing data is accessed
CREATE OR REPLACE FUNCTION log_billing_access(
  p_billing_id UUID,
  p_patient_id UUID,
  p_access_type TEXT,
  p_access_purpose TEXT,
  p_data_accessed JSONB DEFAULT NULL,
  p_pii_fields TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get current user's role
  SELECT role INTO v_user_role FROM users WHERE id = auth.uid();

  INSERT INTO billing_access_logs (
    billing_id,
    patient_id,
    user_id,
    user_role,
    access_type,
    access_status,
    access_purpose,
    data_accessed,
    pii_fields_accessed,
    accessed_at
  ) VALUES (
    p_billing_id,
    p_patient_id,
    auth.uid(),
    v_user_role,
    p_access_type,
    'success',
    p_access_purpose,
    p_data_accessed,
    p_pii_fields
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_billing_access TO authenticated;

-- 13. Create view for invoice status summary (compliance reporting)
CREATE OR REPLACE VIEW invoice_status_summary AS
SELECT
  DATE_TRUNC('month', si.invoice_date) AS month,
  si.invoice_status,
  COUNT(*) AS total_invoices,
  SUM(si.total_gross) AS total_amount,
  MIN(si.invoice_date) AS first_invoice_date,
  MAX(si.invoice_date) AS last_invoice_date
FROM satusehat_invoices si
GROUP BY DATE_TRUNC('month', si.invoice_date), si.invoice_status;

-- 14. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION update_billing_table_updated_at TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_invoice_retention TO authenticated;
