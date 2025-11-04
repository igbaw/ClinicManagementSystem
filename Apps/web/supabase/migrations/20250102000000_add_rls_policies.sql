-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage users" ON users
  FOR ALL USING (get_user_role() = 'admin');

-- Patients table policies
CREATE POLICY "All authenticated users can view patients" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Front desk and admin can create patients" ON patients
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'front_desk')
  );

CREATE POLICY "Front desk and admin can update patients" ON patients
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Appointments table policies
CREATE POLICY "All authenticated users can view appointments" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Front desk and admin can manage appointments" ON appointments
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Medical records table policies
CREATE POLICY "Doctors and admin can view medical records" ON medical_records
  FOR SELECT USING (
    get_user_role() IN ('admin', 'doctor') OR doctor_id = auth.uid()
  );

CREATE POLICY "Doctors can create their own medical records" ON medical_records
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid() AND get_user_role() IN ('doctor', 'admin')
  );

CREATE POLICY "Doctors can update their own records within 24 hours" ON medical_records
  FOR UPDATE USING (
    doctor_id = auth.uid() 
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Prescriptions table policies
CREATE POLICY "Doctors and admin can view prescriptions" ON prescriptions
  FOR SELECT USING (
    get_user_role() IN ('admin', 'doctor', 'front_desk')
  );

CREATE POLICY "Doctors can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid() AND get_user_role() IN ('doctor', 'admin')
  );

-- Medications table policies
CREATE POLICY "All authenticated users can view medications" ON medications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and front desk can manage medications" ON medications
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Billing policies
CREATE POLICY "Front desk and admin can manage billings" ON billings
  FOR ALL USING (
    get_user_role() IN ('admin', 'front_desk')
  );

-- Services and ICD-10 (read-only for most users)
CREATE POLICY "All authenticated users can view services" ON services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage services" ON services
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "All authenticated users can view ICD-10 codes" ON icd10_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage ICD-10 codes" ON icd10_codes
  FOR ALL USING (get_user_role() = 'admin');
