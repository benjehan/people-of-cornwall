-- Add location_expert badge for Where Is This winners
-- Also add challenge winner tracking

-- ================================================
-- ADD LOCATION EXPERT BADGE TYPE
-- ================================================

-- Add the new badge type
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'location_expert';

-- ================================================
-- TRACK CHALLENGE WINNERS
-- ================================================

-- Add is_winner column to guesses if not exists
ALTER TABLE where_is_this_guesses ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;

-- Add winner_count to track how many challenges a user has won
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_wins INTEGER DEFAULT 0;

-- ================================================
-- FUNCTION TO AWARD LOCATION EXPERT BADGE
-- ================================================

-- Function to check and award badge when user wins their first challenge
CREATE OR REPLACE FUNCTION award_location_expert_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when is_correct is set to true
  IF NEW.is_correct = TRUE AND (OLD.is_correct IS NULL OR OLD.is_correct = FALSE) THEN
    -- Increment user's win count
    UPDATE users SET location_wins = COALESCE(location_wins, 0) + 1 
    WHERE id = NEW.user_id;
    
    -- Award badge if user doesn't already have it
    INSERT INTO user_badges (user_id, badge_type, awarded_reason)
    VALUES (
      NEW.user_id, 
      'location_expert', 
      'Correctly identified a mystery location in the Where Is This challenge'
    )
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_award_location_badge ON where_is_this_guesses;
CREATE TRIGGER trigger_award_location_badge
  AFTER UPDATE ON where_is_this_guesses
  FOR EACH ROW
  EXECUTE FUNCTION award_location_expert_badge();

-- ================================================
-- LEADERBOARD VIEW
-- ================================================

-- Create view for location experts leaderboard
CREATE OR REPLACE VIEW location_experts_leaderboard AS
SELECT 
  u.id,
  u.display_name,
  u.avatar_url,
  COALESCE(u.location_wins, 0) as wins,
  (SELECT COUNT(*) FROM where_is_this_guesses g WHERE g.user_id = u.id) as total_guesses,
  ROUND(
    CASE 
      WHEN (SELECT COUNT(*) FROM where_is_this_guesses g WHERE g.user_id = u.id) > 0 
      THEN (COALESCE(u.location_wins, 0)::DECIMAL / (SELECT COUNT(*) FROM where_is_this_guesses g WHERE g.user_id = u.id)) * 100
      ELSE 0 
    END, 1
  ) as accuracy_percent
FROM users u
WHERE COALESCE(u.location_wins, 0) > 0
ORDER BY u.location_wins DESC, accuracy_percent DESC
LIMIT 50;
