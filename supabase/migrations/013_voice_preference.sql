-- Add voice preference to stories for text-to-speech reading
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS voice_preference VARCHAR(10) DEFAULT 'male' 
CHECK (voice_preference IN ('male', 'female'));

-- Comment for documentation
COMMENT ON COLUMN stories.voice_preference IS 'Preferred voice for text-to-speech: male or female. Default is male.';
