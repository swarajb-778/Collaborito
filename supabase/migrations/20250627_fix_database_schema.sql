-- Fix for Database Schema Issues
-- Migration: 20250627_fix_database_schema
-- Description: Adding missing oauth_provider column and ensuring proper user creation trigger

-- Step 1: Add missing oauth_provider column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- Step 2: Create or recreate the user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      first_name,
      last_name,
      avatar_url,
      oauth_provider,
      onboarding_step,
      onboarding_completed
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
      'profile',
      false
    );
    
    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Ensure RLS policies are properly set
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate profile policies to ensure they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id); 