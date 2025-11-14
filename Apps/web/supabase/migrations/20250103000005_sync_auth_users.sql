-- Sync existing auth.users to users table with default role
-- This ensures all authenticated users have a role

-- Insert any auth users that don't exist in users table yet
-- Default to 'doctor' role (you can change this to 'admin' or 'front_desk' as needed)
INSERT INTO users (id, full_name, role, phone, is_active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  'doctor' as role,  -- Default role (change to 'admin' if needed)
  COALESCE(au.raw_user_meta_data->>'phone', '') as phone,
  true as is_active
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE users.id = au.id
);

-- Create a trigger to automatically create user record when someone signs up
CREATE OR REPLACE FUNCTION create_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create user if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = NEW.id
  ) THEN
    INSERT INTO public.users (id, full_name, role, phone, is_active)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),  -- Default to doctor
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_on_signup();
