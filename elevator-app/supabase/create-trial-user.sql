-- Create trial account for staff testing
-- Password: FiecAdmin2026!
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'upsndownco@gmail.com',
  crypt('FiecAdmin2026!', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- Add admin profile for the new user
INSERT INTO profiles (id, role, full_name)
SELECT id, 'admin', 'Trial Admin' FROM auth.users WHERE email = 'upsndownco@gmail.com'
ON CONFLICT (id) DO NOTHING;
