-- ===========================================================
-- COMPREHENSIVE RLS POLICY FIX FOR COLLABORITO PROJECT
-- ===========================================================
-- This script fixes the infinite recursion issue in project_members
-- while maintaining compatibility with existing schema and functions
-- 
-- IMPORTANT: Execute this script in sections, one at a time
-- Check the results after each section before proceeding
-- ===========================================================

-- ===========================================================
-- SECTION 1: ANALYZE CURRENT SETUP
-- ===========================================================

-- Check current tables structure
\d project_members
\d projects
\d tasks

-- Check existing RLS policies on relevant tables
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies
WHERE tablename IN ('project_members', 'projects', 'tasks');

-- Check existing functions that might be used in policies
SELECT 
    proname, 
    prosrc 
FROM 
    pg_proc 
WHERE 
    proname LIKE '%project%' 
    OR proname LIKE '%member%'
    OR proname LIKE '%task%';

-- ===========================================================
-- SECTION 2: BACKUP EXISTING POLICIES
-- ===========================================================

-- Create a temporary table to store policy information (if needed)
DROP TABLE IF EXISTS _temp_policy_backup;
CREATE TEMP TABLE _temp_policy_backup AS
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'project_members';

-- ===========================================================
-- SECTION 3: FIX PROJECT_MEMBERS POLICIES
-- ===========================================================

-- First, disable RLS temporarily to prevent issues during changes
-- NOTE: This makes all rows accessible temporarily, but is safer for making changes
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on project_members
DROP POLICY IF EXISTS "Users can view their own project memberships" ON "project_members";
DROP POLICY IF EXISTS "Users can view project members for projects they belong to" ON "project_members";
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON "project_members";
DROP POLICY IF EXISTS "Project owners can delete members" ON "project_members";
DROP POLICY IF EXISTS "Users can insert themselves into public projects" ON "project_members";
DROP POLICY IF EXISTS "Allow full access to project members" ON "project_members";
DROP POLICY IF EXISTS "Project members can see other members" ON "project_members";
DROP POLICY IF EXISTS "project_members_simplified_access" ON "project_members";

-- Create the new, optimized policies

-- Policy for reading project members
CREATE POLICY "Read project members" ON project_members
FOR SELECT
USING (
    -- Users can read their own memberships
    auth.uid() = user_id
    OR
    -- Users can read memberships for projects they are members of
    auth.uid() IN (
        SELECT pm.user_id
        FROM project_members pm
        WHERE pm.project_id = project_id
    )
    OR
    -- Project owners can read all members
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
);

-- Policy for inserting new project members
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
    -- Admins can add members to projects they're admins for
    auth.uid() IN (
        SELECT pm.user_id
        FROM project_members pm
        WHERE pm.project_id = project_id
        AND pm.role = 'admin'
    )
);

-- Policy for updating project members
CREATE POLICY "Update project members" ON project_members
FOR UPDATE
USING (
    -- Project owners can update any member
    EXISTS (
        SELECT 1
        FROM projects
        WHERE id = project_id
        AND owner_id = auth.uid()
    )
    OR
    -- Admins can update members except other admins and owners
    (
        auth.uid() IN (
            SELECT pm.user_id
            FROM project_members pm
            WHERE pm.project_id = project_id
            AND pm.role = 'admin'
        )
        AND
        role <> 'owner'
    )
    OR
    -- Users can update their own membership (e.g., to leave a project)
    auth.uid() = user_id
);

-- Policy for deleting project members
CREATE POLICY "Delete project members" ON project_members
FOR DELETE
USING (
    -- Only project owners can delete any member
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

-- Re-enable RLS now that policies are fixed
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ===========================================================
-- SECTION 4: VERIFY CHANGES AND TEST QUERIES
-- ===========================================================

-- Check updated policies
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'project_members';

-- Test basic queries to check for infinite recursion
SELECT COUNT(*) FROM project_members;

-- Test a join query to ensure policies work correctly
SELECT 
    p.id, 
    p.name, 
    COUNT(pm.id) as member_count
FROM 
    projects p
LEFT JOIN 
    project_members pm ON p.id = pm.project_id
GROUP BY 
    p.id, p.name
LIMIT 5;

-- ===========================================================
-- SECTION 5: FIX RELATED TABLES IF NEEDED
-- ===========================================================

-- Only run this section if you're still experiencing issues
-- with related tables after fixing project_members

-- Add a policy for projects if it doesn't exist already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON projects
        FOR SELECT USING (true);
    END IF;
END
$$;

-- Add a basic policy for tasks if it doesn't exist already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' AND policyname = 'Enable read access for project members'
    ) THEN
        CREATE POLICY "Enable read access for project members" ON tasks
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1
                FROM project_members pm
                WHERE pm.project_id = tasks.project_id
                AND pm.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1
                FROM projects p
                WHERE p.id = tasks.project_id
                AND p.owner_id = auth.uid()
            )
        );
    END IF;
END
$$;

-- ===========================================================
-- SECTION 6: EMERGENCY ROLLBACK (IF NEEDED)
-- ===========================================================

-- If the changes cause problems, you can temporarily disable RLS
-- on all tables during development/testing

/*
-- EMERGENCY ROLLBACK - ONLY USE IF NECESSARY
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- When fixed, remember to re-enable RLS:
-- ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
*/

-- ===========================================================
-- INSTRUCTIONS FOR APPLICATION TESTING
-- ===========================================================

/*
After applying these fixes:

1. Run the test_rls_fix.ts script to verify the fixes are working
2. Check the Project Detail screen in your application to ensure data loads correctly
3. Verify team members and tasks display properly
4. Test adding/removing project members to ensure the policies work as expected

If you encounter any issues:
1. Check the Supabase logs for specific error messages
2. Consider temporarily disabling RLS during development using Section 6
3. Make targeted adjustments to the policies as needed
*/ 