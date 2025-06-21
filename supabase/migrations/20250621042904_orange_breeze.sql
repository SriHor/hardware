-- Hardware Service Management System Database Schema

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
    updated_at timestamptz DEFAULT now(),
    designation_id uuid REFERENCES designations(id) ON DELETE SET NULL,
    employee_id text UNIQUE,
    joining_date date,
    phone_number text,
    address text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relation text,
    basic_salary numeric(10,2) DEFAULT 0,
    allowances numeric(10,2) DEFAULT 0,
    deductions numeric(10,2) DEFAULT 0,
    bank_account_number text,
    bank_name text,
    ifsc_code text
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
    city text NOT NULL,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    company_id text,
    street text,
    landmark text,
    area text,
    mobile_office text,
    landline_ph1 text,
    landline_ph2 text,
    email_id text,
    cust_office text,
    md_manager text,
    md_manager_phone text,
    md_manager_email text,
    contact_person_phone text,
    contact_person_email text
);

-- Service calls table
CREATE TABLE IF NOT EXISTS service_calls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id text UNIQUE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    call_date date NOT NULL DEFAULT CURRENT_DATE,
    call_time time NOT NULL DEFAULT CURRENT_TIME,
    received_by uuid REFERENCES users(id) ON DELETE SET NULL,
    contact_person_name text NOT NULL,
    complaint_date date NOT NULL DEFAULT CURRENT_DATE,
    nature_of_complaint text NOT NULL,
    problem_description text,
    engineer_id uuid REFERENCES users(id) ON DELETE SET NULL,
    assigned_at timestamptz,
    scheduled_date date,
    solution text,
    remarks_by_user text,
    remarks_by_engineer text,
    visit_start_time timestamptz,
    visit_end_time timestamptz,
    completion_time_category text CHECK (completion_time_category IN ('30min', '1hr', '2hrs', 'above_2hrs')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in-progress', 'completed', 'cancelled')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    billing_amount decimal(10,2),
    parts_used text,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- Service call equipment tracking
CREATE TABLE IF NOT EXISTS service_call_equipment (
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
CREATE TABLE IF NOT EXISTS service_call_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
    executive_response text CHECK (executive_response IN ('good', 'average', 'below_average')),
    engineer_response text CHECK (engineer_response IN ('good', 'average', 'below_average')),
    back_response text CHECK (back_response IN ('good', 'average', 'below_average')),
    customer_feedback text,
    feedback_date date DEFAULT CURRENT_DATE,
    feedback_taken_by uuid REFERENCES users(id) ON DELETE SET NULL,
    follow_up_required boolean DEFAULT false,
    follow_up_date date,
    follow_up_notes text,
    created_at timestamptz DEFAULT now()
);

-- Service call invoices
CREATE TABLE IF NOT EXISTS service_call_invoices (
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
CREATE TABLE IF NOT EXISTS service_call_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
    previous_status text,
    new_status text NOT NULL,
    changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    change_reason text,
    changed_at timestamptz DEFAULT now()
);

-- Service call notes
CREATE TABLE IF NOT EXISTS service_call_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_call_id uuid NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note text NOT NULL,
    note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'technical', 'customer', 'internal')),
    is_visible_to_customer boolean DEFAULT false,
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
    updated_at timestamptz DEFAULT now(),
    lead_type text DEFAULT 'hardware' CHECK (lead_type IN ('hardware', 'software', 'website')),
    lead_generation_date date DEFAULT CURRENT_DATE
);

-- Telecalling notes
CREATE TABLE IF NOT EXISTS telecalling_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES telecalling_leads(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Designations table
CREATE TABLE IF NOT EXISTS designations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    department text,
    level integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    permission_name text NOT NULL,
    permission_description text,
    module text NOT NULL,
    action text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role, permission_name)
);

-- User permissions override table
CREATE TABLE IF NOT EXISTS user_permissions_override (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_name text NOT NULL,
    granted boolean DEFAULT true,
    granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, permission_name)
);

