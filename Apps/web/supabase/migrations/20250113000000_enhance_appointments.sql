-- Migration: Enhance Appointments Module
-- Description: Add cancellation tracking, appointment history, and improved functionality
-- Date: 2025-01-13

-- Add cancellation fields to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);

-- Add index for cancelled appointments
CREATE INDEX IF NOT EXISTS idx_appointments_cancelled
  ON appointments(cancelled_at)
  WHERE cancelled_at IS NOT NULL;

-- Create appointment_history table for audit trail
CREATE TABLE IF NOT EXISTS appointment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Add index for appointment history lookups
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment
  ON appointment_history(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_history_changed_at
  ON appointment_history(changed_at DESC);

-- Function to log appointment changes
CREATE OR REPLACE FUNCTION log_appointment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log doctor changes
  IF OLD.doctor_id IS DISTINCT FROM NEW.doctor_id THEN
    INSERT INTO appointment_history (appointment_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'doctor_id', OLD.doctor_id::text, NEW.doctor_id::text);
  END IF;

  -- Log date changes
  IF OLD.appointment_date IS DISTINCT FROM NEW.appointment_date THEN
    INSERT INTO appointment_history (appointment_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'appointment_date', OLD.appointment_date::text, NEW.appointment_date::text);
  END IF;

  -- Log time changes
  IF OLD.appointment_time IS DISTINCT FROM NEW.appointment_time THEN
    INSERT INTO appointment_history (appointment_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'appointment_time', OLD.appointment_time::text, NEW.appointment_time::text);
  END IF;

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO appointment_history (appointment_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status, NEW.status);
  END IF;

  -- Log cancellation
  IF OLD.cancelled_at IS NULL AND NEW.cancelled_at IS NOT NULL THEN
    INSERT INTO appointment_history (appointment_id, changed_by, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'cancelled', 'false', 'true');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log appointment changes
DROP TRIGGER IF EXISTS appointment_changes_trigger ON appointments;
CREATE TRIGGER appointment_changes_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_appointment_change();

-- Add RLS policies for appointment_history
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view appointment history
CREATE POLICY "Users can view appointment history"
  ON appointment_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow system to insert appointment history (via trigger)
CREATE POLICY "System can insert appointment history"
  ON appointment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comment on tables and columns
COMMENT ON COLUMN appointments.cancelled_reason IS 'Reason for cancellation (if cancelled)';
COMMENT ON COLUMN appointments.cancelled_at IS 'Timestamp when appointment was cancelled';
COMMENT ON COLUMN appointments.cancelled_by IS 'User who cancelled the appointment';
COMMENT ON TABLE appointment_history IS 'Audit trail for appointment changes';
COMMENT ON COLUMN appointment_history.field_name IS 'Name of the field that changed';
COMMENT ON COLUMN appointment_history.old_value IS 'Previous value before change';
COMMENT ON COLUMN appointment_history.new_value IS 'New value after change';
