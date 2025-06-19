/*
  # Staff Management and Permissions System

  1. New Tables
    - `designations` - Job titles and organizational hierarchy
    - `role_permissions` - Role-based permission definitions
    - `user_permissions_override` - Individual user permission overrides

  2. Schema Changes
    - Add `designation_id` column to `users` table

  3. Security
    - Enable RLS on all new tables
    - Add policies for admin-only designation management
    - Add policies for permission management

  4. Default Data
    - Insert default designations for different departments
    - Insert role-based permissions for all user roles

  5. Functions
    - Permission checking and retrieval functions
*/

-- Create designations table
CREATE TABLE IF NOT EXISTS designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  department text,
  level integer DEFAULT 1, -- 1=junior, 2=senior, 3=manager, 4=admin
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add designation_id to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'designation_id'
  ) THEN
    ALTER TABLE users ADD COLUMN designation_id uuid REFERENCES designations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create role_permissions table for role-based permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_name text NOT NULL,
  permission_description text,
  module text NOT NULL, -- clients, service_calls, inventory, etc.
  action text NOT NULL, -- create, read, update, delete, manage
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_name)
);

-- Create user_permissions_override table for individual user permissions (overrides)
CREATE TABLE IF NOT EXISTS user_permissions_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  granted boolean DEFAULT true, -- true=granted, false=revoked
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_name)
);

-- Enable RLS
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions_override ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop designations policies
  DROP POLICY IF EXISTS "designations_select_authenticated" ON designations;
  DROP POLICY IF EXISTS "designations_insert_admin" ON designations;
  DROP POLICY IF EXISTS "designations_update_admin" ON designations;
  DROP POLICY IF EXISTS "designations_delete_admin" ON designations;
  
  -- Drop role_permissions policies
  DROP POLICY IF EXISTS "role_permissions_select_authenticated" ON role_permissions;
  DROP POLICY IF EXISTS "role_permissions_manage_admin" ON role_permissions;
  
  -- Drop user_permissions_override policies
  DROP POLICY IF EXISTS "user_permissions_override_select_authenticated" ON user_permissions_override;
  DROP POLICY IF EXISTS "user_permissions_override_manage_admin" ON user_permissions_override;
END $$;

