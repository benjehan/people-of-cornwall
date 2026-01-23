-- Add view counter to stories
-- Migration: 015_story_views.sql

-- Add view_count column to stories
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create a table to track unique views (optional, for more accurate counting)
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL for anonymous
  ip_hash TEXT,  -- Hashed IP for anonymous tracking
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate views within 24 hours
  UNIQUE(story_id, viewer_id),
  UNIQUE(story_id, ip_hash)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);

-- RLS for story_views
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (tracked server-side)
DROP POLICY IF EXISTS "Service can track views" ON story_views;
CREATE POLICY "Service can track views"
  ON story_views FOR INSERT
  WITH CHECK (TRUE);

-- Admins can see views
DROP POLICY IF EXISTS "Admins can view stats" ON story_views;
CREATE POLICY "Admins can view stats"
  ON story_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Function to increment view count (called from API)
-- Drop first to handle parameter name changes
DROP FUNCTION IF EXISTS increment_story_view(UUID);

CREATE OR REPLACE FUNCTION increment_story_view(story_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories SET view_count = view_count + 1 WHERE id = story_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