-- Client agreements table
CREATE TABLE IF NOT EXISTS client_agreements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agreement_date date NOT NULL,
    systems integer DEFAULT 0,
    system_rate numeric(10,2) DEFAULT 0,
    laptops integer DEFAULT 0,
    laptop_rate numeric(10,2) DEFAULT 0,
    printers integer DEFAULT 0,
    printer_rate numeric(10,2) DEFAULT 0,
    servers integer DEFAULT 0,
    server_rate numeric(10,2) DEFAULT 0,
    networking_rate numeric(10,2) DEFAULT 0,
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
    payment_mode text CHECK (payment_mode IN ('cash', 'cheque', 'bank_transfer', 'other')),
    payment_frequency text CHECK (payment_frequency IN ('full', 'half_yearly', 'quarterly', 'three_times', 'monthly')),
    payment_details text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    other_details text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payment schedules table
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

-- Payment records table
CREATE TABLE IF NOT EXISTS payment_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
    agreement_id uuid NOT NULL REFERENCES client_agreements(id) ON DELETE CASCADE,
    payment_date date NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    payment_method text CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
    reference_number text,
    notes text,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Employee family members table
CREATE TABLE IF NOT EXISTS employee_family_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    relation text NOT NULL,
    phone_number text,
    date_of_birth date,
    occupation text,
    is_emergency_contact boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Employee advances table
CREATE TABLE IF NOT EXISTS employee_advances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    advance_date date NOT NULL DEFAULT CURRENT_DATE,
    repayment_start_date date,
    monthly_deduction numeric(10,2),
    total_repaid numeric(10,2) DEFAULT 0,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Salary payments table
CREATE TABLE IF NOT EXISTS salary_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_month integer NOT NULL,
    payment_year integer NOT NULL,
    basic_salary numeric(10,2) NOT NULL,
    allowances numeric(10,2) DEFAULT 0,
    overtime_amount numeric(10,2) DEFAULT 0,
    bonus_amount numeric(10,2) DEFAULT 0,
    deductions numeric(10,2) DEFAULT 0,
    advance_deduction numeric(10,2) DEFAULT 0,
    tax_deduction numeric(10,2) DEFAULT 0,
    other_deductions numeric(10,2) DEFAULT 0,
    gross_salary numeric(10,2) GENERATED ALWAYS AS (basic_salary + allowances + overtime_amount + bonus_amount) STORED,
    total_deductions numeric(10,2) GENERATED ALWAYS AS (deductions + advance_deduction + tax_deduction + other_deductions) STORED,
    net_salary numeric(10,2) GENERATED ALWAYS AS (basic_salary + allowances + overtime_amount + bonus_amount - deductions - advance_deduction - tax_deduction - other_deductions) STORED,
    payment_date date,
    payment_method text DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque')),
    reference_number text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(employee_id, payment_month, payment_year)
);

-- Account categories table
CREATE TABLE IF NOT EXISTS account_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Account transactions table
CREATE TABLE IF NOT EXISTS account_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    category_id uuid NOT NULL REFERENCES account_categories(id) ON DELETE RESTRICT,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    amount numeric(12,2) NOT NULL,
    description text NOT NULL,
    reference_type text,
    reference_id uuid,
    payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'card')),
    reference_number text,
    vendor_customer text,
    invoice_number text,
    receipt_number text,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Advance repayments table
CREATE TABLE IF NOT EXISTS advance_repayments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_id uuid NOT NULL REFERENCES employee_advances(id) ON DELETE CASCADE,
    salary_payment_id uuid REFERENCES salary_payments(id) ON DELETE SET NULL,
    repayment_date date NOT NULL DEFAULT CURRENT_DATE,
    amount numeric(10,2) NOT NULL,
    method text NOT NULL DEFAULT 'salary_deduction' CHECK (method IN ('salary_deduction', 'cash_payment', 'bank_transfer')),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Create sequence for job_id
CREATE SEQUENCE IF NOT EXISTS job_id_seq START 1;

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

-- Function to create payment schedules
CREATE OR REPLACE FUNCTION create_payment_schedules()
RETURNS TRIGGER AS $$
DECLARE
    payment_amount DECIMAL(10,2);
    payment_count INTEGER;
    payment_interval INTERVAL;
    schedule_date DATE;
    i INTEGER;
