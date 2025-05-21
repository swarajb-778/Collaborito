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

-- Add initial data for interests
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

-- Add initial data for skills
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

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON user_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all new tables
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Set RLS policies for the new tables

-- Interests are viewable by everyone
CREATE POLICY "Interests are viewable by everyone" ON interests
  FOR SELECT USING (true);

-- Skills are viewable by everyone
CREATE POLICY "Skills are viewable by everyone" ON skills
  FOR SELECT USING (true);

-- User interests can be viewed by anyone but only modified by the user
CREATE POLICY "User interests are viewable by everyone" ON user_interests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own interests" ON user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests" ON user_interests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" ON user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- User skills can be viewed by anyone but only modified by the user
CREATE POLICY "User skills are viewable by everyone" ON user_skills
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own skills" ON user_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills" ON user_skills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills" ON user_skills
  FOR DELETE USING (auth.uid() = user_id);

-- User goals can be viewed by anyone but only modified by the user
CREATE POLICY "User goals are viewable by everyone" ON user_goals
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Project skills can be viewed by project members and modified by owners/admins
CREATE POLICY "Project members can view project skills" ON project_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        pm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Project owners and admins can insert project skills" ON project_skills
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Project owners and admins can update project skills" ON project_skills
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Project owners and admins can delete project skills" ON project_skills
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    )
  ); 