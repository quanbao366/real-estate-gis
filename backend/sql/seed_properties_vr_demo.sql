-- Demo seed for panorama 360 virtual tours
-- This file INSERTs 2 new properties with virtual_tour_url.
-- NOTE: It does NOT attempt to pick existing users.
-- Update user_id values if your DB requires a valid user.

-- Replace these with valid user_id values in your DB.
-- If you already have a known user id, set DEMO_USER_ID_1 / 2 accordingly.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Demo VR Property 1') THEN
    INSERT INTO properties (
      user_id, title, price, area, property_type, location, description,
      latitude, longitude, listing_id, bedrooms, bathrooms,
      virtual_tour_url
    ) VALUES (
      (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
      'Demo VR Property 1',
      3500000,
      45,
      'Căn hộ',
      'Demo Location 1',
      'Demo property for VR/360 panorama tour.',
      10.8231,
      106.6297,
      'demo-1',
      2,
      1,
      '/virtual-tour/house1.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Demo VR Property 2') THEN
    INSERT INTO properties (
      user_id, title, price, area, property_type, location, description,
      latitude, longitude, listing_id, bedrooms, bathrooms,
      virtual_tour_url
    ) VALUES (
      (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
      'Demo VR Property 2',
      5200000,
      62,
      'Nhà phố',
      'Demo Location 2',
      'Demo property for VR/360 panorama tour.',
      10.7758,
      106.7016,
      'demo-2',
      3,
      2,
      '/virtual-tour/apartment1.jpg'
    );
  END IF;
END $$;

