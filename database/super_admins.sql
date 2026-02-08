-- Create super_admins table for multiple super admins
CREATE TABLE IF NOT EXISTS super_admins (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    added_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default super admin
INSERT INTO super_admins (email, added_by) 
VALUES ('keshabsarkar2018@gmail.com', 'system')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view and manage super admins
CREATE POLICY "Super admins can view all"
    ON super_admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM super_admins sa
            JOIN user_licenses ul ON sa.email = ul.email
            WHERE ul.user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can insert"
    ON super_admins FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM super_admins sa
            JOIN user_licenses ul ON sa.email = ul.email
            WHERE ul.user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can delete"
    ON super_admins FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM super_admins sa
            JOIN user_licenses ul ON sa.email = ul.email
            WHERE ul.user_id = auth.uid()
        )
    );

-- Create index
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