BEGIN
    -- Calculate payment amount and count based on frequency
    CASE NEW.payment_frequency
        WHEN 'full' THEN
            payment_amount := NEW.total_cost;
            payment_count := 1;
            payment_interval := INTERVAL '0 months';
        WHEN 'half_yearly' THEN
            payment_amount := NEW.total_cost / 2;
            payment_count := 2;
            payment_interval := INTERVAL '6 months';
        WHEN 'quarterly' THEN
            payment_amount := NEW.total_cost / 4;
            payment_count := 4;
            payment_interval := INTERVAL '3 months';
        WHEN 'three_times' THEN
            payment_amount := NEW.total_cost / 3;
            payment_count := 3;
            payment_interval := INTERVAL '4 months';
        WHEN 'monthly' THEN
            payment_amount := NEW.total_cost / 12;
            payment_count := 12;
            payment_interval := INTERVAL '1 month';
        ELSE
            payment_amount := NEW.total_cost;
            payment_count := 1;
            payment_interval := INTERVAL '0 months';
    END CASE;

    -- Create payment schedules
    FOR i IN 1..payment_count LOOP
        IF i = 1 THEN
            schedule_date := NEW.agreement_date;
        ELSE
            schedule_date := NEW.agreement_date + (payment_interval * (i - 1));
        END IF;

        INSERT INTO payment_schedules (
            agreement_id,
            due_date,
            amount,
            payment_number,
            status,
            reminder_sent
        ) VALUES (
            NEW.id,
            schedule_date,
            payment_amount,
            i,
            'pending',
            false
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create salary transaction
CREATE OR REPLACE FUNCTION create_salary_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    INSERT INTO account_transactions (
      transaction_date,
      category_id,
      type,
      amount,
      description,
      reference_type,
      reference_id,
      payment_method,
      reference_number,
      created_by,
      status
    )
    SELECT 
      NEW.payment_date,
      ac.id,
      'expense',
      NEW.net_salary,
      'Salary payment for ' || u.name || ' - ' || TO_CHAR(TO_DATE(NEW.payment_month::text, 'MM'), 'Month') || ' ' || NEW.payment_year,
      'salary_payment',
      NEW.id,
      NEW.payment_method,
      NEW.reference_number,
      NEW.processed_by,
      'approved'
    FROM account_categories ac, users u
    WHERE ac.name = 'Employee Salaries' 
    AND u.id = NEW.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create advance transaction
CREATE OR REPLACE FUNCTION create_advance_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    INSERT INTO account_transactions (
      transaction_date,
      category_id,
      type,
      amount,
      description,
      reference_type,
      reference_id,
      payment_method,
      created_by,
      status
    )
    SELECT 
      NEW.advance_date,
      ac.id,
      'expense',
      NEW.amount,
      'Advance payment to ' || u.name || ' - ' || NEW.reason,
      'advance_payment',
      NEW.id,
      'cash',
      NEW.approved_by,
      'approved'
    FROM account_categories ac, users u
    WHERE ac.name = 'Employee Advances' 
    AND u.id = NEW.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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

-- Function to get user permissions
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

-- Function to get monthly financial summary
CREATE OR REPLACE FUNCTION get_monthly_financial_summary(month_val integer, year_val integer)
RETURNS TABLE(
  total_income numeric,
  total_expenses numeric,
  net_profit numeric,
  salary_expenses numeric,
  advance_expenses numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(income.total, 0) as total_income,
    COALESCE(expenses.total, 0) as total_expenses,
    COALESCE(income.total, 0) - COALESCE(expenses.total, 0) as net_profit,
    COALESCE(salary_exp.total, 0) as salary_expenses,
    COALESCE(advance_exp.total, 0) as advance_expenses
  FROM 
    (SELECT SUM(amount) as total 
     FROM account_transactions 
     WHERE type = 'income' 
     AND EXTRACT(MONTH FROM transaction_date) = month_val 
     AND EXTRACT(YEAR FROM transaction_date) = year_val
     AND status = 'approved') income
  FULL OUTER JOIN
    (SELECT SUM(amount) as total 
     FROM account_transactions 
     WHERE type = 'expense' 
     AND EXTRACT(MONTH FROM transaction_date) = month_val 
     AND EXTRACT(YEAR FROM transaction_date) = year_val
     AND status = 'approved') expenses ON true
  FULL OUTER JOIN
    (SELECT SUM(amount) as total 
     FROM account_transactions 
     WHERE reference_type = 'salary_payment'
     AND EXTRACT(MONTH FROM transaction_date) = month_val 
     AND EXTRACT(YEAR FROM transaction_date) = year_val
     AND status = 'approved') salary_exp ON true
  FULL OUTER JOIN
    (SELECT SUM(amount) as total 
     FROM account_transactions 
     WHERE reference_type = 'advance_payment'
     AND EXTRACT(MONTH FROM transaction_date) = month_val 
     AND EXTRACT(YEAR FROM transaction_date) = year_val
     AND status = 'approved') advance_exp ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER generate_job_id_trigger
  BEFORE INSERT ON service_calls
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_id();

CREATE TRIGGER service_call_status_change_trigger
  BEFORE UPDATE ON service_calls
  FOR EACH ROW
  EXECUTE FUNCTION track_service_call_status_change();

CREATE TRIGGER create_payment_schedules_trigger
  AFTER INSERT ON client_agreements
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_schedules();

CREATE TRIGGER salary_payment_transaction_trigger
  AFTER INSERT OR UPDATE ON salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_salary_transaction();

CREATE TRIGGER advance_payment_transaction_trigger
  AFTER INSERT OR UPDATE ON employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION create_advance_transaction();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_call_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecalling_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecalling_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_repayments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "users_select_own_profile" ON users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_insert_admin_manager" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'manager')
      AND u.active = true
    )
  );

