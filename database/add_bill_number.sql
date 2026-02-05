-- Add bill number tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_bill_no INT DEFAULT 0;
