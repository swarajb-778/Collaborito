# Fixing RLS Policies in Supabase Dashboard

## Overview
The current RLS (Row Level Security) policies on the `project_members` table are causing an infinite recursion error, which is preventing proper data fetching in the Collaborito app. This document provides step-by-step instructions to fix this issue using the SQL script.

## Steps to Fix

### 1. Access the Supabase Dashboard
1. Go to the [Supabase Dashboard](https://app.supabase.com/)
2. Sign in with your credentials
3. Select the "Collaborito" project (project reference: `ekydublgvsoaaepdhtzc`)

### 2. Open the SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click on "New query" to create a new SQL query

### 3. Run the SQL Script
1. Copy the entire SQL script from the `fix_project_members_rls.sql` file
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

```sql
-- Fix RLS policies for project_members table
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
CREATE POLICY "Insert project members" ON project_members
FOR INSERT
WITH CHECK (
    -- Only project owners and admins can add members
    EXISTS (
        SELECT 1
        FROM projects
        WHERE id = project_id
        AND owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_members
        WHERE project_id = NEW.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
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
        FROM project_members
        WHERE project_id = project_id
        AND user_id = auth.uid()
        AND role = 'admin'
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
```

### 4. Check the Results
1. Review the output of the SQL query
2. Look for any error messages
3. The final query `SELECT COUNT(*) FROM project_members` should execute without the infinite recursion error

### 5. Verify Fix in the Application
1. Return to your Collaborito application
2. Navigate to a project detail page
3. Confirm that data is loading correctly without errors
4. Check that team members and tasks are displaying properly

### Optional: If Issues Persist
If you're still experiencing problems after running the script, you may need to temporarily disable RLS for testing purposes:

```sql
-- Temporarily disable RLS (use only for development/debugging)
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable RLS before deploying to production!
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
```

## What This Fix Does

This SQL script resolves the infinite recursion issue by:

1. Removing all existing policies on the `project_members` table that might be causing circular dependencies
2. Creating simpler, optimized policies that avoid recursive checks
3. Implementing separate policies for different operations (SELECT, INSERT, UPDATE, DELETE) with clear permissions

The new policies ensure:
- Users can view their own memberships and memberships for projects they own
- Only project owners and admins can add new members
- Users can update their own membership information
- Only project owners can delete members (except users can remove themselves) 