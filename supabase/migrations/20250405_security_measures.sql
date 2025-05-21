-- Security Measures for Onboarding
-- Implements:
-- 1. Rate limiting for profile updates
-- 2. Additional RLS policies for relationships
-- 3. Input validation triggers

-- Create a rate limiting table to track API calls
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  ip_address INET,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE (user_id, endpoint, window_start)
);

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own rate limits
CREATE POLICY "Users can view their own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Allow system to insert rate limits (edge functions use service role)
CREATE POLICY "System can insert rate limits" ON rate_limits
  FOR INSERT WITH CHECK (true);

-- Only system can update rate limits
CREATE POLICY "System can update rate limits" ON rate_limits
  FOR UPDATE USING (true);

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_ip_address INET,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_request_count INTEGER;
  v_record_exists BOOLEAN;
BEGIN
  -- Calculate the start of the current time window
  v_window_start := date_trunc('minute', NOW() AT TIME ZONE 'UTC') - 
                   ((EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'UTC') % p_window_minutes) 
                    || ' minutes')::INTERVAL;
  
  -- Check if a record already exists for this user, endpoint, and time window
  SELECT EXISTS(
    SELECT 1 FROM rate_limits 
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start = v_window_start
  ) INTO v_record_exists;
  
  IF v_record_exists THEN
    -- Update the existing record
    UPDATE rate_limits
    SET request_count = request_count + 1,
        ip_address = p_ip_address
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start = v_window_start
    RETURNING request_count INTO v_request_count;
    
    -- Check if the limit has been exceeded
    RETURN v_request_count <= p_max_requests;
  ELSE
    -- Insert a new record
    INSERT INTO rate_limits(user_id, endpoint, ip_address, window_start)
    VALUES (p_user_id, p_endpoint, p_ip_address, v_window_start);
    
    -- First request in this window, so it's allowed
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add more specific RLS policies for onboarding relationships

-- Ensure specific RLS on user_goals table - tighten access
DROP POLICY IF EXISTS "User goals are viewable by everyone" ON user_goals;
CREATE POLICY "Users can view their own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all goals" ON user_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add validation triggers for data integrity

-- Trigger function to validate profile data
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate first_name
  IF NEW.first_name IS NOT NULL AND (LENGTH(NEW.first_name) < 1 OR LENGTH(NEW.first_name) > 50) THEN
    RAISE EXCEPTION 'First name must be between 1 and 50 characters';
  END IF;
  
  -- Validate last_name
  IF NEW.last_name IS NOT NULL AND (LENGTH(NEW.last_name) < 1 OR LENGTH(NEW.last_name) > 50) THEN
    RAISE EXCEPTION 'Last name must be between 1 and 50 characters';
  END IF;
  
  -- Validate location (if provided)
  IF NEW.location IS NOT NULL AND LENGTH(NEW.location) > 100 THEN
    RAISE EXCEPTION 'Location must be 100 characters or less';
  END IF;
  
  -- Validate job_title (if provided)
  IF NEW.job_title IS NOT NULL AND LENGTH(NEW.job_title) > 100 THEN
    RAISE EXCEPTION 'Job title must be 100 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS validate_profile_data_trigger ON profiles;
CREATE TRIGGER validate_profile_data_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION validate_profile_data();

-- Trigger function to validate user interests (limit number)
CREATE OR REPLACE FUNCTION validate_user_interests()
RETURNS TRIGGER AS $$
DECLARE
  interest_count INTEGER;
BEGIN
  -- Count existing interests for this user
  SELECT COUNT(*) INTO interest_count 
  FROM user_interests
  WHERE user_id = NEW.user_id;
  
  -- Check if adding this would exceed the limit (20)
  IF interest_count >= 20 THEN
    RAISE EXCEPTION 'Maximum of 20 interests allowed per user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on user_interests table
DROP TRIGGER IF EXISTS validate_user_interests_trigger ON user_interests;
CREATE TRIGGER validate_user_interests_trigger
BEFORE INSERT ON user_interests
FOR EACH ROW EXECUTE FUNCTION validate_user_interests();

-- Trigger function to validate user skills (limit number)
CREATE OR REPLACE FUNCTION validate_user_skills()
RETURNS TRIGGER AS $$
DECLARE
  skill_count INTEGER;
BEGIN
  -- Count existing skills for this user
  SELECT COUNT(*) INTO skill_count 
  FROM user_skills
  WHERE user_id = NEW.user_id;
  
  -- Check if adding this would exceed the limit (20)
  IF skill_count >= 20 THEN
    RAISE EXCEPTION 'Maximum of 20 skills allowed per user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on user_skills table
DROP TRIGGER IF EXISTS validate_user_skills_trigger ON user_skills;
CREATE TRIGGER validate_user_skills_trigger
BEFORE INSERT ON user_skills
FOR EACH ROW EXECUTE FUNCTION validate_user_skills();

-- Add security function to sanitize inputs
CREATE OR REPLACE FUNCTION sanitize_input(input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Basic sanitization: trim whitespace and remove any potentially harmful characters
  RETURN TRIM(REGEXP_REPLACE(input, E'[\\\\\'";><]', '', 'g'));
END;
$$ LANGUAGE plpgsql; 