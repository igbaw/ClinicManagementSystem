-- Identify duplicate medical records for the same appointment
-- Run this first to see what duplicates exist

SELECT 
  appointment_id,
  COUNT(*) as record_count,
  STRING_AGG(id::text, ', ') as medical_record_ids,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM medical_records
WHERE appointment_id IS NOT NULL
GROUP BY appointment_id
HAVING COUNT(*) > 1
ORDER BY last_created DESC;

-- To clean up duplicates (keeping the oldest record):
-- Uncomment and run this after reviewing the duplicates above

/*
-- Delete duplicate medical records, keeping only the first one created
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
*/
