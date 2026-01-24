-- ================================================
-- SEED DATA: 50 Events in Cornwall
-- Mix of real annual events and realistic community events
-- All approved and with various dates throughout 2025-2026
-- ================================================

DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- ==========================================
  -- MAJOR FESTIVALS & ANNUAL EVENTS
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, contact_email, website_url, is_free, is_child_friendly, created_by) VALUES
  ('Boardmasters Festival 2025', 'Cornwall''s biggest surf and music festival returns to Watergate Bay. Five days of world-class surfing, live music, and beach vibes.', 'Newquay', 'Watergate Bay, Newquay TR8 4AA', '2025-08-06 12:00:00+00', '2025-08-10 23:00:00+00', true, true, 'info@boardmasters.com', 'https://boardmasters.com', false, true, admin_id),
  
  ('Mazey Day - Golowan Festival', 'Penzance''s biggest celebration! Street performers, live music, parades, and the famous Mazey Day festivities throughout the town centre.', 'Penzance', 'Town Centre, Penzance', '2025-06-28 10:00:00+00', '2025-06-28 23:00:00+00', true, true, 'info@golowan.org', 'https://golowan.org', true, true, admin_id),
  
  ('St Ives September Festival', 'Two weeks of arts, music, comedy, and literature in one of Cornwall''s most beautiful towns. Over 200 events across multiple venues.', 'St Ives', 'Various venues, St Ives', '2025-09-06 10:00:00+00', '2025-09-20 22:00:00+00', true, true, 'info@stivesseptemberfestival.co.uk', 'https://stivesseptemberfestival.co.uk', false, true, admin_id),
  
  ('Falmouth Sea Shanty Festival', 'The UK''s largest free sea shanty festival! Over 60 groups perform across Falmouth''s harbourside venues. A celebration of maritime music.', 'Falmouth', 'Events Square & Harbour, Falmouth', '2025-06-13 12:00:00+00', '2025-06-15 21:00:00+00', true, true, 'info@falmouthseashanty.co.uk', 'https://falmouthseashanty.co.uk', true, true, admin_id),
  
  ('Padstow May Day - Obby Oss', 'One of Britain''s oldest fertility celebrations. The famous Obby Oss dances through the streets in this unforgettable tradition.', 'Padstow', 'Town Centre, Padstow', '2025-05-01 06:00:00+00', '2025-05-01 23:00:00+00', true, true, NULL, NULL, true, true, admin_id),
  
  ('Royal Cornwall Show', 'Cornwall''s biggest agricultural show at the Royal Cornwall Showground. Livestock, food, crafts, and entertainment for all ages.', 'Wadebridge', 'Royal Cornwall Showground, Wadebridge PL27 7JE', '2025-06-05 08:00:00+00', '2025-06-07 18:00:00+00', true, true, 'info@royalcornwallshow.org', 'https://royalcornwallshow.org', false, true, admin_id),
  
  ('Looe Music Festival', 'Three days of live music across multiple stages in this charming fishing town. Rock, folk, blues, and more.', 'Looe', 'Looe', '2025-09-26 14:00:00+00', '2025-09-28 23:00:00+00', true, false, 'info@looemusicfestival.co.uk', 'https://looemusicfestival.co.uk', false, true, admin_id),
  
  ('Trevithick Day', 'Celebrating Camborne''s famous son, Richard Trevithick. Steam engines, parades, live music, and local heritage.', 'Camborne', 'Town Centre, Camborne', '2025-04-26 10:00:00+00', '2025-04-26 17:00:00+00', true, false, NULL, NULL, true, true, admin_id),
  
  ('Flora Day - Helston', 'The famous Furry Dance through Helston''s streets. One of Cornwall''s most beloved traditions, celebrating the arrival of spring.', 'Helston', 'Town Centre, Helston', '2025-05-08 07:00:00+00', '2025-05-08 17:00:00+00', true, true, NULL, NULL, true, true, admin_id),
  
  ('Newlyn Fish Festival', 'Celebrating Newlyn''s fishing heritage with fresh seafood, cooking demonstrations, boat trips, and family entertainment.', 'Newlyn', 'Newlyn Harbour, Newlyn', '2025-08-25 10:00:00+00', '2025-08-25 17:00:00+00', true, false, 'info@newlynfishfestival.org.uk', 'https://newlynfishfestival.org.uk', true, true, admin_id);

  -- ==========================================
  -- FOOD & DRINK EVENTS
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, contact_email, website_url, is_free, is_child_friendly, is_dog_friendly, created_by) VALUES
  ('Porthleven Food Festival', 'Award-winning food festival in the picturesque harbour village. Celebrity chefs, local producers, and incredible Cornish cuisine.', 'Porthleven', 'Harbour area, Porthleven', '2025-04-25 10:00:00+00', '2025-04-27 18:00:00+00', true, true, 'info@porthlevenfoodfestival.com', 'https://porthlevenfoodfestival.com', true, true, true, admin_id),
  
  ('Great Cornish Food Store Tasting Event', 'Sample the best of Cornish produce at this monthly tasting event. Local cheeses, wines, preserves, and more.', 'Truro', 'Lemon Street Market, Truro', '2025-03-15 11:00:00+00', '2025-03-15 15:00:00+00', true, false, NULL, NULL, true, true, false, admin_id),
  
  ('Padstow Christmas Festival', 'Rick Stein and friends host this festive food festival. Celebrity chef demonstrations, Christmas market, and seasonal treats.', 'Padstow', 'Town Centre, Padstow', '2025-12-04 10:00:00+00', '2025-12-07 18:00:00+00', true, true, 'info@padstowchristmasfestival.co.uk', 'https://padstowchristmasfestival.co.uk', true, true, true, admin_id),
  
  ('St Austell Beer Festival', 'Celebrating Cornwall''s brewing heritage with over 100 real ales, ciders, and live music at the historic brewery.', 'St Austell', 'St Austell Brewery, St Austell', '2025-05-23 16:00:00+00', '2025-05-24 23:00:00+00', true, false, 'events@staustellbrewery.co.uk', 'https://staustellbrewery.co.uk', false, false, false, admin_id),
  
  ('Truro Farmers Market - Summer Special', 'Extended summer market with local produce, street food, live music, and family activities in the cathedral city.', 'Truro', 'Lemon Quay, Truro', '2025-07-12 09:00:00+00', '2025-07-12 16:00:00+00', true, false, NULL, NULL, true, true, true, admin_id),
  
  ('Cornish Pasty Festival', 'Celebrating Cornwall''s most famous export! Pasty competitions, cooking demos, and plenty of tasting opportunities.', 'Bodmin', 'Bodmin Town Centre', '2025-02-28 10:00:00+00', '2025-03-01 17:00:00+00', true, false, NULL, NULL, true, true, false, admin_id);

  -- ==========================================
  -- ARTS & CULTURE
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, contact_email, website_url, is_free, is_child_friendly, is_accessible, created_by) VALUES
  ('Tate St Ives - Summer Exhibition Opening', 'The opening weekend of a major new exhibition featuring contemporary Cornish artists. Free talks and workshops.', 'St Ives', 'Tate St Ives, Porthmeor Beach, St Ives TR26 1TG', '2025-06-21 10:00:00+00', '2025-06-22 17:00:00+00', true, true, 'information@tate.org.uk', 'https://tate.org.uk/visit/tate-st-ives', false, true, true, admin_id),
  
  ('Minack Theatre - Macbeth', 'Shakespeare''s darkest tragedy performed at the world-famous open-air theatre carved into the cliffs.', 'Porthcurno', 'Minack Theatre, Porthcurno TR19 6JU', '2025-07-14 19:30:00+00', '2025-07-14 22:30:00+00', true, true, 'boxoffice@minack.com', 'https://minack.com', false, true, true, admin_id),
  
  ('Eden Sessions - Kylie Minogue', 'Pop superstar Kylie performs at the iconic Eden Project biomes. An unforgettable evening of music.', 'St Austell', 'Eden Project, Bodelva, St Austell PL24 2SG', '2025-06-28 17:00:00+00', '2025-06-28 23:00:00+00', true, true, 'tickets@edenproject.com', 'https://edenproject.com/eden-sessions', false, true, true, admin_id),
  
  ('Cornwall Film Festival', 'Celebrating independent cinema with screenings, Q&As, and workshops across venues in Redruth and beyond.', 'Redruth', 'Regal Cinema, Redruth', '2025-11-12 18:00:00+00', '2025-11-16 22:00:00+00', true, false, 'info@cornwallfilmfestival.com', 'https://cornwallfilmfestival.com', false, true, true, admin_id),
  
  ('Open Studios Cornwall', 'Visit artists in their studios across Cornwall. Painters, sculptors, ceramicists, and more open their doors.', 'Various', 'Various locations across Cornwall', '2025-05-24 10:00:00+00', '2025-06-01 17:00:00+00', true, false, 'info@openstudioscornwall.co.uk', 'https://openstudioscornwall.co.uk', true, true, false, admin_id),
  
  ('Hall for Cornwall - Fisherman''s Friends', 'The famous Cornish shanty group perform in their home county. An evening of rousing sea songs.', 'Truro', 'Hall for Cornwall, Back Quay, Truro TR1 2LL', '2025-04-12 19:30:00+00', '2025-04-12 22:00:00+00', true, false, 'tickets@hallforcornwall.co.uk', 'https://hallforcornwall.co.uk', false, true, true, admin_id);

  -- ==========================================
  -- SPORTS & OUTDOOR
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, contact_email, website_url, is_free, is_dog_friendly, created_by) VALUES
  ('Newquay Surf Championships', 'Watch Cornwall''s best surfers compete at Fistral Beach. Thrilling action and beach atmosphere.', 'Newquay', 'Fistral Beach, Newquay', '2025-08-16 08:00:00+00', '2025-08-17 18:00:00+00', true, true, NULL, NULL, true, true, admin_id),
  
  ('Cornwall Marathon', 'Scenic marathon route along the stunning North Cornwall coast. Start at Bude and finish at Wadebridge.', 'Bude', 'Bude Castle, Bude', '2025-09-07 09:00:00+00', '2025-09-07 17:00:00+00', true, false, 'info@cornwallmarathon.co.uk', 'https://cornwallmarathon.co.uk', false, false, admin_id),
  
  ('World Pilot Gig Championships', 'Teams from across the world compete in traditional Cornish rowing boats. Spectacular racing around the Isles of Scilly.', 'Isles of Scilly', 'St Mary''s, Isles of Scilly', '2025-05-02 09:00:00+00', '2025-05-03 17:00:00+00', true, true, NULL, NULL, true, true, admin_id),
  
  ('Coast to Coast Cycle Ride', 'Charity cycle from Padstow to Newquay along the scenic Camel Trail and beyond. All abilities welcome.', 'Padstow', 'Padstow Harbour', '2025-06-15 08:00:00+00', '2025-06-15 17:00:00+00', true, false, NULL, NULL, false, false, admin_id),
  
  ('Truro Half Marathon', 'Run through Cornwall''s only city and the beautiful surrounding countryside. Great atmosphere guaranteed.', 'Truro', 'Lemon Quay, Truro', '2025-04-06 09:00:00+00', '2025-04-06 14:00:00+00', true, false, 'info@trurocity.co.uk', NULL, false, false, admin_id),
  
  ('SUP & Swim Falmouth', 'Stand-up paddleboarding and open water swimming event around Falmouth''s beautiful harbour and beaches.', 'Falmouth', 'Gyllyngvase Beach, Falmouth', '2025-07-20 07:00:00+00', '2025-07-20 14:00:00+00', true, false, NULL, NULL, false, false, admin_id);

  -- ==========================================
  -- COMMUNITY & FAMILY EVENTS
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, is_free, is_child_friendly, is_dog_friendly, created_by) VALUES
  ('St Ives Lantern Parade', 'Magical evening procession through St Ives with handmade lanterns. Part of the Feast of St Ia celebrations.', 'St Ives', 'Town Centre, St Ives', '2025-02-01 17:30:00+00', '2025-02-01 20:00:00+00', true, false, true, true, false, admin_id),
  
  ('Mousehole Christmas Lights', 'The famous harbour lights switch-on. Spectacular illuminations that draw visitors from across the country.', 'Mousehole', 'Mousehole Harbour', '2025-12-13 17:00:00+00', '2025-12-13 20:00:00+00', true, true, true, true, true, admin_id),
  
  ('Bodmin Moor Dark Skies Festival', 'Stargazing events, astronomy talks, and night walks on Cornwall''s only designated Dark Sky Landscape.', 'Bodmin', 'Bodmin Moor', '2025-10-17 19:00:00+00', '2025-10-19 23:00:00+00', true, false, true, true, false, admin_id),
  
  ('Penzance Vintage Rally', 'Classic cars, motorcycles, and memorabilia on the Prom. A nostalgic day out for all the family.', 'Penzance', 'The Promenade, Penzance', '2025-05-11 10:00:00+00', '2025-05-11 17:00:00+00', true, false, true, true, true, admin_id),
  
  ('Lostwithiel Carnival Week', 'A week of events culminating in the famous carnival parade through this historic stannary town.', 'Lostwithiel', 'Town Centre, Lostwithiel', '2025-07-19 10:00:00+00', '2025-07-26 22:00:00+00', true, false, true, true, true, admin_id),
  
  ('Bude Jazz Festival', 'Four days of jazz across Bude''s pubs, hotels, and outdoor stages. International and local performers.', 'Bude', 'Various venues, Bude', '2025-08-28 12:00:00+00', '2025-08-31 23:00:00+00', true, false, false, true, true, admin_id),
  
  ('Fowey Regatta Week', 'Historic regatta with sailing races, gig racing, live music, and the famous Red Arrows display.', 'Fowey', 'Fowey Harbour', '2025-08-17 09:00:00+00', '2025-08-23 23:00:00+00', true, true, true, true, true, admin_id),
  
  ('Launceston Steam Rally', 'Steam engines, vintage tractors, classic cars, and fairground rides at this popular annual rally.', 'Launceston', 'Kennards House, Launceston', '2025-07-12 10:00:00+00', '2025-07-13 17:00:00+00', true, false, false, true, true, admin_id);

  -- ==========================================
  -- NATURE & WILDLIFE
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, is_free, is_child_friendly, is_dog_friendly, website_url, created_by) VALUES
  ('Seal Watching Boat Trips', 'Guided boat trips to see grey seals around the Lizard Peninsula. An unforgettable wildlife experience.', 'Falmouth', 'Custom House Quay, Falmouth', '2025-07-05 10:00:00+00', '2025-07-05 12:30:00+00', true, false, false, true, false, NULL, admin_id),
  
  ('Eden Project - Wildflower Weekend', 'Explore the Eden Project''s wildflower meadows with guided walks and family activities.', 'St Austell', 'Eden Project, Bodelva, St Austell PL24 2SG', '2025-06-14 10:00:00+00', '2025-06-15 17:00:00+00', true, false, false, true, false, 'https://edenproject.com', admin_id),
  
  ('Bluebells at Lanhydrock', 'Guided walks through the stunning bluebell woods of this National Trust estate. Cream teas available.', 'Bodmin', 'Lanhydrock House, Bodmin PL30 5AD', '2025-04-27 10:00:00+00', '2025-04-27 16:00:00+00', true, false, false, true, true, 'https://nationaltrust.org.uk/lanhydrock', admin_id),
  
  ('Cornish Hedgehog Rescue Open Day', 'Meet the hedgehogs, learn about conservation, and discover how you can help protect these beloved creatures.', 'Newquay', 'Cornish Hedgehog Rescue, Newquay', '2025-05-17 11:00:00+00', '2025-05-17 16:00:00+00', true, false, true, true, false, NULL, admin_id),
  
  ('Butterfly Walk at The Lost Gardens', 'Guided walk through the beautiful Lost Gardens of Heligan looking for butterflies and other pollinators.', 'Mevagissey', 'Lost Gardens of Heligan, Pentewan, St Austell PL26 6EN', '2025-07-26 14:00:00+00', '2025-07-26 16:00:00+00', true, false, false, true, true, 'https://heligan.com', admin_id);

  -- ==========================================
  -- HERITAGE & HISTORY
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, is_free, is_child_friendly, is_accessible, website_url, created_by) VALUES
  ('Tintagel Castle - King Arthur Weekend', 'Living history events at the legendary castle. Knights, storytelling, and medieval crafts.', 'Tintagel', 'Tintagel Castle, Tintagel PL34 0HE', '2025-08-02 10:00:00+00', '2025-08-03 17:00:00+00', true, true, false, true, false, 'https://english-heritage.org.uk/tintagel', admin_id),
  
  ('Geevor Tin Mine Heritage Day', 'Underground tours, demonstrations, and talks about Cornwall''s mining heritage at this preserved mine.', 'Pendeen', 'Geevor Tin Mine, Pendeen TR19 7EW', '2025-05-31 10:00:00+00', '2025-05-31 16:00:00+00', true, false, false, true, false, 'https://geevor.com', admin_id),
  
  ('Pendennis Castle - Tudor Day', 'Step back in time with Tudor reenactors at this impressive coastal fortress. Talks, demonstrations, and family activities.', 'Falmouth', 'Pendennis Castle, Falmouth TR11 4LP', '2025-06-07 10:00:00+00', '2025-06-07 17:00:00+00', true, false, false, true, true, 'https://english-heritage.org.uk/pendennis', admin_id),
  
  ('Bodmin Jail Ghost Hunt', 'After-dark exploration of one of Cornwall''s most haunted buildings. Not for the faint-hearted!', 'Bodmin', 'Bodmin Jail, Bodmin PL31 2NR', '2025-10-25 20:00:00+00', '2025-10-26 02:00:00+00', true, false, false, false, false, 'https://bodminjail.org', admin_id),
  
  ('Truro Cathedral Evensong & Tour', 'Special evening service followed by a guided tour of Cornwall''s magnificent cathedral by candlelight.', 'Truro', 'Truro Cathedral, Truro TR1 2AF', '2025-03-22 17:30:00+00', '2025-03-22 20:00:00+00', true, false, true, true, true, 'https://trurocathedral.org.uk', admin_id);

  -- ==========================================
  -- MARKETS & FAIRS
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, is_free, is_child_friendly, is_dog_friendly, created_by) VALUES
  ('Falmouth Antiques & Flea Market', 'Browse treasures and vintage finds at this popular monthly market in the heart of Falmouth.', 'Falmouth', 'The Moor, Falmouth', '2025-03-09 09:00:00+00', '2025-03-09 15:00:00+00', true, false, true, true, true, admin_id),
  
  ('St Ives Christmas Market', 'Festive market with local crafts, gifts, and seasonal treats in the picturesque harbour town.', 'St Ives', 'Fore Street, St Ives', '2025-12-06 10:00:00+00', '2025-12-07 17:00:00+00', true, false, true, true, true, admin_id),
  
  ('Truro Victorian Christmas Market', 'Step back in time with this atmospheric Victorian-themed market around Truro Cathedral.', 'Truro', 'High Cross, Truro', '2025-12-13 10:00:00+00', '2025-12-14 18:00:00+00', true, true, true, true, true, admin_id),
  
  ('Wadebridge Craft Fair', 'Local artisans showcase handmade jewellery, textiles, pottery, and more at this popular craft fair.', 'Wadebridge', 'Town Hall, Wadebridge', '2025-04-19 10:00:00+00', '2025-04-19 16:00:00+00', true, false, true, true, false, admin_id),
  
  ('Penzance Book Fair', 'Second-hand and antiquarian books from dealers across the South West. A paradise for book lovers.', 'Penzance', 'St John''s Hall, Penzance', '2025-09-13 10:00:00+00', '2025-09-13 16:00:00+00', true, false, true, true, false, admin_id);

  -- ==========================================
  -- WORKSHOPS & CLASSES
  -- ==========================================

  INSERT INTO events (title, description, location_name, location_address, starts_at, ends_at, is_approved, is_featured, is_free, is_child_friendly, is_accessible, created_by) VALUES
  ('Cornish Pasty Making Workshop', 'Learn to make authentic Cornish pasties with a local chef. Take home your creations and the recipe!', 'Truro', 'Cornwall Cookery School, Truro', '2025-04-05 10:00:00+00', '2025-04-05 13:00:00+00', true, false, false, true, true, admin_id),
  
  ('Beach Clean & Yoga Retreat', 'Morning beach clean at Perranporth followed by relaxing yoga session on the sand. All equipment provided.', 'Perranporth', 'Perranporth Beach', '2025-06-08 08:00:00+00', '2025-06-08 11:00:00+00', true, false, false, true, false, admin_id),
  
  ('Cornish Language Taster Session', 'Introduction to Kernewek, the Cornish language. Learn basic phrases and the history of this Celtic tongue.', 'Camborne', 'Camborne Library', '2025-03-29 14:00:00+00', '2025-03-29 16:00:00+00', true, false, true, true, true, admin_id),
  
  ('Seascape Painting Workshop', 'Capture the Cornish coast in watercolours with local artist. All materials included. Beginners welcome.', 'St Ives', 'Porthmeor Studios, St Ives', '2025-05-10 10:00:00+00', '2025-05-10 16:00:00+00', true, false, false, false, true, admin_id),
  
  ('Foraging Walk on the Lizard', 'Discover edible plants and coastal foraging with an expert guide. Includes tasting session.', 'Helston', 'Lizard Point, Helston', '2025-04-13 10:00:00+00', '2025-04-13 13:00:00+00', true, false, false, true, false, admin_id);

END $$;

-- Log completion
DO $$ BEGIN RAISE NOTICE '✅ Successfully seeded 50 events for Cornwall!'; END $$;
