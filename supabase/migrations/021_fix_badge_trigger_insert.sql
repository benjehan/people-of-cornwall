-- Fix location expert badge trigger to also work on INSERT
-- This is needed because auto-detected correct guesses are now set on insert

-- ================================================
-- UPDATE TRIGGER FUNCTION
-- ================================================

-- Updated function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION award_location_expert_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if is_correct is TRUE (works for both INSERT and UPDATE)
  IF NEW.is_correct = TRUE THEN
    -- For UPDATE, only trigger if it wasn't already correct
    IF TG_OP = 'UPDATE' AND OLD.is_correct = TRUE THEN
      RETURN NEW;
    END IF;
    
    -- Only award if user_id is not null (authenticated user)
    IF NEW.user_id IS NOT NULL THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- RECREATE TRIGGERS FOR BOTH INSERT AND UPDATE
-- ================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_award_location_badge ON where_is_this_guesses;

-- Create trigger for INSERT
CREATE TRIGGER trigger_award_location_badge_insert
  AFTER INSERT ON where_is_this_guesses
  FOR EACH ROW
  WHEN (NEW.is_correct = TRUE)
  EXECUTE FUNCTION award_location_expert_badge();

-- Create trigger for UPDATE (when admin marks correct later)
CREATE TRIGGER trigger_award_location_badge_update
  AFTER UPDATE OF is_correct ON where_is_this_guesses
  FOR EACH ROW
  WHEN (NEW.is_correct = TRUE AND (OLD.is_correct IS NULL OR OLD.is_correct = FALSE))
  EXECUTE FUNCTION award_location_expert_badge();

-- ================================================
-- RETROACTIVELY AWARD BADGES TO EXISTING WINNERS
-- ================================================

-- Award badges to any users who already have correct guesses but no badge
INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT DISTINCT g.user_id, 'location_expert', 'Correctly identified a mystery location in the Where Is This challenge'
FROM where_is_this_guesses g
WHERE g.is_correct = TRUE 
  AND g.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = g.user_id 
    AND ub.badge_type = 'location_expert'
  )
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Update location_wins count for users who have correct guesses
UPDATE users u
SET location_wins = (
  SELECT COUNT(*) 
  FROM where_is_this_guesses g 
  WHERE g.user_id = u.id 
  AND g.is_correct = TRUE
)
WHERE EXISTS (
  SELECT 1 FROM where_is_this_guesses g 
  WHERE g.user_id = u.id 
  AND g.is_correct = TRUE
);
