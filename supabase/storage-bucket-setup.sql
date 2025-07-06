-- Supabase Storage Bucket Setup for Profile Pictures
-- This file sets up the avatars bucket and security policies

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Policy: Users can upload their own avatars
-- File path format: avatars/{user_id}/{filename}
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Anyone can view avatars (for public profile display)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
  );

-- Create a function to get the public URL for an avatar
CREATE OR REPLACE FUNCTION get_avatar_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT CASE 
      WHEN bucket_name = 'avatars' THEN
        'https://' || (SELECT project_ref FROM pg_stat_ssl WHERE ssl = true LIMIT 1) || '.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path
      ELSE
        NULL
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old avatar files when user uploads new one
CREATE OR REPLACE FUNCTION cleanup_old_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- When avatar_url is updated in profiles table, clean up old files
  IF OLD.avatar_url IS NOT NULL AND NEW.avatar_url IS DIFFERENT FROM OLD.avatar_url THEN
    -- Extract file path from old URL and delete from storage
    -- This will be handled by the application layer for better error handling
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 