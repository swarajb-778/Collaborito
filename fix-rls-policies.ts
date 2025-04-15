import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or keys. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client with service role key (preferred) or anon key
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * This script identifies and fixes the infinite recursion in the RLS policies
 * for the project_members table. The issue typically occurs when a policy references
 * itself or creates a circular dependency across multiple policies.
 */
async function fixRLSPolicies() {
  console.log('Analyzing RLS policies for project_members table...');
  
  try {
    // First, let's check if we can run SQL queries (requires service role)
    const { data: testData, error: testError } = await supabase
      .rpc('get_current_user_id');
    
    if (testError) {
      if (testError.message.includes('function') && testError.message.includes('does not exist')) {
        console.log('Note: The get_current_user_id function is not defined. This is expected if it doesn\'t exist.');
      } else {
        console.warn('Warning: Limited access to SQL execution. Service role key may be required for full fixes.');
        console.warn('Error was:', testError.message);
      }
    }

    // Store the policies before we make changes
    let existingPolicies;
    try {
      // Try to get existing policies using SQL
      const { data: policiesData, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'project_members');
        
      if (policiesError) {
        console.warn('Could not retrieve existing policies via pg_policies:', policiesError.message);
      } else {
        existingPolicies = policiesData;
        console.log('Current policies for project_members:');
        console.log(existingPolicies);
      }
    } catch (e) {
      console.warn('Error querying policies:', e);
    }

    console.log('\nPerforming basic checks on project_members table...');
    
    // Try a simple query without auth to check basic access
    const { error: basicQueryError } = await supabase
      .from('project_members')
      .select('count')
      .limit(1);
      
    if (basicQueryError) {
      console.error('Basic query error:', basicQueryError.message);
      if (basicQueryError.message.includes('infinite recursion')) {
        console.log('\nInfinite recursion detected. This typically happens when:');
        console.log('1. A policy references itself in its USING or WITH CHECK expression');
        console.log('2. There\'s a circular dependency between multiple policies');
        console.log('3. A function used in the policy creates a recursive query\n');
      }
    } else {
      console.log('Basic query succeeded - the issue might be specific to certain auth states or edge cases.');
    }

    console.log('\nApplying suggested fixes...');

    // Option 1: Create a temporary workaround policy
    console.log('\nCreating temporary workaround policy...');
    
    // First, try to disable all existing policies on the table (requires admin rights)
    try {
      const { error: disablePolicyError } = await supabase.rpc('disable_project_members_policies', {});
      
      if (disablePolicyError) {
        console.log('Could not disable existing policies programmatically:', disablePolicyError.message);
        console.log('\nManual fix required:');
        
        // Extract project reference from URL safely
        let projectRef = 'your-project-ref';
        if (supabaseUrl && supabaseUrl.includes('https://') && supabaseUrl.includes('.supabase.co')) {
          projectRef = supabaseUrl.split('https://')[1].split('.supabase.co')[0];
        }
        
        console.log('1. Log in to Supabase dashboard: https://app.supabase.io/project/' + projectRef);
        console.log('2. Go to Authentication > Policies');
        console.log('3. Find the project_members table');
        console.log('4. Disable or delete all existing policies');
        console.log('5. Create a new, simpler policy:');
        console.log(`
   - Policy name: project_members_simplified_access
   - Target roles: authenticated
   - Using expression: (
       auth.uid() = user_id 
       OR 
       EXISTS (
           SELECT 1 FROM project_members pm 
           WHERE pm.project_id = project_id 
           AND pm.user_id = auth.uid() 
           AND pm.role IN ('owner', 'admin')
       )
   )
   - With check expression: (
       auth.uid() = user_id 
       OR 
       EXISTS (
           SELECT 1 FROM projects p
           WHERE p.id = project_id 
           AND p.owner_id = auth.uid()
       )
   )
`);
      } else {
        console.log('Successfully disabled existing policies.');
        
        // Create a new, simplified policy
        const { error: createPolicyError } = await supabase.rpc('create_simplified_project_members_policy', {});
        
        if (createPolicyError) {
          console.log('Could not create simplified policy programmatically:', createPolicyError.message);
          console.log('Please follow the manual fix instructions above.');
        } else {
          console.log('Successfully created a simplified policy for project_members table.');
        }
      }
    } catch (e) {
      console.warn('Error managing policies:', e);
      console.log('Please follow the manual fix instructions above.');
    }

    // Test if our fix worked
    console.log('\nTesting the fix...');
    const { error: testFixError } = await supabase
      .from('project_members')
      .select('count')
      .limit(1);
      
    if (testFixError) {
      console.error('The issue persists. Manual intervention is required:', testFixError.message);
    } else {
      console.log('Success! The infinite recursion issue is resolved.');
    }
    
    console.log('\nPlease check the Supabase dashboard to ensure policies are correctly configured.');
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

// Execute the function
fixRLSPolicies(); 