CREATE POLICY "users_update_admin_manager" ON users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND (
        (u.role = 'admin' AND u.active = true) OR
        (u.role = 'manager' AND u.active = true AND users.role != 'admin') OR
        (u.id = users.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND (
        (u.role = 'admin' AND u.active = true) OR
        (u.role = 'manager' AND u.active = true AND users.role != 'admin') OR
        (u.id = users.id)
      )
    )
  );

CREATE POLICY "users_delete_admin_only" ON users
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role = 'admin'
      AND u.active = true
    )
  );

-- Create RLS policies for permissions table
CREATE POLICY "permissions_select_authenticated" ON permissions
  FOR SELECT TO authenticated
  USING (true);

-- Create RLS policies for user_permissions table
CREATE POLICY "user_permissions_select_authenticated" ON user_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Create RLS policies for clients table
CREATE POLICY "clients_select_authenticated" ON clients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "clients_insert_authenticated" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "clients_update_authenticated" ON clients
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clients_delete_authenticated" ON clients
  FOR DELETE TO authenticated
  USING (true);

-- Create RLS policies for service_calls table
CREATE POLICY "service_calls_select_authenticated" ON service_calls
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_calls_insert_authenticated" ON service_calls
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "service_calls_update_authenticated" ON service_calls
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "service_calls_delete_authenticated" ON service_calls
  FOR DELETE TO authenticated
  USING (true);

-- Create RLS policies for service_call_notes table
CREATE POLICY "service_call_notes_select_authenticated" ON service_call_notes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_call_notes_insert_authenticated" ON service_call_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "service_call_notes_update_authenticated" ON service_call_notes
  FOR UPDATE TO authenticated
  USING (true);

-- Create RLS policies for service_call_equipment table
CREATE POLICY "service_call_equipment_select_authenticated" ON service_call_equipment
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_call_equipment_insert_authenticated" ON service_call_equipment
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "service_call_equipment_update_authenticated" ON service_call_equipment
  FOR UPDATE TO authenticated
  USING (true);

-- Create RLS policies for service_call_feedback table
CREATE POLICY "service_call_feedback_select_authenticated" ON service_call_feedback
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_call_feedback_insert_authenticated" ON service_call_feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "service_call_feedback_update_authenticated" ON service_call_feedback
  FOR UPDATE TO authenticated
  USING (true);

-- Create RLS policies for service_call_invoices table
CREATE POLICY "service_call_invoices_select_authenticated" ON service_call_invoices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_call_invoices_insert_authenticated" ON service_call_invoices
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "service_call_invoices_update_authenticated" ON service_call_invoices
  FOR UPDATE TO authenticated
  USING (true);

