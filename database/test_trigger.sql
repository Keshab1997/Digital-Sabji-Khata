-- Test: Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test: Check existing licenses
SELECT email, status, license_type, created_at FROM user_licenses ORDER BY created_at DESC;

-- If new signups are not creating licenses automatically, 
-- you need to manually create them after signup using this:
-- (Replace the user_id and email with actual values from auth.users table)

-- First, check auth.users to get the user_id
-- SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- Then insert license manually:
-- INSERT INTO user_licenses (user_id, email, status, license_type, trial_start_date, trial_end_date)
-- VALUES (
--     'USER_ID_HERE',
--     'user@example.com',
--     'pending',
--     'trial',
--     NOW(),
--     NOW() + INTERVAL '7 days'
-- );
