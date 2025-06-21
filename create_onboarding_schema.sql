-- Onboarding Database Schema Updates
-- Add fields and tables needed for the onboarding flow

-- Update the profiles table with additional fields needed for onboarding
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_path TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT CHECK (
    onboarding_step IN ('profile', 'interests', 'goals', 'project_details', 'skills', 'completed')
  );

-- Create a user_interests table to store user interests with many-to-many relationship
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- Junction table for user interests
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  UNIQUE (user_id, interest_id)
);

-- Create skills table for a more structured approach to skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- Junction table for user skills
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_offering BOOLEAN DEFAULT TRUE, -- Whether the user is offering this skill or looking for it
  UNIQUE (user_id, skill_id)
);

-- Store user goals and pathway selections
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (
    goal_type IN ('find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas')
  ),
  is_active BOOLEAN DEFAULT TRUE,
  details JSONB, -- Store additional goal-specific details
  UNIQUE (user_id, goal_type, is_active)
);

-- Create a table for project requirements (skills needed for a project)
CREATE TABLE IF NOT EXISTS project_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance TEXT CHECK (importance IN ('nice_to_have', 'important', 'critical')),
  UNIQUE (project_id, skill_id)
);

-- Enable RLS on all tables
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Interests: Everyone can read
CREATE POLICY "Everyone can view interests" ON interests FOR SELECT USING (true);

-- User interests: Users can only see and modify their own
CREATE POLICY "Users can view own interests" ON user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interests" ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interests" ON user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interests" ON user_interests FOR DELETE USING (auth.uid() = user_id);

-- Skills: Everyone can read
CREATE POLICY "Everyone can view skills" ON skills FOR SELECT USING (true);

-- User skills: Users can only see and modify their own
CREATE POLICY "Users can view own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- User goals: Users can only see and modify their own
CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON user_goals FOR DELETE USING (auth.uid() = user_id);

-- Project skills: Users can see all, but only project owners can modify
CREATE POLICY "Everyone can view project skills" ON project_skills FOR SELECT USING (true);
CREATE POLICY "Project owners can insert project skills" ON project_skills FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.created_by = auth.uid()
  )
);
CREATE POLICY "Project owners can update project skills" ON project_skills FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.created_by = auth.uid()
  )
);
CREATE POLICY "Project owners can delete project skills" ON project_skills FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.created_by = auth.uid()
  )
);
