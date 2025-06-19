/*
  # Modify Clients Table Structure

  1. Table Changes
    - Add comprehensive client information fields
    - Replace simple structure with detailed company data
    - Include multiple contact persons and communication channels
    - Add office details and management information

  2. New Columns
    - Company identification and address details
    - Multiple phone numbers and communication channels
    - Management and contact person information
    - Office and operational details

  3. Data Migration
    - Preserve existing data where possible
    - Map current fields to new structure
*/

-- First, create a backup of existing data
CREATE TABLE IF NOT EXISTS clients_backup AS SELECT * FROM clients;

-- Add new columns to the clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mobile_office text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS landline_ph1 text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS landline_ph2 text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_id text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cust_office text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS md_manager text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS md_manager_phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS md_manager_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_email text;

-- Migrate existing data to new structure
UPDATE clients SET 
  email_id = email,
  contact_person_phone = phone,
  street = address
WHERE email IS NOT NULL OR phone IS NOT NULL OR address IS NOT NULL;

-- Drop old columns that are now replaced
ALTER TABLE clients DROP COLUMN IF EXISTS email;
ALTER TABLE clients DROP COLUMN IF EXISTS phone;
ALTER TABLE clients DROP COLUMN IF EXISTS address;

-- Update column constraints and defaults
ALTER TABLE clients ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE clients ALTER COLUMN contact_person SET NOT NULL;
ALTER TABLE clients ALTER COLUMN city SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_area ON clients(area);
CREATE INDEX IF NOT EXISTS idx_clients_mobile_office ON clients(mobile_office);
CREATE INDEX IF NOT EXISTS idx_clients_email_id ON clients(email_id);

-- Add comments to document the new structure
COMMENT ON COLUMN clients.company_id IS 'Unique identifier for the company';
COMMENT ON COLUMN clients.company_name IS 'Official name of the company';
COMMENT ON COLUMN clients.street IS 'Street address of the company';
COMMENT ON COLUMN clients.landmark IS 'Nearby landmark for location reference';
COMMENT ON COLUMN clients.area IS 'Area or locality of the company';
COMMENT ON COLUMN clients.city IS 'City where the company is located';
COMMENT ON COLUMN clients.mobile_office IS 'Mobile number of the office';
COMMENT ON COLUMN clients.landline_ph1 IS 'Primary landline phone number';
COMMENT ON COLUMN clients.landline_ph2 IS 'Secondary landline phone number';
COMMENT ON COLUMN clients.email_id IS 'Official email address of the company';
COMMENT ON COLUMN clients.cust_office IS 'Customer office details or branch';
COMMENT ON COLUMN clients.md_manager IS 'Name of MD or Manager';
COMMENT ON COLUMN clients.md_manager_phone IS 'Phone number of MD or Manager';
COMMENT ON COLUMN clients.md_manager_email IS 'Email address of MD or Manager';
COMMENT ON COLUMN clients.contact_person IS 'Primary contact person name';
COMMENT ON COLUMN clients.contact_person_phone IS 'Phone number of contact person';
COMMENT ON COLUMN clients.contact_person_email IS 'Email address of contact person';