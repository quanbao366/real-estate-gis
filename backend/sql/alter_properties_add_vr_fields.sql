-- Add VR/virtual tour fields to properties table
-- All columns are nullable to avoid impacting existing data.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS vr_url TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS model_3d TEXT;

