# Supabase Backend Setup for Collaborito

This directory contains SQL migration files to set up the Supabase backend for the Collaborito application.

## Database Schema

The database schema includes the following tables:

- `profiles` - User profiles with LinkedIn information
- `projects` - Project details and metadata
- `project_members` - Tracks project membership and roles
- `invitations` - Manages pending project invitations
- `messages` - Stores project chat messages
- `tasks` - Manages project tasks and assignments
- `files` - Tracks uploaded files and their metadata
- `device_tokens` - Stores push notification tokens
- `notifications` - Stores in-app notifications
- `ai_chat_history` - Logs AI assistant interactions

## Setup Instructions

### 1. Supabase Project Setup

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Note your project URL and anon key (these are used in your `.env` file)

### 2. Database Setup

#### Option 1: Using the SQL Editor (recommended for initial setup)

For first-time setup, it's best to run the SQL script in separate parts to avoid dependency issues:

1. Create a new project on Supabase and note down the project URL and anon key
2. Go to the SQL Editor
3. Run the script in this order:
   ```
   -- First run just the schema creation part (tables only)
   -- Lines 1-140 in complete_setup.sql

   -- Then run the triggers and functions
   -- Lines 141-250 in complete_setup.sql

   -- Finally run the RLS policies
   -- Lines 251-end in complete_setup.sql
   ```

This approach prevents errors with column references in RLS policies before tables are fully created.

#### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push
```

### 3. Storage Buckets

You'll need to create the following storage buckets in Supabase:

1. Navigate to the Storage section in your Supabase dashboard
2. Create the following buckets:
   - `avatars` - For user profile pictures
   - `project-files` - For files shared in projects
   - `project-covers` - For project cover images

### 4. Enable Auth Providers

For LinkedIn OAuth:

1. Go to the Authentication > Providers section in Supabase
2. Enable LinkedIn auth
3. Configure the LinkedIn OAuth provider with your credentials
4. Set the redirect URL to `YOUR_APP_SCHEME://auth/callback`

### 5. Edge Functions (For Claude AI Integration)

1. Navigate to the Edge Functions section in Supabase
2. Create a new function called `claude-ai`
3. Implement the Claude AI integration using the Anthropic Claude API

## Row Level Security (RLS) Policies

The setup includes comprehensive Row Level Security (RLS) policies that:

- Ensure users can only access their own data
- Control project access based on membership
- Enforce appropriate permissions for owners, admins, and members
- Allow owners to manage project settings
- Permit members to send messages and create tasks
- Restrict file and task management based on roles

## Triggers and Functions

The setup includes triggers and functions to:

- Automatically create a profile when a user signs up
- Process pending invitations when a user joins
- Generate notifications for various events
- Update timestamps when records are modified

## Troubleshooting

If you encounter issues with the SQL script:

1. Try running it in smaller portions
2. Check for error messages in the SQL output
3. Verify that the Supabase project has the necessary extensions enabled
4. Ensure you have proper permissions for your Supabase project 