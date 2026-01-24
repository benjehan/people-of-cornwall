-- ================================================
-- STORY BADGES - Triggers for story-related badges
-- ================================================

-- ================================================
-- 1. ADD MISSING BADGE TYPES
-- ================================================

-- Add all potentially missing badge types
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'voice_of_cornwall';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'prompt_responder';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'community_voter';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'poll_winner';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'early_supporter';

-- ================================================
-- 2. ENSURE award_badge_if_not_exists EXISTS
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 3. STORY BADGE TRIGGER FUNCTION
-- ================================================

CREATE OR REPLACE FUNCTION check_story_badges()
RETURNS TRIGGER AS $$
DECLARE
  story_count INTEGER;
  has_audio BOOLEAN;
  has_prompt BOOLEAN;
BEGIN
  -- Only process when story becomes published
  IF NEW.status = 'published' AND NEW.author_id IS NOT NULL THEN
    -- For UPDATE, only trigger if status actually changed to published
    IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
      RETURN NEW;
    END IF;
    
    -- Count published stories for this user
    SELECT COUNT(*) INTO story_count
    FROM stories 
    WHERE author_id = NEW.author_id AND status = 'published';
    
    -- Check if this story has audio
    has_audio := NEW.voice_recording_url IS NOT NULL;
    
    -- Check if this story is a prompt response
    has_prompt := NEW.prompt_id IS NOT NULL;
    
    -- Award first_story badge
    IF story_count >= 1 THEN
      PERFORM award_badge_if_not_exists(
        NEW.author_id,
        'first_story'::badge_type,
        'Published their first story'
      );
    END IF;
    
    -- Award storyteller_5 badge
    IF story_count >= 5 THEN
      PERFORM award_badge_if_not_exists(
        NEW.author_id,
        'storyteller_5'::badge_type,
        'Published 5 stories'
      );
    END IF;
    
    -- Award storyteller_10 badge
    IF story_count >= 10 THEN
      PERFORM award_badge_if_not_exists(
        NEW.author_id,
        'storyteller_10'::badge_type,
        'Published 10 stories - a master storyteller!'
      );
    END IF;
    
    -- Award voice_of_cornwall badge
    IF has_audio THEN
      PERFORM award_badge_if_not_exists(
        NEW.author_id,
        'voice_of_cornwall'::badge_type,
        'Added audio narration to a story'
      );
    END IF;
    
    -- Award prompt_responder badge
    IF has_prompt THEN
      PERFORM award_badge_if_not_exists(
        NEW.author_id,
        'prompt_responder'::badge_type,
        'Responded to a community writing prompt'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 4. CREATE TRIGGERS
-- ================================================

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trigger_story_badges_insert ON stories;
DROP TRIGGER IF EXISTS trigger_story_badges_update ON stories;

-- Trigger for new published stories
CREATE TRIGGER trigger_story_badges_insert
  AFTER INSERT ON stories
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION check_story_badges();

-- Trigger for stories that get published (status change)
CREATE TRIGGER trigger_story_badges_update
  AFTER UPDATE OF status ON stories
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION check_story_badges();

-- Also check when audio is added to an existing story
CREATE OR REPLACE FUNCTION check_voice_badge_on_audio()
RETURNS TRIGGER AS $$
BEGIN
  -- When audio is added to a published story
  IF NEW.voice_recording_url IS NOT NULL 
     AND (OLD.voice_recording_url IS NULL OR OLD.voice_recording_url = '')
     AND NEW.status = 'published'
     AND NEW.author_id IS NOT NULL THEN
    PERFORM award_badge_if_not_exists(
      NEW.author_id,
      'voice_of_cornwall'::badge_type,
      'Added audio narration to a story'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_voice_badge ON stories;
CREATE TRIGGER trigger_voice_badge
  AFTER UPDATE OF voice_recording_url ON stories
  FOR EACH ROW
  EXECUTE FUNCTION check_voice_badge_on_audio();

-- ================================================
-- 5. COMMUNITY VOTER BADGE (for polls)
-- ================================================

CREATE OR REPLACE FUNCTION check_community_voter_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM award_badge_if_not_exists(
      NEW.user_id,
      'community_voter'::badge_type,
      'Participated in a community poll'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_community_voter ON poll_votes;
CREATE TRIGGER trigger_community_voter
  AFTER INSERT ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION check_community_voter_badge();
