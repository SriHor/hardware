/*
  # Payment Records Table Enhancement

  1. Tables
    - Ensure payment_records table exists with proper structure
    - Add missing columns if needed
    
  2. Security
    - Enable RLS on payment_records table
    - Create policies only if they don't exist
    
  3. Performance
    - Add indexes for better query performance
*/

-- Create payment_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  agreement_id uuid NOT NULL REFERENCES client_agreements(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add payment method constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_records_payment_method_check' 
    AND table_name = 'payment_records'
  ) THEN
    ALTER TABLE payment_records 
    ADD CONSTRAINT payment_records_payment_method_check 
    CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "payment_records_select_authenticated" ON payment_records;
DROP POLICY IF EXISTS "payment_records_insert_authenticated" ON payment_records;

-- Create policies
CREATE POLICY "payment_records_select_authenticated" ON payment_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payment_records_insert_authenticated" ON payment_records
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_records_schedule_id ON payment_records(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_agreement_id ON payment_records(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);