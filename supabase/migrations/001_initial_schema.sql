-- =============================================================================
-- People of Cornwall — Initial Database Schema
-- A living archive of Cornish voices
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE story_status AS ENUM (
  'draft',
  'review',
  'published',
  'rejected',
  'unpublished'
);

CREATE TYPE media_type AS ENUM (
  'image',
  'video',
  'audio'
);

CREATE TYPE comment_status AS ENUM (
  'visible',
  'hidden',
  'flagged'
);

CREATE TYPE user_role AS ENUM (
  'user',
  'admin'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_display_name TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  status story_status DEFAULT 'draft',
  rejection_reason TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  timeline_year INT,
  timeline_decade INT,
  location_name TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  ai_summary TEXT,
  ai_tags TEXT[],
  soft_deleted BOOLEAN DEFAULT FALSE
);

-- Media (attached to stories)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status comment_status DEFAULT 'visible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Collections (curated groups of stories)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story-Collection junction table
CREATE TABLE story_collections (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (story_id, collection_id)
);

-- Writing Prompts (community prompts for future phases)
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Full-text search on stories
CREATE INDEX idx_stories_fts ON stories 
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(body, '')));

-- Common query filters
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_timeline ON stories(timeline_year, timeline_decade);
CREATE INDEX idx_stories_location ON stories(location_name);
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_stories_published_at ON stories(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_stories_featured ON stories(featured) WHERE featured = TRUE;

-- Tags search
CREATE INDEX idx_stories_tags ON stories USING GIN(ai_tags);

-- Soft delete filter
CREATE INDEX idx_stories_not_deleted ON stories(soft_deleted) WHERE soft_deleted = FALSE;

-- Comments
CREATE INDEX idx_comments_story ON comments(story_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Likes
CREATE INDEX idx_likes_story ON likes(story_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- Collections
CREATE INDEX idx_collections_slug ON collections(slug);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate timeline_decade from timeline_year
CREATE OR REPLACE FUNCTION calculate_decade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.timeline_year IS NOT NULL THEN
    NEW.timeline_decade = (NEW.timeline_year / 10) * 10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync author_display_name when story is created/updated
CREATE OR REPLACE FUNCTION sync_author_display_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.anonymous = TRUE THEN
    NEW.author_display_name = NULL;
  ELSE
    SELECT display_name INTO NEW.author_display_name
    FROM users WHERE id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate decade
CREATE TRIGGER calculate_story_decade
  BEFORE INSERT OR UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION calculate_decade();

-- Auto-sync author display name
CREATE TRIGGER sync_story_author_name
  BEFORE INSERT OR UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION sync_author_display_name();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (is_admin());

-- =============================================================================
-- STORIES POLICIES
-- =============================================================================

-- Anyone can read published stories
CREATE POLICY "Public can read published stories"
  ON stories FOR SELECT
  USING (status = 'published' AND soft_deleted = FALSE);

-- Users can read their own stories (any status)
CREATE POLICY "Users can read own stories"
  ON stories FOR SELECT
  USING (auth.uid() = author_id);

-- Users can create stories (as drafts)
CREATE POLICY "Users can create drafts"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Users can update their own non-published stories
CREATE POLICY "Users can update own non-published stories"
  ON stories FOR UPDATE
  USING (auth.uid() = author_id AND status != 'published')
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own published stories ONLY to unpublish
CREATE POLICY "Users can unpublish own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = author_id AND status = 'published')
  WITH CHECK (auth.uid() = author_id AND status = 'unpublished');

-- Admins have full access to stories
CREATE POLICY "Admins have full access to stories"
  ON stories FOR ALL
  USING (is_admin());

-- =============================================================================
-- MEDIA POLICIES
-- =============================================================================

-- Anyone can read media for published stories
CREATE POLICY "Public can read media for published stories"
  ON media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = media.story_id 
      AND stories.status = 'published'
      AND stories.soft_deleted = FALSE
    )
  );

-- Users can read media for their own stories
CREATE POLICY "Users can read own story media"
  ON media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = media.story_id 
      AND stories.author_id = auth.uid()
    )
  );

-- Users can manage media for their own stories
CREATE POLICY "Users can manage own story media"
  ON media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = media.story_id 
      AND stories.author_id = auth.uid()
    )
  );

-- Admins have full access to media
CREATE POLICY "Admins have full access to media"
  ON media FOR ALL
  USING (is_admin());

-- =============================================================================
-- COMMENTS POLICIES
-- =============================================================================

-- Anyone can read visible comments
CREATE POLICY "Public can read visible comments"
  ON comments FOR SELECT
  USING (status = 'visible');

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins have full access to comments
CREATE POLICY "Admins have full access to comments"
  ON comments FOR ALL
  USING (is_admin());

-- =============================================================================
-- LIKES POLICIES
-- =============================================================================

-- Anyone can read likes
CREATE POLICY "Public can read likes"
  ON likes FOR SELECT
  USING (TRUE);

-- Authenticated users can like stories
CREATE POLICY "Authenticated users can like"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- COLLECTIONS POLICIES
-- =============================================================================

-- Anyone can read collections
CREATE POLICY "Public can read collections"
  ON collections FOR SELECT
  USING (TRUE);

-- Admins can manage collections
CREATE POLICY "Admins can manage collections"
  ON collections FOR ALL
  USING (is_admin());

-- =============================================================================
-- STORY_COLLECTIONS POLICIES
-- =============================================================================

-- Anyone can read story_collections
CREATE POLICY "Public can read story_collections"
  ON story_collections FOR SELECT
  USING (TRUE);

-- Admins can manage story_collections
CREATE POLICY "Admins can manage story_collections"
  ON story_collections FOR ALL
  USING (is_admin());

-- =============================================================================
-- PROMPTS POLICIES
-- =============================================================================

-- Anyone can read active prompts
CREATE POLICY "Public can read active prompts"
  ON prompts FOR SELECT
  USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Admins can manage prompts
CREATE POLICY "Admins can manage prompts"
  ON prompts FOR ALL
  USING (is_admin());

-- =============================================================================
-- HANDLE NEW USER SIGNUP
-- =============================================================================

-- Function to create a user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- STORAGE BUCKET (for media uploads)
-- =============================================================================

-- Note: Storage bucket creation is done via Supabase Dashboard or API
-- This is documentation of the expected bucket configuration:
--
-- Bucket: 'story-media'
-- Public: false
-- Allowed MIME types: image/*, video/*, audio/*
-- Max file size: 50MB
--
-- Policies:
-- - Authenticated users can upload to their own folder
-- - Public can read files for published stories
-- - Users can delete their own files
