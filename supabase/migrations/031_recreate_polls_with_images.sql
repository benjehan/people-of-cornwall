-- ================================================
-- RECREATE POLLS: Enable images for visual polls
-- ================================================

-- First, delete all seeded polls (those without votes/nominations can be safely deleted)
-- This deletes polls that match our seed titles
DELETE FROM polls WHERE title IN (
  'Best Pasty Shop in Cornwall 2026',
  'Cornwall''s Best Beach',
  'Best Fish & Chips in Cornwall',
  'Best Coastal Walk in Cornwall',
  'Best Cream Tea in Cornwall',
  'Best Sunset Spot in Cornwall',
  'Best Surf Beach in Cornwall',
  'Most Iconic Site in Cornwall',
  'Best Art Gallery in Cornwall',
  'Best Festival in Cornwall',
  'Best Pub in St Ives',
  'Best Café in Falmouth',
  'Best Restaurant in Padstow',
  'Best Independent Shop in Truro',
  'Best Pub in Penzance',
  'Best Café in Fowey',
  'Best Walk around Tintagel',
  'Best Beach in the Newquay Area',
  'Best Pub in Mousehole',
  'Best Restaurant in Looe',
  'Best Live Music Venue in Cornwall',
  'Best Act of Kindness in Cornwall 2025',
  'Most Memorable Cornish Character',
  'Best Local Business Success Story',
  'Cornwall''s Best Hidden Gem',
  'Best Cornish Memory of 2025',
  'Best Dog-Friendly Pub in Cornwall',
  'Best Family Day Out in Cornwall',
  'Best Rainy Day Activity in Cornwall',
  'Best Winter Beach Walk in Cornwall'
);

