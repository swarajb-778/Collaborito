const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabase = createClient(
  'https://ekydublgvsoaaepdhtzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUxMDQ1NSwiZXhwIjoyMDU5MDg2NDU1fQ.TY63nJARwPQrg53WYub2o3v-sJNR-9dhIjpdmrtWTws'
);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...');

    // Create interests table
    console.log('Creating interests table...');
    const { error: interestsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS interests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
          name TEXT NOT NULL UNIQUE,
          category TEXT
        );
        
        -- Enable RLS
        ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for interests
        DROP POLICY IF EXISTS "Interests are viewable by everyone" ON interests;
        CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);
      `
    });

    if (interestsTableError) {
      console.log('❌ Error creating interests table:', interestsTableError.message);
    } else {
      console.log('✅ Interests table created');
    }

    // Create skills table
    console.log('Creating skills table...');
    const { error: skillsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
          name TEXT NOT NULL UNIQUE,
          category TEXT
        );
        
        -- Enable RLS
        ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for skills
        DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
        CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
      `
    });

    if (skillsTableError) {
      console.log('❌ Error creating skills table:', skillsTableError.message);
    } else {
      console.log('✅ Skills table created');
    }

    // Create user_interests table
    console.log('Creating user_interests table...');
    const { error: userInterestsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_interests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
          UNIQUE (user_id, interest_id)
        );
        
        -- Enable RLS
        ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for user_interests
        DROP POLICY IF EXISTS "User interests are viewable by everyone" ON user_interests;
        CREATE POLICY "User interests are viewable by everyone" ON user_interests FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Users can insert their own interests" ON user_interests;
        CREATE POLICY "Users can insert their own interests" ON user_interests
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;
        CREATE POLICY "Users can update their own interests" ON user_interests
          FOR UPDATE USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can delete their own interests" ON user_interests;
        CREATE POLICY "Users can delete their own interests" ON user_interests
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (userInterestsTableError) {
      console.log('❌ Error creating user_interests table:', userInterestsTableError.message);
    } else {
      console.log('✅ User_interests table created');
    }

    // Create user_skills table
    console.log('Creating user_skills table...');
    const { error: userSkillsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
          proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
          is_offering BOOLEAN DEFAULT TRUE,
          UNIQUE (user_id, skill_id)
        );
        
        -- Enable RLS
        ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for user_skills
        DROP POLICY IF EXISTS "User skills are viewable by everyone" ON user_skills;
        CREATE POLICY "User skills are viewable by everyone" ON user_skills FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
        CREATE POLICY "Users can insert their own skills" ON user_skills
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
        CREATE POLICY "Users can update their own skills" ON user_skills
          FOR UPDATE USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can delete their own skills" ON user_skills;
        CREATE POLICY "Users can delete their own skills" ON user_skills
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (userSkillsTableError) {
      console.log('❌ Error creating user_skills table:', userSkillsTableError.message);
    } else {
      console.log('✅ User_skills table created');
    }

    // Create user_goals table
    console.log('Creating user_goals table...');
    const { error: userGoalsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_goals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          goal_type TEXT NOT NULL CHECK (goal_type IN ('find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas')),
          is_active BOOLEAN DEFAULT TRUE,
          details JSONB,
          UNIQUE (user_id, goal_type, is_active)
        );
        
        -- Enable RLS
        ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for user_goals
        DROP POLICY IF EXISTS "User goals are viewable by everyone" ON user_goals;
        CREATE POLICY "User goals are viewable by everyone" ON user_goals FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
        CREATE POLICY "Users can insert their own goals" ON user_goals
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
        CREATE POLICY "Users can update their own goals" ON user_goals
          FOR UPDATE USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;
        CREATE POLICY "Users can delete their own goals" ON user_goals
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (userGoalsTableError) {
      console.log('❌ Error creating user_goals table:', userGoalsTableError.message);
    } else {
      console.log('✅ User_goals table created');
    }

    // Add onboarding fields to profiles table
    console.log('Adding onboarding fields to profiles table...');
    const { error: profilesUpdateError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Add onboarding fields if they don't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
            ALTER TABLE profiles ADD COLUMN first_name TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
            ALTER TABLE profiles ADD COLUMN last_name TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
            ALTER TABLE profiles ADD COLUMN location TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
            ALTER TABLE profiles ADD COLUMN job_title TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_image_path') THEN
            ALTER TABLE profiles ADD COLUMN profile_image_path TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
            ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_step') THEN
            ALTER TABLE profiles ADD COLUMN onboarding_step TEXT CHECK (onboarding_step IN ('profile', 'interests', 'goals', 'project_details', 'skills', 'completed'));
          END IF;
        END $$;
      `
    });

    if (profilesUpdateError) {
      console.log('❌ Error updating profiles table:', profilesUpdateError.message);
    } else {
      console.log('✅ Profiles table updated with onboarding fields');
    }

    console.log('\n🎉 Database setup completed successfully!');

  } catch (err) {
    console.error('❌ Database setup error:', err.message);
  }
}

setupDatabase(); 