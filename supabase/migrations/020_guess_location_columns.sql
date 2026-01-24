-- Add location columns to where_is_this_guesses for distance calculation
-- This enables automatic win detection within 2 miles

-- Add guess coordinates
ALTER TABLE where_is_this_guesses ADD COLUMN IF NOT EXISTS guess_lat DECIMAL(10, 8);
ALTER TABLE where_is_this_guesses ADD COLUMN IF NOT EXISTS guess_lng DECIMAL(11, 8);

-- Add distance from correct answer (in km)
ALTER TABLE where_is_this_guesses ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 3);

-- Also ensure where_is_this has answer coordinates columns
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS answer_lat DECIMAL(10, 8);
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS answer_lng DECIMAL(11, 8);

-- Create index for faster distance-based queries
CREATE INDEX IF NOT EXISTS idx_guesses_distance ON where_is_this_guesses(distance_km);
CREATE INDEX IF NOT EXISTS idx_guesses_correct ON where_is_this_guesses(is_correct);
