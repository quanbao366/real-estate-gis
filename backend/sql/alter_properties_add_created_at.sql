-- Keep compatibility with backend code that expects properties.created_at.
-- Some existing DBs may not have this column.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

