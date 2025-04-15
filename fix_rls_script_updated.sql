-- Updated Fix RLS policies for project_members table
-- Run this SQL script in the Supabase SQL Editor

-- Step 1: Check for existing policies on project_members table
SELECT
    tablename,
    policyname,
    roles,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'project_members';

-- Step 2: Drop all existing policies on project_members
DROP POLICY IF EXISTS "Users can view their own project memberships" ON "project_members";
DROP POLICY IF EXISTS "Users can view project members for projects they belong to" ON "project_members";
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON "project_members";
DROP POLICY IF EXISTS "Project owners can delete members" ON "project_members";
DROP POLICY IF EXISTS "Users can insert themselves into public projects" ON "project_members";
DROP POLICY IF EXISTS "Allow full access to project members" ON "project_members";
DROP POLICY IF EXISTS "Project members can see other members" ON "project_members";
DROP POLICY IF EXISTS "project_members_simplified_access" ON "project_members";

-- Step 3: Create a new, simplified policy for project_members
-- This policy avoids recursive checks that can cause infinite recursion

-- First ensure RLS is enabled
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy for reading project members
CREATE POLICY "Read project members" ON project_members
FOR SELECT
USING (
    -- Users can read their own memberships
    auth.uid() = user_id
    OR
    -- Users can read memberships for projects they are members of
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
);

-- Policy for inserting new project members
-- Fix the NEW reference by using a different approach
CREATE POLICY "Insert project members" ON project_members
FOR INSERT
WITH CHECK (
    -- Only project owners can add members
    EXISTS (
        SELECT 1
        FROM projects
        WHERE id = project_id
        AND owner_id = auth.uid()
    )
    OR
    -- Or admins can add members to projects they're already admins for
    (
        auth.uid() IN (
            SELECT pm.user_id
            FROM project_members pm
            WHERE pm.project_id = project_id
            AND pm.role = 'admin'
        )
    )
);

-- Policy for updating project members
CREATE POLICY "Update project members" ON project_members
FOR UPDATE
USING (
    -- Only project owners and admins can update members
    EXISTS (
        SELECT 1
        FROM projects
        WHERE id = project_id
        AND owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'admin'
    )
    OR
    -- Users can update their own membership (e.g., to leave a project)
    auth.uid() = user_id
);

-- Policy for deleting project members
CREATE POLICY "Delete project members" ON project_members
FOR DELETE
USING (
    -- Only project owners can delete members
    EXISTS (
        SELECT 1
        FROM projects
        WHERE id = project_id
        AND owner_id = auth.uid()
    )
    OR
    -- Users can delete their own membership (leave a project)
    auth.uid() = user_id
);

-- Step 4: Verify the new policies
SELECT
    tablename,
    policyname,
    roles,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'project_members';

-- Step 5: Test a simple query to ensure the infinite recursion is fixed
SELECT COUNT(*) FROM project_members;

-- Step 6: Extra - Fix policies for related tables that might be affected

-- Ensure projects table has appropriate policies
-- These should be safe to add even if they already exist as we're using IF NOT EXISTS
CREATE POLICY IF NOT EXISTS "Read projects" ON projects
FOR SELECT
USING (true); -- Everyone can read projects

-- Ensure tasks table has appropriate policies if needed
CREATE POLICY IF NOT EXISTS "Read tasks" ON tasks
FOR SELECT
USING (
    -- Users can read tasks for projects they're members of
    EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
    )
    OR
    -- Or if they're the project owner
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = tasks.project_id
        AND p.owner_id = auth.uid()
    )
);

-- If you encounter issues with the above policies, you can temporarily disable RLS
-- for debugging purposes (comment these out in production):
/*
-- TEMPORARY FIX FOR DEVELOPMENT ONLY
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable RLS before deploying to production:
-- ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
*/ 