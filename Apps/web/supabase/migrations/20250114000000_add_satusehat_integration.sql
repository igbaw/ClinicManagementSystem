-- Add SatuSehat integration tables and fields

-- 1. Add SatuSehat fields to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ihs_number TEXT UNIQUE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS satusehat_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS satusehat_sync_status TEXT DEFAULT 'pending' CHECK (satusehat_sync_status IN ('pending', 'synced', 'failed'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_ihs_number ON patients(ihs_number);
CREATE INDEX IF NOT EXISTS idx_patients_satusehat_sync_status ON patients(satusehat_sync_status);

-- 2. Create satusehat_submissions table for audit logging
CREATE TABLE IF NOT EXISTS satusehat_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL, -- Patient, Encounter, Condition, Observation, MedicationRequest, ServiceRequest
  local_id UUID NOT NULL, -- Reference to local record (patient, appointment, etc.)
  resource_id TEXT, -- SatuSehat resource ID (e.g., Patient/123, Encounter/456)
  submission_status TEXT NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'processing', 'success', 'failed')),
  request_payload JSONB NOT NULL, -- Full FHIR request payload
  response_payload JSONB, -- Full FHIR response payload
  error_message TEXT, -- Error details if failed
  http_status_code INTEGER, -- HTTP status code from SatuSehat API
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  last_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_submissions_status ON satusehat_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_satusehat_submissions_resource_type ON satusehat_submissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_satusehat_submissions_local_id ON satusehat_submissions(local_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_submissions_resource_id ON satusehat_submissions(resource_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_submissions_created_at ON satusehat_submissions(created_at);

-- 3. Create satusehat_queue table for pending submissions with retry logic
CREATE TABLE IF NOT EXISTS satusehat_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID UNIQUE NOT NULL REFERENCES satusehat_submissions(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  local_id UUID NOT NULL,
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, -1=low
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_retry_at TIMESTAMP WITH TIME ZONE,
  max_retries INTEGER DEFAULT 3,
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead_letter')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_queue_status ON satusehat_queue(status);
CREATE INDEX IF NOT EXISTS idx_satusehat_queue_next_retry ON satusehat_queue(next_retry_at) WHERE status IN ('queued', 'failed');
CREATE INDEX IF NOT EXISTS idx_satusehat_queue_created_at ON satusehat_queue(created_at);

-- 4. Create satusehat_practitioners table to cache registered practitioners
CREATE TABLE IF NOT EXISTS satusehat_practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT UNIQUE NOT NULL, -- SatuSehat Practitioner/123
  name TEXT NOT NULL,
  identifier_type TEXT, -- SIK, STR, etc.
  identifier_value TEXT,
  specialization TEXT,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_practitioners_resource_id ON satusehat_practitioners(resource_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_practitioners_user_id ON satusehat_practitioners(user_id);

-- 5. Create satusehat_organization table to cache organization/location info
CREATE TABLE IF NOT EXISTS satusehat_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_resource_id TEXT UNIQUE NOT NULL, -- SatuSehat Organization/123
  location_resource_id TEXT UNIQUE NOT NULL, -- SatuSehat Location/456
  clinic_name TEXT NOT NULL,
  clinic_code TEXT, -- IHS or other identifier
  address_detail JSONB,
  contact_info JSONB,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create satusehat_encounters table to link local appointments/medical records to SatuSehat encounters
CREATE TABLE IF NOT EXISTS satusehat_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  encounter_resource_id TEXT UNIQUE, -- SatuSehat Encounter/789
  encounter_status TEXT, -- completed, cancelled, etc.
  submission_id UUID REFERENCES satusehat_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_encounters_appointment_id ON satusehat_encounters(appointment_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_encounters_medical_record_id ON satusehat_encounters(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_encounters_encounter_resource_id ON satusehat_encounters(encounter_resource_id);

-- 7. Create satusehat_sync_events table for compliance and audit trail
CREATE TABLE IF NOT EXISTS satusehat_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- patient_created, encounter_submitted, sync_failed, etc.
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_sync_events_event_type ON satusehat_sync_events(event_type);
CREATE INDEX IF NOT EXISTS idx_satusehat_sync_events_created_at ON satusehat_sync_events(created_at);
CREATE INDEX IF NOT EXISTS idx_satusehat_sync_events_resource_type ON satusehat_sync_events(resource_type);

-- 8. Enable Row Level Security (RLS) on new tables
ALTER TABLE satusehat_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE satusehat_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE satusehat_practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE satusehat_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE satusehat_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE satusehat_sync_events ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies
-- satusehat_submissions: admin only can see all, others see their own
CREATE POLICY satusehat_submissions_admin ON satusehat_submissions
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY satusehat_submissions_submitted_by ON satusehat_submissions
  FOR SELECT USING (
    submitted_by = auth.uid()
  );

-- satusehat_queue: admin and system only
CREATE POLICY satusehat_queue_select ON satusehat_queue
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- satusehat_practitioners: everyone can read (for reference), only admin can insert/update
CREATE POLICY satusehat_practitioners_select ON satusehat_practitioners
  FOR SELECT USING (true);

CREATE POLICY satusehat_practitioners_insert ON satusehat_practitioners
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- satusehat_organization: everyone can read, only admin can insert/update
CREATE POLICY satusehat_organization_select ON satusehat_organization
  FOR SELECT USING (true);

CREATE POLICY satusehat_organization_insert ON satusehat_organization
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- satusehat_encounters: can see own or if admin
CREATE POLICY satusehat_encounters_select ON satusehat_encounters
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    appointment_id IN (SELECT id FROM appointments WHERE assigned_to = auth.uid())
  );

-- satusehat_sync_events: admin only
CREATE POLICY satusehat_sync_events_select ON satusehat_sync_events
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_satusehat_table_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_satusehat_submissions_updated_at
  BEFORE UPDATE ON satusehat_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_satusehat_table_updated_at();

CREATE TRIGGER trigger_satusehat_queue_updated_at
  BEFORE UPDATE ON satusehat_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_satusehat_table_updated_at();

CREATE TRIGGER trigger_satusehat_encounters_updated_at
  BEFORE UPDATE ON satusehat_encounters
  FOR EACH ROW
  EXECUTE FUNCTION update_satusehat_table_updated_at();

-- 11. Create function to automatically create queue item when submission is created
CREATE OR REPLACE FUNCTION create_queue_item_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO satusehat_queue (
    submission_id,
    resource_type,
    local_id,
    priority,
    scheduled_for,
    status
  ) VALUES (
    NEW.id,
    NEW.resource_type,
    NEW.local_id,
    0,
    NOW(),
    'queued'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_queue_on_submission
  AFTER INSERT ON satusehat_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_queue_item_on_submission();

-- 12. Create function to log sync events
CREATE OR REPLACE FUNCTION log_satusehat_sync_event(
  p_event_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO satusehat_sync_events (
    event_type,
    resource_type,
    resource_id,
    details,
    user_id
  ) VALUES (
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_details,
    auth.uid()
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION log_satusehat_sync_event TO authenticated;
GRANT EXECUTE ON FUNCTION update_satusehat_table_updated_at TO authenticated;
