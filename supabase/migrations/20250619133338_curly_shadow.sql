/*
  # Add Admin User

  1. New User
    - Creates an admin user with email admin2@example.com
    - Sets role to 'admin' with full privileges
    - Links to System Administrator designation
    - Sets active status to true

  2. Security
    - User will be able to access all system functions
    - Password will need to be set through Supabase Auth
*/

-- First, let's get the System Administrator designation ID
DO $$
DECLARE
    admin_designation_id uuid;
    new_user_id uuid;
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

    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();

    -- Insert the admin user
    INSERT INTO users (
        id,
        name,
        email,
        role,
        designation_id,
        active,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'System Administrator',
        'admin2@example.com',
        'admin',
        admin_designation_id,
        true,
        now(),
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        designation_id = EXCLUDED.designation_id,
        active = EXCLUDED.active,
        updated_at = now();

    -- Log the creation
    RAISE NOTICE 'Admin user created/updated with email: admin2@example.com';
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE 'Designation ID: %', admin_designation_id;
END $$;

-- Grant all permissions to admin role (if not already granted)
INSERT INTO role_permissions (role, permission_name, permission_description, module, action) VALUES
  ('admin', 'full_system_access', 'Complete system administration access', 'system', 'all'),
  ('admin', 'user_management', 'Create, read, update, delete users', 'users', 'all'),
  ('admin', 'client_management', 'Full client management access', 'clients', 'all'),
  ('admin', 'service_management', 'Full service call management', 'service_calls', 'all'),
  ('admin', 'inventory_management', 'Full inventory management', 'inventory', 'all'),
  ('admin', 'telecalling_management', 'Full telecalling management', 'telecalling', 'all'),
  ('admin', 'reports_access', 'Full reports and analytics access', 'reports', 'all'),
  ('admin', 'settings_management', 'System settings management', 'settings', 'all'),
  ('admin', 'designation_management', 'Manage designations and roles', 'designations', 'all'),
  ('admin', 'permission_management', 'Manage user permissions', 'permissions', 'all')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Create a note about password setup
COMMENT ON TABLE users IS 'Admin user admin2@example.com created. Password must be set through Supabase Auth dashboard or signup process.';