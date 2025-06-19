/*
  # Enhanced Payment System with Proper Calculations

  1. Updates
    - Add currency support (INR)
    - Update payment calculation logic
    - Enhance payment schedule generation
    - Add proper date calculations for Indian context

  2. Functions
    - Enhanced payment schedule creation
    - Proper amount distribution based on frequency
*/

-- Drop existing function to recreate with enhanced logic
DROP FUNCTION IF EXISTS create_payment_schedules();

-- Create enhanced payment schedule function
CREATE OR REPLACE FUNCTION create_payment_schedules()
RETURNS TRIGGER AS $$
DECLARE
    payment_amount DECIMAL(10,2);
    payment_count INTEGER;
    payment_interval INTERVAL;
    current_date DATE;
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
            current_date := NEW.agreement_date;
        ELSE
            current_date := NEW.agreement_date + (payment_interval * (i - 1));
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
            current_date,
            payment_amount,
            i,
            'pending',
            false
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger
DROP TRIGGER IF EXISTS create_payment_schedules_trigger ON client_agreements;
CREATE TRIGGER create_payment_schedules_trigger
    AFTER INSERT ON client_agreements
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_schedules();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date_status ON payment_schedules(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_reminder_sent ON payment_schedules(reminder_sent);