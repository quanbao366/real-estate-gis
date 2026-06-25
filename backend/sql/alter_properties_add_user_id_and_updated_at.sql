-- Add ownership + updated timestamp to properties
-- - user_id: FK -> users(id)
-- - updated_at: timestamp, used when editing a property

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS user_id INT;

-- If updated_at column missing, add it
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Add FK constraint (avoid error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_properties_user_id'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT fk_properties_user_id
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

