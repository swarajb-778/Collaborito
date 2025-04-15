/**
 * Script to test that the RLS policy fixes are working correctly
 * Run this after applying the SQL fixes in the Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or keys. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Tests that the RLS policy fixes are working correctly
 */
async function testRlsFix() {
  console.log('Testing RLS policy fixes...');
  console.log('URL:', supabaseUrl);
  console.log('-------------------------------------------');

  try {
    // Test 1: Basic query on project_members
    console.log('Test 1: Basic query on project_members');
    const { data: memberCount, error: memberCountError } = await supabase
      .from('project_members')
      .select('count');

    if (memberCountError) {
      console.error('❌ Test 1 failed:', memberCountError.message);
    } else {
      console.log('✅ Test 1 passed: Basic query on project_members successful');
    }

    // Test 2: Query projects with project_members join
    console.log('\nTest 2: Query projects with project_members join');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        members:project_members(id, user_id, role)
      `)
      .limit(5);

    if (projectsError) {
      console.error('❌ Test 2 failed:', projectsError.message);
    } else {
      console.log('✅ Test 2 passed: Query with joins successful');
      console.log(`Retrieved ${projects?.length || 0} projects`);
    }

    // Test 3: Full query similar to what the app uses
    console.log('\nTest 3: Full query (similar to app usage)');
    const { data: detailedProjects, error: detailedError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        created_at,
        updated_at,
        cover_image_url,
        owner_id,
        members:project_members(
          id, 
          user_id,
          role,
          profile:profiles(*)
        ),
        tasks(*)
      `)
      .limit(1);

    if (detailedError) {
      console.error('❌ Test 3 failed:', detailedError.message);
    } else {
      console.log('✅ Test 3 passed: Complex query successful');
      
      // Print some basic info about the result
      if (detailedProjects && detailedProjects.length > 0) {
        const project = detailedProjects[0];
        console.log(`Project: ${project.name}`);
        console.log(`- Status: ${project.status}`);
        console.log(`- Members: ${project.members?.length || 0}`);
        console.log(`- Tasks: ${project.tasks?.length || 0}`);
      } else {
        console.log('No projects found in the database');
      }
    }

    // Test 4: Check if you can query tasks directly
    console.log('\nTest 4: Query tasks');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.error('❌ Test 4 failed:', tasksError.message);
    } else {
      console.log('✅ Test 4 passed: Tasks query successful');
      console.log(`Retrieved ${tasks?.length || 0} tasks`);
    }

    console.log('\n-------------------------------------------');
    
    // Final verdict
    if (!memberCountError && !projectsError && !detailedError && !tasksError) {
      console.log('🎉 All tests passed! The RLS policy fixes are working correctly.');
      console.log('You can now use the enhanced Project Detail screen without issues.');
    } else {
      console.log('⚠️ Some tests failed. There may still be issues with the RLS policies.');
      console.log('Check the error messages above and consider applying the fixes again.');
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
testRlsFix(); 