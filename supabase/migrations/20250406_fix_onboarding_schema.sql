-- Fix Onboarding Schema Issues
-- Migration: 20250406_fix_onboarding_schema.sql

-- Ensure the profiles table has all necessary fields for onboarding
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'profile' CHECK (
    onboarding_step IN ('profile', 'interests', 'goals', 'project_details', 'skills', 'completed')
  ),
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step ON profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user_profile() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile with default onboarding state
  INSERT INTO public.profiles (
    id, 
    email,
    first_name,
    last_name,
    full_name,
    username,
    avatar_url,
    oauth_provider,
    onboarding_step,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.app_metadata->>'provider', 'email'),
    'profile',
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      first_name = COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', first_name),
      last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', last_name),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      username = COALESCE(NEW.raw_user_meta_data->>'username', username),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
      oauth_provider = COALESCE(NEW.app_metadata->>'provider', oauth_provider),
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- Update existing profiles to have proper onboarding defaults
UPDATE profiles 
SET 
  onboarding_step = COALESCE(onboarding_step, 'profile'),
  onboarding_completed = COALESCE(onboarding_completed, false),
  oauth_provider = COALESCE(oauth_provider, 'email'),
  updated_at = NOW()
WHERE onboarding_step IS NULL OR onboarding_completed IS NULL; 