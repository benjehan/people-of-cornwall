-- ================================================
-- POLL LOCATION TOGGLE: Allow admin to control if location field shows
-- ================================================

-- Add toggle for whether nominations should show location field
ALTER TABLE polls
ADD COLUMN IF NOT EXISTS show_nomination_location BOOLEAN DEFAULT TRUE;

-- Comment explaining the field
COMMENT ON COLUMN polls.show_nomination_location IS 
  'When TRUE, nominations can include a location. When FALSE (e.g., poll is already location-specific like "Best Pub in Falmouth"), the location field is hidden from the nomination form.';