-- Policies for designations (admin only for CUD, all authenticated for read)
CREATE POLICY "designations_select_authenticated" ON designations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "designations_insert_admin" ON designations
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "designations_update_admin" ON designations
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "designations_delete_admin" ON designations
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policies for role_permissions
CREATE POLICY "role_permissions_select_authenticated" ON role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_manage_admin" ON role_permissions
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policies for user_permissions_override
CREATE POLICY "user_permissions_override_select_authenticated" ON user_permissions_override
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_permissions_override_manage_admin" ON user_permissions_override
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Insert default designations
INSERT INTO designations (name, description, department, level, is_active) VALUES
  ('System Administrator', 'Full system access and management', 'IT', 4, true),
  ('General Manager', 'Overall operations management', 'Management', 4, true),
  ('Service Manager', 'Service operations management', 'Service', 3, true),
  ('Senior Hardware Engineer', 'Senior level hardware support', 'Technical', 2, true),
  ('Hardware Engineer', 'Hardware support and maintenance', 'Technical', 1, true),
  ('Senior Telecaller', 'Senior sales and lead generation', 'Sales', 2, true),
  ('Telecaller', 'Sales and lead generation', 'Sales', 1, true),
  ('Front Office Executive', 'Customer service and reception', 'Administration', 1, true),
  ('Front Office Supervisor', 'Front office operations management', 'Administration', 2, true),
  ('Inventory Manager', 'Inventory and procurement management', 'Operations', 3, true),
  ('Inventory Executive', 'Inventory handling and tracking', 'Operations', 1, true),
  ('Accounts Manager', 'Financial operations management', 'Finance', 3, true),
  ('Accounts Executive', 'Financial data entry and processing', 'Finance', 1, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default role permissions
INSERT INTO role_permissions (role, permission_name, permission_description, module, action) VALUES
  -- Admin permissions (full access)
  ('admin', 'manage_all', 'Full system management access', 'system', 'manage'),
  ('admin', 'manage_users', 'Create, edit, delete users', 'users', 'manage'),
  ('admin', 'manage_designations', 'Create, edit, delete designations', 'designations', 'manage'),
  ('admin', 'manage_permissions', 'Assign and revoke permissions', 'permissions', 'manage'),
  
  -- Manager permissions
  ('manager', 'view_all_modules', 'Access to all modules', 'system', 'read'),
  ('manager', 'manage_clients', 'Full client management', 'clients', 'manage'),
  ('manager', 'manage_service_calls', 'Full service call management', 'service_calls', 'manage'),
  ('manager', 'manage_inventory', 'Full inventory management', 'inventory', 'manage'),
  ('manager', 'manage_telecalling', 'Full telecalling management', 'telecalling', 'manage'),
  ('manager', 'view_reports', 'Access to all reports', 'reports', 'read'),
  ('manager', 'manage_staff', 'Manage staff (except admins)', 'users', 'update'),
  
  -- Engineer permissions
  ('engineer', 'view_service_calls', 'View assigned service calls', 'service_calls', 'read'),
  ('engineer', 'update_service_calls', 'Update service call status and details', 'service_calls', 'update'),
  ('engineer', 'view_inventory', 'View inventory items', 'inventory', 'read'),
  ('engineer', 'update_inventory', 'Update inventory usage', 'inventory', 'update'),
  ('engineer', 'view_clients', 'View client information', 'clients', 'read'),
  
  -- Telecaller permissions
  ('telecaller', 'manage_telecalling', 'Full telecalling management', 'telecalling', 'manage'),
  ('telecaller', 'view_clients', 'View client information', 'clients', 'read'),
  ('telecaller', 'create_clients', 'Add new clients', 'clients', 'create'),
  ('telecaller', 'view_reports_telecalling', 'View telecalling reports', 'reports', 'read'),
  
  -- Front office permissions
  ('frontoffice', 'manage_service_calls', 'Create and manage service calls', 'service_calls', 'manage'),
  ('frontoffice', 'view_clients', 'View client information', 'clients', 'read'),
  ('frontoffice', 'create_clients', 'Add new clients', 'clients', 'create'),
  ('frontoffice', 'update_clients', 'Update client information', 'clients', 'update'),
  ('frontoffice', 'view_inventory', 'View inventory status', 'inventory', 'read')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designations_department ON designations(department);
CREATE INDEX IF NOT EXISTS idx_designations_level ON designations(level);
CREATE INDEX IF NOT EXISTS idx_designations_active ON designations(is_active);
CREATE INDEX IF NOT EXISTS idx_users_designation_id ON users(designation_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON role_permissions(module);
CREATE INDEX IF NOT EXISTS idx_user_permissions_override_user_id ON user_permissions_override(user_id);

-- Function to get user permissions (combines role and individual permissions)
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid)
RETURNS TABLE(permission_name text, granted boolean) AS $$
BEGIN
  RETURN QUERY
  WITH user_role AS (
    SELECT u.role 
    FROM users u 
    WHERE u.id = user_uuid
  ),
  role_perms AS (
    SELECT rp.permission_name, true as granted
    FROM role_permissions rp, user_role ur
    WHERE rp.role = ur.role
  ),
  user_perms AS (
    SELECT up.permission_name, up.granted
    FROM user_permissions_override up
    WHERE up.user_id = user_uuid
  )
  SELECT 
    COALESCE(up.permission_name, rp.permission_name) as permission_name,
    COALESCE(up.granted, rp.granted) as granted
  FROM role_perms rp
  FULL OUTER JOIN user_perms up ON rp.permission_name = up.permission_name
  WHERE COALESCE(up.granted, rp.granted) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid uuid, perm_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_user_permissions(user_uuid) 
    WHERE permission_name = perm_name AND granted = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;