-- Initial Doctor Setup
-- Run this in Supabase SQL Editor to add your first doctor

-- Step 1: Create your wife's user account in Supabase Auth (do this via Supabase Dashboard first)
-- Go to: Authentication > Users > Add User
-- Email: doctor@yourdomain.com (or her email)
-- Password: (set a secure password)
-- Email Confirm: Yes

-- Step 2: After creating the auth user, get the user ID from Supabase Dashboard
-- Then run this SQL, replacing the UUID with the actual user ID:

-- Update the user's profile in the users table
UPDATE public.users
SET 
  role = 'doctor',
  full_name = 'Dr. [Your Wife''s Name]',
  phone = '08123456789', -- Replace with actual phone
  email = 'doctor@yourdomain.com', -- Replace with actual email
  is_active = true,
  updated_at = NOW()
WHERE id = 'REPLACE-WITH-ACTUAL-USER-ID-FROM-SUPABASE';

-- If the user doesn't exist in the users table yet, INSERT instead:
-- INSERT INTO public.users (
--   id,
--   email,
--   full_name,
--   role,
--   phone,
--   is_active,
--   created_at,
--   updated_at
-- ) VALUES (
--   'REPLACE-WITH-ACTUAL-USER-ID-FROM-SUPABASE',
--   'doctor@yourdomain.com',
--   'Dr. [Your Wife''s Name]',
--   'doctor',
--   '08123456789',
--   true,
--   NOW(),
--   NOW()
-- );

-- Optional: Add additional doctor metadata if needed in the future
-- For now, the basic user record is sufficient for appointments
