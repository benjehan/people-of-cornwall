-- ================================================
-- POLL ENHANCEMENTS: Images & Duplicate Prevention
-- ================================================

-- 1. Add toggle for whether nominations can include images
ALTER TABLE polls
ADD COLUMN IF NOT EXISTS allow_nomination_images BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN polls.allow_nomination_images IS 
  'When TRUE, users can upload images with their nominations (e.g., sunset spots, scenic views)';

-- 2. Ensure poll_nominations has image_url column
ALTER TABLE poll_nominations
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Enable pg_trgm extension for fuzzy text matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. Create function to check for duplicate nominations
CREATE OR REPLACE FUNCTION check_duplicate_nomination(
  p_poll_id UUID,
  p_title TEXT,
  p_similarity_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_nomination_id UUID,
  existing_title TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_duplicate,
    pn.id as existing_nomination_id,
    pn.title as existing_title,
    similarity(LOWER(pn.title), LOWER(p_title)) as similarity_score
  FROM poll_nominations pn
  WHERE pn.poll_id = p_poll_id
    AND (
      -- Exact match (case-insensitive)
      LOWER(TRIM(pn.title)) = LOWER(TRIM(p_title))
      OR
      -- Fuzzy match using trigram similarity
      similarity(LOWER(pn.title), LOWER(p_title)) > p_similarity_threshold
    )
  ORDER BY similarity_score DESC
  LIMIT 1;
  
  -- If no rows returned, return a "not duplicate" row
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 0.0::FLOAT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to prevent duplicate nominations on insert
CREATE OR REPLACE FUNCTION prevent_duplicate_nomination()
RETURNS TRIGGER AS $$
DECLARE
  dup_check RECORD;
BEGIN
  -- Check for duplicates
  SELECT * INTO dup_check 
  FROM check_duplicate_nomination(NEW.poll_id, NEW.title, 0.5);
  
  IF dup_check.is_duplicate AND dup_check.existing_nomination_id IS NOT NULL THEN
    RAISE EXCEPTION 'A similar nomination already exists: "%". Please vote for it instead!', 
      dup_check.existing_title
      USING HINT = 'Similarity score: ' || dup_check.similarity_score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_nomination_duplicate ON poll_nominations;
CREATE TRIGGER check_nomination_duplicate
  BEFORE INSERT ON poll_nominations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_nomination();

-- 6. Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_poll_nominations_title_trgm 
  ON poll_nominations USING gin (title gin_trgm_ops);

-- 7. Add helpful comment
COMMENT ON FUNCTION check_duplicate_nomination IS 
  'Checks if a nomination title is too similar to existing nominations for the same poll. 
   Uses PostgreSQL trigram similarity (pg_trgm) for fuzzy matching.
   Threshold of 0.4 catches variations like "The Ship Inn" vs "Ship Inn" or "Godrevy Beach" vs "Godrevy"';
