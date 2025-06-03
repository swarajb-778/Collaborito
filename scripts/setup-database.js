#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

console.log('🚀 Setting up Collaborito database...');

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables!');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('📋 Reading database setup script...');
    const sqlPath = path.join(__dirname, 'setup-database.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Database setup script not found at:', sqlPath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⚡ Executing database setup...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Database setup failed:', error.message);
      
      // Try alternative approach: execute SQL directly
      console.log('🔄 Trying alternative setup method...');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        try {
          if (statement.includes('CREATE TABLE') || statement.includes('INSERT INTO')) {
            console.log('📝 Executing:', statement.substring(0, 50) + '...');
          }
          
          // For table creation and data insertion, we need to use raw SQL
          if (statement.includes('CREATE TABLE') || statement.includes('INSERT INTO') || statement.includes('ALTER TABLE')) {
            // This would need to be done through Supabase dashboard or direct SQL access
            console.log('⚠️  SQL statement needs manual execution:', statement.substring(0, 100) + '...');
          }
        } catch (stmtError) {
          console.warn('⚠️  Statement failed (may be normal):', stmtError.message);
        }
      }
    } else {
      console.log('✅ Database setup completed successfully!');
    }
    
    // Verify the setup by checking if required tables exist
    console.log('\n🔍 Verifying database setup...');
    
    const requiredTables = ['interests', 'skills', 'user_interests', 'user_skills', 'user_goals'];
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
          allTablesExist = false;
        } else {
          console.log(`✅ Table '${table}': accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      console.log('\n🎉 All required tables are accessible!');
      
      // Check if data exists in core tables
      console.log('\n📊 Checking initial data...');
      
      const { data: interestsData } = await supabase.from('interests').select('count', { count: 'exact', head: true });
      const { data: skillsData } = await supabase.from('skills').select('count', { count: 'exact', head: true });
      
      console.log(`📋 Interests in database: ${interestsData?.length || 0}`);
      console.log(`🛠️  Skills in database: ${skillsData?.length || 0}`);
      
    } else {
      console.log('\n⚠️  Some tables are missing. You may need to run the SQL script manually in your Supabase dashboard.');
      console.log('\n📝 Manual Setup Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of scripts/setup-database.sql');
      console.log('4. Execute the script');
    }
    
    return allTablesExist;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor'); 
    console.log('3. Copy and paste the contents of scripts/setup-database.sql');
    console.log('4. Execute the script');
    return false;
  }
}

if (require.main === module) {
  setupDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupDatabase }; 