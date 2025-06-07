#!/usr/bin/env node

/**
 * Test Authentication Flow
 * 
 * This script tests the authentication session management
 * to ensure signup creates proper sessions.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Check current session
    console.log('1️⃣ Checking current session...');
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    console.log('Current session exists:', !!currentSession);
    
    if (currentSession) {
      console.log('Session user:', currentSession.user.email);
      console.log('Session expires at:', new Date(currentSession.expires_at * 1000));
      
      // Test if session is valid for database operations
      console.log('\n2️⃣ Testing database access with current session...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
        
      if (profileError) {
        console.log('❌ Profile fetch failed:', profileError.message);
      } else {
        console.log('✅ Profile fetch successful:', profile ? 'Profile exists' : 'No profile');
      }
      
      return;
    }

    // Test 2: Create a test user
    console.log('\n2️⃣ Testing signup with test user...');
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'testpass123';
    
    console.log('Creating user with email:', testEmail);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: 'testuser'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return;
    }
    
    console.log('✅ Signup successful');
    console.log('User ID:', signupData.user?.id);
    console.log('Session exists:', !!signupData.session);
    console.log('User confirmed:', !!signupData.user?.email_confirmed_at);
    
    if (signupData.session) {
      console.log('✅ Session created immediately (auto-confirm enabled)');
      
      // Test 3: Verify session works for database operations
      console.log('\n3️⃣ Testing database operations with new session...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ Session verification successful');
        console.log('User ID from getUser:', user.id);
        
        // Test database insert
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            onboarding_completed: false,
            onboarding_step: 'profile'
          })
          .select()
          .single();
          
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile creation successful');
        }
        
        // Clean up - delete test user profile
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
        console.log('🧹 Test cleanup completed');
        
      } else {
        console.log('❌ Session verification failed');
      }
      
    } else {
      console.log('⚠️ No session created (email confirmation required)');
      console.log('Check your Supabase project settings:');
      console.log('- Go to Authentication > Settings');
      console.log('- Look for "Enable email confirmations"');
      console.log('- For development, you may want to disable this');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow().then(() => {
  console.log('\n🏁 Authentication flow test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
}); 