# Sport & Clubs Database Setup

The Sport & Clubs section requires the following database tables to be created in Supabase.

## Required Tables

### 1. `sport_clubs` (Main Photo Table)

```sql
CREATE TABLE sport_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  club_name TEXT,
  sport_type TEXT,
  team_name TEXT,
  year_taken TEXT,
  season TEXT,
  location_name TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  source_credit TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Indexes for better query performance
CREATE INDEX idx_sport_clubs_published ON sport_clubs(is_published);
CREATE INDEX idx_sport_clubs_club_name ON sport_clubs(club_name);
CREATE INDEX idx_sport_clubs_sport_type ON sport_clubs(sport_type);
CREATE INDEX idx_sport_clubs_location ON sport_clubs(location_name);
CREATE INDEX idx_sport_clubs_year ON sport_clubs(year_taken);
CREATE INDEX idx_sport_clubs_created_at ON sport_clubs(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE sport_clubs ENABLE ROW LEVEL SECURITY;

-- Public can view published photos
CREATE POLICY "Public can view published sport club photos"
  ON sport_clubs FOR SELECT
  USING (is_published = true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert sport club photos"
  ON sport_clubs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update own sport club photos"
  ON sport_clubs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can update any photo
CREATE POLICY "Admins can update any sport club photo"
  ON sport_clubs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### 2. `sport_clubs_images` (Additional Images Table)

```sql
CREATE TABLE sport_clubs_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_club_id UUID NOT NULL REFERENCES sport_clubs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sport_clubs_images_sport_club_id ON sport_clubs_images(sport_club_id);
CREATE INDEX idx_sport_clubs_images_display_order ON sport_clubs_images(display_order);

-- RLS
ALTER TABLE sport_clubs_images ENABLE ROW LEVEL SECURITY;

-- Public can view images for published photos
CREATE POLICY "Public can view images for published photos"
  ON sport_clubs_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sport_clubs
      WHERE sport_clubs.id = sport_club_id
      AND sport_clubs.is_published = true
    )
  );

-- Authenticated users can insert images
CREATE POLICY "Authenticated users can insert images"
  ON sport_clubs_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sport_clubs
      WHERE sport_clubs.id = sport_club_id
      AND sport_clubs.user_id = auth.uid()
    )
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON sport_clubs_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sport_clubs
      WHERE sport_clubs.id = sport_club_id
      AND sport_clubs.user_id = auth.uid()
    )
  );
```

### 3. Integration with Existing `likes` Table

The Sport & Clubs section uses the existing `likes` table with `content_type = 'sport_club'`.

Make sure the `likes` table supports the `sport_club` content type:

```sql
-- If you need to add a constraint for content types:
ALTER TABLE likes
  DROP CONSTRAINT IF EXISTS likes_content_type_check;

ALTER TABLE likes
  ADD CONSTRAINT likes_content_type_check
  CHECK (content_type IN ('story', 'comment', 'lost_cornwall', 'school_photo', 'sport_club'));
```

## Storage Buckets

Create a storage bucket for sport & clubs photos:

```sql
-- In Supabase Storage, create a bucket named 'sport-clubs'
-- Set it to public for read access
-- Configure appropriate upload policies
```

## Trigger for Updating `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sport_clubs_updated_at
  BEFORE UPDATE ON sport_clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Sample Sport Types

Consider pre-populating common sport types for better filtering:

- Football
- Rugby
- Cricket
- Sailing
- Rowing
- Athletics
- Hockey
- Tennis
- Surfing
- Golf
- Netball
- Swimming
- Cycling
- Boxing
- Wrestling

## Sample Data (Optional)

For testing, you can insert sample data:

```sql
INSERT INTO sport_clubs (
  title,
  description,
  image_url,
  club_name,
  sport_type,
  year_taken,
  location_name,
  is_published,
  user_id
) VALUES (
  'Camborne RFC 1970s',
  'The first XV squad from the 1970-71 season',
  'https://example.com/image.jpg',
  'Camborne RFC',
  'Rugby',
  '1970s',
  'Camborne',
  true,
  'YOUR_USER_ID_HERE'
);
```

## Notes

- The `year_taken` field is TEXT to support formats like "1970s", "circa 1950", "1960-1965", etc.
- The `season` field can store "1970/71", "2023 Summer", etc.
- All images should be processed and stored in Supabase Storage before inserting URLs
- Consider adding a moderation queue by keeping `is_published = false` by default
- The section supports multiple images per entry via the `sport_clubs_images` table
- Image carousel and before/after slider features are built into the UI

## TypeScript Types

Add these types to `/src/types/supabase.ts` or create a separate types file:

```typescript
export interface SportClubPhoto {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  club_name: string | null;
  sport_type: string | null;
  team_name: string | null;
  year_taken: string | null;
  season: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  source_credit: string | null;
  view_count: number;
  like_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SportClubImage {
  id: string;
  sport_club_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}
```

## Migration File

You can create a Supabase migration file with all these changes:

```bash
# Create migration
supabase migration new add_sport_clubs

# Add the SQL from above to the generated migration file
# Then apply the migration
supabase db push
```
