/*
  # Fix Staff Management Issues

  1. RLS Policies
    - Add proper RLS policies for users table
    - Allow admins and managers to manage staff
    - Allow users to read their own data

  2. Security
    - Enable proper authentication checks
    - Add permission-based access control
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "users_select_own_profile" ON users;
  DROP POLICY IF EXISTS "users_update_own_profile" ON users;
  DROP POLICY IF EXISTS "users_insert_admin_manager" ON users;
  DROP POLICY IF EXISTS "users_update_admin_manager" ON users;
  DROP POLICY IF EXISTS "users_select_authenticated" ON users;
END $$;

-- Create comprehensive RLS policies for users table
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "users_insert_admin_manager" ON users
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('admin', 'manager')
      AND u.active = true
    )
  );

CREATE POLICY "users_update_admin_manager" ON users
  FOR UPDATE TO authenticated 
  USING (
    -- Allow admins to update anyone, managers to update non-admins, users to update themselves
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() 
      AND (
        (u.role = 'admin' AND u.active = true) OR
        (u.role = 'manager' AND u.active = true AND users.role != 'admin') OR
        (u.id = users.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() 
      AND (
        (u.role = 'admin' AND u.active = true) OR
        (u.role = 'manager' AND u.active = true AND users.role != 'admin') OR
        (u.id = users.id)
      )
    )
  );

CREATE POLICY "users_delete_admin_only" ON users
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'admin'
      AND u.active = true
    )
  );

-- Ensure the admin user exists and has proper setup
DO $$
DECLARE
    admin_designation_id uuid;
    admin_user_id uuid;
    admin_auth_id uuid;
BEGIN
    -- Get the System Administrator designation ID
    SELECT id INTO admin_designation_id 
    FROM designations 
    WHERE name = 'System Administrator' 
    LIMIT 1;

    -- If designation doesn't exist, create it
    IF admin_designation_id IS NULL THEN
        INSERT INTO designations (name, description, department, level, is_active)
        VALUES ('System Administrator', 'Full system access and management', 'IT', 4, true)
        RETURNING id INTO admin_designation_id;
    END IF;

    -- Check if admin user exists in auth.users
    SELECT id INTO admin_auth_id 
    FROM auth.users 
    WHERE email = 'admin@example.com' 
    LIMIT 1;

    -- Update or create the admin user in users table
    INSERT INTO users (
        auth_user_id,
        name,
        email,
        role,
        designation_id,
        active,
        created_at,
        updated_at
    ) VALUES (
        admin_auth_id,
        'System Administrator',
        'admin@example.com',
        'admin',
        admin_designation_id,
        true,
        now(),
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        auth_user_id = COALESCE(EXCLUDED.auth_user_id, users.auth_user_id),
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        designation_id = EXCLUDED.designation_id,
        active = EXCLUDED.active,
        updated_at = now()
    RETURNING id INTO admin_user_id;

    RAISE NOTICE 'Admin user setup completed - ID: %, Auth ID: %', admin_user_id, admin_auth_id;
END $$;

-- Create a function to safely insert users with proper validation
CREATE OR REPLACE FUNCTION create_user_safe(
  p_name text,
  p_email text,
  p_role text,
  p_designation_id uuid DEFAULT NULL,
  p_active boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM users 
  WHERE auth_user_id = auth.uid() AND active = true;
  
  -- Check permissions
  IF current_user_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Insufficient permissions to create users';
  END IF;
  
  -- Managers cannot create admin users
  IF current_user_role = 'manager' AND p_role = 'admin' THEN
    RAISE EXCEPTION 'Managers cannot create admin users';
  END IF;
  
  -- Insert the new user
  INSERT INTO users (
    name,
    email,
    role,
    designation_id,
    active,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_email,
    p_role,
    p_designation_id,
    p_active,
    now(),
    now()
  ) RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_user_safe TO authenticated;

-- Add some sample staff members for testing (only if they don't exist)
DO $$
DECLARE
    engineer_designation_id uuid;
    telecaller_designation_id uuid;
    frontoffice_designation_id uuid;
BEGIN
    -- Get designation IDs
    SELECT id INTO engineer_designation_id FROM designations WHERE name = 'Hardware Engineer' LIMIT 1;
    SELECT id INTO telecaller_designation_id FROM designations WHERE name = 'Telecaller' LIMIT 1;
    SELECT id INTO frontoffice_designation_id FROM designations WHERE name = 'Front Office Executive' LIMIT 1;

    -- Insert sample users if they don't exist
    INSERT INTO users (name, email, role, designation_id, active) VALUES
        ('John Smith', 'engineer@example.com', 'engineer', engineer_designation_id, true),
        ('Sarah Johnson', 'telecaller@example.com', 'telecaller', telecaller_designation_id, true),
        ('Mike Wilson', 'frontoffice@example.com', 'frontoffice', frontoffice_designation_id, true)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Sample staff members added (if they did not exist)';
END $$;