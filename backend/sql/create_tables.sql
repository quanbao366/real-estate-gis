-- Create users table for authentication
-- Run in PostgreSQL (adjust schema if needed)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optional: index to speed up login/register
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

