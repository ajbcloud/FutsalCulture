
-- Migration to add authentication fields to users table
ALTER TABLE users 
ADD COLUMN password_hash TEXT,
ADD COLUMN auth_provider TEXT,
ADD COLUMN auth_provider_id TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update existing users to have 'replit' as auth provider if they don't have one
UPDATE users SET auth_provider = 'replit' WHERE auth_provider IS NULL;
