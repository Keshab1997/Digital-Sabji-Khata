-- Add signature_name column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_name TEXT;
