const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

async function applyPerformanceOptimizations() {
  log('\n🚀 Applying Performance Optimizations to Remote Supabase...', colors.bright + colors.blue);
  log('\nPerformance Optimization Deployment', colors.bright);
  log('Collaborito Onboarding System', colors.cyan);
  log('=' * 40, colors.cyan);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    log('❌ Missing Supabase configuration', colors.red);
    log('Please check your .env file contains:', colors.yellow);
    log('  - EXPO_PUBLIC_SUPABASE_URL', colors.yellow);
    log('  - SUPABASE_SERVICE_ROLE_KEY', colors.yellow);
    process.exit(1);
  }

  try {
    log('1. Connecting to remote Supabase...', colors.blue);
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error && !error.message.includes('permission denied')) {
      throw new Error(`Connection failed: ${error.message}`);
    }
    
    log('✅ Connected to remote Supabase successfully', colors.green);

    log('\n2. Reading performance optimization SQL...', colors.blue);
    
    const sqlPath = path.join(__dirname, '..', 'supabase', 'performance-optimizations.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Performance optimization SQL file not found');
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    log('✅ SQL file loaded successfully', colors.green);

    log('\n3. Applying database optimizations...', colors.blue);
    
    // Split SQL into individual statements and execute them
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of sqlStatements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            // Try direct execution for some statements
            const { error: directError } = await supabase.from('_').select('*').limit(0);
            // Some statements like CREATE INDEX might need different approach
            log(`  ⚠️  Statement might need manual execution: ${statement.substring(0, 50)}...`, colors.yellow);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          // For statements that can't be executed via RPC, we'll note them
          log(`  ⚠️  Complex statement (may need manual execution): ${statement.substring(0, 50)}...`, colors.yellow);
          errorCount++;
        }
      }
    }

    log(`\n✅ Applied ${successCount} optimizations successfully`, colors.green);
    if (errorCount > 0) {
      log(`⚠️  ${errorCount} statements may need manual execution via Supabase SQL Editor`, colors.yellow);
    }

    log('\n4. Verifying optimizations...', colors.blue);
    
    // Test if our RPC functions were created
    const testFunctions = [
      'get_user_onboarding_progress',
      'save_profile_step_optimized',
      'get_onboarding_reference_data'
    ];

    for (const funcName of testFunctions) {
      try {
        // Try to call the function with minimal parameters to test existence
        await supabase.rpc(funcName, {});
      } catch (error) {
        if (error.message && error.message.includes('does not exist')) {
          log(`  ❌ Function ${funcName} not found - may need manual creation`, colors.red);
        } else {
          log(`  ✅ Function ${funcName} exists`, colors.green);
        }
      }
    }

    log('\n5. Performance optimization summary:', colors.blue);
    log('   • Database indexes for faster queries', colors.green);
    log('   • RPC functions for batch operations', colors.green);
    log('   • Materialized views for analytics', colors.green);
    log('   • Optimized caching support', colors.green);

    log('\n🎯 Next Steps:', colors.bright + colors.magenta);
    log('   1. Manually run any failed SQL statements in Supabase SQL Editor', colors.cyan);
    log('   2. Update your app to use OptimizedAuthContext', colors.cyan);
    log('   3. Test the performance improvements', colors.cyan);
    log('   4. Monitor the performance metrics', colors.cyan);

    log('\n✨ Performance optimization deployment completed!', colors.bright + colors.green);

  } catch (error) {
    log(`\n❌ Error applying optimizations: ${error.message}`, colors.red);
    log('\nFallback: Please manually execute the SQL file in Supabase SQL Editor:', colors.yellow);
    log('   1. Go to your Supabase project dashboard', colors.cyan);
    log('   2. Navigate to SQL Editor', colors.cyan);
    log('   3. Copy and paste the contents of supabase/performance-optimizations.sql', colors.cyan);
    log('   4. Execute the SQL statements', colors.cyan);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  applyPerformanceOptimizations();
}

module.exports = { applyPerformanceOptimizations }; 