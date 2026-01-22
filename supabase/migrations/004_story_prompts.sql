-- Story Prompts
-- Community writing prompts to inspire stories

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  story_count INT DEFAULT 0
);

-- Add prompt_id to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES prompts(id);

-- Index for active prompts
CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(active, featured);
CREATE INDEX IF NOT EXISTS idx_stories_prompt ON stories(prompt_id);

-- RLS for prompts
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active prompts
DROP POLICY IF EXISTS "Anyone can view active prompts" ON prompts;
CREATE POLICY "Anyone can view active prompts" ON prompts
  FOR SELECT
  USING (active = true);

-- Only admins can manage prompts
DROP POLICY IF EXISTS "Admins can manage prompts" ON prompts;
CREATE POLICY "Admins can manage prompts" ON prompts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update story count on prompts
CREATE OR REPLACE FUNCTION update_prompt_story_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.prompt_id IS NOT NULL THEN
    UPDATE prompts SET story_count = story_count + 1 WHERE id = NEW.prompt_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.prompt_id IS DISTINCT FROM NEW.prompt_id THEN
      IF OLD.prompt_id IS NOT NULL THEN
        UPDATE prompts SET story_count = story_count - 1 WHERE id = OLD.prompt_id;
      END IF;
      IF NEW.prompt_id IS NOT NULL THEN
        UPDATE prompts SET story_count = story_count + 1 WHERE id = NEW.prompt_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.prompt_id IS NOT NULL THEN
    UPDATE prompts SET story_count = story_count - 1 WHERE id = OLD.prompt_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_prompt_story_count ON stories;
CREATE TRIGGER trigger_update_prompt_story_count
AFTER INSERT OR UPDATE OR DELETE ON stories
FOR EACH ROW EXECUTE FUNCTION update_prompt_story_count();

-- Insert some default prompts
INSERT INTO prompts (title, description, active, featured) VALUES
  ('What was market day like in your town?', 'Share your memories of local markets, the sights, sounds, and characters you remember.', true, true),
  ('A day at a Cornish beach', 'Describe your most memorable beach day - swimming, rock pooling, building sandcastles, or just watching the waves.', true, false),
  ('School days in Cornwall', 'What do you remember about your school? Teachers, friends, the journey to school, or school dinners?', true, false),
  ('Working in Cornwall', 'Share stories from your working life - fishing, farming, mining, tourism, or any other trade.', true, false),
  ('Cornish festivals and traditions', 'Obby Oss, Golowan, Flora Day, or local village fetes - what traditions do you remember?', true, false);
