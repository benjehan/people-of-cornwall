-- Lost Cornwall: Historical photos where users identify what's changed
-- Where Is This: Mystery photos for location guessing

-- ================================================
-- LOST CORNWALL TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS lost_cornwall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  year_taken TEXT,  -- e.g., "1920s", "circa 1950", "1897"
  location_name TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  source_credit TEXT,  -- "Courtesy of Cornwall Record Office"
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost Cornwall memories/comments
CREATE TABLE IF NOT EXISTS lost_cornwall_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_cornwall_id UUID NOT NULL REFERENCES lost_cornwall(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,  -- Admin can feature best memories
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- WHERE IS THIS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS where_is_this (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  hint TEXT,  -- Optional hint
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  
  -- The answer (hidden from users)
  answer_location_name TEXT NOT NULL,
  answer_description TEXT,  -- What makes this place special
  answer_lat DECIMAL(10, 8),
  answer_lng DECIMAL(11, 8),
  
  -- State
  is_active BOOLEAN DEFAULT FALSE,  -- Only one active at a time
  is_revealed BOOLEAN DEFAULT FALSE,  -- When answer is shown
  revealed_at TIMESTAMPTZ,
  
  -- Stats
  total_guesses INTEGER DEFAULT 0,
  correct_guesses INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User guesses for Where Is This
CREATE TABLE IF NOT EXISTS where_is_this_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES where_is_this(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Nullable for anonymous guesses
  guest_name TEXT,  -- For anonymous guesses
  guess_location_name TEXT NOT NULL,
  guess_lat DECIMAL(10, 8),
  guess_lng DECIMAL(11, 8),
  is_correct BOOLEAN DEFAULT FALSE,  -- Admin marks correct
  distance_km DECIMAL(10, 2),  -- How far from actual answer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent same user guessing twice
  UNIQUE(challenge_id, user_id)
);

-- ================================================
-- ADD LOCATION TO POLLS FOR MAP
-- ================================================

ALTER TABLE polls ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE polls ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- ================================================
-- RLS POLICIES
-- ================================================

ALTER TABLE lost_cornwall ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_cornwall_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE where_is_this ENABLE ROW LEVEL SECURITY;
ALTER TABLE where_is_this_guesses ENABLE ROW LEVEL SECURITY;

-- Lost Cornwall
DROP POLICY IF EXISTS "Anyone can view published lost cornwall" ON lost_cornwall;
CREATE POLICY "Anyone can view published lost cornwall"
  ON lost_cornwall FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admins can manage lost cornwall" ON lost_cornwall;
CREATE POLICY "Admins can manage lost cornwall"
  ON lost_cornwall FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Lost Cornwall Memories
DROP POLICY IF EXISTS "Anyone can view memories" ON lost_cornwall_memories;
CREATE POLICY "Anyone can view memories"
  ON lost_cornwall_memories FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can add memories" ON lost_cornwall_memories;
CREATE POLICY "Authenticated users can add memories"
  ON lost_cornwall_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can edit own memories" ON lost_cornwall_memories;
CREATE POLICY "Users can edit own memories"
  ON lost_cornwall_memories FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage memories" ON lost_cornwall_memories;
CREATE POLICY "Admins can manage memories"
  ON lost_cornwall_memories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Where Is This
DROP POLICY IF EXISTS "Anyone can view where is this" ON where_is_this;
CREATE POLICY "Anyone can view where is this"
  ON where_is_this FOR SELECT
  USING (is_active = TRUE OR is_revealed = TRUE);

DROP POLICY IF EXISTS "Admins can manage where is this" ON where_is_this;
CREATE POLICY "Admins can manage where is this"
  ON where_is_this FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Where Is This Guesses
DROP POLICY IF EXISTS "Anyone can view guesses after reveal" ON where_is_this_guesses;
CREATE POLICY "Anyone can view guesses after reveal"
  ON where_is_this_guesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM where_is_this 
      WHERE where_is_this.id = challenge_id 
      AND where_is_this.is_revealed = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can see own guesses" ON where_is_this_guesses;
CREATE POLICY "Users can see own guesses"
  ON where_is_this_guesses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can submit guesses" ON where_is_this_guesses;
CREATE POLICY "Authenticated can submit guesses"
  ON where_is_this_guesses FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can manage guesses" ON where_is_this_guesses;
CREATE POLICY "Admins can manage guesses"
  ON where_is_this_guesses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_lost_cornwall_published ON lost_cornwall(is_published);
CREATE INDEX IF NOT EXISTS idx_lost_cornwall_location ON lost_cornwall(location_lat, location_lng) WHERE location_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_where_is_this_active ON where_is_this(is_active);
CREATE INDEX IF NOT EXISTS idx_where_is_this_guesses_challenge ON where_is_this_guesses(challenge_id);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Calculate distance between two points (Haversine formula)
DROP FUNCTION IF EXISTS calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL);
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371;  -- Earth radius in km
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
