-- Seed default front desk user for easy testing and initial setup
-- Email: frontdesk@aionclinic.com
-- Password: !Password.123
-- This user will be auto-approved (email confirmed)

-- Insert into auth.users (Supabase Auth table)
-- Using a fixed UUID for reproducibility
DO $$
DECLARE
  user_id uuid := '00000000-0000-0000-0000-000000000001';
  user_email text := 'frontdesk@aionclinic.com';
  user_password text := '!Password.123';
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  ) THEN
    -- Insert the auth user with confirmed email
    -- Using a simple hash approach that works with Supabase
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      confirmation_token,
      recovery_token
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000', -- default instance_id
      user_email,
      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9xqKS', -- pre-hashed bcrypt for '!Password.123'
      NOW(), -- auto-confirm email
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"default_role": "front_desk"}',
      'authenticated',
      'authenticated',
      '',
      ''
    );

    -- Insert into public.users table with front_desk role
    IF NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = user_id
    ) THEN
      INSERT INTO public.users (
        id,
        full_name,
        role,
        phone,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        user_id,
        'Front Desk User',
        'front_desk',
        '+62123456789',
        true,
        NOW(),
        NOW()
      );
    END IF;

    RAISE NOTICE 'Default front desk user created successfully';
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'Password: %', user_password;
  ELSE
    RAISE NOTICE 'Front desk user already exists, skipping...';
  END IF;
END $$;

-- Create identities record for email auth (required by Supabase Auth)
DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_user_email text := 'frontdesk@aionclinic.com';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user_id
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      'email',
      json_build_object(
        'sub', v_user_id::text,
        'email', v_user_email,
        'email_verified', true
      ),
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;