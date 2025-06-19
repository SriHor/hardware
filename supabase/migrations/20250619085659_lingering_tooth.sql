/*
  # Client Agreements and Payment Tracking System

  1. New Tables
    - `client_agreements`
      - Agreement details with equipment counts and pricing
      - Payment terms and dates
      - Total cost calculations
    - `payment_schedules`
      - Individual payment due dates
      - Payment status tracking
    - `payment_records`
      - Actual payment records
      - Payment method and details

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create client_agreements table
CREATE TABLE IF NOT EXISTS client_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agreement_date date NOT NULL,
  
  -- Equipment details
  systems integer DEFAULT 0,
  system_rate numeric(10,2) DEFAULT 0,
  laptops integer DEFAULT 0,
  laptop_rate numeric(10,2) DEFAULT 0,
  printers integer DEFAULT 0,
  printer_rate numeric(10,2) DEFAULT 0,
  servers integer DEFAULT 0,
  server_rate numeric(10,2) DEFAULT 0,
  networking_rate numeric(10,2) DEFAULT 0,
  
  -- Pricing calculations
  subtotal numeric(10,2) GENERATED ALWAYS AS (
    (systems * system_rate) + 
    (laptops * laptop_rate) + 
    (printers * printer_rate) + 
    (servers * server_rate) + 
    networking_rate
  ) STORED,
  discount numeric(10,2) DEFAULT 0,
  total_cost numeric(10,2) GENERATED ALWAYS AS (
    (systems * system_rate) + 
    (laptops * laptop_rate) + 
    (printers * printer_rate) + 
    (servers * server_rate) + 
    networking_rate - discount
  ) STORED,
  
  -- Payment terms
  payment_mode text CHECK (payment_mode IN ('cash', 'cheque', 'bank_transfer', 'other')),
  payment_frequency text CHECK (payment_frequency IN ('full', 'half_yearly', 'quarterly', 'monthly')),
  payment_details text,
  
  -- Agreement status
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Other details
  other_details text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_schedules table
CREATE TABLE IF NOT EXISTS payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES client_agreements(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_number integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_records table
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  agreement_id uuid NOT NULL REFERENCES client_agreements(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount_paid numeric(10,2) NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for client_agreements
CREATE POLICY "client_agreements_select_authenticated"
  ON client_agreements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "client_agreements_insert_authenticated"
  ON client_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "client_agreements_update_authenticated"
  ON client_agreements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "client_agreements_delete_authenticated"
  ON client_agreements
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for payment_schedules
CREATE POLICY "payment_schedules_select_authenticated"
  ON payment_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "payment_schedules_insert_authenticated"
  ON payment_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "payment_schedules_update_authenticated"
  ON payment_schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for payment_records
CREATE POLICY "payment_records_select_authenticated"
  ON payment_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "payment_records_insert_authenticated"
  ON payment_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_client_agreements_client_id ON client_agreements(client_id);
CREATE INDEX idx_client_agreements_agreement_date ON client_agreements(agreement_date);
CREATE INDEX idx_client_agreements_status ON client_agreements(status);

CREATE INDEX idx_payment_schedules_agreement_id ON payment_schedules(agreement_id);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);

CREATE INDEX idx_payment_records_schedule_id ON payment_records(schedule_id);
CREATE INDEX idx_payment_records_agreement_id ON payment_records(agreement_id);
CREATE INDEX idx_payment_records_payment_date ON payment_records(payment_date);

-- Function to automatically create payment schedules
CREATE OR REPLACE FUNCTION create_payment_schedules()
RETURNS TRIGGER AS $$
DECLARE
  payment_amount numeric(10,2);
  payment_count integer;
  schedule_date date;
  i integer;
BEGIN
  -- Calculate payment amount and count based on frequency
  CASE NEW.payment_frequency
    WHEN 'full' THEN
      payment_amount := NEW.total_cost;
      payment_count := 1;
    WHEN 'half_yearly' THEN
      payment_amount := NEW.total_cost / 2;
      payment_count := 2;
    WHEN 'quarterly' THEN
      payment_amount := NEW.total_cost / 4;
      payment_count := 4;
    WHEN 'monthly' THEN
      payment_amount := NEW.total_cost / 12;
      payment_count := 12;
    ELSE
      payment_amount := NEW.total_cost;
      payment_count := 1;
  END CASE;

  -- Create payment schedules
  FOR i IN 1..payment_count LOOP
    CASE NEW.payment_frequency
      WHEN 'full' THEN
        schedule_date := NEW.agreement_date;
      WHEN 'half_yearly' THEN
        schedule_date := NEW.agreement_date + INTERVAL '6 months' * (i - 1);
      WHEN 'quarterly' THEN
        schedule_date := NEW.agreement_date + INTERVAL '3 months' * (i - 1);
      WHEN 'monthly' THEN
        schedule_date := NEW.agreement_date + INTERVAL '1 month' * (i - 1);
    END CASE;

    INSERT INTO payment_schedules (agreement_id, due_date, amount, payment_number)
    VALUES (NEW.id, schedule_date, payment_amount, i);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate payment schedules
CREATE TRIGGER create_payment_schedules_trigger
  AFTER INSERT ON client_agreements
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_schedules();

-- Function to update payment schedule status based on due dates
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE payment_schedules 
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE 
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;