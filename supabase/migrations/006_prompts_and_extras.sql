-- =============================================================================
-- People of Cornwall — Add Prompts and Extra Columns
-- =============================================================================

-- Add bio to users (for author profiles)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add view_count to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add prompt_id to stories (for stories responding to prompts)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL;

-- Create index for prompt lookups
CREATE INDEX IF NOT EXISTS idx_stories_prompt_id ON stories(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompts(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(active) WHERE active = true;

-- RLS for prompts
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Everyone can read active prompts
CREATE POLICY "Anyone can view active prompts"
  ON prompts FOR SELECT
  USING (active = true);

-- Only admins can manage prompts
CREATE POLICY "Admins can manage prompts"
  ON prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to increment story views
CREATE OR REPLACE FUNCTION increment_story_view(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories SET view_count = COALESCE(view_count, 0) + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
