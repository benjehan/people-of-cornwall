-- ================================================
-- SEED DATA: 30 Engaging Polls for Cornwall
-- All polls are inactive (is_active = false) until admin activates
-- ================================================

-- Get admin user ID (or use NULL if none exists)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- ==========================================
  -- CORNWALL-WIDE POLLS (General Appeal)
  -- ==========================================

  -- 1. Best Pasty
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Pasty Shop in Cornwall 2026',
    'The ultimate Cornish debate! Which bakery makes the best traditional Cornish pasty? Nominate your favourite and let the people decide.',
    'best_shop',
    NULL,
    false,
    true,
    admin_id
  );

  -- 2. Best Beach
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Cornwall''s Best Beach',
    'From hidden coves to golden sandy stretches - which Cornish beach is your absolute favourite? Time to settle this once and for all!',
    'best_beach',
    NULL,
    false,
    true,
    admin_id
  );

  -- 3. Best Fish & Chips
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Fish & Chips in Cornwall',
    'Golden battered fish, crispy chips, and that sea air - which chippy does it best? Nominate your go-to spot!',
    'best_restaurant',
    NULL,
    false,
    true,
    admin_id
  );

  -- 4. Best Coastal Walk
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Coastal Walk in Cornwall',
    'With 300 miles of South West Coast Path, which stretch takes your breath away? Share your favourite walk.',
    'best_walk',
    NULL,
    false,
    true,
    admin_id
  );

  -- 5. Best Cream Tea
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Cream Tea in Cornwall',
    'Scones, clotted cream, and jam (cream first, obviously!) - where serves the most heavenly cream tea?',
    'best_cafe',
    NULL,
    false,
    true,
    admin_id
  );

  -- 6. Best Sunset Spot
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Sunset Spot in Cornwall',
    'Those famous Cornish sunsets deserve the perfect viewing spot. Where do you go to watch the sky turn gold?',
    'best_site',
    NULL,
    false,
    true,
    admin_id
  );

  -- 7. Best Surf Beach
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Surf Beach in Cornwall',
    'Whether you''re a pro or just learning, which beach has the best waves and vibe for surfing?',
    'best_beach',
    NULL,
    false,
    true,
    admin_id
  );

  -- 8. Most Iconic Cornish Site
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Most Iconic Site in Cornwall',
    'From ancient ruins to dramatic cliffs - what place most captures the spirit of Cornwall for you?',
    'best_site',
    NULL,
    false,
    true,
    admin_id
  );

  -- 9. Best Local Art Gallery
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Art Gallery in Cornwall',
    'Cornwall has inspired artists for centuries. Which gallery best showcases local talent and creativity?',
    'best_business',
    NULL,
    false,
    true,
    admin_id
  );

  -- 10. Best Cornish Festival
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Festival in Cornwall',
    'From Mazey Day to Boardmasters, Golowan to Port Eliot - which Cornish festival do you look forward to most?',
    'best_event',
    NULL,
    false,
    true,
    admin_id
  );

  -- ==========================================
  -- TOWN-SPECIFIC POLLS (Local Pride)
  -- ==========================================

  -- 11. Best Pub in St Ives
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Pub in St Ives',
    'St Ives has some legendary watering holes. Which pub has the best atmosphere, views, or pints?',
    'best_pub',
    'St Ives',
    false,
    false,
    admin_id
  );

  -- 12. Best Café in Falmouth
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Café in Falmouth',
    'From harbour-side spots to hidden gems - where do Falmouth locals go for their coffee fix?',
    'best_cafe',
    'Falmouth',
    false,
    false,
    admin_id
  );

  -- 13. Best Restaurant in Padstow
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Restaurant in Padstow',
    'Beyond the celebrity chefs, which Padstow restaurant truly delivers an unforgettable meal?',
    'best_restaurant',
    'Padstow',
    false,
    false,
    admin_id
  );

  -- 14. Best Shop in Truro
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Independent Shop in Truro',
    'Supporting local! Which independent shop in Truro deserves more love and customers?',
    'best_shop',
    'Truro',
    false,
    false,
    admin_id
  );

  -- 15. Best Pub in Penzance
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Pub in Penzance',
    'From historic inns to modern bars - which Penzance pub is your favourite for a proper night out?',
    'best_pub',
    'Penzance',
    false,
    false,
    admin_id
  );

  -- 16. Best Café in Fowey
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Café in Fowey',
    'This charming harbour town has some lovely spots for tea and cake. Which is your go-to?',
    'best_cafe',
    'Fowey',
    false,
    false,
    admin_id
  );

  -- 17. Best Walk around Tintagel
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Walk around Tintagel',
    'King Arthur''s legendary home has stunning coastal paths. Which walk do you recommend?',
    'best_walk',
    'Tintagel',
    false,
    false,
    admin_id
  );

  -- 18. Best Beach near Newquay
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Beach in the Newquay Area',
    'Fistral, Watergate, Crantock... Newquay has beaches galore! Which one tops your list?',
    'best_beach',
    'Newquay',
    false,
    false,
    admin_id
  );

  -- 19. Best Pub in Mousehole
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Pub in Mousehole',
    'This picture-perfect fishing village has some cosy pubs. Which is the best for a pint?',
    'best_pub',
    'Mousehole',
    false,
    false,
    admin_id
  );

  -- 20. Best Restaurant in Looe
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Restaurant in Looe',
    'Fresh seafood and harbour views - which Looe restaurant serves up the best dining experience?',
    'best_restaurant',
    'Looe',
    false,
    false,
    admin_id
  );

  -- ==========================================
  -- COMMUNITY & CULTURE POLLS
  -- ==========================================

  -- 21. Best Live Music Venue
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Live Music Venue in Cornwall',
    'From intimate pubs to proper venues - where have you had the best live music experience in Cornwall?',
    'best_business',
    NULL,
    false,
    true,
    admin_id
  );

  -- 22. Best Act of Kindness
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Act of Kindness in Cornwall 2025',
    'Celebrate the good in our community! Nominate someone who went above and beyond to help others.',
    'best_kindness',
    NULL,
    false,
    true,
    admin_id
  );

  -- 23. Most Memorable Cornish Character
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Most Memorable Cornish Character',
    'Every village has them - the local legends who make Cornwall special. Who''s your favourite character?',
    'best_character',
    NULL,
    false,
    true,
    admin_id
  );

  -- 24. Best Local Business Story
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Local Business Success Story',
    'Which Cornish business has an inspiring story? Started from nothing, overcame challenges, or gives back to community.',
    'best_business',
    NULL,
    false,
    true,
    admin_id
  );

  -- 25. Best Hidden Gem
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Cornwall''s Best Hidden Gem',
    'The places only locals know about... Share your secret spot (but maybe not your absolute favourite!)',
    'other',
    NULL,
    false,
    true,
    admin_id
  );

  -- 26. Best Cornish Memory
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Cornish Memory of 2025',
    'What moment from this year in Cornwall will you never forget? A festival, a sunset, a chance encounter?',
    'best_memory',
    NULL,
    false,
    true,
    admin_id
  );

  -- ==========================================
  -- THEMATIC & SEASONAL POLLS
  -- ==========================================

  -- 27. Best Dog-Friendly Pub
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Dog-Friendly Pub in Cornwall',
    'Four-legged friends welcome! Which pub gives the warmest welcome to you AND your dog?',
    'best_pub',
    NULL,
    false,
    true,
    admin_id
  );

  -- 28. Best Family Day Out
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Family Day Out in Cornwall',
    'Planning a day with the kids? Which attraction or activity gets the whole family excited?',
    'best_event',
    NULL,
    false,
    true,
    admin_id
  );

  -- 29. Best Rainy Day Activity
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Rainy Day Activity in Cornwall',
    'Let''s be honest, it rains sometimes! Where do you go when the weather turns?',
    'other',
    NULL,
    false,
    true,
    admin_id
  );

  -- 30. Best Winter Beach Walk
  INSERT INTO polls (title, description, category, location_name, is_active, show_nomination_location, created_by)
  VALUES (
    'Best Winter Beach Walk in Cornwall',
    'Wild waves, empty sands, and that crisp air - which beach is best for a bracing winter walk?',
    'best_walk',
    NULL,
    false,
    true,
    admin_id
  );

END $$;

-- Log completion
DO $$ BEGIN RAISE NOTICE '✅ Successfully seeded 30 polls for Cornwall!'; END $$;
