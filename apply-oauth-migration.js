const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Applying oauth_provider column migration...\n');

async function applyMigration() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Read the migration SQL
    const migrationSQL = `
      -- Add the oauth_provider column if it doesn't exist
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT 'email';

      -- Update existing records to have a default value
      UPDATE public.profiles 
      SET oauth_provider = 'email' 
      WHERE oauth_provider IS NULL;
    `;

    console.log('📝 Executing migration SQL...');
    const { data, error } = await serviceClient.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.log('❌ Migration failed:', error.message);
      
      // Try a simpler approach
      console.log('\n🔄 Trying direct column addition...');
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT \'email\';'
          })
        });
        
        if (response.ok) {
          console.log('✅ Column addition successful via direct API');
        } else {
          console.log('❌ Direct API failed:', response.statusText);
        }
      } catch (directErr) {
        console.log('💥 Direct API error:', directErr.message);
      }
    } else {
      console.log('✅ Migration applied successfully');
    }

    // Verify the column was added
    console.log('\n🔍 Verifying the column was added...');
    try {
      const { data: testData, error: testError } = await serviceClient
        .from('profiles')
        .select('oauth_provider')
        .limit(1);
        
      if (testError) {
        console.log('❌ Column verification failed:', testError.message);
      } else {
        console.log('✅ oauth_provider column is now accessible');
      }
    } catch (err) {
      console.log('💥 Verification error:', err.message);
    }

  } catch (error) {
    console.error('💥 Critical error during migration:', error);
  }
}

// Run the migration
applyMigration(); 