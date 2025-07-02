-- Migration: Add missing oauth_provider column to profiles table
-- Created: 2025-07-02
-- Description: Add oauth_provider column that was referenced in code but missing from database

-- Add the oauth_provider column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT 'email';

-- Update existing records to have a default value
UPDATE public.profiles 
SET oauth_provider = 'email' 
WHERE oauth_provider IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.oauth_provider IS 'OAuth provider used for authentication (email, google, linkedin, etc.)'; 