-- Now recreate all polls with proper image settings
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- ==========================================
  -- CORNWALL-WIDE POLLS
  -- ==========================================

  -- 1. Best Pasty (no images needed)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Pasty Shop in Cornwall 2026',
    'The ultimate Cornish debate! Which bakery makes the best traditional Cornish pasty?',
    'best_shop',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 2. Best Beach (IMAGES: show off the beach!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Cornwall''s Best Beach',
    'From hidden coves to golden sandy stretches - share a photo of your favourite!',
    'best_beach',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 3. Best Fish & Chips (no images)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Fish & Chips in Cornwall',
    'Golden battered fish, crispy chips - which chippy does it best?',
    'best_restaurant',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 4. Best Coastal Walk (IMAGES: scenic walks!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Coastal Walk in Cornwall',
    'Which stretch of the South West Coast Path takes your breath away? Share a photo!',
    'best_walk',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 5. Best Cream Tea (IMAGES: show those scones!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Cream Tea in Cornwall',
    'Scones, clotted cream, and jam - where serves the most heavenly cream tea? Show us!',
    'best_cafe',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 6. Best Sunset Spot (IMAGES: definitely!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Sunset Spot in Cornwall',
    'Those famous Cornish sunsets deserve the perfect viewing spot. Share your best sunset photo!',
    'best_site',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 7. Best Surf Beach (IMAGES: waves and vibes)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Surf Beach in Cornwall',
    'Which beach has the best waves? Share a photo of your favourite surf spot!',
    'best_beach',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 8. Most Iconic Site (IMAGES: iconic views!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Most Iconic Site in Cornwall',
    'From ancient ruins to dramatic cliffs - what place captures the spirit of Cornwall? Share a photo!',
    'best_site',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 9. Best Art Gallery (no images)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Art Gallery in Cornwall',
    'Cornwall has inspired artists for centuries. Which gallery best showcases local talent?',
    'best_business',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 10. Best Festival (IMAGES: festival vibes!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Festival in Cornwall',
    'From Mazey Day to Boardmasters - which Cornish festival do you love most? Share a memory!',
    'best_event',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- ==========================================
  -- TOWN-SPECIFIC POLLS (location already specified)
  -- ==========================================

  -- 11. Best Pub in St Ives
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Pub in St Ives',
    'St Ives has some legendary watering holes. Which pub has the best atmosphere?',
    'best_pub',
    'St Ives',
    false,
    false,
    false,
    admin_id
  );

  -- 12. Best Café in Falmouth
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Café in Falmouth',
    'From harbour-side spots to hidden gems - where do locals go for coffee?',
    'best_cafe',
    'Falmouth',
    false,
    false,
    false,
    admin_id
  );

  -- 13. Best Restaurant in Padstow
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Restaurant in Padstow',
    'Beyond the celebrity chefs - which Padstow restaurant truly delivers?',
    'best_restaurant',
    'Padstow',
    false,
    false,
    false,
    admin_id
  );

  -- 14. Best Shop in Truro
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Independent Shop in Truro',
    'Supporting local! Which independent shop in Truro deserves more love?',
    'best_shop',
    'Truro',
    false,
    false,
    false,
    admin_id
  );

  -- 15. Best Pub in Penzance
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Pub in Penzance',
    'From historic inns to modern bars - which Penzance pub is your favourite?',
    'best_pub',
    'Penzance',
    false,
    false,
    false,
    admin_id
  );

  -- 16. Best Café in Fowey
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Café in Fowey',
    'This charming harbour town has lovely spots for tea and cake. Which is your go-to?',
    'best_cafe',
    'Fowey',
    false,
    false,
    false,
    admin_id
  );

  -- 17. Best Walk around Tintagel (IMAGES: scenic!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Walk around Tintagel',
    'King Arthur''s legendary home has stunning coastal paths. Share your favourite walk photo!',
    'best_walk',
    'Tintagel',
    false,
    false,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 18. Best Beach near Newquay (IMAGES: beach photos!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Beach in the Newquay Area',
    'Fistral, Watergate, Crantock... Which Newquay beach tops your list? Share a photo!',
    'best_beach',
    'Newquay',
    false,
    false,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 19. Best Pub in Mousehole
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Pub in Mousehole',
    'This picture-perfect fishing village has cosy pubs. Which is best for a pint?',
    'best_pub',
    'Mousehole',
    false,
    false,
    false,
    admin_id
  );

  -- 20. Best Restaurant in Looe
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Restaurant in Looe',
    'Fresh seafood and harbour views - which Looe restaurant is best?',
    'best_restaurant',
    'Looe',
    false,
    false,
    false,
    admin_id
  );

  -- ==========================================
  -- COMMUNITY & CULTURE POLLS
  -- ==========================================

  -- 21. Best Live Music Venue
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Live Music Venue in Cornwall',
    'From intimate pubs to proper venues - where have you had the best live music experience?',
    'best_business',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 22. Best Act of Kindness (IMAGES: heartwarming moments)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Act of Kindness in Cornwall 2025',
    'Celebrate the good in our community! Nominate someone who went above and beyond.',
    'best_kindness',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 23. Most Memorable Character (IMAGES: local legends)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Most Memorable Cornish Character',
    'Every village has them - the local legends who make Cornwall special. Share a photo if you have one!',
    'best_character',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 24. Best Local Business Story
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Local Business Success Story',
    'Which Cornish business has an inspiring story? Started from nothing, overcame challenges, or gives back.',
    'best_business',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 25. Best Hidden Gem (IMAGES: secret spots!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Cornwall''s Best Hidden Gem',
    'The places only locals know about... Share your secret spot (with a photo if you dare!)',
    'other',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- 26. Best Cornish Memory (IMAGES: memories!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Cornish Memory of 2025',
    'What moment from this year in Cornwall will you never forget? Share a photo!',
    'best_memory',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

  -- ==========================================
  -- THEMATIC POLLS
  -- ==========================================

  -- 27. Best Dog-Friendly Pub
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Dog-Friendly Pub in Cornwall',
    'Four-legged friends welcome! Which pub gives the warmest welcome to you AND your dog?',
    'best_pub',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 28. Best Family Day Out
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Family Day Out in Cornwall',
    'Planning a day with the kids? Which attraction gets the whole family excited?',
    'best_event',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 29. Best Rainy Day Activity
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Rainy Day Activity in Cornwall',
    'Let''s be honest, it rains sometimes! Where do you go when the weather turns?',
    'other',
    NULL,
    false,
    true,
    false,
    admin_id
  );

  -- 30. Best Winter Beach Walk (IMAGES: dramatic winter scenes!)
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, allow_nomination_images, created_by)
  VALUES (
    'Best Winter Beach Walk in Cornwall',
    'Wild waves, empty sands, crisp air - which beach is best for a bracing winter walk? Share a photo!',
    'best_walk',
    NULL,
    false,
    true,
    true,  -- IMAGES ENABLED
    admin_id
  );

END $$;

-- Log completion
DO $$ BEGIN RAISE NOTICE '✅ Recreated 30 polls with image settings!'; END $$;
