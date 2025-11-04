-- Function to safely deduct medication stock
CREATE OR REPLACE FUNCTION deduct_medication_stock(
  p_medication_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock and lock the row
  SELECT stock_quantity INTO current_stock
  FROM medications
  WHERE id = p_medication_id
  FOR UPDATE;

  -- Check if sufficient stock is available
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', current_stock, p_quantity;
  END IF;

  -- Deduct the stock
  UPDATE medications
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_medication_id;

  -- Log the stock transaction
  INSERT INTO stock_adjustments (
    medication_id,
    adjustment_type,
    quantity,
    reference_type,
    reference_id,
    notes,
    created_at
  ) VALUES (
    p_medication_id,
    'dispensed',
    -p_quantity,
    'prescription',
    p_medication_id, -- This will be updated with actual prescription ID in the application
    'Stock deducted for prescription dispensing',
    NOW()
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Stock deduction failed: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create stock_adjustments table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('purchase', 'dispensed', 'adjustment', 'expired', 'damaged')),
  quantity INTEGER NOT NULL, -- Positive for additions, negative for deductions
  reference_type TEXT, -- 'prescription', 'purchase', 'manual'
  reference_id UUID, -- ID of the related record
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for stock_adjustments
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Policy for stock_adjustments
CREATE POLICY "Authenticated users can view stock adjustments" ON stock_adjustments
FOR SELECT USING (auth.role() IN ('authenticated'));

CREATE POLICY "Admin and front desk can manage stock adjustments" ON stock_adjustments
FOR ALL USING (
  auth.role() IN ('authenticated') AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'front_desk')
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_medication ON stock_adjustments(medication_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at);
