/*
  # Hardware Service Management System Database Schema

  1. New Tables
    - `users` - System users with roles and authentication
    - `permissions` - Available system permissions
    - `user_permissions` - User-permission relationships
    - `clients` - Client companies and contact information
    - `service_calls` - Service requests and tracking
    - `service_call_notes` - Notes for service calls
    - `inventory` - Hardware parts and equipment
    - `inventory_transactions` - Inventory movement tracking
    - `telecalling_leads` - Sales leads from telecalling
    - `telecalling_notes` - Notes for telecalling leads

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles

  3. Sample Data
    - Default permissions
    - Admin user
    - Sample clients, inventory, and service calls
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'frontoffice' CHECK (role IN ('admin', 'manager', 'engineer', 'telecaller', 'frontoffice')),
    active boolean NOT NULL DEFAULT true,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    contact_person text NOT NULL,
    email text,
    phone text NOT NULL,
    address text,
    city text NOT NULL,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Service calls table
CREATE TABLE IF NOT EXISTS service_calls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    issue text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in-progress', 'completed', 'cancelled')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    engineer_id uuid REFERENCES users(id) ON DELETE SET NULL,
    received_by uuid REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date date,
    completed_at timestamptz,
    resolution text,
    parts_used text,
    billing_amount decimal(10,2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Service call notes
CREATE TABLE IF NOT EXISTS service_call_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name text NOT NULL,
    description text,
    category text NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    unit_price decimal(10,2),
    supplier text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type text NOT NULL CHECK (transaction_type IN ('in', 'out')),
    quantity integer NOT NULL,
    reference_type text,
    reference_id uuid,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Telecalling leads
CREATE TABLE IF NOT EXISTS telecalling_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    contact_person text NOT NULL,
    contact_number text NOT NULL,
    email text,
    location text,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'follow-up', 'converted', 'rejected')),
    notes text,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    follow_up_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Telecalling notes
CREATE TABLE IF NOT EXISTS telecalling_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES telecalling_leads(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecalling_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecalling_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can read all users" ON users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- RLS Policies for permissions table
CREATE POLICY "Authenticated users can read permissions" ON permissions
    FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for user_permissions table
CREATE POLICY "Users can read own permissions" ON user_permissions
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- RLS Policies for clients table
CREATE POLICY "Authenticated users can read clients" ON clients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authorized users can insert clients" ON clients
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'frontoffice')
        )
    );

CREATE POLICY "Authorized users can update clients" ON clients
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'frontoffice')
        )
    );

CREATE POLICY "Admins can delete clients" ON clients
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager')
        )
    );

-- RLS Policies for service_calls table
CREATE POLICY "Authenticated users can read service calls" ON service_calls
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authorized users can insert service calls" ON service_calls
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'frontoffice', 'engineer')
        )
    );

CREATE POLICY "Authorized users can update service calls" ON service_calls
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'frontoffice', 'engineer')
        )
    );

-- RLS Policies for service_call_notes table
CREATE POLICY "Authenticated users can read service call notes" ON service_call_notes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert service call notes" ON service_call_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- RLS Policies for inventory table
CREATE POLICY "Authenticated users can read inventory" ON inventory
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authorized users can manage inventory" ON inventory
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'engineer')
        )
    );

-- RLS Policies for inventory_transactions table
CREATE POLICY "Authenticated users can read inventory transactions" ON inventory_transactions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authorized users can insert inventory transactions" ON inventory_transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'engineer')
        )
    );

-- RLS Policies for telecalling_leads table
CREATE POLICY "Authenticated users can read telecalling leads" ON telecalling_leads
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authorized users can manage telecalling leads" ON telecalling_leads
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'telecaller')
        )
    );

-- RLS Policies for telecalling_notes table
CREATE POLICY "Authenticated users can read telecalling notes" ON telecalling_notes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert telecalling notes" ON telecalling_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
('view_dashboard', 'View dashboard'),
('view_clients', 'View clients'),
('add_clients', 'Add new clients'),
('edit_clients', 'Edit existing clients'),
('delete_clients', 'Delete clients'),
('view_service_calls', 'View service calls'),
('add_service_calls', 'Add new service calls'),
('edit_service_calls', 'Edit existing service calls'),
('delete_service_calls', 'Delete service calls'),
('assign_service_calls', 'Assign service calls to engineers'),
('view_inventory', 'View inventory'),
('manage_inventory', 'Manage inventory (add, edit, delete)'),
('view_telecalling', 'View telecalling leads'),
('manage_telecalling', 'Manage telecalling leads'),
('view_reports', 'View reports'),
('manage_users', 'Manage users (add, edit, delete)'),
('manage_settings', 'Manage system settings');

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO users (auth_user_id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'frontoffice')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample clients
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID (will be created when first user signs up)
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Only insert sample data if we have an admin user
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO clients (company_name, contact_person, email, phone, address, city, created_by) VALUES
        ('Tech Solutions Inc.', 'John Smith', 'john@techsolutions.com', '123-456-7890', '123 Tech Street', 'New York', admin_user_id),
        ('Innovative Systems', 'Emma Johnson', 'emma@innovativesystems.com', '987-654-3210', '456 Innovation Avenue', 'San Francisco', admin_user_id),
        ('Global Computers', 'Michael Brown', 'michael@globalcomputers.com', '555-123-4567', '789 Computer Lane', 'Chicago', admin_user_id),
        ('DataServe Corporation', 'Sarah Wilson', 'sarah@dataserve.com', '444-789-1234', '321 Data Drive', 'Boston', admin_user_id),
        ('Hardware Express', 'David Miller', 'david@hardwareexpress.com', '777-888-9999', '555 Hardware Boulevard', 'Seattle', admin_user_id);
    END IF;
END $$;

-- Insert sample inventory items
INSERT INTO inventory (item_name, description, category, quantity, unit_price, supplier) VALUES
('Laptop RAM 8GB', 'DDR4 SODIMM Memory Module', 'Memory', 50, 45.99, 'MemoryTech'),
('SSD 500GB', 'Solid State Drive 2.5"', 'Storage', 30, 79.99, 'Storage Solutions'),
('Laptop Battery', 'Replacement Battery for Dell Latitude', 'Power', 25, 89.99, 'Power Components'),
('Network Card', 'Gigabit Ethernet Adapter', 'Networking', 40, 29.99, 'Network Pro'),
('CPU Cooling Fan', 'Replacement Cooling Fan for Desktop', 'Cooling', 35, 19.99, 'Cool Systems'),
('Power Supply 500W', 'ATX Power Supply Unit', 'Power', 20, 59.99, 'Power Solutions'),
('Keyboard', 'USB Wired Keyboard', 'Peripherals', 45, 24.99, 'Input Devices Inc.'),
('Mouse', 'Wireless Optical Mouse', 'Peripherals', 50, 19.99, 'Input Devices Inc.'),
('HDMI Cable', '6ft HDMI Cable', 'Cables', 100, 9.99, 'Cable Connect'),
('Thermal Paste', 'CPU Thermal Compound', 'Cooling', 60, 7.99, 'Cool Systems');

-- Insert sample service calls (will be populated when users and clients exist)
DO $$
DECLARE
    client_ids uuid[];
    admin_user_id uuid;
BEGIN
    -- Get client IDs
    SELECT array_agg(id) INTO client_ids FROM clients LIMIT 5;
    
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Only insert if we have clients and admin user
    IF array_length(client_ids, 1) > 0 AND admin_user_id IS NOT NULL THEN
        INSERT INTO service_calls (client_id, issue, description, status, priority, engineer_id, received_by, scheduled_date) VALUES
        (client_ids[1], 'Network connectivity issues', 'Unable to connect to company network. All computers affected.', 'pending', 'high', NULL, admin_user_id, CURRENT_DATE),
        (client_ids[2], 'Laptop overheating', 'CEO laptop shutting down due to overheating.', 'assigned', 'medium', admin_user_id, admin_user_id, CURRENT_DATE + INTERVAL '1 day'),
        (client_ids[3], 'Server maintenance', 'Scheduled server maintenance and updates.', 'in-progress', 'low', admin_user_id, admin_user_id, CURRENT_DATE - INTERVAL '1 day'),
        (client_ids[4], 'Printer not working', 'Main office printer showing error codes.', 'pending', 'medium', NULL, admin_user_id, CURRENT_DATE + INTERVAL '2 days'),
        (client_ids[5], 'Data recovery', 'Need to recover data from damaged hard drive.', 'assigned', 'urgent', admin_user_id, admin_user_id, CURRENT_DATE);
    END IF;
END $$;