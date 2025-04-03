# Supabase Storage Configuration for Collaborito

This document outlines the storage setup required for the Collaborito application in Supabase.

## Storage Buckets

Create the following storage buckets in your Supabase project:

### 1. avatars

Used for user profile pictures.

**Configuration:**
- Public/Private: Private
- Security: Authenticated users can upload and read their own files
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

**Row Level Security (RLS) Policies:**

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.uid() = (storage.foldername(name))[1]::uuid AND
    bucket_id = 'avatars'
  );

-- Allow users to update/delete their own avatars
CREATE POLICY "Users can update/delete their own avatars" ON storage.objects
  FOR UPDATE USING (
    auth.uid() = (storage.foldername(name))[1]::uuid AND
    bucket_id = 'avatars'
  );

-- Allow users to read any avatar (for profile display)
CREATE POLICY "Anyone can read avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
  );
```

### 2. project-files

Used for files shared within projects.

**Configuration:**
- Public/Private: Private
- Security: Project members can upload and read project files
- File size limit: 50MB
- Allowed MIME types: Various (document, image, audio, video)

**Row Level Security (RLS) Policies:**

```sql
-- Allow project members to upload files to projects they're part of
CREATE POLICY "Project members can upload project files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND
    (
      -- Extract project ID from path (project-id/user-id/filename)
      EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE 
          p.id = (storage.foldername(name))[1]::uuid AND
          (
            p.owner_id = auth.uid() OR
            (pm.user_id = auth.uid() AND pm.project_id = (storage.foldername(name))[1]::uuid)
          )
      )
    )
  );

-- Allow project members to view files from projects they're part of
CREATE POLICY "Project members can view project files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND
    (
      -- Extract project ID from path (project-id/user-id/filename)
      EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE 
          p.id = (storage.foldername(name))[1]::uuid AND
          (
            p.owner_id = auth.uid() OR
            (pm.user_id = auth.uid() AND pm.project_id = (storage.foldername(name))[1]::uuid)
          )
      )
    )
  );

-- Allow users to delete files they uploaded
CREATE POLICY "Users can delete files they uploaded" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[2]::uuid = auth.uid()
  );
```

### 3. project-covers

Used for project cover images.

**Configuration:**
- Public/Private: Public
- Security: Project owners and admins can upload, anyone can view
- File size limit: 10MB
- Allowed MIME types: image/jpeg, image/png, image/webp

**Row Level Security (RLS) Policies:**

```sql
-- Allow project owners and admins to upload project covers
CREATE POLICY "Project owners and admins can upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-covers' AND
    (
      -- Extract project ID from path (project-id/filename)
      EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
        WHERE 
          p.id = (storage.foldername(name))[1]::uuid AND
          (
            p.owner_id = auth.uid() OR
            (pm.role = 'admin' AND pm.project_id = (storage.foldername(name))[1]::uuid)
          )
      )
    )
  );

-- Anyone can view project covers
CREATE POLICY "Anyone can view project covers" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-covers'
  );

-- Project owners and admins can update/delete project covers
CREATE POLICY "Project owners and admins can update/delete covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-covers' AND
    (
      -- Extract project ID from path (project-id/filename)
      EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
        WHERE 
          p.id = (storage.foldername(name))[1]::uuid AND
          (
            p.owner_id = auth.uid() OR
            (pm.role = 'admin' AND pm.project_id = (storage.foldername(name))[1]::uuid)
          )
      )
    )
  );
```

## File Path Structure

When uploading files to the storage buckets, use the following path structures:

### avatars
```
{user_id}/{filename}
```
Example: `550e8400-e29b-41d4-a716-446655440000/profile.jpg`

### project-files
```
{project_id}/{user_id}/{filename}
```
Example: `550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/document.pdf`

### project-covers
```
{project_id}/{filename}
```
Example: `550e8400-e29b-41d4-a716-446655440000/cover.jpg`

## Implementation Notes

- When uploading files, always generate a unique filename to avoid collisions
- Use a consistent file naming convention (e.g., `{timestamp}-{original_filename}`)
- Always validate file types, sizes, and content on the client side before uploading
- When displaying user-uploaded images, consider using Supabase's transformation parameters to resize and optimize them
- For file downloads, generate short-lived signed URLs for security 