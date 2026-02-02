-- Migration: Add password hash to users table
-- Stores bcrypt password hashes for authentication

ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Create index for efficient lookups
CREATE INDEX idx_users_email ON users(email);
