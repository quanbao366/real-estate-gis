-- Ensure properties has ownership + timestamps used by management APIs.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS user_id INT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- If properties.description column does not exist, add it (backend expects it on create/update)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS description TEXT;

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

