-- Check current user and their role
-- Run this in Supabase SQL Editor to see your user info

-- 1. Check all users in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Check users table (which stores roles)
SELECT id, full_name, role, is_active
FROM users
ORDER BY created_at DESC;

-- 3. If you don't have a role, run this to add yourself as admin/doctor:
-- Replace 'YOUR_EMAIL_HERE' with your actual email

/*
-- Example: Set user as doctor
INSERT INTO users (id, full_name, role, phone, is_active)
SELECT id, email, 'doctor', '', true
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (id) DO UPDATE SET role = 'doctor';

-- OR set as admin
INSERT INTO users (id, full_name, role, phone, is_active)
SELECT id, email, 'admin', '', true
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
*/
