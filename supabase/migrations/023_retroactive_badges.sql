-- ================================================
-- RETROACTIVE BADGE AWARDS
-- Run AFTER migration 022 (enum values must be committed first)
-- ================================================

-- Location experts (already have wins)
INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'sharp_eye'::badge_type, 'Correctly identified 5 mystery locations'
FROM users WHERE COALESCE(location_wins, 0) >= 5
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'cornish_guide'::badge_type, 'Correctly identified 10 mystery locations - a true Cornish guide!'
FROM users WHERE COALESCE(location_wins, 0) >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Memory keepers
INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'memory_keeper'::badge_type, 'Shared a memory on a Lost Cornwall photo'
FROM users WHERE COALESCE(memories_count, 0) >= 1
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'historian'::badge_type, 'Shared memories on 10+ Lost Cornwall photos - a true historian!'
FROM users WHERE COALESCE(memories_count, 0) >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Social butterfly
INSERT INTO user_badges (user_id, badge_type, awarded_reason)
SELECT id, 'social_butterfly'::badge_type, 'Left 10+ comments across the platform'
FROM users WHERE COALESCE(total_comments, 0) >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;
