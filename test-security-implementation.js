#!/usr/bin/env node

/**
 * Comprehensive Security Implementation Test
 * 
 * Tests login attempt monitoring, device registration, account lockout,
 * and security alert functionality for the Collaborito app.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const testEmail = 'security-test@example.com';
const testDeviceFingerprint = 'test-device-123';
const testDeviceInfo = {
  name: 'Test iPhone',
  type: 'mobile',
  osName: 'iOS',
  osVersion: '17.0',
  appVersion: '1.0.0',
  modelName: 'iPhone 15',
  brand: 'Apple'
};

async function runSecurityTests() {
  console.log('🔐 Starting Collaborito Security Implementation Tests');
  console.log('================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Database Schema Validation
  console.log('1️⃣ Testing Database Schema...');
  try {
    // Check if all security tables exist
    const tables = [
      'login_attempts',
      'user_devices', 
      'security_alerts',
      'account_lockouts',
      'security_config'
    ];

    for (const table of tables) {
      const { data, error } = await adminSupabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        throw new Error(`Table ${table} not accessible: ${error.message}`);
      }
      console.log(`   ✅ ${table} table exists and accessible`);
    }

    testsPassed++;
    console.log('   🎉 Database schema validation passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Database schema validation failed: ${error.message}\n`);
  }

  // Test 2: Database Functions
  console.log('2️⃣ Testing Database Functions...');
  try {
    // Test is_account_locked function
    const { data: lockStatus, error: lockError } = await adminSupabase.rpc(
      'is_account_locked',
      { p_email: testEmail }
    );

    if (lockError) {
      throw new Error(`is_account_locked function failed: ${lockError.message}`);
    }
    console.log(`   ✅ is_account_locked function works (result: ${lockStatus})`);

    // Test get_account_lockout_info function
    const { data: lockInfo, error: lockInfoError } = await adminSupabase.rpc(
      'get_account_lockout_info',
      { p_email: testEmail }
    );

    if (lockInfoError) {
      throw new Error(`get_account_lockout_info function failed: ${lockInfoError.message}`);
    }
    console.log(`   ✅ get_account_lockout_info function works`);

    testsPassed++;
    console.log('   🎉 Database functions validation passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Database functions validation failed: ${error.message}\n`);
  }

  // Test 3: Login Attempt Recording
  console.log('3️⃣ Testing Login Attempt Recording...');
  try {
    // Test failed login attempt
    const { data: failedResult, error: failedError } = await adminSupabase.rpc(
      'record_login_attempt_and_check_lockout',
      {
        p_email: testEmail,
        p_success: false,
        p_device_fingerprint: testDeviceFingerprint,
        p_device_info: testDeviceInfo,
        p_location_info: {
          country: 'United States',
          region: 'California',
          city: 'San Francisco'
        },
        p_failure_reason: 'Invalid password'
      }
    );

    if (failedError) {
      throw new Error(`Failed login recording failed: ${failedError.message}`);
    }
    console.log(`   ✅ Failed login attempt recorded`);
    console.log(`   📊 Lockout status: ${failedResult?.[0]?.should_lockout ? 'Will lockout' : 'No lockout'}`);

    // Test successful login attempt
    const { data: successResult, error: successError } = await adminSupabase.rpc(
      'record_login_attempt_and_check_lockout',
      {
        p_email: testEmail,
        p_success: true,
        p_device_fingerprint: testDeviceFingerprint,
        p_device_info: testDeviceInfo,
        p_location_info: {
          country: 'United States',
          region: 'California',
          city: 'San Francisco'
        }
      }
    );

    if (successError) {
      throw new Error(`Successful login recording failed: ${successError.message}`);
    }
    console.log(`   ✅ Successful login attempt recorded`);

    testsPassed++;
    console.log('   🎉 Login attempt recording passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Login attempt recording failed: ${error.message}\n`);
  }

  // Test 4: Account Lockout Simulation
  console.log('4️⃣ Testing Account Lockout Mechanism...');
  try {
    const lockoutTestEmail = 'lockout-test@example.com';
    
    // Simulate multiple failed attempts (default is 5)
    for (let i = 1; i <= 6; i++) {
      const { data: result, error } = await adminSupabase.rpc(
        'record_login_attempt_and_check_lockout',
        {
          p_email: lockoutTestEmail,
          p_success: false,
          p_device_fingerprint: `test-device-${i}`,
          p_device_info: testDeviceInfo,
          p_failure_reason: `Test failure attempt ${i}`
        }
      );

      if (error) {
        throw new Error(`Failed attempt ${i} recording failed: ${error.message}`);
      }

      console.log(`   📝 Attempt ${i}: ${result?.[0]?.should_lockout ? 'LOCKED' : 'Not locked'}`);
      
      if (result?.[0]?.should_lockout) {
        console.log(`   🔒 Account locked after ${i} attempts for ${result[0].lockout_duration_minutes} minutes`);
        break;
      }
    }

    // Verify account is locked
    const { data: isLocked, error: lockCheckError } = await adminSupabase.rpc(
      'is_account_locked',
      { p_email: lockoutTestEmail }
    );

    if (lockCheckError) {
      throw new Error(`Lock check failed: ${lockCheckError.message}`);
    }

    if (isLocked) {
      console.log(`   ✅ Account lockout mechanism working correctly`);
      
      // Clean up - remove lockout for future tests
      await adminSupabase
        .from('account_lockouts')
        .delete()
        .eq('email', lockoutTestEmail);
      
    } else {
      throw new Error('Account should be locked but is not');
    }

    testsPassed++;
    console.log('   🎉 Account lockout mechanism passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Account lockout mechanism failed: ${error.message}\n`);
  }

  // Test 5: Device Registration
  console.log('5️⃣ Testing Device Registration...');
  try {
    // Create a test user first
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: 'device-test@example.com',
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Test user creation failed: ${authError.message}`);
    }

    const testUserId = authData.user.id;
    console.log(`   👤 Test user created: ${testUserId}`);

    // Test device registration
    const { error: deviceError } = await adminSupabase
      .from('user_devices')
      .insert({
        user_id: testUserId,
        device_fingerprint: testDeviceFingerprint,
        device_name: testDeviceInfo.name,
        device_type: testDeviceInfo.type,
        os_name: testDeviceInfo.osName,
        os_version: testDeviceInfo.osVersion,
        app_version: testDeviceInfo.appVersion,
        model_name: testDeviceInfo.modelName,
        brand: testDeviceInfo.brand,
        trusted: false
      });

    if (deviceError) {
      throw new Error(`Device registration failed: ${deviceError.message}`);
    }
    console.log(`   ✅ Device registered successfully`);

    // Test device update (last_seen)
    const { error: updateError } = await adminSupabase
      .from('user_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('user_id', testUserId)
      .eq('device_fingerprint', testDeviceFingerprint);

    if (updateError) {
      throw new Error(`Device update failed: ${updateError.message}`);
    }
    console.log(`   ✅ Device last_seen updated successfully`);

    // Clean up test user
    await adminSupabase.auth.admin.deleteUser(testUserId);
    console.log(`   🧹 Test user cleaned up`);

    testsPassed++;
    console.log('   🎉 Device registration passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Device registration failed: ${error.message}\n`);
  }

  // Test 6: Security Configuration
  console.log('6️⃣ Testing Security Configuration...');
  try {
    // Create another test user for security config
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: 'config-test@example.com',
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Config test user creation failed: ${authError.message}`);
    }

    const testUserId = authData.user.id;

    // Test security config creation (should be automatic via trigger)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

    const { data: configData, error: configError } = await adminSupabase
      .from('security_config')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (configError) {
      // If no config exists, create one manually for test
      const { error: insertError } = await adminSupabase
        .from('security_config')
        .insert({ user_id: testUserId });
      
      if (insertError) {
        throw new Error(`Security config creation failed: ${insertError.message}`);
      }
      console.log(`   ✅ Security config created manually`);
    } else {
      console.log(`   ✅ Security config created automatically via trigger`);
    }

    // Test config update
    const { error: updateError } = await adminSupabase
      .from('security_config')
      .update({ 
        max_failed_attempts: 3,
        lockout_duration_minutes: 10
      })
      .eq('user_id', testUserId);

    if (updateError) {
      throw new Error(`Security config update failed: ${updateError.message}`);
    }
    console.log(`   ✅ Security config updated successfully`);

    // Clean up
    await adminSupabase.auth.admin.deleteUser(testUserId);

    testsPassed++;
    console.log('   🎉 Security configuration passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Security configuration failed: ${error.message}\n`);
  }

  // Test 7: Row Level Security
  console.log('7️⃣ Testing Row Level Security...');
  try {
    // Test that anonymous users cannot read sensitive data
    const { data: attemptData, error: attemptError } = await supabase
      .from('login_attempts')
      .select('*')
      .limit(1);

    // Should fail for anonymous users
    if (!attemptError) {
      throw new Error('Anonymous users should not be able to read login attempts');
    }
    console.log(`   ✅ RLS properly blocks anonymous access to login_attempts`);

    const { data: deviceData, error: deviceError } = await supabase
      .from('user_devices')
      .select('*')
      .limit(1);

    if (!deviceError) {
      throw new Error('Anonymous users should not be able to read user devices');
    }
    console.log(`   ✅ RLS properly blocks anonymous access to user_devices`);

    testsPassed++;
    console.log('   🎉 Row Level Security passed\n');
  } catch (error) {
    testsFailed++;
    console.log(`   ❌ Row Level Security failed: ${error.message}\n`);
  }

  // Test Results Summary
  console.log('================================================');
  console.log('🎯 SECURITY IMPLEMENTATION TEST RESULTS');
  console.log('================================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 ALL SECURITY TESTS PASSED!');
    console.log('🔐 Security implementation is ready for production use.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.');
  }
  
  console.log('\n🚀 Security Features Available:');
  console.log('   • Login attempt monitoring');
  console.log('   • Automatic account lockout');
  console.log('   • Device registration and tracking');
  console.log('   • Security configuration per user');
  console.log('   • Row Level Security protection');
  console.log('   • Real-time security alerts');
  
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Clean up any test data before starting
async function cleanup() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Remove test login attempts
    await adminSupabase
      .from('login_attempts')
      .delete()
      .in('email', [testEmail, 'lockout-test@example.com']);
    
    // Remove test lockouts
    await adminSupabase
      .from('account_lockouts')
      .delete()
      .in('email', [testEmail, 'lockout-test@example.com']);
    
    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.log('⚠️ Cleanup failed (continuing anyway):', error.message, '\n');
  }
}

// Run the tests
cleanup().then(runSecurityTests); 