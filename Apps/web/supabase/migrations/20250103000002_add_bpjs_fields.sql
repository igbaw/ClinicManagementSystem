-- Add BPJS-related fields to appointments table
ALTER TABLE appointments
ADD COLUMN sep_number TEXT,
ADD COLUMN bpjs_card_number TEXT,
ADD COLUMN rujukan_number TEXT,
ADD COLUMN rujukan_date DATE,
ADD COLUMN rujukan_ppk_code TEXT;

-- Create index for SEP number lookup
CREATE INDEX idx_appointments_sep_number ON appointments(sep_number);

-- Add comment for documentation
COMMENT ON COLUMN appointments.sep_number IS 'BPJS SEP (Surat Eligibilitas Peserta) number';
COMMENT ON COLUMN appointments.bpjs_card_number IS 'Patient BPJS card number used for this appointment';
COMMENT ON COLUMN appointments.rujukan_number IS 'Referral number from Faskes 1';
COMMENT ON COLUMN appointments.rujukan_date IS 'Referral issue date';
COMMENT ON COLUMN appointments.rujukan_ppk_code IS 'Referring Faskes PPK code';
