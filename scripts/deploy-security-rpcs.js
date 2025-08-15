#!/usr/bin/env node

/**
 * Deploy Security RPC Functions to Supabase
 * This script deploys the missing security RPC functions to the remote Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL for missing RPC functions (extracted from migration)
const rpcFunctions = `
-- Function to clean up expired lockouts
CREATE OR REPLACE FUNCTION cleanup_expired_lockouts()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  DELETE FROM account_lockouts 
  WHERE locked_until < TIMEZONE('utc', NOW())
  AND automatic_unlock = TRUE;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is currently locked
CREATE OR REPLACE FUNCTION is_account_locked(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record
  FROM account_lockouts
  WHERE email = LOWER(p_email)
  AND locked_until > TIMEZONE('utc', NOW());
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account lockout info
CREATE OR REPLACE FUNCTION get_account_lockout_info(p_email TEXT)
RETURNS TABLE(
  is_locked BOOLEAN,
  locked_until TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER,
  minutes_remaining INTEGER
) AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record
  FROM account_lockouts
  WHERE email = LOWER(p_email);
  
  IF FOUND AND lockout_record.locked_until > TIMEZONE('utc', NOW()) THEN
    RETURN QUERY SELECT 
      TRUE,
      lockout_record.locked_until,
      lockout_record.failed_attempts,
      EXTRACT(EPOCH FROM (lockout_record.locked_until - TIMEZONE('utc', NOW()))) / 60;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE, 0, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt and check for lockout
CREATE OR REPLACE FUNCTION record_login_attempt_and_check_lockout(
  p_email TEXT,
  p_success BOOLEAN,
  p_device_fingerprint TEXT,
  p_device_info JSONB DEFAULT NULL,
  p_location_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
  should_lockout BOOLEAN,
  lockout_duration_minutes INTEGER,
  failed_attempts_count INTEGER
) AS $$
DECLARE
  config_record RECORD;
  recent_failures INTEGER;
  attempt_id UUID;
BEGIN
  -- Insert the login attempt
  INSERT INTO login_attempts (
    email, success, device_fingerprint, device_info, location_info,
    ip_address, user_agent, failure_reason
  ) VALUES (
    LOWER(p_email), p_success, p_device_fingerprint, p_device_info, p_location_info,
    p_ip_address, p_user_agent, p_failure_reason
  ) RETURNING id INTO attempt_id;

  -- If login was successful, clean up any existing lockout
  IF p_success THEN
    DELETE FROM account_lockouts WHERE email = LOWER(p_email);
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;

  -- Get security config (use defaults if no config exists)
  SELECT 
    COALESCE(sc.max_failed_attempts, 5) as max_failed_attempts,
    COALESCE(sc.lockout_duration_minutes, 15) as lockout_duration_minutes
  INTO config_record
  FROM security_config sc
  JOIN profiles p ON sc.user_id = p.id
  JOIN auth.users u ON p.id = u.id
  WHERE u.email = LOWER(p_email);

  -- If no config found, use defaults
  IF NOT FOUND THEN
    config_record.max_failed_attempts := 5;
    config_record.lockout_duration_minutes := 15;
  END IF;

  -- Count recent failed attempts (last hour)
  SELECT COUNT(*) INTO recent_failures
  FROM login_attempts
  WHERE email = LOWER(p_email)
  AND success = FALSE
  AND created_at > TIMEZONE('utc', NOW()) - INTERVAL '1 hour';

  -- Check if we should lockout the account
  IF recent_failures >= config_record.max_failed_attempts THEN
    -- Create or update lockout record
    INSERT INTO account_lockouts (email, locked_until, failed_attempts, lockout_reason)
    VALUES (
      LOWER(p_email),
      TIMEZONE('utc', NOW()) + (config_record.lockout_duration_minutes || ' minutes')::INTERVAL,
      recent_failures,
      'Too many failed login attempts'
    )
    ON CONFLICT (email) DO UPDATE SET
      locked_until = TIMEZONE('utc', NOW()) + (config_record.lockout_duration_minutes || ' minutes')::INTERVAL,
      failed_attempts = recent_failures,
      updated_at = TIMEZONE('utc', NOW());

    RETURN QUERY SELECT TRUE, config_record.lockout_duration_minutes, recent_failures;
  ELSE
    RETURN QUERY SELECT FALSE, 0, recent_failures;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function deployRPCFunctions() {
  console.log('🚀 Deploying security RPC functions to Supabase...');
  
  try {
    // Execute the SQL to create RPC functions
    const { error } = await supabase.rpc('_exec_sql', {
      sql: rpcFunctions
    });

    if (error) {
      console.error('❌ Error deploying RPC functions:', error);
      return false;
    }

    console.log('✅ Security RPC functions deployed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Failed to deploy RPC functions:', err.message);
    return false;
  }
}

async function testRPCDeployment() {
  console.log('🧪 Testing RPC functions deployment...');
  
  try {
    // Test the main RPC function
    const { data, error } = await supabase.rpc('record_login_attempt_and_check_lockout', {
      p_email: 'test@example.com',
      p_success: false,
      p_device_fingerprint: 'test-device-123',
      p_failure_reason: 'test deployment'
    });

    if (error) {
      console.error('❌ RPC function test failed:', error);
      return false;
    }

    console.log('✅ RPC function test successful:', data);
    return true;
  } catch (err) {
    console.error('❌ RPC function test error:', err.message);
    return false;
  }
}

async function main() {
  console.log('📋 Security RPC Deployment Script');
  console.log('==================================');
  
  // Step 1: Deploy RPC functions
  const deploySuccess = await deployRPCFunctions();
  if (!deploySuccess) {
    console.error('❌ Failed to deploy RPC functions');
    process.exit(1);
  }

  // Step 2: Test deployment
  const testSuccess = await testRPCDeployment();
  if (!testSuccess) {
    console.error('❌ RPC function test failed');
    process.exit(1);
  }

  console.log('\n🎉 Security RPC deployment completed successfully!');
  console.log('💡 Run "npm run verify-security" to verify all security features');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deployRPCFunctions, testRPCDeployment };
