-- Add deletion request fields to stories
-- Authors can request deletion, admins approve/reject

ALTER TABLE stories ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index for finding deletion requests
CREATE INDEX IF NOT EXISTS idx_stories_deletion_requested 
  ON stories(deletion_requested) 
  WHERE deletion_requested = TRUE AND soft_deleted = FALSE;
