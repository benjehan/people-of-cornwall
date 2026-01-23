-- Add AI image generation credits tracking
-- Each user starts with 5 free credits, admins get unlimited

-- Add credits column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_image_credits INTEGER DEFAULT 5 NOT NULL;

-- Add column to track total images generated (for analytics)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_images_generated INTEGER DEFAULT 0 NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN users.ai_image_credits IS 'Remaining AI image generation credits. Default 5 for new users. Admins bypass this limit.';
COMMENT ON COLUMN users.ai_images_generated IS 'Total number of AI images this user has generated (for analytics).';
