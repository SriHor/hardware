/*
  # Create payment records table for tracking payment collections

  1. New Tables
    - `payment_records`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, references payment_schedules)
      - `agreement_id` (uuid, references client_agreements)
      - `payment_date` (date)
      - `amount_paid` (decimal)
      - `payment_method` (text)
      - `reference_number` (text, optional)
      - `notes` (text, optional)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `payment_records` table
    - Add policies for authenticated users to manage payment records
*/

-- Create payment_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  agreement_id uuid NOT NULL REFERENCES client_agreements(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
  reference_number text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "payment_records_select_authenticated" ON payment_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payment_records_insert_authenticated" ON payment_records
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_records_schedule_id ON payment_records(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_agreement_id ON payment_records(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);