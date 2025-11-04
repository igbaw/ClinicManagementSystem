-- ============================================
-- Row-Level Security (RLS) Policies
-- ENT Clinic Management System
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS Table Policies
-- ============================================

-- Allow authenticated users to read all users (for dropdowns, listings)
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to insert new users (via service role or admin panel)
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any user
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PATIENTS Table Policies
-- ============================================

-- Allow all authenticated users to read patients
CREATE POLICY "Authenticated users can read patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert patients
CREATE POLICY "Authenticated users can create patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update patients
CREATE POLICY "Authenticated users can update patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete patients (soft delete recommended)
CREATE POLICY "Authenticated users can delete patients"
  ON patients
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- APPOINTMENTS Table Policies
-- ============================================

-- Allow all authenticated users to read appointments
CREATE POLICY "Authenticated users can read appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create appointments
CREATE POLICY "Authenticated users can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update appointments
CREATE POLICY "Authenticated users can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete appointments
CREATE POLICY "Authenticated users can delete appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- MEDICAL_RECORDS Table Policies
-- ============================================

-- Allow all authenticated users to read medical records
CREATE POLICY "Authenticated users can read medical records"
  ON medical_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow doctors to create medical records
CREATE POLICY "Doctors can create medical records"
  ON medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

-- Allow doctors to update their own medical records within 24 hours
CREATE POLICY "Doctors can update own recent medical records"
  ON medical_records
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid() AND
    created_at > (NOW() - INTERVAL '24 hours')
  );

-- Allow admins to update any medical record
CREATE POLICY "Admins can update any medical record"
  ON medical_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STORAGE Policies (for patient photos, attachments)
-- ============================================

-- Patient Photos Bucket
-- Allow authenticated users to upload patient photos
CREATE POLICY "Authenticated users can upload patient photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-photos');

-- Allow authenticated users to view patient photos
CREATE POLICY "Authenticated users can view patient photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'patient-photos');

-- Allow authenticated users to update patient photos
CREATE POLICY "Authenticated users can update patient photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'patient-photos');

-- Allow authenticated users to delete patient photos
CREATE POLICY "Authenticated users can delete patient photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'patient-photos');

-- Medical Record Attachments Bucket (if you create one)
CREATE POLICY "Authenticated users can upload medical attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'medical-attachments');

CREATE POLICY "Authenticated users can view medical attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'medical-attachments');

-- ============================================
-- NOTES:
-- ============================================
-- 1. These policies allow all authenticated users full access
--    This is appropriate for a small clinic where all staff should access patient data
--
-- 2. Medical records have special protection:
--    - Only doctors/admins can create
--    - Doctors can only edit their own records within 24 hours
--    - Admins can edit any record anytime
--
-- 3. For enhanced security in larger clinics, you might want to:
--    - Restrict patient access by assigned doctor
--    - Add role-based restrictions (receptionist vs doctor vs admin)
--    - Add audit logging for sensitive operations
--
-- 4. To apply these policies, run this SQL in Supabase SQL Editor
--    Make sure to drop existing conflicting policies first if needed:
--    DROP POLICY IF EXISTS "policy_name" ON table_name;
