/*
  # Enhanced Service Call Management System

  1. New Tables
    - Enhanced `service_calls` table with comprehensive tracking
    - `service_call_equipment` for equipment received/delivered tracking
    - `service_call_feedback` for customer feedback and ratings
    - `service_call_invoices` for billing integration
    - `service_call_status_history` for audit trail
    - Enhanced `service_call_notes` with categorization

  2. Features
    - Auto-generated Job IDs (JOB-YYYYMMDD-0001 format)
    - Complete workflow tracking from call reception to completion
    - Time tracking for engineer visits
    - Equipment management
    - Customer feedback system
    - Invoice integration
    - Status history audit trail

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create sequence for job_id first
CREATE SEQUENCE IF NOT EXISTS job_id_seq START 1;

-- Drop existing service_calls table and recreate with enhanced structure
DROP TABLE IF EXISTS service_calls CASCADE;

-- Enhanced service_calls table
CREATE TABLE service_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Call Reception Details
  call_date date NOT NULL DEFAULT CURRENT_DATE,
  call_time time NOT NULL DEFAULT CURRENT_TIME,
  received_by uuid REFERENCES users(id) ON DELETE SET NULL,
  contact_person_name text NOT NULL,
  
  -- Complaint Details
  complaint_date date NOT NULL DEFAULT CURRENT_DATE,
  nature_of_complaint text NOT NULL,
  problem_description text,
  
  -- Assignment Details
  engineer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  scheduled_date date,
  
  -- Solution Details
  solution text,
  remarks_by_user text,
  remarks_by_engineer text,
  
  -- Time Tracking
  visit_start_time timestamptz,
  visit_end_time timestamptz,
  completion_time_category text CHECK (completion_time_category IN ('30min', '1hr', '2hrs', 'above_2hrs')),
  
  -- Status and Priority
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in-progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Billing
  billing_amount decimal(10,2),
  parts_used text,
  
  -- Tracking
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Service call equipment tracking
CREATE TABLE service_call_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  sl_no integer NOT NULL,
  particulars text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  equipment_type text CHECK (equipment_type IN ('received', 'delivered')),
  received_date date,
  delivered_date date,
  condition_notes text,
  created_at timestamptz DEFAULT now()
);

-- Service call feedback
CREATE TABLE service_call_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  
  -- Response ratings
  executive_response text CHECK (executive_response IN ('good', 'average', 'below_average')),
  engineer_response text CHECK (engineer_response IN ('good', 'average', 'below_average')),
  back_response text CHECK (back_response IN ('good', 'average', 'below_average')),
  
  -- Feedback details
  customer_feedback text,
  feedback_date date DEFAULT CURRENT_DATE,
  feedback_taken_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Follow-up
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  follow_up_notes text,
  
  created_at timestamptz DEFAULT now()
);

-- Service call invoices
CREATE TABLE service_call_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(10,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date date,
  payment_terms text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Service call status history
CREATE TABLE service_call_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  change_reason text,
  changed_at timestamptz DEFAULT now()
);

-- Service call notes (enhanced)
DROP TABLE IF EXISTS service_call_notes CASCADE;
CREATE TABLE service_call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'technical', 'customer', 'internal')),
  is_visible_to_customer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Function to generate unique job ID
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_id IS NULL OR NEW.job_id = '' THEN
    NEW.job_id := 'JOB-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(nextval('job_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update status history
CREATE OR REPLACE FUNCTION track_service_call_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO service_call_status_history (
      service_call_id,
      previous_status,
      new_status,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.updated_by,
      'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status
    );
  END IF;
  
  -- Update completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  -- Update assigned_at when status changes to assigned
  IF NEW.status = 'assigned' AND OLD.status != 'assigned' THEN
    NEW.assigned_at = now();
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER generate_job_id_trigger
  BEFORE INSERT ON service_calls
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_id();

CREATE TRIGGER service_call_status_change_trigger
  BEFORE UPDATE ON service_calls
  FOR EACH ROW
  EXECUTE FUNCTION track_service_call_status_change();

-- Enable RLS on all tables
ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for service_calls
CREATE POLICY "service_calls_select_authenticated" ON service_calls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_calls_insert_authenticated" ON service_calls
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_calls_update_authenticated" ON service_calls
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "service_calls_delete_authenticated" ON service_calls
  FOR DELETE TO authenticated USING (true);

-- Create policies for service_call_equipment
CREATE POLICY "service_call_equipment_select_authenticated" ON service_call_equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_call_equipment_insert_authenticated" ON service_call_equipment
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_call_equipment_update_authenticated" ON service_call_equipment
  FOR UPDATE TO authenticated USING (true);

-- Create policies for service_call_feedback
CREATE POLICY "service_call_feedback_select_authenticated" ON service_call_feedback
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_call_feedback_insert_authenticated" ON service_call_feedback
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_call_feedback_update_authenticated" ON service_call_feedback
  FOR UPDATE TO authenticated USING (true);

-- Create policies for service_call_invoices
CREATE POLICY "service_call_invoices_select_authenticated" ON service_call_invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_call_invoices_insert_authenticated" ON service_call_invoices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_call_invoices_update_authenticated" ON service_call_invoices
  FOR UPDATE TO authenticated USING (true);

-- Create policies for service_call_status_history
CREATE POLICY "service_call_status_history_select_authenticated" ON service_call_status_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_call_status_history_insert_authenticated" ON service_call_status_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies for service_call_notes
CREATE POLICY "service_call_notes_select_authenticated" ON service_call_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_call_notes_insert_authenticated" ON service_call_notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_call_notes_update_authenticated" ON service_call_notes
  FOR UPDATE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_service_calls_job_id ON service_calls(job_id);
CREATE INDEX idx_service_calls_client_id ON service_calls(client_id);
CREATE INDEX idx_service_calls_engineer_id ON service_calls(engineer_id);
CREATE INDEX idx_service_calls_status ON service_calls(status);
CREATE INDEX idx_service_calls_call_date ON service_calls(call_date);
CREATE INDEX idx_service_calls_scheduled_date ON service_calls(scheduled_date);

CREATE INDEX idx_service_call_equipment_service_call_id ON service_call_equipment(service_call_id);
CREATE INDEX idx_service_call_feedback_service_call_id ON service_call_feedback(service_call_id);
CREATE INDEX idx_service_call_invoices_service_call_id ON service_call_invoices(service_call_id);
CREATE INDEX idx_service_call_invoices_invoice_number ON service_call_invoices(invoice_number);
CREATE INDEX idx_service_call_status_history_service_call_id ON service_call_status_history(service_call_id);
CREATE INDEX idx_service_call_notes_service_call_id ON service_call_notes(service_call_id);