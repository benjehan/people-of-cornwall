-- ============================================
-- COMMENTS & LIKES SYSTEM + MODERATION
-- ============================================

-- ============================================
-- 1. GENERIC COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic association (can comment on different content types)
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'event', 'lost_cornwall', 'where_is_this')),
  content_id UUID NOT NULL,
  
  -- Comment data
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT TRUE,  -- Auto-approved unless flagged
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  moderation_score DECIMAL(3, 2),  -- AI confidence score 0-1
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. GENERIC LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic association
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'event', 'lost_cornwall', 'where_is_this', 'comment')),
  content_id UUID NOT NULL,
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One like per user per content
  UNIQUE(content_type, content_id, user_id)
);

-- ============================================
-- 3. UPDATE WHERE IS THIS
-- ============================================

-- Add challenge duration and better tracking
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 3;
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Add location to guesses for proximity calculation
ALTER TABLE where_is_this_guesses ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;

-- Add comments ability (uses generic comments table)

-- ============================================
-- 4. UPDATE LOST CORNWALL FOR LIKES
-- ============================================

-- Add like_count for sorting (denormalized for performance)
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- ============================================
-- 5. UPDATE EVENTS
-- ============================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- ============================================
-- 6. MODERATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  
  action TEXT NOT NULL CHECK (action IN ('flagged', 'approved', 'rejected', 'deleted', 'user_warned', 'user_banned')),
  reason TEXT,
  
  -- Who took the action
  moderator_id UUID REFERENCES users(id),  -- NULL if AI
  is_automated BOOLEAN DEFAULT FALSE,
  
  -- AI moderation details
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
-- 8. BADGES FOR WHERE IS THIS WINNERS
-- ============================================

-- Add badge type if not exists
DO $$ BEGIN
  ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'location_expert';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (is_approved = TRUE AND is_flagged = FALSE);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can edit own comments" ON comments;
CREATE POLICY "Users can edit own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage comments" ON comments;
CREATE POLICY "Admins can manage comments"
  ON comments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Likes RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can like" ON likes;
CREATE POLICY "Users can like"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike" ON likes;
CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Moderation Log RLS
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view moderation log" ON moderation_log;
CREATE POLICY "Only admins can view moderation log"
  ON moderation_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "System can insert moderation log" ON moderation_log;
CREATE POLICY "System can insert moderation log"
  ON moderation_log FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- 10. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved, is_flagged);

CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_log_content ON moderation_log(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_action ON moderation_log(action, created_at);

CREATE INDEX IF NOT EXISTS idx_lost_cornwall_likes ON lost_cornwall(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_events_likes ON events(like_count DESC);

-- ============================================
-- 11. FUNCTIONS
-- ============================================

-- Function to update like count on lost_cornwall
CREATE OR REPLACE FUNCTION update_lost_cornwall_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lost_cornwall SET like_count = like_count + 1 
    WHERE id = NEW.content_id AND NEW.content_type = 'lost_cornwall';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lost_cornwall SET like_count = like_count - 1 
    WHERE id = OLD.content_id AND OLD.content_type = 'lost_cornwall';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lost_cornwall_likes ON likes;
CREATE TRIGGER trigger_lost_cornwall_likes
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  WHEN (NEW.content_type = 'lost_cornwall' OR OLD.content_type = 'lost_cornwall')
  EXECUTE FUNCTION update_lost_cornwall_like_count();

-- Function to update like count on events
CREATE OR REPLACE FUNCTION update_event_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET like_count = like_count + 1 
    WHERE id = NEW.content_id AND NEW.content_type = 'event';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET like_count = like_count - 1 
    WHERE id = OLD.content_id AND OLD.content_type = 'event';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_event_likes ON likes;
CREATE TRIGGER trigger_event_likes
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  WHEN (NEW.content_type = 'event' OR OLD.content_type = 'event')
  EXECUTE FUNCTION update_event_like_count();

-- Function to update comment count on events
CREATE OR REPLACE FUNCTION update_event_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET comment_count = comment_count + 1 
    WHERE id = NEW.content_id AND NEW.content_type = 'event';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET comment_count = comment_count - 1 
    WHERE id = OLD.content_id AND OLD.content_type = 'event';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_event_comments ON comments;
CREATE TRIGGER trigger_event_comments
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  WHEN (NEW.content_type = 'event' OR OLD.content_type = 'event')
  EXECUTE FUNCTION update_event_comment_count();