-- Create RLS policies for service_call_status_history table
CREATE POLICY "service_call_status_history_select_authenticated" ON service_call_status_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_call_status_history_insert_authenticated" ON service_call_status_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create RLS policies for inventory table
CREATE POLICY "inventory_select_authenticated" ON inventory
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inventory_all_authenticated" ON inventory
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for inventory_transactions table
CREATE POLICY "inventory_transactions_select_authenticated" ON inventory_transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inventory_transactions_insert_authenticated" ON inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create RLS policies for telecalling_leads table
CREATE POLICY "telecalling_leads_select_authenticated" ON telecalling_leads
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "telecalling_leads_all_authenticated" ON telecalling_leads
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for telecalling_notes table
CREATE POLICY "telecalling_notes_select_authenticated" ON telecalling_notes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "telecalling_notes_insert_authenticated" ON telecalling_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create RLS policies for designations table
CREATE POLICY "designations_select_authenticated" ON designations
  FOR SELECT TO authenticated
  USING (true);

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

-- Create RLS policies for role_permissions table
CREATE POLICY "role_permissions_select_authenticated" ON role_permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_permissions_manage_admin" ON role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create RLS policies for user_permissions_override table
CREATE POLICY "user_permissions_override_select_authenticated" ON user_permissions_override
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "user_permissions_override_manage_admin" ON user_permissions_override
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create RLS policies for client_agreements table
CREATE POLICY "client_agreements_select_authenticated" ON client_agreements
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "client_agreements_insert_authenticated" ON client_agreements
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "client_agreements_update_authenticated" ON client_agreements
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "client_agreements_delete_authenticated" ON client_agreements
  FOR DELETE TO authenticated
  USING (true);

