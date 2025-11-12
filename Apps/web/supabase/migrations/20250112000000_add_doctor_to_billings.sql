-- Add doctor_id to billings table
-- This allows tracking which doctor provided the service for billing attribution

-- Add the column (nullable first for backfill)
ALTER TABLE billings ADD COLUMN doctor_id UUID REFERENCES users(id);

-- Backfill doctor_id from medical_records
UPDATE billings b
SET doctor_id = mr.doctor_id
FROM medical_records mr
WHERE b.medical_record_id = mr.id
AND b.doctor_id IS NULL;

-- For billings without medical_record_id, we cannot backfill
-- These should be rare, but leave them nullable for now
-- In production, you may want to set a default doctor or handle these manually

-- Add index for performance
CREATE INDEX idx_billings_doctor_id ON billings(doctor_id);

-- Add comment
COMMENT ON COLUMN billings.doctor_id IS 'Doctor who provided the service being billed';
