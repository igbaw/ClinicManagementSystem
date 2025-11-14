-- =====================================================
-- Migration: Add vital_signs column to queue_entries
-- Date: 2025-01-04
-- Description: Stores vital signs JSON captured at check-in
-- =====================================================

ALTER TABLE queue_entries
ADD COLUMN IF NOT EXISTS vital_signs JSONB;

COMMENT ON COLUMN queue_entries.vital_signs IS
  'Vital signs captured at check-in time (e.g. blood pressure, pulse, temperature, weight, height).';
