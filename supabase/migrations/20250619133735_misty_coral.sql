/*
  # Update admin@example.com with full admin privileges

  1. Updates
    - Set admin@example.com user to have admin role
    - Assign System Administrator designation
    - Ensure user is active
    - Grant all admin permissions

  2. Security
    - Maintains existing RLS policies
    - Ensures admin has full system access
*/

-- Update the existing admin@example.com user to have full admin privileges
DO $$
DECLARE
    admin_designation_id uuid;
    admin_user_id uuid;
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
        
        RAISE NOTICE 'Created System Administrator designation with ID: %', admin_designation_id;
    END IF;

    -- Update the admin@example.com user
    UPDATE users SET
        name = 'System Administrator',
        role = 'admin',
        designation_id = admin_designation_id,
        active = true,
        updated_at = now()
    WHERE email = 'admin@example.com'
    RETURNING id INTO admin_user_id;

    -- If user doesn't exist, create it
    IF admin_user_id IS NULL THEN
        INSERT INTO users (
            name,
            email,
            role,
            designation_id,
            active,
            created_at,
            updated_at
        ) VALUES (
            'System Administrator',
            'admin@example.com',
            'admin',
            admin_designation_id,
            true,
            now(),
            now()
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Created admin user with email: admin@example.com';
    ELSE
        RAISE NOTICE 'Updated existing admin user with email: admin@example.com';
    END IF;

    RAISE NOTICE 'Admin User ID: %', admin_user_id;
    RAISE NOTICE 'Designation ID: %', admin_designation_id;
END $$;

-- Ensure all admin permissions exist
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
  ('admin', 'permission_management', 'Manage user permissions', 'permissions', 'all'),
  ('admin', 'staff_management', 'Full staff management access', 'staff', 'all'),
  ('admin', 'agreement_management', 'Full agreement management access', 'agreements', 'all'),
  ('admin', 'payment_management', 'Full payment management access', 'payments', 'all')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Update the table comment
COMMENT ON TABLE users IS 'Admin user admin@example.com updated with full admin privileges. Use this account to access all system features.';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Admin user setup completed successfully!';
    RAISE NOTICE 'Email: admin@example.com';
    RAISE NOTICE 'Role: admin';
    RAISE NOTICE 'All admin permissions granted';
END $$;