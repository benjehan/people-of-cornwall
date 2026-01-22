-- Storage Bucket Setup for Story Media
-- This migration creates the storage bucket and RLS policies for media uploads

-- Create the storage bucket (if it doesn't exist)
-- Note: If this fails, create the bucket manually in Supabase Dashboard:
-- Storage > New bucket > Name: "story-media" > Public: true
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-media',
  'story-media',
  true, -- Public bucket so images can be accessed
  5242880, -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- RLS Policies for storage.objects
-- Drop existing policies first (in case they exist)
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all media" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
-- File path format: {user_id}/{story_id or 'drafts'}/{timestamp}.{ext}
CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'story-media' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'story-media' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'story-media' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'story-media' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can view media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'story-media');

-- Allow admins to manage all files
CREATE POLICY "Admins can manage all media"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'story-media' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'story-media' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
