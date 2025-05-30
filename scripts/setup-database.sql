-- Database Setup Script for Collaborito App
-- This script ensures all required tables exist and are populated with initial data

-- Enable the UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update profiles table with onboarding fields
DO $$
BEGIN
  -- Add onboarding fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
    ALTER TABLE profiles ADD COLUMN job_title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_image_path') THEN
    ALTER TABLE profiles ADD COLUMN profile_image_path TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_step') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_step TEXT CHECK (onboarding_step IN ('profile', 'interests', 'goals', 'project_details', 'skills', 'completed'));
  END IF;
END $$;

-- Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- Create user_interests junction table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  UNIQUE (user_id, interest_id)
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- Create user_skills junction table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_offering BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, skill_id)
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas')),
  is_active BOOLEAN DEFAULT TRUE,
  details JSONB,
  UNIQUE (user_id, goal_type, is_active)
);

-- Create project_skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance TEXT CHECK (importance IN ('nice_to_have', 'important', 'critical')),
  UNIQUE (project_id, skill_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Interests are viewable by everyone
DROP POLICY IF EXISTS "Interests are viewable by everyone" ON interests;
CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);

-- Skills are viewable by everyone
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);

-- User interests policies
DROP POLICY IF EXISTS "User interests are viewable by everyone" ON user_interests;
CREATE POLICY "User interests are viewable by everyone" ON user_interests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own interests" ON user_interests;
CREATE POLICY "Users can insert their own interests" ON user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;
CREATE POLICY "Users can update their own interests" ON user_interests
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interests" ON user_interests;
CREATE POLICY "Users can delete their own interests" ON user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- User skills policies
DROP POLICY IF EXISTS "User skills are viewable by everyone" ON user_skills;
CREATE POLICY "User skills are viewable by everyone" ON user_skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
CREATE POLICY "Users can insert their own skills" ON user_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
CREATE POLICY "Users can update their own skills" ON user_skills
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON user_skills;
CREATE POLICY "Users can delete their own skills" ON user_skills
  FOR DELETE USING (auth.uid() = user_id);

-- User goals policies
DROP POLICY IF EXISTS "User goals are viewable by everyone" ON user_goals;
CREATE POLICY "User goals are viewable by everyone" ON user_goals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
CREATE POLICY "Users can insert their own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
CREATE POLICY "Users can update their own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;
CREATE POLICY "Users can delete their own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Insert initial interests data
INSERT INTO interests (name, category) VALUES
  ('Art', 'Creative'),
  ('Artificial Intelligence & Machine Learning', 'Technology'),
  ('Biotechnology', 'Science'),
  ('Business', 'Business'),
  ('Books', 'Entertainment'),
  ('Climate Change', 'Environmental'),
  ('Civic Engagement', 'Social'),
  ('Dancing', 'Entertainment'),
  ('Data Science', 'Technology'),
  ('Education', 'Education'),
  ('Entrepreneurship', 'Business'),
  ('Fashion', 'Creative'),
  ('Fitness', 'Health'),
  ('Food', 'Lifestyle'),
  ('Gaming', 'Entertainment'),
  ('Health & Wellness', 'Health'),
  ('Investing & Finance', 'Business'),
  ('Marketing', 'Business'),
  ('Movies', 'Entertainment'),
  ('Music', 'Entertainment'),
  ('Parenting', 'Lifestyle'),
  ('Pets', 'Lifestyle'),
  ('Product Design', 'Creative'),
  ('Reading', 'Entertainment'),
  ('Real Estate', 'Business'),
  ('Robotics', 'Technology'),
  ('Science & Tech', 'Technology'),
  ('Social Impact', 'Social'),
  ('Sports', 'Entertainment'),
  ('Travel', 'Lifestyle'),
  ('Writing', 'Creative'),
  ('Other', 'Other')
ON CONFLICT (name) DO NOTHING;

-- Insert initial skills data
INSERT INTO skills (name, category) VALUES
  ('Accounting', 'Business'),
  ('Artificial Intelligence & Machine Learning', 'Technology'),
  ('Biotechnology', 'Science'),
  ('Business Development', 'Business'),
  ('Content Creation', 'Marketing'),
  ('Counseling & Therapy', 'Health'),
  ('Data Analysis', 'Technology'),
  ('DevOps', 'Technology'),
  ('Finance', 'Business'),
  ('Fundraising', 'Business'),
  ('Graphic Design', 'Creative'),
  ('Legal', 'Professional'),
  ('Manufacturing', 'Industrial'),
  ('Marketing', 'Business'),
  ('Policy', 'Government'),
  ('Product Management', 'Business'),
  ('Project Management', 'Business'),
  ('Public Relations', 'Marketing'),
  ('Research', 'Science'),
  ('Sales', 'Business'),
  ('Software Development (Backend)', 'Technology'),
  ('Software Development (Frontend)', 'Technology'),
  ('UI/UX Design', 'Creative'),
  ('Other', 'Other')
ON CONFLICT (name) DO NOTHING; 