-- Create RLS policies for payment_schedules table
CREATE POLICY "payment_schedules_select_authenticated" ON payment_schedules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "payment_schedules_insert_authenticated" ON payment_schedules
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "payment_schedules_update_authenticated" ON payment_schedules
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for payment_records table
CREATE POLICY "payment_records_select_authenticated" ON payment_records
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "payment_records_insert_authenticated" ON payment_records
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create RLS policies for employee_family_members table
CREATE POLICY "family_members_admin_full_access" ON employee_family_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "family_members_employee_own_data" ON employee_family_members
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for employee_advances table
CREATE POLICY "advances_admin_full_access" ON employee_advances
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "advances_employee_view_own" ON employee_advances
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for salary_payments table
CREATE POLICY "salary_payments_admin_full_access" ON salary_payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "salary_payments_employee_view_own" ON salary_payments
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for account_categories table
CREATE POLICY "account_categories_admin_only" ON account_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create RLS policies for account_transactions table
CREATE POLICY "account_transactions_admin_only" ON account_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create RLS policies for advance_repayments table
CREATE POLICY "advance_repayments_admin_only" ON advance_repayments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_designation_id ON users(designation_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id_key ON users(employee_id);

CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_area ON clients(area);
CREATE INDEX IF NOT EXISTS idx_clients_mobile_office ON clients(mobile_office);
CREATE INDEX IF NOT EXISTS idx_clients_email_id ON clients(email_id);

CREATE INDEX IF NOT EXISTS idx_service_calls_job_id ON service_calls(job_id);
CREATE INDEX IF NOT EXISTS idx_service_calls_client_id ON service_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_service_calls_engineer_id ON service_calls(engineer_id);
CREATE INDEX IF NOT EXISTS idx_service_calls_status ON service_calls(status);
CREATE INDEX IF NOT EXISTS idx_service_calls_call_date ON service_calls(call_date);
CREATE INDEX IF NOT EXISTS idx_service_calls_scheduled_date ON service_calls(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_service_call_equipment_service_call_id ON service_call_equipment(service_call_id);
CREATE INDEX IF NOT EXISTS idx_service_call_feedback_service_call_id ON service_call_feedback(service_call_id);
CREATE INDEX IF NOT EXISTS idx_service_call_invoices_service_call_id ON service_call_invoices(service_call_id);
CREATE INDEX IF NOT EXISTS idx_service_call_invoices_invoice_number ON service_call_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_service_call_status_history_service_call_id ON service_call_status_history(service_call_id);
CREATE INDEX IF NOT EXISTS idx_service_call_notes_service_call_id ON service_call_notes(service_call_id);

CREATE INDEX IF NOT EXISTS idx_telecalling_leads_lead_type ON telecalling_leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_generation_date ON telecalling_leads(lead_generation_date);
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_created_by ON telecalling_leads(created_by);
CREATE INDEX IF NOT EXISTS idx_telecalling_leads_status_date ON telecalling_leads(status, lead_generation_date);

CREATE INDEX IF NOT EXISTS idx_designations_department ON designations(department);
CREATE INDEX IF NOT EXISTS idx_designations_level ON designations(level);
CREATE INDEX IF NOT EXISTS idx_designations_active ON designations(is_active);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON role_permissions(module);
CREATE INDEX IF NOT EXISTS idx_user_permissions_override_user_id ON user_permissions_override(user_id);

CREATE INDEX IF NOT EXISTS idx_client_agreements_client_id ON client_agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_client_agreements_agreement_date ON client_agreements(agreement_date);
CREATE INDEX IF NOT EXISTS idx_client_agreements_status ON client_agreements(status);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_agreement_id ON payment_schedules(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date_status ON payment_schedules(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_reminder_sent ON payment_schedules(reminder_sent);

CREATE INDEX IF NOT EXISTS idx_payment_records_schedule_id ON payment_records(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_agreement_id ON payment_records(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);

CREATE INDEX IF NOT EXISTS idx_employee_family_members_employee_id ON employee_family_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_advances_employee_id ON employee_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_advances_status ON employee_advances(status);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee_id ON salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month_year ON salary_payments(payment_month, payment_year);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON salary_payments(status);
CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON account_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_account_transactions_type ON account_transactions(type);
CREATE INDEX IF NOT EXISTS idx_account_transactions_category_id ON account_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_status ON account_transactions(status);
CREATE INDEX IF NOT EXISTS idx_advance_repayments_advance_id ON advance_repayments(advance_id);

-- Create telecalling_reports view
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

-- Insert default account categories
INSERT INTO account_categories (name, type, description) VALUES
  -- Income categories
  ('Service Revenue', 'income', 'Revenue from hardware service calls'),
  ('AMC Revenue', 'income', 'Annual Maintenance Contract revenue'),
  ('Product Sales', 'income', 'Revenue from hardware/software sales'),
  ('Consultation Fees', 'income', 'Technical consultation revenue'),
  ('Training Revenue', 'income', 'Revenue from training services'),
  ('Other Income', 'income', 'Miscellaneous income'),
  
  -- Expense categories
  ('Employee Salaries', 'expense', 'Monthly salary payments to employees'),
  ('Employee Advances', 'expense', 'Advance payments to employees'),
  ('Office Rent', 'expense', 'Monthly office rent payments'),
  ('Utilities', 'expense', 'Electricity, water, internet bills'),
  ('Equipment Purchase', 'expense', 'Purchase of tools and equipment'),
  ('Inventory Purchase', 'expense', 'Purchase of spare parts and inventory'),
  ('Vehicle Expenses', 'expense', 'Fuel, maintenance, insurance for vehicles'),
  ('Marketing Expenses', 'expense', 'Advertising and promotional costs'),
  ('Office Supplies', 'expense', 'Stationery and office consumables'),
  ('Professional Services', 'expense', 'Legal, accounting, consulting fees'),
  ('Insurance', 'expense', 'Business and employee insurance'),
  ('Taxes and Licenses', 'expense', 'Government taxes and license fees'),
  ('Travel Expenses', 'expense', 'Employee travel and accommodation'),
  ('Training Expenses', 'expense', 'Employee training and development'),
  ('Maintenance', 'expense', 'Office and equipment maintenance'),
  ('Other Expenses', 'expense', 'Miscellaneous business expenses')
ON CONFLICT (name) DO NOTHING;

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
  ('admin', 'manage_employee_finances', 'Manage employee salaries and advances', 'finance', 'manage'),
  ('admin', 'view_accounting', 'View income and expenditure reports', 'accounting', 'read'),
  ('admin', 'manage_accounting', 'Manage income and expenditure transactions', 'accounting', 'manage'),
  ('admin', 'process_salaries', 'Process monthly salary payments', 'payroll', 'manage'),
  ('admin', 'approve_advances', 'Approve employee advance requests', 'advances', 'manage'),
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
  ('admin', 'payment_management', 'Full payment management access', 'payments', 'all'),
  
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
('manage_settings', 'Manage system settings')
ON CONFLICT (name) DO NOTHING;

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
('Thermal Paste', 'CPU Thermal Compound', 'Cooling', 60, 7.99, 'Cool Systems')
ON CONFLICT DO NOTHING;

-- Comment on tables
COMMENT ON TABLE users IS 'Admin user admin@example.com updated with full admin privileges. Use this account to access all system features.';