-- Add recurring event support
-- Note: category, recurring, recurrence_pattern, and source_url were already added directly
-- This migration adds the remaining fields needed for full recurrence support

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT
    CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'fortnightly', 'monthly')),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS excluded_dates DATE[] DEFAULT '{}';

-- Index for efficient querying of recurring events
CREATE INDEX IF NOT EXISTS idx_events_recurring
  ON events(recurring)
  WHERE recurring = true;

COMMENT ON COLUMN events.category IS 'Event category (e.g., music, food, arts, sports)';
COMMENT ON COLUMN events.recurring IS 'Whether this event repeats';
COMMENT ON COLUMN events.recurrence_pattern IS 'Recurrence frequency: daily, weekly, fortnightly, monthly';
COMMENT ON COLUMN events.source_url IS 'External URL source for the event';
COMMENT ON COLUMN events.recurrence_end_date IS 'Optional end date for the recurrence series (inclusive)';
COMMENT ON COLUMN events.excluded_dates IS 'Array of dates to skip in the recurrence pattern (e.g., school holidays)';
