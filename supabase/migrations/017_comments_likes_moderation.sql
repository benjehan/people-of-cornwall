-- ============================================
-- COMMENTS & LIKES SYSTEM + MODERATION
-- ============================================

-- ============================================
-- 1. UPDATE EXISTING COMMENTS TABLE
-- ============================================

-- Add columns to existing comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_score DECIMAL(3, 2);

-- ============================================
-- 2. LIKES TABLE - ADD COLUMNS OR CREATE
-- ============================================

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT,
  content_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table exists but columns don't
ALTER TABLE likes ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint if not exists (only if columns exist)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_unique_per_user'
  ) THEN
    -- Only add if all columns exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'likes' AND column_name = 'content_type'
    ) THEN
      ALTER TABLE likes ADD CONSTRAINT likes_unique_per_user 
        UNIQUE(content_type, content_id, user_id);
    END IF;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. UPDATE WHERE IS THIS (if exists)
-- ============================================

DO $$ BEGIN
  ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 3;
  ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE where_is_this_guesses ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN undefined_table THEN null;
END $$;

-- ============================================
-- 4. UPDATE LOST CORNWALL FOR LIKES (if exists)
-- ============================================

DO $$ BEGIN
  ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
EXCEPTION WHEN undefined_table THEN null;
END $$;

-- ============================================
-- 5. UPDATE EVENTS (if exists)
-- ============================================

DO $$ BEGIN
  ALTER TABLE events ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
  ALTER TABLE events ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
EXCEPTION WHEN undefined_table THEN null;
END $$;

-- ============================================
-- 6. MODERATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  moderator_id UUID REFERENCES users(id),
  is_automated BOOLEAN DEFAULT FALSE,
  ai_flags TEXT[],
  ai_confidence DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. USER WARNINGS/BANS
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can edit own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Admins can manage comments" ON comments;

CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (COALESCE(is_approved, TRUE) = TRUE AND COALESCE(is_flagged, FALSE) = FALSE);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage comments"
  ON comments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Likes RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can like" ON likes;
DROP POLICY IF EXISTS "Users can unlike" ON likes;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can like"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Moderation Log RLS
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view moderation log" ON moderation_log;
DROP POLICY IF EXISTS "System can insert moderation log" ON moderation_log;

CREATE POLICY "Only admins can view moderation log"
  ON moderation_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "System can insert moderation log"
  ON moderation_log FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- 9. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_log_content ON moderation_log(content_type, content_id);

-- ============================================
-- 10. TRIGGER FUNCTIONS
-- ============================================

-- Function to update like count on lost_cornwall
CREATE OR REPLACE FUNCTION update_lost_cornwall_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.content_type = 'lost_cornwall' THEN
    UPDATE lost_cornwall SET like_count = COALESCE(like_count, 0) + 1 
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.content_type = 'lost_cornwall' THEN
    UPDATE lost_cornwall SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
EXCEPTION WHEN undefined_table THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update like count on events
CREATE OR REPLACE FUNCTION update_event_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.content_type = 'event' THEN
    UPDATE events SET like_count = COALESCE(like_count, 0) + 1 
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.content_type = 'event' THEN
    UPDATE events SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
EXCEPTION WHEN undefined_table THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment count on events
CREATE OR REPLACE FUNCTION update_event_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.content_type = 'event' THEN
    UPDATE events SET comment_count = COALESCE(comment_count, 0) + 1 
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.content_type = 'event' THEN
    UPDATE events SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
    WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
EXCEPTION WHEN undefined_table THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_lost_cornwall_likes ON likes;
DROP TRIGGER IF EXISTS trigger_event_likes ON likes;
DROP TRIGGER IF EXISTS trigger_event_comments ON comments;

CREATE TRIGGER trigger_lost_cornwall_likes
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_lost_cornwall_like_count();

CREATE TRIGGER trigger_event_likes
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_event_like_count();

CREATE TRIGGER trigger_event_comments
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_event_comment_count();
