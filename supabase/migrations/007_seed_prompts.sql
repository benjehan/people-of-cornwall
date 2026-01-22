-- Seed inspiring story prompts for the People of Cornwall community
-- Run this after the prompts table is created

-- Insert prompts (using ON CONFLICT to avoid duplicates if run multiple times)
INSERT INTO prompts (id, title, description, active, featured, story_count)
VALUES 
  -- Featured prompt
  (
    gen_random_uuid(),
    'What was market day like in your town?',
    'Remember the sounds, smells, and faces of the local market. The stalls, the traders, the conversations. What made your market special?',
    true,
    true,
    0
  )
ON CONFLICT DO NOTHING;

-- More prompts
INSERT INTO prompts (title, description, active, featured, story_count)
VALUES 
  (
    'Tell us about a storm you remember',
    'Cornwall has weathered many storms. Share your memory of watching the waves crash, sheltering at home, or helping neighbours recover.',
    true,
    false,
    0
  ),
  (
    'Who was the character in your village?',
    'Every community has memorable people. Share a story about someone who made your village unique — the storyteller, the helper, the eccentric.',
    true,
    false,
    0
  ),
  (
    'What did summer holidays look like growing up?',
    'The endless days of childhood summers in Cornwall. Rock pools, ice cream vans, family gatherings — what do you remember most?',
    true,
    false,
    0
  ),
  (
    'Share a memory of the sea',
    'Whether you fished, surfed, walked the coastal path, or simply watched the waves — tell us about a moment the sea gave you.',
    true,
    false,
    0
  ),
  (
    'What was your first job in Cornwall?',
    'From fishing boats to pasty shops, mines to farms. What was your introduction to working life in Cornwall?',
    true,
    false,
    0
  ),
  (
    'Tell us about a pub, café, or shop that no longer exists',
    'Some places live only in memory now. Share your story of a beloved local spot and what made it special.',
    true,
    false,
    0
  ),
  (
    'What traditions did your family keep?',
    'Feast days, Christmas customs, harvest suppers, or something uniquely yours. What traditions connected your family to Cornwall?',
    true,
    false,
    0
  ),
  (
    'Describe a journey you remember',
    'A memorable bus ride, a walk home from school, a drive through the lanes. Sometimes the journey is the story.',
    true,
    false,
    0
  ),
  (
    'What sounds remind you of home?',
    'The gulls, the wind, church bells, a particular voice, a song on the radio. What soundtrack plays when you think of Cornwall?',
    true,
    false,
    0
  ),
  (
    'Share a photo and tell us its story',
    'Do you have an old photograph? Upload it and tell us who is in it, when it was taken, and what was happening that day.',
    true,
    false,
    0
  ),
  (
    'What was school like for you?',
    'Your teachers, your friends, the playground, the lessons. Share a memory from your school days in Cornwall.',
    true,
    false,
    0
  ),
  (
    'Tell us about learning to cook a Cornish dish',
    'Pasties, saffron buns, stargazy pie, cream tea. Who taught you, and what's the story behind your recipe?',
    true,
    false,
    0
  ),
  (
    'What was your favourite hiding spot as a child?',
    'A tree, a beach cave, a corner of the garden, a spot in the moors. Where did you go to dream, play, or escape?',
    true,
    false,
    0
  ),
  (
    'Share a memory of helping someone',
    'Cornwall communities look out for each other. Tell us about a time you helped a neighbour, or someone helped you.',
    true,
    false,
    0
  ),
  (
    'What did you collect as a child?',
    'Shells, stones, stamps, butterflies, football cards. What treasures did you gather, and where did they go?',
    true,
    false,
    0
  ),
  (
    'Tell us about a celebration you remember',
    'A wedding, a birthday, a village fête, the Flora Day. What celebration stands out in your memory?',
    true,
    false,
    0
  ),
  (
    'What was the view from your childhood window?',
    'Paint us a picture with words. What did you see when you looked out?',
    true,
    false,
    0
  ),
  (
    'Share a memory of your grandparents',
    'Their home, their stories, their hands, their voice. What do you remember most about your grandparents?',
    true,
    false,
    0
  ),
  (
    'What was the best day you ever had in Cornwall?',
    'A perfect day — whatever that means to you. Take us there.',
    true,
    false,
    0
  )
ON CONFLICT DO NOTHING;

-- Note: The story_count will update automatically as stories are linked to prompts
