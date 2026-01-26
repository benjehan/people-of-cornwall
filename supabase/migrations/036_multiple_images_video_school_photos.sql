-- ================================================
-- Migration: Multiple Images, Video Support, School Photos
-- ================================================

-- ================================================
-- 1. STORY IMAGES TABLE (for gallery-style multiple images)
-- ================================================

CREATE TABLE IF NOT EXISTS story_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  credit TEXT,
  display_order INT DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,  -- Primary image for thumbnails
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_images_story ON story_images(story_id, display_order);

-- RLS for story_images
ALTER TABLE story_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view story images" ON story_images;
CREATE POLICY "Anyone can view story images"
  ON story_images FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authors can manage their story images" ON story_images;
CREATE POLICY "Authors can manage their story images"
  ON story_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_images.story_id AND stories.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all story images" ON story_images;
CREATE POLICY "Admins can manage all story images"
  ON story_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================================
-- 2. STORY VIDEOS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS story_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_videos_story ON story_videos(story_id);

-- RLS for story_videos
ALTER TABLE story_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view story videos" ON story_videos;
CREATE POLICY "Anyone can view story videos"
  ON story_videos FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authors can manage their story videos" ON story_videos;
CREATE POLICY "Authors can manage their story videos"
  ON story_videos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_videos.story_id AND stories.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all story videos" ON story_videos;
CREATE POLICY "Admins can manage all story videos"
  ON story_videos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================================
-- 3. LOST CORNWALL IMAGES TABLE (multiple images per entry)
-- ================================================

CREATE TABLE IF NOT EXISTS lost_cornwall_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_cornwall_id UUID NOT NULL REFERENCES lost_cornwall(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lost_cornwall_images_entry ON lost_cornwall_images(lost_cornwall_id, display_order);

-- RLS for lost_cornwall_images
ALTER TABLE lost_cornwall_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lost cornwall images" ON lost_cornwall_images;
CREATE POLICY "Anyone can view lost cornwall images"
  ON lost_cornwall_images FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can add images to their submissions" ON lost_cornwall_images;
CREATE POLICY "Users can add images to their submissions"
  ON lost_cornwall_images FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM lost_cornwall WHERE lost_cornwall.id = lost_cornwall_images.lost_cornwall_id AND lost_cornwall.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all lost cornwall images" ON lost_cornwall_images;
CREATE POLICY "Admins can manage all lost cornwall images"
  ON lost_cornwall_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================================
-- 4. SCHOOL PHOTOS TABLE
-- ================================================

-- Create school type enum
DO $$ BEGIN
  CREATE TYPE school_type AS ENUM ('primary', 'secondary', 'grammar', 'comprehensive', 'college', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS school_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Photo details
  image_url TEXT NOT NULL,
  title TEXT,  -- Optional title like "Class of 1985"
  description TEXT,
  
  -- School information
  school_name TEXT NOT NULL,
  school_type school_type DEFAULT 'other',
  
  -- Location
  location_name TEXT NOT NULL,  -- Town/village name
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- Time period
  year_taken INT,  -- e.g., 1985
  class_name TEXT,  -- e.g., "Year 6", "Form 3B", "Reception"
  
  -- Source and permissions
  source_credit TEXT,  -- "Family collection", "School archive"
  has_image_rights BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitter_email TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_pending BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for school_photos
CREATE INDEX IF NOT EXISTS idx_school_photos_published ON school_photos(is_published);
CREATE INDEX IF NOT EXISTS idx_school_photos_school ON school_photos(school_name);
CREATE INDEX IF NOT EXISTS idx_school_photos_location ON school_photos(location_name);
CREATE INDEX IF NOT EXISTS idx_school_photos_year ON school_photos(year_taken);
CREATE INDEX IF NOT EXISTS idx_school_photos_pending ON school_photos(is_pending);

-- RLS for school_photos
ALTER TABLE school_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published school photos" ON school_photos;
CREATE POLICY "Anyone can view published school photos"
  ON school_photos FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Users can view their own pending photos" ON school_photos;
CREATE POLICY "Users can view their own pending photos"
  ON school_photos FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can submit school photos" ON school_photos;
CREATE POLICY "Authenticated users can submit school photos"
  ON school_photos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage all school photos" ON school_photos;
CREATE POLICY "Admins can manage all school photos"
  ON school_photos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================================
-- 5. SCHOOL PHOTO IDENTIFICATIONS (people in photos)
-- ================================================

CREATE TABLE IF NOT EXISTS school_photo_identifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES school_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Position in photo (optional, for future face tagging)
  position_x DECIMAL(5, 2),  -- Percentage from left
  position_y DECIMAL(5, 2),  -- Percentage from top
  
  -- Identification
  person_name TEXT NOT NULL,
  relationship TEXT,  -- "Self", "Parent", "Friend", "Teacher", etc.
  notes TEXT,
  
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_photo_ids_photo ON school_photo_identifications(photo_id);

-- RLS for school_photo_identifications
ALTER TABLE school_photo_identifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view identifications" ON school_photo_identifications;
CREATE POLICY "Anyone can view identifications"
  ON school_photo_identifications FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can add identifications" ON school_photo_identifications;
CREATE POLICY "Authenticated users can add identifications"
  ON school_photo_identifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can edit their own identifications" ON school_photo_identifications;
CREATE POLICY "Users can edit their own identifications"
  ON school_photo_identifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all identifications" ON school_photo_identifications;
CREATE POLICY "Admins can manage all identifications"
  ON school_photo_identifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================================
-- 6. STORAGE BUCKET FOR VIDEOS (if not exists)
-- ================================================

-- Note: Video storage bucket should be created in Supabase dashboard
-- with appropriate size limits (recommend 50MB max per video)

-- ================================================
-- 7. HELPER FUNCTIONS
-- ================================================

-- Function to get distinct schools for dropdown
CREATE OR REPLACE FUNCTION get_distinct_schools()
RETURNS TABLE (
  school_name TEXT,
  location_name TEXT,
  photo_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.school_name,
    sp.location_name,
    COUNT(*) as photo_count
  FROM school_photos sp
  WHERE sp.is_published = TRUE
  GROUP BY sp.school_name, sp.location_name
  ORDER BY sp.school_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get distinct years with photos
CREATE OR REPLACE FUNCTION get_school_photo_years()
RETURNS TABLE (
  year_taken INT,
  photo_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.year_taken,
    COUNT(*) as photo_count
  FROM school_photos sp
  WHERE sp.is_published = TRUE 
    AND sp.year_taken IS NOT NULL
  GROUP BY sp.year_taken
  ORDER BY sp.year_taken DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. COMMENTS
-- ================================================

COMMENT ON TABLE story_images IS 'Gallery images for stories, separate from inline images in body';
COMMENT ON TABLE story_videos IS 'Video uploads for stories with size tracking';
COMMENT ON TABLE lost_cornwall_images IS 'Multiple historic images per Lost Cornwall entry';
COMMENT ON TABLE school_photos IS 'Historic school photographs submitted by community';
COMMENT ON TABLE school_photo_identifications IS 'People identified in school photos by community members';
