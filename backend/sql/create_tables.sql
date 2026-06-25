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

-- -------------------- favorites table --------------------

-- Lưu bất động sản yêu thích của từng user
-- Thiết kế theo yêu cầu:
-- - favorites.id
-- - favorites.user_id  -> users.id
-- - favorites.property_id -> properties.id
-- - favorites.created_at
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_favorites_user_property UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites (property_id);

-- Note:
-- properties table is defined in create_properties.sql

