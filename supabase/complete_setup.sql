-- Complete Supabase Setup Script for Collaborito App

-- Part 1: Schema Setup
-- Enable the UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  linkedin_id TEXT,
  headline TEXT,
  bio TEXT,
  skills TEXT[],
  interests TEXT[]
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

-- Create project_members table to track who has access to which projects
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE (project_id, user_id)
);

-- Create invitations table for pending project invites
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

-- Create messages table for project chat
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

-- Create tasks table for project task management
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

-- Create files table for file sharing
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

-- Create notifications table for push notifications
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

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('project_invite', 'message', 'task_assigned', 'task_completed', 'member_joined')),
  content JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  related_item_id UUID -- Generic reference to a message, task, etc.
);

-- Create AI chat history table for storing AI interactions
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_type TEXT CHECK (context_type IN ('general', 'project', 'task'))
);

-- Create Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_members_updated_at
BEFORE UPDATE ON project_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON invitations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_tokens_updated_at
BEFORE UPDATE ON device_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Part 2: User Management Triggers
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

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle invitations when a new user signs up
CREATE OR REPLACE FUNCTION handle_user_invitations() 
RETURNS TRIGGER AS $$
DECLARE
  invitation RECORD;
BEGIN
  -- Find any pending invitations for this user's email
  FOR invitation IN 
    SELECT * FROM public.invitations 
    WHERE invitee_email = (SELECT email FROM auth.users WHERE id = NEW.id)
    AND status = 'pending'
  LOOP
    -- Add the user to the project
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (invitation.project_id, NEW.id, invitation.role);
    
    -- Update invitation status
    UPDATE public.invitations 
    SET status = 'accepted' 
    WHERE id = invitation.id;
    
    -- Create notification for project owner
    INSERT INTO public.notifications (
      user_id, 
      type, 
      content, 
      related_project_id
    )
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

-- Trigger to handle invitations when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created_handle_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_user_invitations();


-- Part 3: Row Level Security Policies
-- Enable Row Level Security on all tables
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

-- Profiles: Users can read any profile, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects: Only project members can see projects, owners and admins can update
CREATE POLICY "Project members can view projects" ON projects
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = id AND user_id = auth.uid()
    )
    -- Only include public projects if the is_public column exists
    OR (CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'projects' AND column_name = 'is_public'
        ) 
        THEN is_public ELSE false END)
  );

CREATE POLICY "Project owners can insert projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners and admins can update projects" ON projects
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Project Members: Owners and admins can manage members
CREATE POLICY "Project members can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.id = project_id 
      AND (
        pm.user_id = auth.uid() OR
        p.owner_id = auth.uid() 
        -- Only include public projects if the is_public column exists
        OR (CASE WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'is_public'
            ) 
            THEN p.is_public ELSE false END)
      )
    )
  );

CREATE POLICY "Project owners and admins can insert members" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    ) OR
    -- Users can add themselves if accepting an invitation
    (
      user_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM invitations
        WHERE project_id = project_id 
        AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
      )
    )
  );

CREATE POLICY "Project owners and admins can update members" ON project_members
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

CREATE POLICY "Project owners and admins can delete members" ON project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    ) OR
    -- Users can remove themselves
    user_id = auth.uid()
  );

-- Invitations: Project members can view invitations, owners and admins can manage
CREATE POLICY "Project members can view invitations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        pm.user_id = auth.uid()
      )
    ) OR
    -- Users can see their own invitations by email
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Project owners and admins can insert invitations" ON invitations
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

CREATE POLICY "Project owners, admins, and invitees can update invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    ) OR
    -- Users can update their own invitations by email
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Messages: Project members can see and send messages
CREATE POLICY "Project members can view messages" ON messages
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

CREATE POLICY "Project members can insert messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        pm.user_id = auth.uid()
      )
    ) AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Tasks: Project members can see tasks, create and update them
CREATE POLICY "Project members can view tasks" ON tasks
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

CREATE POLICY "Project members can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        pm.user_id = auth.uid()
      )
    ) AND
    created_by = auth.uid()
  );

CREATE POLICY "Project members can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        pm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Task creator and project owner/admin can delete tasks" ON tasks
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    )
  );

-- Files: Project members can view files, upload and update them
CREATE POLICY "Project members can view files" ON files
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

CREATE POLICY "Project members can insert files" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        pm.user_id = auth.uid()
      )
    ) AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "File uploaders and project owner/admin can update files" ON files
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "File uploaders and project owner/admin can delete files" ON files
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
      WHERE p.id = project_id AND (
        p.owner_id = auth.uid() OR
        (pm.role = 'admin' AND pm.user_id = auth.uid())
      )
    )
  );

-- Device Tokens: Users can manage their own device tokens
CREATE POLICY "Users can view their own device tokens" ON device_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own device tokens" ON device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own device tokens" ON device_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own device tokens" ON device_tokens
  FOR DELETE USING (user_id = auth.uid());

-- Notifications: Users can view and manage their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications for any user" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- AI Chat History: Users can manage their own AI chat history
CREATE POLICY "Users can view their own AI chat history" ON ai_chat_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI chat history" ON ai_chat_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI chat history" ON ai_chat_history
  FOR DELETE USING (user_id = auth.uid()); 