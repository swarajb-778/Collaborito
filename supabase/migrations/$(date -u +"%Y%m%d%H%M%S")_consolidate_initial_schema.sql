-- =================================================================
-- Collaborito: Consolidated Initial Schema
-- Description: This single migration file sets up the entire database,
-- including the base schema, functions, triggers, RLS policies,
-- and onboarding-specific tables and data.
-- =================================================================

-- Part 1: Initial Schema Setup
-- =================================================================

-- Enable the UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  location TEXT,
  job_title TEXT,
  avatar_url TEXT,
  linkedin_id TEXT,
  headline TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step TEXT CHECK (onboarding_step IN ('profile', 'interests', 'goals', 'project_details', 'skills', 'completed'))
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  tags TEXT[]
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE (project_id, user_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token UUID DEFAULT uuid_generate_v4() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ai_generated BOOLEAN DEFAULT FALSE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  description TEXT
);

-- Create device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, token)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('project_invite', 'message', 'task_assigned', 'task_completed', 'member_joined')),
  content JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  related_item_id UUID
);

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_type TEXT CHECK (context_type IN ('general', 'project', 'task'))
);

-- Part 2: Onboarding Schema
-- =================================================================

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

-- Create project_skills table
CREATE TABLE IF NOT EXISTS project_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance TEXT CHECK (importance IN ('nice_to_have', 'important', 'critical')),
  UNIQUE (project_id, skill_id)
);

-- Part 3: Functions and Triggers
-- =================================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_members_updated_at BEFORE UPDATE ON project_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON device_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the new user function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle invitations when a new user signs up
CREATE OR REPLACE FUNCTION handle_user_invitations() 
RETURNS TRIGGER AS $$
DECLARE
  invitation RECORD;
BEGIN
  FOR invitation IN 
    SELECT * FROM public.invitations 
    WHERE invitee_email = (SELECT email FROM auth.users WHERE id = NEW.id)
    AND status = 'pending'
  LOOP
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (invitation.project_id, NEW.id, invitation.role);
    
    UPDATE public.invitations 
    SET status = 'accepted' 
    WHERE id = invitation.id;
    
    INSERT INTO public.notifications (user_id, type, content, related_project_id)
    VALUES (
      invitation.inviter_id, 
      'member_joined', 
      json_build_object(
        'user_id', NEW.id,
        'project_id', invitation.project_id,
        'message', 'A new member has joined your project'
      ),
      invitation.project_id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle invitations
CREATE OR REPLACE TRIGGER on_auth_user_created_handle_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_user_invitations();

-- Part 4: Row Level Security (RLS)
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Project members can view projects" ON projects FOR SELECT USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid()));
CREATE POLICY "Project owners can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners and admins can update projects" ON projects FOR UPDATE USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Project owners can delete projects" ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Project Members Policies
CREATE POLICY "Project members can view project members" ON project_members FOR SELECT USING (EXISTS (SELECT 1 FROM project_members pm JOIN projects p ON pm.project_id = p.id WHERE p.id = project_id AND (pm.user_id = auth.uid() OR p.owner_id = auth.uid())));
CREATE POLICY "Project owners and admins can insert members" ON project_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))) OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM invitations WHERE project_id = project_id AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending')));
CREATE POLICY "Project owners and admins can update members" ON project_members FOR UPDATE USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));
CREATE POLICY "Project owners and admins can delete members" ON project_members FOR DELETE USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))) OR user_id = auth.uid());

-- Invitations Policies
CREATE POLICY "Project members can view invitations" ON invitations FOR SELECT USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())) OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "Project owners and admins can insert invitations" ON invitations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));
CREATE POLICY "Project owners, admins, and invitees can update invitations" ON invitations FOR UPDATE USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))) OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Messages Policies
CREATE POLICY "Project members can view messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())));
CREATE POLICY "Project members can insert messages" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())) AND user_id = auth.uid());
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (user_id = auth.uid());

-- Tasks Policies
CREATE POLICY "Project members can view tasks" ON tasks FOR SELECT USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())));
CREATE POLICY "Project members can insert tasks" ON tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())) AND created_by = auth.uid());
CREATE POLICY "Project members can update tasks" ON tasks FOR UPDATE USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())));
CREATE POLICY "Task creator and project owner/admin can delete tasks" ON tasks FOR DELETE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));

-- Files Policies
CREATE POLICY "Project members can view files" ON files FOR SELECT USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())));
CREATE POLICY "Project members can insert files" ON files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())) AND uploaded_by = auth.uid());
CREATE POLICY "File uploaders and project owner/admin can update files" ON files FOR UPDATE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));
CREATE POLICY "File uploaders and project owner/admin can delete files" ON files FOR DELETE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));

-- Device Tokens Policies
CREATE POLICY "Users can view their own device tokens" ON device_tokens FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own device tokens" ON device_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own device tokens" ON device_tokens FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own device tokens" ON device_tokens FOR DELETE USING (user_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications for any user" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- AI Chat History Policies
CREATE POLICY "Users can view their own AI chat history" ON ai_chat_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own AI chat history" ON ai_chat_history FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own AI chat history" ON ai_chat_history FOR DELETE USING (user_id = auth.uid());

-- Onboarding Policies
CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "User interests are viewable by everyone" ON user_interests FOR SELECT USING (true);
CREATE POLICY "Users can insert their own interests" ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests" ON user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interests" ON user_interests FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User skills are viewable by everyone" ON user_skills FOR SELECT USING (true);
CREATE POLICY "Users can insert their own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON user_skills FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User goals are viewable by everyone" ON user_goals FOR SELECT USING (true);
CREATE POLICY "Users can insert their own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON user_goals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Project members can view project skills" ON project_skills FOR SELECT USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())));
CREATE POLICY "Project owners and admins can insert project skills" ON project_skills FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));
CREATE POLICY "Project owners and admins can update project skills" ON project_skills FOR UPDATE USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));
CREATE POLICY "Project owners and admins can delete project skills" ON project_skills FOR DELETE USING (EXISTS (SELECT 1 FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.role = 'admin' AND pm.user_id = auth.uid()))));

-- Part 5: Data Seeding
-- =================================================================

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