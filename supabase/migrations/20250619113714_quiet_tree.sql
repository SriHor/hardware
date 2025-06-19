-- Drop trigger first, then function to avoid dependency issues
DROP TRIGGER IF EXISTS create_payment_schedules_trigger ON client_agreements;
DROP FUNCTION IF EXISTS create_payment_schedules();

-- Create enhanced payment schedule function
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

-- Create the trigger
CREATE TRIGGER create_payment_schedules_trigger
    AFTER INSERT ON client_agreements
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_schedules();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date_status ON payment_schedules(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_reminder_sent ON payment_schedules(reminder_sent);

-- Update client_agreements table to support three_times payment frequency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'client_agreements_payment_frequency_check'
        AND check_clause LIKE '%three_times%'
    ) THEN
        ALTER TABLE client_agreements DROP CONSTRAINT IF EXISTS client_agreements_payment_frequency_check;
        ALTER TABLE client_agreements ADD CONSTRAINT client_agreements_payment_frequency_check 
        CHECK (payment_frequency = ANY (ARRAY['full'::text, 'half_yearly'::text, 'quarterly'::text, 'three_times'::text, 'monthly'::text]));
    END IF;
END $$;