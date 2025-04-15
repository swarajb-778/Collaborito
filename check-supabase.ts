import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  console.log('Checking connection to Supabase project...');
  console.log(`URL: ${supabaseUrl}`);
  
  try {
    // Get auth config as a reliable connection test
    const { data: authSettings, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error connecting to Supabase Auth:', authError.message);
    } else {
      console.log('Successfully connected to Supabase Auth!');
      console.log('Session exists:', authSettings.session !== null);
    }
    
    // Try querying the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('Error fetching profiles:', profilesError.message);
    } else {
      console.log('Successfully queried profiles table!');
      console.log('Profiles found:', profiles?.length || 0);
    }
    
    // List tables in public schema
    console.log('\nAttempting to list available tables:');
    
    // Try tasks table
    const { error: tasksError } = await supabase.from('tasks').select('count').limit(1);
    console.log('tasks table:', tasksError ? 'Error: ' + tasksError.message : 'Available');
    
    // Try projects table
    const { error: projectsError } = await supabase.from('projects').select('count').limit(1);
    console.log('projects table:', projectsError ? 'Error: ' + projectsError.message : 'Available');
    
    // Try messages table
    const { error: messagesError } = await supabase.from('messages').select('count').limit(1);
    console.log('messages table:', messagesError ? 'Error: ' + messagesError.message : 'Available');
    
    // Try project_members table
    const { error: membersError } = await supabase.from('project_members').select('count').limit(1);
    console.log('project_members table:', membersError ? 'Error: ' + membersError.message : 'Available');
    
    // Try invitations table
    const { error: invitationsError } = await supabase.from('invitations').select('count').limit(1);
    console.log('invitations table:', invitationsError ? 'Error: ' + invitationsError.message : 'Available');
    
    console.log('\nConnection check complete.');
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

checkConnection(); 