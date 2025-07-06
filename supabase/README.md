# Supabase Backend Setup for Collaborito

This directory contains the Supabase configuration for the Collaborito application, including database migrations, and authentication setup.

## Database Schema

The database schema includes tables for:
- User management (`profiles`, `user_interests`, `user_skills`, `user_goals`)
- Project collaboration (`projects`, `project_members`, `invitations`)
- Communication (`messages`, `notifications`, `device_tokens`)
- Task management (`tasks`)
- File sharing (`files`)
- AI integration (`ai_chat_history`)

## Local Development Setup

To set up the database for local development, follow these steps:

### 1. Install the Supabase CLI
If you haven't already, install the Supabase CLI:
```bash
npm install -g supabase
```

### 2. Start Supabase Services
Navigate to the root of the project and start the local Supabase services:
```bash
supabase start
```
This will spin up a local instance of the database, authentication, and storage.

### 3. Apply Migrations
Once the local services are running, apply all database migrations:
```bash
supabase db reset
```
This command will drop the existing local database (if any) and run all migrations from the `supabase/migrations` directory in chronological order, ensuring your local schema is up-to-date.

## Production Setup

For a production environment, you should:

### 1. Supabase Project Setup
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Note your project URL and `anon` key, and add them to your project's environment variables (`.env`).

### 2. Link Your Project and Push Migrations
Link your local Supabase project to your remote Supabase project and push the migrations:
```bash
# Link your project (only needs to be done once)
supabase link --project-ref <your-project-ref>

# Push the migrations to your remote database
supabase db push
```

### 3. Storage Buckets
You will need to create the following storage buckets in your Supabase project dashboard:
- `avatars`: For user profile pictures
- `project-files`: For files shared within projects
- `project-covers`: For project cover images

See `supabase/storage.md` for details on the required RLS policies for each bucket.

### 4. Enable Auth Providers
For features like LinkedIn OAuth, you must enable the respective providers in the Supabase dashboard under **Authentication > Providers**.

### 5. Edge Functions
The project uses Edge Functions for AI integration and other backend logic. Deploy them using the CLI:
```bash
supabase functions deploy --all
```

## Migrations
All schema changes, function updates, and data seeding are handled through migration files located in the `supabase/migrations` directory. This ensures that the database schema is version-controlled and can be applied consistently across all environments.

- **Initial Schema**: The first migration file (`*_consolidate_initial_schema.sql`) sets up the entire initial database schema.
- **Performance Optimizations**: The second migration (`*_apply_performance_optimizations.sql`) applies indexes and other optimizations.

## Row Level Security (RLS)
The setup includes comprehensive RLS policies to ensure data privacy and security. These policies control access to data based on user roles and project membership.

## Triggers and Functions
The database uses triggers and functions to automate tasks such as:
- Creating a user profile upon sign-up
- Handling project invitations
- Updating timestamps on record changes

## Troubleshooting

If you encounter issues with the SQL script:

1. Try running it in smaller portions
2. Check for error messages in the SQL output
3. Verify that the Supabase project has the necessary extensions enabled
4. Ensure you have proper permissions for your Supabase project 