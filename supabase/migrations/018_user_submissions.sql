-- Allow authenticated users to submit Where Is This and Lost Cornwall content
-- Submissions require admin approval before being visible

-- ================================================
-- UPDATE WHERE IS THIS POLICIES
-- ================================================

-- Users can view their own unpublished submissions
DROP POLICY IF EXISTS "Users can view own where is this submissions" ON where_is_this;
CREATE POLICY "Users can view own where is this submissions"
  ON where_is_this FOR SELECT
  USING (auth.uid() = created_by);

-- Authenticated users can submit challenges
DROP POLICY IF EXISTS "Authenticated users can submit where is this" ON where_is_this;
CREATE POLICY "Authenticated users can submit where is this"
  ON where_is_this FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_active = FALSE);

-- ================================================
-- UPDATE LOST CORNWALL POLICIES  
-- ================================================

-- Users can view their own unpublished submissions
DROP POLICY IF EXISTS "Users can view own lost cornwall submissions" ON lost_cornwall;
CREATE POLICY "Users can view own lost cornwall submissions"
  ON lost_cornwall FOR SELECT
  USING (auth.uid() = created_by);

-- Authenticated users can submit photos
DROP POLICY IF EXISTS "Authenticated users can submit lost cornwall" ON lost_cornwall;
CREATE POLICY "Authenticated users can submit lost cornwall"
  ON lost_cornwall FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_published = FALSE);

-- ================================================
-- ADD SUBMISSION TRACKING FIELDS
-- ================================================

-- Add submission metadata to where_is_this
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS submitter_email TEXT;
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS is_pending BOOLEAN DEFAULT TRUE;
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE where_is_this ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add submission metadata to lost_cornwall
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS submitter_email TEXT;
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS is_pending BOOLEAN DEFAULT TRUE;
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS has_image_rights BOOLEAN DEFAULT FALSE;

-- Add like_count if not exists
ALTER TABLE lost_cornwall ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
