-- ================================================
-- POLLS ENHANCEMENT: Location, Winners, Social Links
-- ================================================

-- 1. Add location coordinates to polls for map display
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- 2. Add location coordinates to nominations for map display
ALTER TABLE poll_nominations
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- 3. Add social/website links to nominations (for winner promotion)
ALTER TABLE poll_nominations
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 4. Add winner tracking to polls
ALTER TABLE polls
ADD COLUMN IF NOT EXISTS winner_nomination_id UUID REFERENCES poll_nominations(id),
ADD COLUMN IF NOT EXISTS winner_declared_at TIMESTAMPTZ;

-- 5. Create a function to automatically declare winners when poll ends
CREATE OR REPLACE FUNCTION check_poll_winners()
RETURNS void AS $$
DECLARE
  poll_record RECORD;
  winner_nom RECORD;
BEGIN
  -- Find polls that have ended but no winner declared yet
  FOR poll_record IN 
    SELECT p.id 
    FROM polls p 
    WHERE p.voting_end_at IS NOT NULL 
      AND p.voting_end_at < NOW() 
      AND p.winner_nomination_id IS NULL
      AND p.is_active = TRUE
  LOOP
    -- Find the nomination with most votes
    SELECT pn.id, pn.user_id INTO winner_nom
    FROM poll_nominations pn
    LEFT JOIN poll_votes pv ON pv.nomination_id = pn.id
    WHERE pn.poll_id = poll_record.id AND pn.is_approved = TRUE
    GROUP BY pn.id, pn.user_id
    ORDER BY COUNT(pv.id) DESC
    LIMIT 1;
    
    -- Update poll with winner
    IF winner_nom.id IS NOT NULL THEN
      UPDATE polls 
      SET winner_nomination_id = winner_nom.id,
          winner_declared_at = NOW(),
          is_active = FALSE
      WHERE id = poll_record.id;
      
      -- Award poll_winner badge to the user who created the nomination
      IF winner_nom.user_id IS NOT NULL THEN
        INSERT INTO user_badges (user_id, badge_type, awarded_reason)
        VALUES (winner_nom.user_id, 'poll_winner', 'Nomination won a community poll!')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Index for faster winner queries
CREATE INDEX IF NOT EXISTS idx_polls_voting_end ON polls(voting_end_at) WHERE voting_end_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_poll_nominations_location ON poll_nominations(location_lat, location_lng) WHERE location_lat IS NOT NULL;
