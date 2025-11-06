-- Migration: Add diagnosis_text field and make diagnosis_icd10 optional
-- Date: 2025-01-04
-- Description: Support free-text diagnosis with optional ICD-10 codes

-- Add diagnosis_text column for free-text diagnosis
ALTER TABLE medical_records
ADD COLUMN diagnosis_text TEXT;

-- Make diagnosis_icd10 nullable (optional for BPJS)
ALTER TABLE medical_records
ALTER COLUMN diagnosis_icd10 DROP NOT NULL;

-- Make anamnesis nullable (can be empty if not filled)
ALTER TABLE medical_records
ALTER COLUMN anamnesis DROP NOT NULL;

-- Add check constraint to ensure either diagnosis_text or diagnosis_icd10 exists
ALTER TABLE medical_records
ADD CONSTRAINT check_diagnosis_exists
CHECK (
  diagnosis_text IS NOT NULL OR
  (diagnosis_icd10 IS NOT NULL AND array_length(diagnosis_icd10, 1) > 0)
);

-- Add comments
COMMENT ON COLUMN medical_records.diagnosis_text IS 'Free-text diagnosis (primary field)';
COMMENT ON COLUMN medical_records.diagnosis_icd10 IS 'Optional ICD-10 codes for BPJS claims and reporting';
