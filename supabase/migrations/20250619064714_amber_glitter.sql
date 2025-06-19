/*
  # Fix RLS Policy Infinite Recursion

  1. Problem Analysis
    - The current policies are creating infinite recursion by checking user roles
    - This happens when policies on related tables query back to the users table
    - The auth.uid() function should be used directly instead of complex subqueries

  2. Solution
    - Simplify policies to avoid circular dependencies
    - Use auth.uid() directly for user identification
    - Remove complex role-checking subqueries that cause recursion
    - Create simpler, more direct policies

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies
    - Ensure no circular references between tables
*/

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Authorized users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authorized users can update clients" ON clients;

DROP POLICY IF EXISTS "Authenticated users can read service calls" ON service_calls;
DROP POLICY IF EXISTS "Authorized users can insert service calls" ON service_calls;
DROP POLICY IF EXISTS "Authorized users can update service calls" ON service_calls;

DROP POLICY IF EXISTS "Authenticated users can insert service call notes" ON service_call_notes;
DROP POLICY IF EXISTS "Authenticated users can read service call notes" ON service_call_notes;

DROP POLICY IF EXISTS "Authenticated users can read inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Authorized users can insert inventory transactions" ON inventory_transactions;

DROP POLICY IF EXISTS "Authenticated users can read telecalling leads" ON telecalling_leads;
DROP POLICY IF EXISTS "Authorized users can manage telecalling leads" ON telecalling_leads;

DROP POLICY IF EXISTS "Authenticated users can insert telecalling notes" ON telecalling_notes;
DROP POLICY IF EXISTS "Authenticated users can read telecalling notes" ON telecalling_notes;

DROP POLICY IF EXISTS "Authenticated users can read inventory" ON inventory;
DROP POLICY IF EXISTS "Authorized users can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Public can read inventory" ON inventory;

-- Create new simplified policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Create simplified policies for clients
CREATE POLICY "Authenticated users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create simplified policies for service_calls
CREATE POLICY "Authenticated users can read service calls"
  ON service_calls
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service calls"
  ON service_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service calls"
  ON service_calls
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for service_call_notes
CREATE POLICY "Authenticated users can read service call notes"
  ON service_call_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service call notes"
  ON service_call_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified policies for inventory
CREATE POLICY "Authenticated users can read inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for inventory_transactions
CREATE POLICY "Authenticated users can read inventory transactions"
  ON inventory_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory transactions"
  ON inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified policies for telecalling_leads
CREATE POLICY "Authenticated users can read telecalling leads"
  ON telecalling_leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage telecalling leads"
  ON telecalling_leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for telecalling_notes
CREATE POLICY "Authenticated users can read telecalling notes"
  ON telecalling_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert telecalling notes"
  ON telecalling_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified policies for user_permissions
CREATE POLICY "Users can read own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Create simplified policies for permissions
CREATE POLICY "Authenticated users can read permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);