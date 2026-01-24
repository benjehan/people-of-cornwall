-- ================================================
-- FIX EVENT DATES (2025 -> 2026) & ADD MULTIPLE IMAGES
-- ================================================

-- 1. Update all event dates from 2025 to 2026
-- This shifts all events forward by exactly 1 year
UPDATE events 
SET 
  starts_at = starts_at + INTERVAL '1 year',
  ends_at = CASE WHEN ends_at IS NOT NULL THEN ends_at + INTERVAL '1 year' ELSE NULL END
WHERE EXTRACT(YEAR FROM starts_at) = 2025;

-- Also update event titles that mention 2025
UPDATE events 
SET title = REPLACE(title, '2025', '2026')
WHERE title LIKE '%2025%';

-- 2. Create event_images table for multiple images per event
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one primary image per event
  CONSTRAINT unique_primary_image UNIQUE (event_id, is_primary) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Actually, the above constraint is too strict. Let's drop it and use a different approach
ALTER TABLE event_images DROP CONSTRAINT IF EXISTS unique_primary_image;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_primary ON event_images(event_id, is_primary) WHERE is_primary = TRUE;

-- Create a function to ensure only one primary image per event
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this image as primary, unset any other primary images for this event
  IF NEW.is_primary = TRUE THEN
    UPDATE event_images 
    SET is_primary = FALSE 
    WHERE event_id = NEW.event_id 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_single_primary_image ON event_images;
CREATE TRIGGER trigger_single_primary_image
  BEFORE INSERT OR UPDATE OF is_primary ON event_images
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_image();

-- 3. Migrate existing image_url to event_images table
INSERT INTO event_images (event_id, image_url, is_primary, display_order)
SELECT id, image_url, TRUE, 0
FROM events 
WHERE image_url IS NOT NULL AND image_url != '';

-- Enable RLS
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view event images
CREATE POLICY "Event images are publicly viewable"
  ON event_images FOR SELECT
  USING (true);

-- Only admin and event creator can manage images
CREATE POLICY "Users can manage their event images"
  ON event_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_images.event_id 
        AND (e.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

-- Log completion
DO $$ BEGIN RAISE NOTICE '✅ Fixed event dates (2025→2026) and added event_images table!'; END $$;
