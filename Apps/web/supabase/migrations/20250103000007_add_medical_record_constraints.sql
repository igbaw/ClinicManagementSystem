-- Add constraint to ensure one medical record per appointment
-- This follows best practice: one appointment = one medical record

-- First, clean up any existing duplicates (keep the oldest record)
DELETE FROM medical_records
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      appointment_id,
      ROW_NUMBER() OVER (
        PARTITION BY appointment_id 
        ORDER BY created_at ASC
      ) as rn
    FROM medical_records
    WHERE appointment_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Add unique constraint on appointment_id to prevent future duplicates
-- Note: appointment_id can be NULL (for walk-in patients without appointment)
-- So we create a unique index where appointment_id is not NULL
CREATE UNIQUE INDEX unique_medical_record_per_appointment 
ON medical_records(appointment_id) 
WHERE appointment_id IS NOT NULL;

-- Add index for faster lookups by patient
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date 
ON medical_records(patient_id, created_at DESC);

-- Add index for faster lookups by doctor
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_date 
ON medical_records(doctor_id, created_at DESC);

-- Add comment for documentation
COMMENT ON INDEX unique_medical_record_per_appointment IS 
'Ensures one medical record per appointment - prevents duplicate documentation. Medical records without appointments (walk-ins) are allowed multiple times.';

-- ============================================
-- BEST PRACTICES FOR MEDICAL RECORDS
-- ============================================
-- 1. One Appointment = One Medical Record
--    - Each appointment should have exactly one medical record
--    - This ensures data integrity and audit trail
--    - Prevents confusion and duplicate billing
--
-- 2. Medical Records Are Immutable
--    - Once created, medical records should not be edited
--    - Use addendums or notes for corrections
--    - This maintains legal and regulatory compliance
--
-- 3. Walk-in Patients
--    - Patients without appointments (appointment_id = NULL) 
--      can have multiple medical records
--    - Identified by patient_id + visit_date
--
-- 4. Audit Trail
--    - All medical records have created_at and updated_at
--    - Track who created the record (doctor_id)
--    - Store original data without modifications
