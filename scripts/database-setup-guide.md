# Database Setup Guide for Collaborito

## Issue
The app is showing missing database tables during onboarding. This guide will help you set up the required database schema.

## Required Tables
The following tables are needed for the app to function properly:
- `interests` - Available interests for users to select
- `skills` - Available skills for users to select
- `user_interests` - Junction table linking users to their interests
- `user_skills` - Junction table linking users to their skills
- `user_goals` - User goals and objectives

## Setup Instructions

### Option 1: Quick Setup (Recommended)
1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in and navigate to your project: `ekydublgvsoaaepdhtzc`

2. **Navigate to SQL Editor**
   - In the left sidebar, click "SQL Editor"
   - Click "New query"

3. **Copy and Execute the SQL**
   - Copy the entire contents of `scripts/setup-database.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Verify Setup**
   - Go to "Table Editor" in the sidebar
   - You should see the following tables:
     - `interests` (with ~32 sample interests)
     - `skills` (with ~24 sample skills)
     - `user_interests`
     - `user_skills`
     - `user_goals`

### Option 2: Manual Table Creation
If the SQL script doesn't work, create tables manually:

#### 1. Create interests table
```sql
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);
```

#### 2. Create skills table
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);
```

#### 3. Create user_interests table
```sql
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  UNIQUE (user_id, interest_id)
);
```

#### 4. Create user_skills table
```sql
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_offering BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, skill_id)
);
```

#### 5. Create user_goals table
```sql
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas')),
  is_active BOOLEAN DEFAULT TRUE,
  details JSONB,
  UNIQUE (user_id, goal_type, is_active)
);
```

#### 6. Insert sample data
After creating tables, insert some sample interests and skills (see the full SQL file for the complete list).

## Troubleshooting

### "Invalid API key" error
- Verify your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- Make sure your Supabase project is active and not paused
- Check if you've exceeded your Supabase plan limits

### Tables not visible
- Make sure you're in the correct Supabase project
- Check if Row Level Security (RLS) is properly configured
- Verify table permissions

### App still showing errors
1. Run the validation script: `npm run validate-supabase`
2. Check the app logs for specific error messages
3. Restart the Expo development server

## Verification
After setup, run this command to verify everything is working:
```bash
npm run validate-supabase
```

You should see:
- ✅ All tables accessible
- ✅ Sample data loaded
- ✅ Connection successful

If you see any errors, please check the troubleshooting section above or refer to the Supabase documentation. 