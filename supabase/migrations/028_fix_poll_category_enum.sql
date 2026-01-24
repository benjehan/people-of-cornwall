-- ================================================
-- FIX: Add missing poll_category enum values
-- ================================================
-- Some enum values may not have been added when the database was set up.
-- This migration safely adds any missing values.

-- best_joke
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_joke'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_business  
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_business'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_pub
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_pub'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_cafe
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_cafe'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_restaurant
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_restaurant'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_walk
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_walk'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_beach
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_beach'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_kindness
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_kindness'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_event
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_event'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_memory
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_memory'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_site
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_site'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_shop
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_shop'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- best_character
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'best_character'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- other
DO $$ BEGIN ALTER TYPE poll_category ADD VALUE IF NOT EXISTS 'other'; EXCEPTION WHEN duplicate_object THEN null; END $$;
