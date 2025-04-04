-- Collaborito Database Security Policies
-- Part 3: Row Level Security (RLS) Policies

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