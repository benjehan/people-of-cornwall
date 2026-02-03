-- Add moderator role to user_role enum
-- Run this migration in your Supabase SQL Editor

-- Step 1: Add 'moderator' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';

-- Step 2: Update any existing moderators (if you want to set specific users as moderators)
-- Example: UPDATE users SET role = 'moderator' WHERE email = 'moderator@example.com';

-- Note: This migration adds the 'moderator' role between 'user' and 'admin'
-- Moderators have permissions to:
-- - Approve/reject stories, photos, comments, and poll nominations
-- - Flag inappropriate content for admin review
-- - Edit community content (titles, descriptions, fix typos)
-- - Manage photo identifications

COMMENT ON TYPE user_role IS 'User roles: user (default), moderator (community helper), admin (full access)';
