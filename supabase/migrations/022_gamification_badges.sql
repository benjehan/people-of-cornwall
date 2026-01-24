-- ================================================
-- GAMIFICATION BADGES
-- Complete badge system for all platform features
-- ================================================

-- ================================================
-- 1. ADD NEW BADGE TYPES
-- ================================================

-- Add all new badge types to the enum
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'sharp_eye';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'cornish_guide';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'challenge_creator';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'memory_keeper';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'historian';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'photo_contributor';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'event_organizer';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'community_builder';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'social_butterfly';

-- ================================================
-- 2. TRACKING COLUMNS ON USERS TABLE
-- ================================================

-- Add counters for badge tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS memories_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS events_submitted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenges_submitted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photos_submitted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_comments INTEGER DEFAULT 0;

-- ================================================
-- 3. HELPER FUNCTION TO AWARD BADGES
-- ================================================

CREATE OR REPLACE FUNCTION award_badge_if_not_exists(
  p_user_id UUID,
  p_badge_type badge_type,
  p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_type, awarded_reason)
  VALUES (p_user_id, p_badge_type, p_reason)
  ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. WHERE IS THIS BADGES
-- ================================================

-- Update location_wins trigger to also check for sharp_eye and cornish_guide
CREATE OR REPLACE FUNCTION check_location_badges()
RETURNS TRIGGER AS $$
DECLARE
  win_count INTEGER;
