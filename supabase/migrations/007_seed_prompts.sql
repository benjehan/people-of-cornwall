-- Seed inspiring story prompts for the People of Cornwall community
-- A comprehensive collection covering all aspects of Cornish life and history
-- Run this after the prompts table is created (migration 006)

-- =============================================================================
-- FEATURED PROMPT
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'What was market day like in your town?',
    'Remember the sounds, smells, and faces of the local market. The stalls, the traders, the conversations. What made your market special?',
    true,
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- EVERYDAY LIFE & MEMORIES
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Tell us about a storm you remember',
    'Cornwall has weathered many storms. Share your memory of watching the waves crash, sheltering at home, or helping neighbours recover.',
    true, false
  ),
  (
    'Who was the character in your village?',
    'Every community has memorable people. Share a story about someone who made your village unique — the storyteller, the helper, the eccentric.',
    true, false
  ),
  (
    'What did summer holidays look like growing up?',
    'The endless days of childhood summers in Cornwall. Rock pools, ice cream vans, family gatherings — what do you remember most?',
    true, false
  ),
  (
    'Share a memory of the sea',
    'Whether you fished, surfed, walked the coastal path, or simply watched the waves — tell us about a moment the sea gave you.',
    true, false
  ),
  (
    'What was your first job in Cornwall?',
    'From fishing boats to pasty shops, mines to farms. What was your introduction to working life in Cornwall?',
    true, false
  ),
  (
    'Tell us about a pub, café, or shop that no longer exists',
    'Some places live only in memory now. Share your story of a beloved local spot and what made it special.',
    true, false
  ),
  (
    'What traditions did your family keep?',
    'Feast days, Christmas customs, harvest suppers, or something uniquely yours. What traditions connected your family to Cornwall?',
    true, false
  ),
  (
    'Describe a journey you remember',
    'A memorable bus ride, a walk home from school, a drive through the lanes. Sometimes the journey is the story.',
    true, false
  ),
  (
    'What sounds remind you of home?',
    'The gulls, the wind, church bells, a particular voice, a song on the radio. What soundtrack plays when you think of Cornwall?',
    true, false
  ),
  (
    'Share a photo and tell us its story',
    'Do you have an old photograph? Upload it and tell us who is in it, when it was taken, and what was happening that day.',
    true, false
  ),
  (
    'What was school like for you?',
    'Your teachers, your friends, the playground, the lessons. Share a memory from your school days in Cornwall.',
    true, false
  ),
  (
    'Tell us about learning to cook a Cornish dish',
    'Pasties, saffron buns, stargazy pie, cream tea. Who taught you, and what''s the story behind your recipe?',
    true, false
  ),
  (
    'What was your favourite hiding spot as a child?',
    'A tree, a beach cave, a corner of the garden, a spot in the moors. Where did you go to dream, play, or escape?',
    true, false
  ),
  (
    'Share a memory of helping someone',
    'Cornwall communities look out for each other. Tell us about a time you helped a neighbour, or someone helped you.',
    true, false
  ),
  (
    'What did you collect as a child?',
    'Shells, stones, stamps, butterflies, football cards. What treasures did you gather, and where did they go?',
    true, false
  ),
  (
    'Tell us about a celebration you remember',
    'A wedding, a birthday, a village fête, the Flora Day. What celebration stands out in your memory?',
    true, false
  ),
  (
    'What was the view from your childhood window?',
    'Paint us a picture with words. What did you see when you looked out?',
    true, false
  ),
  (
    'Share a memory of your grandparents',
    'Their home, their stories, their hands, their voice. What do you remember most about your grandparents?',
    true, false
  ),
  (
    'What was the best day you ever had in Cornwall?',
    'A perfect day — whatever that means to you. Take us there.',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- THE LAND, WEATHER & NATURE
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Tell us about a perfect Cornish day',
    'When the sun shines and the sea sparkles. What do you do when Cornwall shows its best side?',
    true, false
  ),
  (
    'What''s your favourite stretch of coastline?',
    'The coves, the cliffs, the beaches. Is there a place on the coast that feels like yours?',
    true, false
  ),
  (
    'Share a memory of the moors',
    'Bodmin Moor, the wild places, the ancient stones. What draws you to Cornwall''s wild interior?',
    true, false
  ),
  (
    'Tell us about a sunset you remember',
    'Cornwall is famous for its sunsets. Describe one that stayed with you.',
    true, false
  ),
  (
    'What does the smell of Cornwall mean to you?',
    'Salt air, wild garlic, pasty shops, farmland after rain. What scent takes you back?',
    true, false
  ),
  (
    'Share a memory of fog or mist',
    'When Cornwall disappears into grey and the world goes quiet. What happened on a foggy day?',
    true, false
  ),
  (
    'Tell us about a secret spot',
    'A hidden beach, a quiet wood, a view only you seem to know. Share a place (if you dare!).',
    true, false
  ),
  (
    'What wildlife have you seen in Cornwall?',
    'Seals, dolphins, choughs, adders, badgers. Tell us about an encounter with Cornish wildlife.',
    true, false
  ),
  (
    'Share a memory of harvest time',
    'Daffodils, potatoes, grain, or apples. What was harvest like in your corner of Cornwall?',
    true, false
  ),
  (
    'What''s your memory of a Cornish winter?',
    'The short days, the wild weather, the cosy nights. What does winter mean in Cornwall?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- MINING HERITAGE
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Did anyone in your family work in the mines?',
    'Cornwall''s mining heritage runs deep. Share a story passed down through generations of miners.',
    true, false
  ),
  (
    'Tell us about a mine you remember',
    'The engine houses, the shafts, the spoil heaps. Whether you worked there or played there as a child.',
    true, false
  ),
  (
    'What stories did miners tell?',
    'Tales of knockers, accidents, camaraderie underground. What mining stories were passed down in your family?',
    true, false
  ),
  (
    'Share a memory of a mining community',
    'The villages built around mines, the culture, the solidarity. What was life like in a mining community?',
    true, false
  ),
  (
    'What happened when the mines closed?',
    'The end of an era. How did closures affect your family or community?',
    true, false
  ),
  (
    'Tell us about clay country',
    'The china clay industry shaped mid-Cornwall. Do you have memories of the white mountains and clay works?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SPORTS & RECREATION
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Tell us about rugby in Cornwall',
    'From Pirates to local clubs, Cornwall bleeds black and gold. Share your rugby memories.',
    true, false
  ),
  (
    'Share a memory of village cricket',
    'Summer afternoons, the crack of leather on willow, tea at the pavilion. What was cricket like in your village?',
    true, false
  ),
  (
    'Do you remember watching the County Championship?',
    'Cornwall vs Devon, or the all-England matches at Camborne. What was the atmosphere like?',
    true, false
  ),
  (
    'Tell us about learning to surf',
    'When surfing arrived in Cornwall. Who taught you? Where did you catch your first wave?',
    true, false
  ),
  (
    'Share a memory of gig rowing',
    'Pilot gigs racing across the waves. Have you rowed, raced, or watched from the shore?',
    true, false
  ),
  (
    'What games did you play as a child?',
    'Before screens — what did children do? Marbles, skipping, football in the street?',
    true, false
  ),
  (
    'Tell us about a sports day you remember',
    'School sports days, village athletics. What events did you compete in?',
    true, false
  ),
  (
    'Share a memory of swimming',
    'In the sea, in a tidal pool, in a lido. Where did you learn to swim in Cornwall?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CELTIC SPIRIT & IDENTITY
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'What does being Cornish mean to you?',
    'Identity, pride, belonging. In your own words, what makes you Cornish?',
    true, false
  ),
  (
    'Do you remember anyone speaking Cornish?',
    'The old language lives on. Did you hear Cornish spoken, or learn any words?',
    true, false
  ),
  (
    'Tell us about St Piran''s Day',
    'March 5th — the day Cornwall celebrates. How do you mark St Piran''s Day?',
    true, false
  ),
  (
    'Share a memory of a Cornish festival',
    '''Obby ''Oss, Flora Day, Lafrowda, Golowan. What Cornish festival holds special meaning for you?',
    true, false
  ),
  (
    'What Cornish words or phrases did you grow up with?',
    'Proper job, dreckly, ansum. What Cornish dialect shaped your speech?',
    true, false
  ),
  (
    'Tell us about Cornish music you remember',
    'Brass bands, male voice choirs, folk music, sea shanties. What music defines Cornwall for you?',
    true, false
  ),
  (
    'Share a story about the Cornish flag',
    'St Piran''s white cross on black. What does the flag mean to you? When did you first feel its significance?',
    true, false
  ),
  (
    'Do you know any Cornish legends or folklore?',
    'Giants, piskies, mermaids, standing stones. What legends were you told as a child?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- THE PEOPLE OF CORNWALL
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Tell us about a teacher who changed your life',
    'A Cornish teacher who inspired you, believed in you, or taught you something unforgettable.',
    true, false
  ),
  (
    'Who was the heart of your community?',
    'The shopkeeper who knew everyone, the vicar, the postman. Who held your community together?',
    true, false
  ),
  (
    'Share a memory of a fisherman you knew',
    'The men and women who worked the sea. What did they teach you about life?',
    true, false
  ),
  (
    'Tell us about a farmer in your family',
    'The people who worked the land, through seasons and generations. What stories did they pass on?',
    true, false
  ),
  (
    'Share a memory of a Cornish artist or craftsperson',
    'The artists, potters, weavers, and makers. Did you know someone who created beautiful things?',
    true, false
  ),
  (
    'Who taught you a skill?',
    'Knitting, fishing, baking, woodwork. Who passed on knowledge with their hands?',
    true, false
  ),
  (
    'Tell us about someone who left Cornwall',
    'Emigration scattered Cornish people across the world. Do you have relatives who left? Did they return?',
    true, false
  ),
  (
    'Share a memory of someone who came to Cornwall',
    'Incomers, visitors who stayed, people drawn to Cornwall from elsewhere. Who became part of your community?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- HISTORICAL EVENTS IN CORNWALL
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Do you remember the 1962 blizzard?',
    'One of the worst winters in memory. How did your family survive the snow?',
    true, false
  ),
  (
    'Share your memories of WWII in Cornwall',
    'Evacuees, rationing, the Home Guard, air raids. What did war mean for Cornwall?',
    true, false
  ),
  (
    'Tell us about the Penlee lifeboat disaster',
    'December 1981 — a tragedy that touched all of Cornwall. How did your community respond?',
    true, false
  ),
  (
    'Do you remember the eclipse of 1999?',
    'Cornwall went dark in August 1999. Where were you? What did you see?',
    true, false
  ),
  (
    'Share a memory of the Torrey Canyon disaster',
    '1967 — oil on Cornish beaches. Do you remember the clean-up or the impact?',
    true, false
  ),
  (
    'Tell us about Boscastle flooding in 2004',
    'The village was devastated in August 2004. Were you there? Did you help with recovery?',
    true, false
  ),
  (
    'Do you remember the Cornwall floods of 2010?',
    'Heavy rains caused flooding across Cornwall. How did it affect your area?',
    true, false
  ),
  (
    'Share your memory of a royal visit to Cornwall',
    'When the Queen, Prince Charles, or other royals visited. Did you see them? Where?',
    true, false
  ),
  (
    'Tell us about the railway coming (or going) to your area',
    'The trains that connected or disconnected communities. What did the railway mean to you?',
    true, false
  ),
  (
    'Do you remember when the A30 was dualled?',
    'The road that changed how Cornwall connects. What was driving in Cornwall like before?',
    true, false
  ),
  (
    'Share a memory of the COVID lockdowns in Cornwall',
    'How did 2020 change life in Cornwall? Empty beaches, community spirit, the quiet?',
    true, false
  ),
  (
    'Tell us about a local event that made the news',
    'Something that happened in your town that people still talk about.',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- FISHING & MARITIME
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Tell us about a fishing harbour you knew',
    'Newlyn, Padstow, Mevagissey, Looe. What was the harbour like when you knew it?',
    true, false
  ),
  (
    'Share a memory of going out on a boat',
    'Fishing trips, mackerel lines, rowing across the harbour. Tell us about your time on the water.',
    true, false
  ),
  (
    'What fish did you eat growing up?',
    'Fresh from the boat, the fish van, the chip shop. What seafood was on your table?',
    true, false
  ),
  (
    'Tell us about a lighthouse you know',
    'Godrevy, Pendeen, Longships, the Lizard. What does a particular lighthouse mean to you?',
    true, false
  ),
  (
    'Share a memory of a shipwreck',
    'Cornwall''s coast has seen many wrecks. Do you know stories passed down about ships lost?',
    true, false
  ),
  (
    'Tell us about the smugglers of old',
    'Every cove has a smuggling tale. What stories were told in your area?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ARTS, CULTURE & TOURISM
-- =============================================================================

INSERT INTO prompts (title, description, active, featured)
VALUES 
  (
    'Do you remember the Minack Theatre?',
    'The theatre carved into the cliff. What show did you see there?',
    true, false
  ),
  (
    'Share a memory of St Ives artists',
    'The Tate, the artists'' colony, the light. What do you remember of St Ives'' artistic heritage?',
    true, false
  ),
  (
    'Tell us about the Eden Project opening',
    'March 2001 — the biomes opened. Did you visit? What did you think?',
    true, false
  ),
  (
    'What''s your memory of Flambards or Dairyland?',
    'The theme parks of childhood. What rides or exhibits do you remember?',
    true, false
  ),
  (
    'Share a memory of summer visitors',
    'The emmets arriving, full beaches, busy lanes. How did tourism shape your summers?',
    true, false
  ),
  (
    'Tell us about the Lost Gardens of Heligan',
    'The Victorian gardens rediscovered. Did you see them before or after restoration?',
    true, false
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Total: ~85 prompts covering all aspects of Cornish life
-- =============================================================================
