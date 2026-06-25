-- Create properties table (compatible with backend/server.js queries)
-- Expected by backend:
--  - properties.id, title, price, area, location, latitude, longitude
--  - listing_id, bedrooms, bathrooms, property_type
--  - Optional PostGIS geom column `geom` (geometry)
--
-- If you already import data into latitude/longitude, this schema works as-is.
-- If you import PostGIS geom, backend will prefer it.

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,

  -- Core fields (used in API responses)
  title TEXT,
  price NUMERIC,
  area NUMERIC,
  location TEXT,

  -- Non-PostGIS coordinates (backend FALLBACK)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Additional fields (used in filters/UI)
  listing_id TEXT,
  bedrooms INT,
  bathrooms INT,
  property_type TEXT,

  -- PostGIS geometry (optional but supported by backend)
  -- Backend uses: ST_Y(geom::geometry), ST_X(geom::geometry)
  -- So `geom` must exist and be convertible to geometry.
  geom geometry,

  -- VR/Virtual tour fields (nullable)
  virtual_tour_url TEXT,
  vr_url TEXT,
  model_3d TEXT,

  posted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for faster filtering/search
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties (area);
CREATE INDEX IF NOT EXISTS idx_properties_location_lower ON properties (LOWER(location));
CREATE INDEX IF NOT EXISTS idx_properties_property_type_lower ON properties (LOWER(property_type));

-- PostGIS spatial index (only helps if geom is populated)
-- Safe even if geom is NULL for many rows.
CREATE INDEX IF NOT EXISTS idx_properties_geom_gist ON properties USING GIST (geom);

