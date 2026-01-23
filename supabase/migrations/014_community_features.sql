-- Community Features: Voting, Badges, Digest Subscriptions, Voice Recordings
-- Migration: 014_community_features.sql

-- ============================================
-- 1. COMMUNITY POLLS / "THE BEST OF..." VOTING
-- ============================================

-- Poll categories enum
CREATE TYPE poll_category AS ENUM (
  'best_joke',
  'best_business',
  'best_pub',
  'best_kindness',
  'best_event',
  'best_memory',
  'best_site',
  'other'
);

-- Polls table (admin creates polls)
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category poll_category NOT NULL,
  location_name TEXT,  -- Optional: filter by village/town
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Poll nominations (users nominate entries)
CREATE TABLE IF NOT EXISTS poll_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,  -- e.g., "The Fisherman's Arms"
  description TEXT,     -- Short description (500 chars max)
  location_name TEXT,   -- Village/town
  image_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,  -- Admin approval for nominations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- Poll votes (one vote per user per poll)
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  nomination_id UUID NOT NULL REFERENCES poll_nominations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)  -- One vote per poll per user
);

-- ============================================
-- 2. CONTRIBUTOR BADGES
-- ============================================

CREATE TYPE badge_type AS ENUM (
  'first_story',        -- Published first story
  'storyteller_5',      -- 5 published stories
  'storyteller_10',     -- 10 published stories
  'storyteller_25',     -- 25 published stories
  'voice_keeper',       -- First audio recording
  'memory_keeper',      -- Stories span 3+ decades
  'local_legend',       -- 10+ stories about one location
  'community_star',     -- 50+ comments received
  'ambassador',         -- Community ambassador (manual)
  'founding_member',    -- Joined in first month
  'helpful_voice',      -- 20+ comments on others' stories
  'popular_story'       -- Story with 100+ likes
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_reason TEXT,
  UNIQUE(user_id, badge_type)
);

-- ============================================
-- 3. EMAIL DIGEST SUBSCRIPTIONS
-- ============================================

CREATE TYPE digest_frequency AS ENUM (
  'weekly',
  'monthly',
  'never'
);

CREATE TABLE IF NOT EXISTS digest_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  frequency digest_frequency DEFAULT 'weekly',
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  UNIQUE(email)
);

-- ============================================
-- 4. VOICE RECORDINGS (Original Audio)
-- ============================================

-- Add voice recording URL to stories
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS voice_recording_url TEXT,
ADD COLUMN IF NOT EXISTS voice_recording_duration INT;  -- Duration in seconds

-- ============================================
-- 5. MINI-STORIES FORMAT
-- ============================================

-- Add story format type
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS story_format VARCHAR(20) DEFAULT 'standard' 
CHECK (story_format IN ('standard', 'mini', 'audio'));

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(is_active, ends_at);
CREATE INDEX IF NOT EXISTS idx_poll_nominations_poll ON poll_nominations(poll_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_poll_votes_nomination ON poll_votes(nomination_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_subs_active ON digest_subscriptions(is_active, frequency);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Polls RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active polls"
  ON polls FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage polls"
  ON polls FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Poll Nominations RLS
ALTER TABLE poll_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved nominations"
  ON poll_nominations FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Users can create nominations"
  ON poll_nominations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage nominations"
  ON poll_nominations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Poll Votes RLS
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vote counts"
  ON poll_votes FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- User Badges RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON user_badges FOR SELECT
  USING (TRUE);

CREATE POLICY "Only system can award badges"
  ON user_badges FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Digest Subscriptions RLS
ALTER TABLE digest_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON digest_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscription"
  ON digest_subscriptions FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get vote count for a nomination
CREATE OR REPLACE FUNCTION get_nomination_votes(nomination_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM poll_votes WHERE nomination_id = nomination_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if user has voted on a poll
CREATE OR REPLACE FUNCTION user_has_voted(poll_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM poll_votes WHERE poll_id = poll_uuid AND user_id = user_uuid);
$$ LANGUAGE SQL STABLE;
