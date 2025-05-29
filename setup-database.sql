-- Collaborito Database Setup - Missing Onboarding Tables
-- Run these commands in your Supabase SQL Editor

-- 1. Update profiles table with onboarding fields
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_path TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT;

-- 2. Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- 3. Create user_interests junction table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  UNIQUE (user_id, interest_id)
);

-- 4. Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- 5. Create user_skills junction table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_offering BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, skill_id)
);

-- 6. Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (
    goal_type IN ('find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas')
  ),
  is_active BOOLEAN DEFAULT TRUE,
  details JSONB
);

-- 7. Enable Row Level Security
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies

-- Interests policies (public read access)
DROP POLICY IF EXISTS "Interests are viewable by everyone" ON interests;
CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);

-- User interests policies
DROP POLICY IF EXISTS "User interests are viewable by everyone" ON user_interests;
DROP POLICY IF EXISTS "Users can insert their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON user_interests;

CREATE POLICY "User interests are viewable by everyone" ON user_interests FOR SELECT USING (true);
CREATE POLICY "Users can insert their own interests" ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests" ON user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interests" ON user_interests FOR DELETE USING (auth.uid() = user_id);

-- Skills policies (public read access)
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);

-- User skills policies
DROP POLICY IF EXISTS "User skills are viewable by everyone" ON user_skills;
DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can delete their own skills" ON user_skills;

CREATE POLICY "User skills are viewable by everyone" ON user_skills FOR SELECT USING (true);
CREATE POLICY "Users can insert their own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- User goals policies
DROP POLICY IF EXISTS "User goals are viewable by everyone" ON user_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;

CREATE POLICY "User goals are viewable by everyone" ON user_goals FOR SELECT USING (true);
CREATE POLICY "Users can insert their own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON user_goals FOR DELETE USING (auth.uid() = user_id);

-- 9. Insert initial interests data
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

-- 10. Insert initial skills data
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