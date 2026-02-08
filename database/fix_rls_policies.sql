-- Drop existing policies
DROP POLICY IF EXISTS "Users can view licenses" ON user_licenses;
DROP POLICY IF EXISTS "Users can view their own license" ON user_licenses;
DROP POLICY IF EXISTS "Super admin can view all licenses" ON user_licenses;
DROP POLICY IF EXISTS "System can insert licenses" ON user_licenses;
DROP POLICY IF EXISTS "Super admin can update licenses" ON user_licenses;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_licenses
        WHERE user_id = auth.uid()
        AND email = 'keshabsarkar2018@gmail.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policies
CREATE POLICY "Users can view licenses"
    ON user_licenses FOR SELECT
    USING (auth.uid() = user_id OR is_super_admin());

CREATE POLICY "System can insert licenses"
    ON user_licenses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Super admin can update licenses"
    ON user_licenses FOR UPDATE
    USING (is_super_admin());