BEGIN
  IF NEW.is_correct = TRUE AND NEW.user_id IS NOT NULL THEN
    -- For UPDATE, only trigger if it wasn't already correct
    IF TG_OP = 'UPDATE' AND OLD.is_correct = TRUE THEN
      RETURN NEW;
    END IF;
    
    -- Increment user's win count
    UPDATE users SET location_wins = COALESCE(location_wins, 0) + 1 
    WHERE id = NEW.user_id
    RETURNING location_wins INTO win_count;
    
    -- Award location_expert (first correct guess)
    PERFORM award_badge_if_not_exists(
      NEW.user_id, 
      'location_expert'::badge_type, 
      'Correctly identified a mystery location'
    );
    
    -- Award sharp_eye (5 correct guesses)
    IF win_count >= 5 THEN
      PERFORM award_badge_if_not_exists(
        NEW.user_id, 
        'sharp_eye'::badge_type, 
        'Correctly identified 5 mystery locations'
      );
    END IF;
    
    -- Award cornish_guide (10 correct guesses)
    IF win_count >= 10 THEN
      PERFORM award_badge_if_not_exists(
        NEW.user_id, 
        'cornish_guide'::badge_type, 
        'Correctly identified 10 mystery locations - a true Cornish guide!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace existing triggers
DROP TRIGGER IF EXISTS trigger_award_location_badge ON where_is_this_guesses;
DROP TRIGGER IF EXISTS trigger_award_location_badge_insert ON where_is_this_guesses;
DROP TRIGGER IF EXISTS trigger_award_location_badge_update ON where_is_this_guesses;

CREATE TRIGGER trigger_check_location_badges_insert
  AFTER INSERT ON where_is_this_guesses
  FOR EACH ROW
  WHEN (NEW.is_correct = TRUE)
  EXECUTE FUNCTION check_location_badges();

CREATE TRIGGER trigger_check_location_badges_update
  AFTER UPDATE OF is_correct ON where_is_this_guesses
  FOR EACH ROW
  WHEN (NEW.is_correct = TRUE)
  EXECUTE FUNCTION check_location_badges();

-- Challenge creator badge (when admin approves a submitted challenge)
CREATE OR REPLACE FUNCTION check_challenge_creator_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- When challenge is approved (is_pending goes from true to false and not rejected)
  IF OLD.is_pending = TRUE AND NEW.is_pending = FALSE AND NEW.created_by IS NOT NULL THEN
    -- Increment counter
    UPDATE users SET challenges_submitted = COALESCE(challenges_submitted, 0) + 1
    WHERE id = NEW.created_by;
    
    -- Award badge
    PERFORM award_badge_if_not_exists(
      NEW.created_by,
      'challenge_creator'::badge_type,
      'Submitted a Where Is This challenge that was published'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_challenge_creator ON where_is_this;
CREATE TRIGGER trigger_challenge_creator
  AFTER UPDATE OF is_pending ON where_is_this
  FOR EACH ROW
  EXECUTE FUNCTION check_challenge_creator_badge();

-- ================================================
-- 5. LOST CORNWALL BADGES
-- ================================================

-- Memory keeper (first memory) and Historian (10+ memories)
CREATE OR REPLACE FUNCTION check_memory_badges()
RETURNS TRIGGER AS $$
DECLARE
  memory_count INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- Increment counter
    UPDATE users SET memories_count = COALESCE(memories_count, 0) + 1
    WHERE id = NEW.user_id
    RETURNING memories_count INTO memory_count;
    
    -- Award memory_keeper (first memory)
    PERFORM award_badge_if_not_exists(
      NEW.user_id,
      'memory_keeper'::badge_type,
      'Shared a memory on a Lost Cornwall photo'
    );
    
    -- Award historian (10+ memories)
    IF memory_count >= 10 THEN
      PERFORM award_badge_if_not_exists(
        NEW.user_id,
        'historian'::badge_type,
        'Shared memories on 10+ Lost Cornwall photos - a true historian!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_memory_badges ON lost_cornwall_memories;
CREATE TRIGGER trigger_memory_badges
  AFTER INSERT ON lost_cornwall_memories
  FOR EACH ROW
  EXECUTE FUNCTION check_memory_badges();

-- Photo contributor badge (when admin approves a submitted photo)
CREATE OR REPLACE FUNCTION check_photo_contributor_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- When photo is approved (is_pending goes from true to false)
  IF OLD.is_pending = TRUE AND NEW.is_pending = FALSE AND NEW.created_by IS NOT NULL THEN
    -- Increment counter
    UPDATE users SET photos_submitted = COALESCE(photos_submitted, 0) + 1
    WHERE id = NEW.created_by;
    
    -- Award badge
    PERFORM award_badge_if_not_exists(
      NEW.created_by,
      'photo_contributor'::badge_type,
      'Contributed a historic photo to Lost Cornwall'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_photo_contributor ON lost_cornwall;
CREATE TRIGGER trigger_photo_contributor
  AFTER UPDATE OF is_pending ON lost_cornwall
  FOR EACH ROW
  EXECUTE FUNCTION check_photo_contributor_badge();

-- ================================================
-- 6. EVENTS BADGES
-- ================================================

-- Event organizer and community builder
CREATE OR REPLACE FUNCTION check_event_badges()
RETURNS TRIGGER AS $$
DECLARE
  event_count INTEGER;
BEGIN
  -- When event is approved (is_approved changes from false to true)
  IF NEW.is_approved = TRUE AND (OLD.is_approved IS NULL OR OLD.is_approved = FALSE) AND NEW.created_by IS NOT NULL THEN
    -- Increment counter
    UPDATE users SET events_submitted = COALESCE(events_submitted, 0) + 1
    WHERE id = NEW.created_by
    RETURNING events_submitted INTO event_count;
    
    -- Award event_organizer (first approved event)
    PERFORM award_badge_if_not_exists(
      NEW.created_by,
      'event_organizer'::badge_type,
      'Submitted a community event that was approved'
    );
    
    -- Award community_builder (5+ approved events)
    IF event_count >= 5 THEN
      PERFORM award_badge_if_not_exists(
        NEW.created_by,
        'community_builder'::badge_type,
        'Submitted 5+ community events - a true community builder!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_event_badges ON events;
CREATE TRIGGER trigger_event_badges
  AFTER UPDATE OF is_approved ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_event_badges();

-- Also trigger on INSERT if already approved (admin-created events)
DROP TRIGGER IF EXISTS trigger_event_badges_insert ON events;
CREATE TRIGGER trigger_event_badges_insert
  AFTER INSERT ON events
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE AND NEW.created_by IS NOT NULL)
  EXECUTE FUNCTION check_event_badges();

-- ================================================
-- 7. SOCIAL BUTTERFLY (Comments across platform)
-- ================================================

CREATE OR REPLACE FUNCTION check_social_butterfly_badge()
RETURNS TRIGGER AS $$
DECLARE
  comment_count INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- Increment counter
    UPDATE users SET total_comments = COALESCE(total_comments, 0) + 1
    WHERE id = NEW.user_id
    RETURNING total_comments INTO comment_count;
    
    -- Award social_butterfly (10+ comments)
    IF comment_count >= 10 THEN
      PERFORM award_badge_if_not_exists(
        NEW.user_id,
        'social_butterfly'::badge_type,
        'Left 10+ comments across the platform'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_butterfly ON comments;
CREATE TRIGGER trigger_social_butterfly
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION check_social_butterfly_badge();

-- ================================================
-- 8. RETROACTIVE BADGE AWARDS
-- ================================================

-- Award badges to users who already qualify

-- Location experts (already have wins)
INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'sharp_eye'::badge_type, 'Correctly identified 5 mystery locations'
FROM users WHERE COALESCE(location_wins, 0) >= 5
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'cornish_guide'::badge_type, 'Correctly identified 10 mystery locations - a true Cornish guide!'
FROM users WHERE COALESCE(location_wins, 0) >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Update memory counts and award badges
UPDATE users u SET memories_count = (
  SELECT COUNT(*) FROM lost_cornwall_memories m WHERE m.user_id = u.id
);

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'memory_keeper'::badge_type, 'Shared a memory on a Lost Cornwall photo'
FROM users WHERE COALESCE(memories_count, 0) >= 1
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'historian'::badge_type, 'Shared memories on 10+ Lost Cornwall photos - a true historian!'
FROM users WHERE COALESCE(memories_count, 0) >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Update comment counts and award social_butterfly
UPDATE users u SET total_comments = (
  SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id
);

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'social_butterfly'::badge_type, 'Left 10+ comments across the platform'
FROM users WHERE COALESCE(total_comments, 0) >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;
