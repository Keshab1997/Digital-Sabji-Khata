-- Create user_licenses table
CREATE TABLE IF NOT EXISTS user_licenses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, expired
    license_type TEXT DEFAULT 'paid', -- trial, paid
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    license_start_date TIMESTAMP WITH TIME ZONE,
    license_end_date TIMESTAMP WITH TIME ZONE,
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, partial
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) DEFAULT 5000,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS user_payments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_licenses
DROP POLICY IF EXISTS "Users can view their own license" ON user_licenses;
DROP POLICY IF EXISTS "Super admin can view all licenses" ON user_licenses;
DROP POLICY IF EXISTS "System can insert licenses" ON user_licenses;
DROP POLICY IF EXISTS "Super admin can update licenses" ON user_licenses;

CREATE POLICY "Users can view licenses"
    ON user_licenses FOR SELECT
    USING (
        auth.uid() = user_id 
        OR email IN (
            SELECT email FROM user_licenses WHERE user_id = auth.uid() AND email = 'keshabsarkar2018@gmail.com'
        )
    );

CREATE POLICY "System can insert licenses"
    ON user_licenses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Super admin can update licenses"
    ON user_licenses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_licenses ul 
            WHERE ul.user_id = auth.uid() 
            AND ul.email = 'keshabsarkar2018@gmail.com'
        )
    );

-- RLS Policies for user_payments
DROP POLICY IF EXISTS "Users can view their own payments" ON user_payments;
DROP POLICY IF EXISTS "Super admin can view all payments" ON user_payments;
DROP POLICY IF EXISTS "Super admin can insert payments" ON user_payments;

CREATE POLICY "Users can view their own payments"
    ON user_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admin can view all payments"
    ON user_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_licenses 
            WHERE user_licenses.user_id = auth.uid() 
            AND user_licenses.email = 'keshabsarkar2018@gmail.com'
        )
    );

CREATE POLICY "Super admin can insert payments"
    ON user_payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_licenses 
            WHERE user_licenses.user_id = auth.uid() 
            AND user_licenses.email = 'keshabsarkar2018@gmail.com'
        )
    );

-- RLS Policies for activity_logs
DROP POLICY IF EXISTS "Users can view their own logs" ON activity_logs;
DROP POLICY IF EXISTS "Super admin can view all logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON activity_logs;

CREATE POLICY "Users can view their own logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admin can view all logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_licenses 
            WHERE user_licenses.user_id = auth.uid() 
            AND user_licenses.email = 'keshabsarkar2018@gmail.com'
        )
    );

CREATE POLICY "Anyone can insert logs"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_status ON user_licenses(status);
CREATE INDEX IF NOT EXISTS idx_user_licenses_email ON user_licenses(email);
CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Function to auto-create license on user signup
CREATE OR REPLACE FUNCTION create_user_license()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_licenses (user_id, email, status, license_type, trial_start_date, trial_end_date)
    VALUES (
        NEW.id,
        NEW.email,
        'pending',
        'trial',
        NOW(),
        NOW() + INTERVAL '7 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create license on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_license();
