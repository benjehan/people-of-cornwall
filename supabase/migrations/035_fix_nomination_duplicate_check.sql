-- Fix the check_duplicate_nomination function return type
-- The similarity() function returns REAL, not DOUBLE PRECISION
-- This was causing "structure of query does not match function result type" error

-- Drop the trigger first (depends on the function)
DROP TRIGGER IF EXISTS check_nomination_duplicate ON poll_nominations;

-- Drop and recreate the function with correct return type
DROP FUNCTION IF EXISTS check_duplicate_nomination(UUID, TEXT, FLOAT);
DROP FUNCTION IF EXISTS check_duplicate_nomination(UUID, TEXT, REAL);

-- Recreate with REAL type to match similarity() return type
CREATE OR REPLACE FUNCTION check_duplicate_nomination(
  p_poll_id UUID,
  p_title TEXT,
  p_similarity_threshold REAL DEFAULT 0.4
)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_nomination_id UUID,
  existing_title TEXT,
  similarity_score REAL
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
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 0.0::REAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION prevent_duplicate_nomination()
RETURNS TRIGGER AS $$
DECLARE
  dup_check RECORD;
BEGIN
  -- Check for duplicates
  SELECT * INTO dup_check 
  FROM check_duplicate_nomination(NEW.poll_id, NEW.title, 0.5::REAL);
  
  IF dup_check.is_duplicate AND dup_check.existing_nomination_id IS NOT NULL THEN
    RAISE EXCEPTION 'A similar nomination already exists: "%". Please vote for it instead!', 
      dup_check.existing_title
      USING HINT = 'Similarity score: ' || dup_check.similarity_score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER check_nomination_duplicate
  BEFORE INSERT ON poll_nominations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_nomination();

-- Add helpful comment
COMMENT ON FUNCTION check_duplicate_nomination IS 
  'Checks if a nomination title is too similar to existing nominations for the same poll. 
   Uses PostgreSQL trigram similarity (pg_trgm) for fuzzy matching.
   Returns REAL type to match similarity() function return type.
   Threshold of 0.4 catches variations like "The Ship Inn" vs "Ship Inn"';
