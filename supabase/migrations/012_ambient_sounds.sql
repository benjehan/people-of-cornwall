-- Add ambient sound support to stories
-- Allows writers to select an atmospheric background sound for their story

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS ambient_sound VARCHAR(50) DEFAULT NULL;

-- Create index for filtering by ambient sound
CREATE INDEX IF NOT EXISTS idx_stories_ambient_sound ON stories(ambient_sound) WHERE ambient_sound IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN stories.ambient_sound IS 'Optional ambient background sound type: waves, rain, harbour, pub, wind, church, seagulls, fire, market, storm';
