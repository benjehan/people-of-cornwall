-- =============================================================================
-- ENHANCED COMMENTS SYSTEM
-- Adds: replies, likes, images, and AI moderation
-- =============================================================================

-- Add new columns to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_score DECIMAL(3,2); -- 0.00 to 1.00 (1 = likely harmful)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_flags TEXT[]; -- Array of detected issues

-- Index for parent comments (replies)
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- =============================================================================
-- COMMENT LIKES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Indexes for comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- =============================================================================
-- COMMENT LIKES RLS POLICIES
-- =============================================================================

-- Anyone can read comment likes
CREATE POLICY "Public can read comment likes"
  ON comment_likes FOR SELECT
  USING (TRUE);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete) their own likes
CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTION TO UPDATE COMMENT LIKE COUNT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update like count
DROP TRIGGER IF EXISTS trigger_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_comment_like_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- =============================================================================
-- UPDATE EXISTING COMMENTS RLS FOR REPLIES
-- =============================================================================

-- Anyone can read visible comments (and their replies)
DROP POLICY IF EXISTS "Public can read visible comments" ON comments;
CREATE POLICY "Public can read visible comments"
  ON comments FOR SELECT
  USING (status = 'visible');
