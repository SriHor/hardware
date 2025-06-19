/*
  # Create Authentication User

  1. New User Record
    - Creates a user in auth.users table for authentication
    - Links to our users table via auth_user_id
    - Sets up default admin user with known credentials

  2. Security
    - Uses Supabase's built-in authentication system
    - Password is securely hashed by Supabase
    - Email confirmation is disabled for demo purposes

  3. Demo Credentials
    - Email: admin@example.com
    - Password: password123
*/

-- Insert user into auth.users table (Supabase's authentication table)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the auth user ID we just created
DO $$
DECLARE
  auth_user_uuid uuid;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_uuid 
  FROM auth.users 
  WHERE email = 'admin@example.com';
  
  -- Update our users table to link with the auth user
  UPDATE users 
  SET auth_user_id = auth_user_uuid 
  WHERE email = 'admin@example.com';
  
  -- If no user exists in our users table, create one
  IF NOT FOUND THEN
    INSERT INTO users (auth_user_id, name, email, role, active, created_at, updated_at)
    VALUES (auth_user_uuid, 'Admin User', 'admin@example.com', 'admin', true, NOW(), NOW());
  END IF;
END $$;

-- Create a trigger function to automatically create user records when auth users are created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_user_id, name, email, role, active, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'frontoffice',
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();