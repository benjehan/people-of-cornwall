-- ================================================
-- RETROACTIVE STORY BADGES
-- Run AFTER migration 025 (triggers must be committed first)
-- ================================================

-- ================================================
-- 1. AWARD FIRST_STORY BADGES
-- ================================================

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT DISTINCT s.author_id, 'first_story'::badge_type, 'Published their first story'
FROM stories s
WHERE s.status = 'published' 
  AND s.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = s.author_id 
    AND ub.badge_type = 'first_story'::badge_type
  )
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ================================================
-- 2. AWARD STORYTELLER_5 BADGES
-- ================================================

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT author_id, 'storyteller_5'::badge_type, 'Published 5 stories'
FROM (
  SELECT author_id, COUNT(*) as story_count
  FROM stories
  WHERE status = 'published' AND author_id IS NOT NULL
  GROUP BY author_id
  HAVING COUNT(*) >= 5
) counts
WHERE NOT EXISTS (
  SELECT 1 FROM user_badges ub 
  WHERE ub.user_id = counts.author_id 
  AND ub.badge_type = 'storyteller_5'::badge_type
)
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ================================================
-- 3. AWARD STORYTELLER_10 BADGES
-- ================================================

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT author_id, 'storyteller_10'::badge_type, 'Published 10 stories - a master storyteller!'
FROM (
  SELECT author_id, COUNT(*) as story_count
  FROM stories
  WHERE status = 'published' AND author_id IS NOT NULL
  GROUP BY author_id
  HAVING COUNT(*) >= 10
) counts
WHERE NOT EXISTS (
  SELECT 1 FROM user_badges ub 
  WHERE ub.user_id = counts.author_id 
  AND ub.badge_type = 'storyteller_10'::badge_type
)
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ================================================
-- 4. AWARD VOICE_OF_CORNWALL BADGES
-- ================================================

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT DISTINCT s.author_id, 'voice_of_cornwall'::badge_type, 'Added audio narration to a story'
FROM stories s
WHERE s.status = 'published' 
  AND s.voice_recording_url IS NOT NULL
  AND s.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = s.author_id 
    AND ub.badge_type = 'voice_of_cornwall'::badge_type
  )
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ================================================
-- 5. AWARD PROMPT_RESPONDER BADGES
-- ================================================

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT DISTINCT s.author_id, 'prompt_responder'::badge_type, 'Responded to a community writing prompt'
FROM stories s
WHERE s.status = 'published' 
  AND s.prompt_id IS NOT NULL
  AND s.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = s.author_id 
    AND ub.badge_type = 'prompt_responder'::badge_type
  )
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ================================================
-- 6. AWARD COMMUNITY_VOTER BADGES
-- ================================================

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT DISTINCT pv.user_id, 'community_voter'::badge_type, 'Participated in a community poll'
FROM poll_votes pv
WHERE pv.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = pv.user_id 
    AND ub.badge_type = 'community_voter'::badge_type
  )
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ================================================
-- 7. REPORT BADGES AWARDED
-- ================================================

DO $$
DECLARE
  badge_counts RECORD;
BEGIN
  FOR badge_counts IN
    SELECT badge_type, COUNT(*) as cnt
    FROM user_badges
    WHERE awarded_at > NOW() - INTERVAL '1 minute'
    GROUP BY badge_type
  LOOP
    RAISE NOTICE 'Awarded % % badges', badge_counts.cnt, badge_counts.badge_type;
  END LOOP;
END $$;
