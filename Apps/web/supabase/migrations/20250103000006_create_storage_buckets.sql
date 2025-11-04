-- Create storage buckets for the clinic management system
-- These buckets will store patient photos and medical record attachments

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket for patient profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patients',
  'patients',
  false,  -- Not public, requires authentication
  5242880,  -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Bucket for medical record attachments (examination photos, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-attachments',
  'medical-attachments',
  false,  -- Not public, requires authentication
  10485760,  -- 10MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- ============================================
-- STORAGE POLICIES - Patient Photos
-- ============================================

-- Allow authenticated users to upload patient photos
DROP POLICY IF EXISTS "Authenticated users can upload patient photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload patient photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patients');

-- Allow authenticated users to view patient photos
DROP POLICY IF EXISTS "Authenticated users can view patient photos" ON storage.objects;
CREATE POLICY "Authenticated users can view patient photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'patients');

-- Allow authenticated users to update patient photos
DROP POLICY IF EXISTS "Authenticated users can update patient photos" ON storage.objects;
CREATE POLICY "Authenticated users can update patient photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'patients')
  WITH CHECK (bucket_id = 'patients');

-- Allow authenticated users to delete patient photos
DROP POLICY IF EXISTS "Authenticated users can delete patient photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete patient photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'patients');

-- ============================================
-- STORAGE POLICIES - Medical Attachments
-- ============================================

-- Allow authenticated users to upload medical attachments
DROP POLICY IF EXISTS "Authenticated users can upload medical attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload medical attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'medical-attachments');

-- Allow authenticated users to view medical attachments
DROP POLICY IF EXISTS "Authenticated users can view medical attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view medical attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'medical-attachments');

-- Allow authenticated users to update medical attachments
DROP POLICY IF EXISTS "Authenticated users can update medical attachments" ON storage.objects;
CREATE POLICY "Authenticated users can update medical attachments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'medical-attachments')
  WITH CHECK (bucket_id = 'medical-attachments');

-- Allow doctors and admins to delete medical attachments
DROP POLICY IF EXISTS "Doctors and admins can delete medical attachments" ON storage.objects;
CREATE POLICY "Doctors and admins can delete medical attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'medical-attachments' 
    AND get_user_role() IN ('doctor', 'admin')
  );

-- ============================================
-- NOTES
-- ============================================
-- 1. Patient photos bucket (5MB limit):
--    - Used for patient profile pictures during registration
--    - Only image files allowed
--    - All authenticated users can upload/view
--
-- 2. Medical attachments bucket (10MB limit):
--    - Used for examination photos, x-rays, documents
--    - Images and PDFs allowed
--    - Only doctors/admins can delete
--
-- 3. Both buckets are private (not public)
--    - Files require authentication to access
--    - Use .getPublicUrl() or signed URLs for access
--
-- 4. File size limits can be adjusted based on needs:
--    - Current: 5MB for patient photos, 10MB for medical attachments
--    - Adjust in the INSERT statements above if needed
