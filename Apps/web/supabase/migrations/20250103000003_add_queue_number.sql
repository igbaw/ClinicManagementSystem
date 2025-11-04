-- Add queue_number column to appointments table
ALTER TABLE appointments
ADD COLUMN queue_number INTEGER;

-- Add index for queue_number lookup
CREATE INDEX idx_appointments_queue_number ON appointments(queue_number, appointment_date);

-- Add comment for documentation
COMMENT ON COLUMN appointments.queue_number IS 'Queue number for the appointment on a specific date';
