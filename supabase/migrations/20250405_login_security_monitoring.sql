-- Login Security Monitoring Migration
-- Implements login attempt tracking, device registration, and security monitoring

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create login_attempts table for tracking all login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  device_fingerprint TEXT NOT NULL,
  device_info JSONB,
  location_info JSONB,
  ip_address INET,
  user_agent TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  suspicious_flags TEXT[],
  session_id TEXT
);

-- Create user_devices table for device registration and trust management
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  os_name TEXT NOT NULL,
  os_version TEXT,
  app_version TEXT,
  model_name TEXT,
  brand TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  trusted BOOLEAN DEFAULT FALSE,
  trust_expires_at TIMESTAMP WITH TIME ZONE,
  location_info JSONB,
  UNIQUE (user_id, device_fingerprint)
);

-- Create security_alerts table for tracking security events
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW') NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('suspicious_login', 'multiple_failures', 'new_device', 'unusual_location', 'account_locked', 'brute_force')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recommendation TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Create account_lockouts table for managing temporary account lockouts
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  lockout_reason TEXT,
  automatic_unlock BOOLEAN DEFAULT TRUE
);

-- Create security_config table for per-user security settings
CREATE TABLE IF NOT EXISTS security_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  max_failed_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 15,
  device_trust_duration_days INTEGER DEFAULT 30,
  enable_unusual_location_check BOOLEAN DEFAULT TRUE,
  enable_new_device_check BOOLEAN DEFAULT TRUE,
  enable_suspicious_pattern_detection BOOLEAN DEFAULT TRUE,
  session_timeout_minutes INTEGER DEFAULT 120,
  require_mfa BOOLEAN DEFAULT FALSE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_device_fingerprint ON login_attempts(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_trusted ON user_devices(trusted);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON user_devices(last_seen);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_email ON security_alerts(email);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON account_lockouts(locked_until);

-- Add triggers for updated_at columns
CREATE TRIGGER update_login_attempts_updated_at
  BEFORE UPDATE ON login_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at
  BEFORE UPDATE ON user_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON security_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_lockouts_updated_at
  BEFORE UPDATE ON account_lockouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_config_updated_at
  BEFORE UPDATE ON security_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_attempts (admin/system access only)
CREATE POLICY "System can insert login attempts" ON login_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_devices
CREATE POLICY "Users can view their own devices" ON user_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user devices" ON user_devices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own devices" ON user_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" ON user_devices
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for security_alerts
CREATE POLICY "Users can view their own security alerts" ON security_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security alerts" ON security_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own security alerts" ON security_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for account_lockouts (system access only)
CREATE POLICY "System can manage account lockouts" ON account_lockouts
  FOR ALL WITH CHECK (true);

-- RLS Policies for security_config
CREATE POLICY "Users can view their own security config" ON security_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security config" ON security_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security config" ON security_config
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create default security config for new users
CREATE OR REPLACE FUNCTION create_default_security_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_config (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default security config when user profile is created
CREATE TRIGGER create_security_config_for_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_security_config();

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