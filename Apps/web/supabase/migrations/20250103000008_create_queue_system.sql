-- =====================================================
-- Migration: Create Unified Queue System
-- Date: 2025-01-03
-- Description: Creates queue_entries table, adds booking_code to appointments
-- =====================================================

-- =====================================================
-- PART 1: Add booking_code to appointments table
-- =====================================================

-- Add booking_code column
ALTER TABLE appointments
ADD COLUMN booking_code VARCHAR(12) UNIQUE;

-- Create index for fast booking code lookup
CREATE INDEX idx_appointments_booking_code 
  ON appointments(booking_code) WHERE booking_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN appointments.booking_code IS 
  'Unique booking code for quick check-in. Format: BK-YYYYMMDD-XXX. Auto-generated on insert.';

-- =====================================================
-- PART 2: Booking code generation function
-- =====================================================

-- Function to generate unique booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  code VARCHAR(12);
  code_exists BOOLEAN := TRUE;
BEGIN
  WHILE code_exists LOOP
    -- Format: BK-YYYYMMDD-XXX
    -- Example: BK-20251103-A4K
    code := 'BK' || 
            to_char(CURRENT_DATE, 'YYYYMMDD') || 
            upper(substring(md5(random()::text) from 1 for 2));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM appointments WHERE booking_code = code
    ) INTO code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate booking code on insert
CREATE OR REPLACE FUNCTION set_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER appointments_booking_code_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_code();

-- =====================================================
-- PART 3: Create queue_entries table
-- =====================================================

CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient & Doctor
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Queue Information
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  queue_number INTEGER NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('appointment', 'walk-in')),
  
  -- Link to appointment (if from scheduled appointment)
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  
  -- Timestamps
  check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Additional info
  chief_complaint TEXT,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(queue_date, doctor_id, queue_number),
  
  -- Check: appointment entries must have appointment_id
  CONSTRAINT check_appointment_has_id 
    CHECK (entry_type != 'appointment' OR appointment_id IS NOT NULL)
);

-- =====================================================
-- PART 4: Indexes for queue_entries
-- =====================================================

CREATE INDEX idx_queue_entries_date_status 
  ON queue_entries(queue_date, status);

CREATE INDEX idx_queue_entries_doctor_date 
  ON queue_entries(doctor_id, queue_date, queue_number);

CREATE INDEX idx_queue_entries_patient 
  ON queue_entries(patient_id, queue_date);

CREATE INDEX idx_queue_entries_appointment 
  ON queue_entries(appointment_id) WHERE appointment_id IS NOT NULL;

CREATE INDEX idx_queue_entries_status_date
  ON queue_entries(status, queue_date)
  WHERE status IN ('waiting', 'in_progress');

-- =====================================================
-- PART 5: Comments for documentation
-- =====================================================

COMMENT ON TABLE queue_entries IS 
  'Unified queue system for both scheduled appointments and walk-in patients. Single source of truth for queue management.';

COMMENT ON COLUMN queue_entries.entry_type IS 
  'Type of queue entry: "appointment" = checked-in from scheduled appointment, "walk-in" = patient without appointment';

COMMENT ON COLUMN queue_entries.appointment_id IS 
  'Links to appointment if this queue entry originated from a scheduled appointment. NULL for walk-ins.';

COMMENT ON COLUMN queue_entries.queue_number IS 
  'Sequential queue number per doctor per day. Shared between appointments and walk-ins.';

COMMENT ON COLUMN queue_entries.chief_complaint IS 
  'Patient complaint captured at check-in time. Helps doctor prepare for consultation.';

COMMENT ON COLUMN queue_entries.status IS 
  'Queue status: waiting (checked in), in_progress (being examined), completed (done), cancelled (did not see doctor)';

-- =====================================================
-- PART 6: Add queue_entry_id to medical_records
-- =====================================================

ALTER TABLE medical_records 
ADD COLUMN queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL;

CREATE INDEX idx_medical_records_queue_entry 
  ON medical_records(queue_entry_id);

COMMENT ON COLUMN medical_records.queue_entry_id IS 
  'Links to the queue entry this medical record was created from. Used to track queue completion.';

-- =====================================================
-- PART 7: RLS Policies for queue_entries
-- =====================================================

-- Enable RLS
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view queue entries for their assigned doctor or if they're admin/front_desk
CREATE POLICY "Users can view their doctor's queue"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'front_desk')
    )
  );

-- Policy: Authorized users can create queue entries
CREATE POLICY "Authorized users can create queue entries"
  ON queue_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('doctor', 'admin', 'front_desk')
    )
  );

-- Policy: Users can update their own queue entries
CREATE POLICY "Users can update their queue entries"
  ON queue_entries FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'front_desk')
    )
  );

-- Policy: Only admins can delete queue entries
CREATE POLICY "Admins can delete queue entries"
  ON queue_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- PART 8: Helper function to generate next queue number
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_queue_number(
  p_doctor_id UUID,
  p_queue_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1 INTO next_number
  FROM queue_entries
  WHERE doctor_id = p_doctor_id
    AND queue_date = p_queue_date;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_queue_number IS 
  'Generates the next sequential queue number for a specific doctor and date';

-- =====================================================
-- PART 9: Trigger to auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_queue_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set started_at when status changes to in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.started_at = NOW();
  END IF;
  
  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_entries_updated_at
  BEFORE UPDATE ON queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_entry_timestamp();

-- =====================================================
-- PART 10: Generate booking codes for existing appointments
-- =====================================================

-- Update existing appointments without booking codes
UPDATE appointments
SET booking_code = generate_booking_code()
WHERE booking_code IS NULL
  AND appointment_date >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- Migration complete
-- =====================================================
