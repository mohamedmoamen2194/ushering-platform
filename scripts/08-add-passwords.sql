-- Add password field to users table for password-based authentication
-- Run this script to update your existing database

-- Add password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add email column if it doesn't exist (for password reset functionality)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update existing users with a default password (you should change these in production)
-- Default password is 'password123' - users should change this on first login
UPDATE users SET password_hash = 'default_hash_for_existing_users' WHERE password_hash IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show current users (without sensitive data)
SELECT id, phone, name, email, role, language, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password' END as password_status
FROM users; 