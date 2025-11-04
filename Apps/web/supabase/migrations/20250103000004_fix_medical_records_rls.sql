-- Fix medical records RLS policies to be more permissive during development
-- and add missing policies for other tables

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Doctors can create their own medical records" ON medical_records;

-- Create new policy that allows doctors and admins to create medical records
CREATE POLICY "Doctors and admins can create medical records" ON medical_records
  FOR INSERT WITH CHECK (
    get_user_role() IN ('doctor', 'admin')
  );

-- Add missing policies for prescription_items
CREATE POLICY "Authenticated users can view prescription items" ON prescription_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Doctors can create prescription items" ON prescription_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions 
      WHERE prescriptions.id = prescription_items.prescription_id 
      AND prescriptions.doctor_id = auth.uid()
    )
  );

-- Add missing policies for billing_items
CREATE POLICY "Authenticated users can view billing items" ON billing_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Front desk and admin can manage billing items" ON billing_items
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Add missing policies for payments
CREATE POLICY "Authenticated users can view payments" ON payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Front desk and admin can manage payments" ON payments
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Add missing policies for stock_adjustments
CREATE POLICY "Authenticated users can view stock adjustments" ON stock_adjustments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and front desk can create stock adjustments" ON stock_adjustments
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'front_desk')
  );
