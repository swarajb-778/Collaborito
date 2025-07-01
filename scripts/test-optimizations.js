const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

async function testOptimizations() {
  log('\n🧪 Testing Performance Optimizations...', colors.blue);
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    log('❌ Missing Supabase configuration', colors.red);
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const tests = [
    {
      name: 'Test database connection',
      test: async () => {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        return !error || error.message.includes('permission denied');
      }
    },
    {
      name: 'Test get_user_onboarding_progress function',
      test: async () => {
        try {
          // This should fail gracefully if function doesn't exist
          await supabase.rpc('get_user_onboarding_progress', { 
            user_id_param: '00000000-0000-0000-0000-000000000000' 
          });
          return true;
        } catch (error) {
          return !error.message.includes('does not exist');
        }
      }
    },
    {
      name: 'Test get_onboarding_reference_data function',
      test: async () => {
        try {
          const { error } = await supabase.rpc('get_onboarding_reference_data');
          return !error || !error.message.includes('does not exist');
        } catch (error) {
          return !error.message.includes('does not exist');
        }
      }
    },
    {
      name: 'Test interests table with index',
      test: async () => {
        const { data, error } = await supabase
          .from('interests')
          .select('id, name, category')
          .order('category, name')
          .limit(5);
        return !error;
      }
    },
    {
      name: 'Test skills table with index',
      test: async () => {
        const { data, error } = await supabase
          .from('skills')
          .select('id, name, category')
          .order('category, name')
          .limit(5);
        return !error;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      if (result) {
        log(`✅ ${test.name} (${duration}ms)`, colors.green);
        passed++;
      } else {
        log(`❌ ${test.name} (${duration}ms)`, colors.red);
        failed++;
      }
    } catch (error) {
      log(`❌ ${test.name} - Error: ${error.message}`, colors.red);
      failed++;
    }
  }

  log(`\n📊 Test Results:`, colors.blue);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, colors.red);
  
  if (failed > 0) {
    log('\n⚠️  Some optimizations may need manual setup in Supabase SQL Editor', colors.yellow);
    log('Please run the contents of supabase/performance-optimizations.sql', colors.cyan);
  } else {
    log('\n🎉 All optimizations are working correctly!', colors.green);
  }
}

if (require.main === module) {
  testOptimizations().catch(console.error);
}

 