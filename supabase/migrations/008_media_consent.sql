-- Add media consent tracking to stories
-- This tracks that users have acknowledged they have rights to share images

-- Add consent field to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_consent BOOLEAN DEFAULT FALSE;

-- Add comment explaining the field
COMMENT ON COLUMN stories.media_consent IS 'User confirmed they have rights to share any uploaded images';
