/*
  # Enhanced Telecalling System

  1. Schema Updates
    - Add lead_type field to telecalling_leads table
    - Add lead_generation_date field to telecalling_leads table
    - Update existing records with default values
    - Add indexes for better performance

  2. New Features
    - Lead type categorization (hardware, software, website)
    - Lead generation date tracking
    - Enhanced reporting capabilities

  3. Security
    - Maintain existing RLS policies
    - No changes to authentication or permissions
*/

-- Add new columns to telecalling_leads table
DO $$
BEGIN
  -- Add lead_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telecalling_leads' AND column_name = 'lead_type'
  ) THEN
    ALTER TABLE telecalling_leads ADD COLUMN lead_type text DEFAULT 'hardware';
  END IF;

  -- Add lead_generation_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telecalling_leads' AND column_name = 'lead_generation_date'
  ) THEN
    ALTER TABLE telecalling_leads ADD COLUMN lead_generation_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add check constraint for lead_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'telecalling_leads' AND constraint_name = 'telecalling_leads_lead_type_check'
  ) THEN
    ALTER TABLE telecalling_leads ADD CONSTRAINT telecalling_leads_lead_type_check 
    CHECK (lead_type = ANY (ARRAY['hardware'::text, 'software'::text, 'website'::text]));
  END IF;
END $$;

-- Update existing records to have lead_generation_date as created_at date
UPDATE telecalling_leads 
SET lead_generation_date = created_at::date 
WHERE lead_generation_date IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_lead_type ON telecalling_leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_generation_date ON telecalling_leads(lead_generation_date);
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_created_by ON telecalling_leads(created_by);
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_status_date ON telecalling_leads(status, lead_generation_date);

-- Create a view for telecalling reports
CREATE OR REPLACE VIEW telecalling_reports AS
SELECT 
  tl.*,
  u.name as telecaller_name,
  u.email as telecaller_email,
  EXTRACT(YEAR FROM tl.lead_generation_date) as generation_year,
  EXTRACT(MONTH FROM tl.lead_generation_date) as generation_month,
  EXTRACT(DAY FROM tl.lead_generation_date) as generation_day,
  DATE_TRUNC('month', tl.lead_generation_date) as month_start,
  DATE_TRUNC('week', tl.lead_generation_date) as week_start,
  DATE_TRUNC('day', tl.lead_generation_date) as day_start
FROM telecalling_leads tl
LEFT JOIN users u ON tl.created_by = u.id;

-- Grant access to the view
GRANT SELECT ON telecalling_reports TO authenticated;