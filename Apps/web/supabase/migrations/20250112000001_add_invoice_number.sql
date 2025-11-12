-- Add invoice_number to billings table with auto-generation
-- Format: INV-YYYYMMDD-XXXX (sequential per day)

-- Add the column
ALTER TABLE billings ADD COLUMN invoice_number TEXT UNIQUE;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  seq_num INTEGER;
BEGIN
  -- Only generate if not already set
  IF NEW.invoice_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Format: YYYYMMDD from billing_date
  date_prefix := TO_CHAR(NEW.billing_date, 'YYYYMMDD');

  -- Get next sequence number for this date
  -- Find the highest number used for this date and add 1
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(invoice_number FROM 'INV-\d{8}-(\d{4})') AS INTEGER
      )
    ),
    0
  ) + 1
  INTO seq_num
  FROM billings
  WHERE invoice_number LIKE 'INV-' || date_prefix || '-%';

  -- Generate invoice number: INV-YYYYMMDD-XXXX
  NEW.invoice_number := 'INV-' || date_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice number on insert
CREATE TRIGGER set_invoice_number_on_insert
BEFORE INSERT ON billings
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();

-- Backfill existing records
DO $$
DECLARE
  billing_record RECORD;
  date_prefix TEXT;
  seq_num INTEGER;
BEGIN
  -- Process existing billings ordered by billing_date
  FOR billing_record IN
    SELECT id, billing_date
    FROM billings
    WHERE invoice_number IS NULL
    ORDER BY billing_date, created_at
  LOOP
    date_prefix := TO_CHAR(billing_record.billing_date, 'YYYYMMDD');

    -- Get next sequence for this date
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(invoice_number FROM 'INV-\d{8}-(\d{4})') AS INTEGER
        )
      ),
      0
    ) + 1
    INTO seq_num
    FROM billings
    WHERE invoice_number LIKE 'INV-' || date_prefix || '-%';

    -- Update the record
    UPDATE billings
    SET invoice_number = 'INV-' || date_prefix || '-' || LPAD(seq_num::TEXT, 4, '0')
    WHERE id = billing_record.id;
  END LOOP;
END $$;

-- Make invoice_number NOT NULL after backfill
ALTER TABLE billings ALTER COLUMN invoice_number SET NOT NULL;

-- Add index for fast lookup
CREATE INDEX idx_billings_invoice_number ON billings(invoice_number);

-- Add comment
COMMENT ON COLUMN billings.invoice_number IS 'Human-readable invoice number in format INV-YYYYMMDD-XXXX';
