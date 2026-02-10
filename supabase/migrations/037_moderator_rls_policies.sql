-- =============================================================================
-- Moderator RLS Policies
-- Adds moderator access to all content management policies
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Step 1: Create is_moderator_or_admin() helper function
CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('moderator', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Add missing admin UPDATE policy on users table
-- (Only admins can change user roles - not moderators)
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================================
-- Step 3: Update content policies to allow moderators
-- We DROP the old admin-only policies and recreate with is_moderator_or_admin()
-- =============================================================================

-- --- STORIES ---
DROP POLICY IF EXISTS "Admins have full access to stories" ON stories;
DROP POLICY IF EXISTS "Admins and moderators have full access to stories" ON stories;
CREATE POLICY "Admins and moderators have full access to stories"
  ON stories FOR ALL
  USING (is_moderator_or_admin());

-- --- MEDIA ---
DROP POLICY IF EXISTS "Admins have full access to media" ON media;
DROP POLICY IF EXISTS "Admins and moderators have full access to media" ON media;
CREATE POLICY "Admins and moderators have full access to media"
  ON media FOR ALL
  USING (is_moderator_or_admin());

-- --- COMMENTS (may exist from 001 or 017) ---
DROP POLICY IF EXISTS "Admins have full access to comments" ON comments;
DROP POLICY IF EXISTS "Admins can manage comments" ON comments;
DROP POLICY IF EXISTS "Admins and moderators can manage comments" ON comments;
CREATE POLICY "Admins and moderators can manage comments"
  ON comments FOR ALL
  USING (is_moderator_or_admin());

-- --- EVENTS ---
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Admins and moderators can manage events" ON events;
CREATE POLICY "Admins and moderators can manage events"
  ON events FOR ALL
  USING (is_moderator_or_admin());

-- --- POLLS ---
DROP POLICY IF EXISTS "Admins can manage polls" ON polls;
DROP POLICY IF EXISTS "Admins and moderators can manage polls" ON polls;
CREATE POLICY "Admins and moderators can manage polls"
  ON polls FOR ALL
  USING (is_moderator_or_admin());

-- --- POLL NOMINATIONS ---
DROP POLICY IF EXISTS "Admins can manage nominations" ON poll_nominations;
DROP POLICY IF EXISTS "Admins and moderators can manage nominations" ON poll_nominations;
CREATE POLICY "Admins and moderators can manage nominations"
  ON poll_nominations FOR ALL
  USING (is_moderator_or_admin());

-- --- LOST CORNWALL ---
DROP POLICY IF EXISTS "Admins can manage lost cornwall" ON lost_cornwall;
DROP POLICY IF EXISTS "Admins and moderators can manage lost cornwall" ON lost_cornwall;
CREATE POLICY "Admins and moderators can manage lost cornwall"
  ON lost_cornwall FOR ALL
  USING (is_moderator_or_admin());

-- --- LOST CORNWALL MEMORIES ---
DROP POLICY IF EXISTS "Admins can manage memories" ON lost_cornwall_memories;
DROP POLICY IF EXISTS "Admins and moderators can manage memories" ON lost_cornwall_memories;
CREATE POLICY "Admins and moderators can manage memories"
  ON lost_cornwall_memories FOR ALL
  USING (is_moderator_or_admin());

-- --- LOST CORNWALL IMAGES ---
DROP POLICY IF EXISTS "Admins can manage all lost cornwall images" ON lost_cornwall_images;
DROP POLICY IF EXISTS "Admins and moderators can manage all lost cornwall images" ON lost_cornwall_images;
CREATE POLICY "Admins and moderators can manage all lost cornwall images"
  ON lost_cornwall_images FOR ALL
  USING (is_moderator_or_admin());

-- --- WHERE IS THIS ---
DROP POLICY IF EXISTS "Admins can manage where is this" ON where_is_this;
DROP POLICY IF EXISTS "Admins and moderators can manage where is this" ON where_is_this;
CREATE POLICY "Admins and moderators can manage where is this"
  ON where_is_this FOR ALL
  USING (is_moderator_or_admin());

-- --- WHERE IS THIS GUESSES ---
DROP POLICY IF EXISTS "Admins can manage guesses" ON where_is_this_guesses;
DROP POLICY IF EXISTS "Admins and moderators can manage guesses" ON where_is_this_guesses;
CREATE POLICY "Admins and moderators can manage guesses"
  ON where_is_this_guesses FOR ALL
  USING (is_moderator_or_admin());

-- --- SCHOOL PHOTOS ---
DROP POLICY IF EXISTS "Admins can manage all school photos" ON school_photos;
DROP POLICY IF EXISTS "Admins and moderators can manage all school photos" ON school_photos;
CREATE POLICY "Admins and moderators can manage all school photos"
  ON school_photos FOR ALL
  USING (is_moderator_or_admin());

-- --- SCHOOL PHOTO IDENTIFICATIONS ---
DROP POLICY IF EXISTS "Admins can manage all identifications" ON school_photo_identifications;
DROP POLICY IF EXISTS "Admins and moderators can manage all identifications" ON school_photo_identifications;
CREATE POLICY "Admins and moderators can manage all identifications"
  ON school_photo_identifications FOR ALL
  USING (is_moderator_or_admin());

-- --- STORY IMAGES ---
DROP POLICY IF EXISTS "Admins can manage all story images" ON story_images;
DROP POLICY IF EXISTS "Admins and moderators can manage all story images" ON story_images;
CREATE POLICY "Admins and moderators can manage all story images"
  ON story_images FOR ALL
  USING (is_moderator_or_admin());

-- --- STORY VIDEOS ---
DROP POLICY IF EXISTS "Admins can manage all story videos" ON story_videos;
DROP POLICY IF EXISTS "Admins and moderators can manage all story videos" ON story_videos;
CREATE POLICY "Admins and moderators can manage all story videos"
  ON story_videos FOR ALL
  USING (is_moderator_or_admin());

-- --- SPORT CLUBS ---
DROP POLICY IF EXISTS "Admins can update any sport club photo" ON sport_clubs;
DROP POLICY IF EXISTS "Admins and moderators can manage sport club photos" ON sport_clubs;
CREATE POLICY "Admins and moderators can manage sport club photos"
  ON sport_clubs FOR ALL
  USING (is_moderator_or_admin());

-- --- STORY VIEWS (read-only for moderators too) ---
DROP POLICY IF EXISTS "Admins can view stats" ON story_views;
DROP POLICY IF EXISTS "Admins and moderators can view stats" ON story_views;
CREATE POLICY "Admins and moderators can view stats"
  ON story_views FOR SELECT
  USING (is_moderator_or_admin());

-- --- MODERATION LOG ---
DROP POLICY IF EXISTS "Only admins can view moderation log" ON moderation_log;
DROP POLICY IF EXISTS "Admins and moderators can view moderation log" ON moderation_log;
CREATE POLICY "Admins and moderators can view moderation log"
  ON moderation_log FOR SELECT
  USING (is_moderator_or_admin());

-- =============================================================================
-- Step 4: Keep these admin-only (not for moderators)
-- Collections, prompts, story_collections remain admin-only
-- Users table UPDATE remains admin-only (set above)
-- =============================================================================

-- Note: The following policies are intentionally left as is_admin() only:
-- - "Admins can manage collections" ON collections
-- - "Admins can manage story_collections" ON story_collections
-- - "Admins can manage prompts" ON prompts
-- - "Admins can update all users" ON users (just created above)
