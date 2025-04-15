-- EMERGENCY FIX FOR PROJECT_MEMBERS INFINITE RECURSION
-- This script takes a simple but effective approach to fix the issue

-- First, temporarily disable RLS on project_members table
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on project_members that might cause issues
DROP POLICY IF EXISTS "Users can view their own project memberships" ON "project_members";
DROP POLICY IF EXISTS "Users can view project members for projects they belong to" ON "project_members";
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON "project_members";
DROP POLICY IF EXISTS "Project owners can delete members" ON "project_members";
DROP POLICY IF EXISTS "Users can insert themselves into public projects" ON "project_members";
DROP POLICY IF EXISTS "Allow full access to project members" ON "project_members";
DROP POLICY IF EXISTS "Project members can see other members" ON "project_members";
DROP POLICY IF EXISTS "project_members_simplified_access" ON "project_members";

-- Create a single, simple policy to avoid recursive checks
CREATE POLICY "project_members_access" ON project_members
FOR ALL
USING (
  -- Users can access their own memberships
  auth.uid() = user_id
  OR
  -- Project owners can access all memberships for their projects
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.owner_id = auth.uid()
  )
)
WITH CHECK (
  -- Users can modify their own memberships
  auth.uid() = user_id
  OR
  -- Project owners can modify all memberships for their projects
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.owner_id = auth.uid()
  )
);

-- Re-enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Test query to ensure infinite recursion is fixed
SELECT COUNT(*) FROM project_members; 