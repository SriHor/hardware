/*
  # Complete Employee Management and Accounting System

  1. Employee Management
    - Extended employee fields (joining date, phone, address, salary, etc.)
    - Family member information
    - Employee advances tracking

  2. Accounting System
    - Income and expenditure tracking
    - Employee salary management
    - Advance payments tracking
    - Financial reporting

  3. Security
    - Admin-only access to financial data
    - Proper RLS policies
    - Permission-based access control
*/

-- Add extended employee fields to users table
DO $$
BEGIN
  -- Employee personal information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'employee_id') THEN
    ALTER TABLE users ADD COLUMN employee_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'joining_date') THEN
    ALTER TABLE users ADD COLUMN joining_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
    ALTER TABLE users ADD COLUMN phone_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE users ADD COLUMN emergency_contact_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE users ADD COLUMN emergency_contact_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emergency_contact_relation') THEN
    ALTER TABLE users ADD COLUMN emergency_contact_relation text;
  END IF;
  
  -- Employee financial information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'basic_salary') THEN
    ALTER TABLE users ADD COLUMN basic_salary numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'allowances') THEN
    ALTER TABLE users ADD COLUMN allowances numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'deductions') THEN
    ALTER TABLE users ADD COLUMN deductions numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_account_number') THEN
    ALTER TABLE users ADD COLUMN bank_account_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_name') THEN
    ALTER TABLE users ADD COLUMN bank_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ifsc_code') THEN
    ALTER TABLE users ADD COLUMN ifsc_code text;
  END IF;
END $$;

-- Create employee family members table
CREATE TABLE IF NOT EXISTS employee_family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text NOT NULL, -- spouse, child, parent, sibling, etc.
  phone_number text,
  date_of_birth date,
  occupation text,
  is_emergency_contact boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee advances table
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

-- Create salary payments table
CREATE TABLE IF NOT EXISTS salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_month integer NOT NULL, -- 1-12
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

-- Create account categories table
CREATE TABLE IF NOT EXISTS account_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create accounts (income and expenditure) table
CREATE TABLE IF NOT EXISTS account_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  category_id uuid NOT NULL REFERENCES account_categories(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  reference_type text, -- 'salary_payment', 'advance_payment', 'service_payment', 'other'
  reference_id uuid, -- ID of related record (salary payment, advance, etc.)
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'card')),
  reference_number text,
  vendor_customer text, -- Name of vendor or customer
  invoice_number text,
  receipt_number text,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create advance repayment tracking table
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

-- Enable RLS on all new tables
ALTER TABLE employee_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_repayments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_family_members
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

-- RLS Policies for employee_advances (Admin only for management, employees can view their own)
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

-- RLS Policies for salary_payments (Admin only for management, employees can view their own)
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

-- RLS Policies for account_categories (Admin only)
CREATE POLICY "account_categories_admin_only" ON account_categories
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for account_transactions (Admin only)
CREATE POLICY "account_transactions_admin_only" ON account_transactions
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for advance_repayments (Admin only)
CREATE POLICY "advance_repayments_admin_only" ON advance_repayments
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

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

-- Add financial permissions to role_permissions
INSERT INTO role_permissions (role, permission_name, permission_description, module, action) VALUES
  ('admin', 'manage_employee_finances', 'Manage employee salaries and advances', 'finance', 'manage'),
  ('admin', 'view_accounting', 'View income and expenditure reports', 'accounting', 'read'),
  ('admin', 'manage_accounting', 'Manage income and expenditure transactions', 'accounting', 'manage'),
  ('admin', 'process_salaries', 'Process monthly salary payments', 'payroll', 'manage'),
  ('admin', 'approve_advances', 'Approve employee advance requests', 'advances', 'manage')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Create indexes for better performance
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

-- Function to calculate employee's total advance balance
CREATE OR REPLACE FUNCTION get_employee_advance_balance(emp_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount - total_repaid) 
     FROM employee_advances 
     WHERE employee_id = emp_id AND status = 'active'),
    0
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

-- Trigger to automatically create account transaction when salary is paid
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

CREATE TRIGGER salary_payment_transaction_trigger
  AFTER INSERT OR UPDATE ON salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_salary_transaction();

-- Trigger to automatically create account transaction when advance is given
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

CREATE TRIGGER advance_payment_transaction_trigger
  AFTER INSERT OR UPDATE ON employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION create_advance_transaction();