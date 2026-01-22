-- Add view counts to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add bio to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for view counts
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment_story_view(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories SET view_count = COALESCE(view_count, 0) + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
