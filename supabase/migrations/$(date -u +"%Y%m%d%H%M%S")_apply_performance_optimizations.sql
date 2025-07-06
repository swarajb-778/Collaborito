-- =================================================================
-- Collaborito: Performance Optimizations
-- Description: This migration applies performance enhancements,
-- including indexes, optimized RPC functions, and a
-- materialized view for analytics.
-- =================================================================

-- Part 1: Indexes for Performance
-- =================================================================

-- Indexes for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id_active ON user_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON profiles(onboarding_step, onboarding_completed);

-- Composite indexes for join optimization
CREATE INDEX IF NOT EXISTS idx_user_interests_with_interest ON user_interests(user_id, interest_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_with_skill ON user_skills(user_id, skill_id);

-- Indexes for category-based ordering
CREATE INDEX IF NOT EXISTS idx_interests_category_name ON interests(category, name);
CREATE INDEX IF NOT EXISTS idx_skills_category_name ON skills(category, name);

-- Part 2: Optimized RPC Functions
-- =================================================================

-- Function to get complete onboarding progress in a single query
CREATE OR REPLACE FUNCTION get_user_onboarding_progress(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'currentStep', p.onboarding_step,
    'completed', p.onboarding_completed,
    'completionPercentage', (
      CASE WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM user_interests WHERE user_id = user_id_param) THEN 1 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM user_goals WHERE user_id = user_id_param AND is_active = true) THEN 1 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM user_skills WHERE user_id = user_id_param) THEN 1 ELSE 0 END
    ) * 25,
    'profileData', json_build_object(
      'firstName', p.first_name,
      'lastName', p.last_name,
      'location', p.location,
      'jobTitle', p.job_title,
      'bio', p.bio
    ),
    'interests', COALESCE(
      (SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'category', i.category))
       FROM user_interests ui
       JOIN interests i ON ui.interest_id = i.id
       WHERE ui.user_id = user_id_param), '[]'::json
    ),
    'goal', (
      SELECT json_build_object('goalType', ug.goal_type, 'details', ug.details)
      FROM user_goals ug
      WHERE ug.user_id = user_id_param AND ug.is_active = true
      LIMIT 1
    ),
    'skills', COALESCE(
      (SELECT json_agg(json_build_object('skillId', s.id, 'name', s.name, 'proficiency', us.proficiency, 'isOffering', us.is_offering))
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = user_id_param), '[]'::json
    )
  ) INTO result
  FROM profiles p
  WHERE p.id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save profile step with batch operations
CREATE OR REPLACE FUNCTION save_profile_step_optimized(
  user_id_param UUID,
  first_name_param TEXT,
  last_name_param TEXT,
  location_param TEXT DEFAULT NULL,
  job_title_param TEXT DEFAULT NULL,
  bio_param TEXT DEFAULT NULL,
  next_step_param TEXT DEFAULT 'interests'
)
RETURNS JSON AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  INSERT INTO profiles (
    id, first_name, last_name, full_name, location, job_title, bio, 
    onboarding_step, updated_at
  )
  VALUES (
    user_id_param, first_name_param, last_name_param, 
    CONCAT(first_name_param, ' ', last_name_param),
    location_param, job_title_param, bio_param,
    next_step_param, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    location = EXCLUDED.location,
    job_title = EXCLUDED.job_title,
    bio = EXCLUDED.bio,
    onboarding_step = EXCLUDED.onboarding_step,
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO updated_profile;
  
  RETURN row_to_json(updated_profile);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save user interests with batch operations
CREATE OR REPLACE FUNCTION save_user_interests_optimized(
  user_id_param UUID,
  interest_ids_param UUID[]
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_interests WHERE user_id = user_id_param;
  
  INSERT INTO user_interests (user_id, interest_id)
  SELECT user_id_param, unnest(interest_ids_param);
  
  UPDATE profiles 
  SET onboarding_step = 'goals', updated_at = NOW()
  WHERE id = user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save user goal with batch operations
CREATE OR REPLACE FUNCTION save_user_goal_optimized(
  user_id_param UUID,
  goal_type_param TEXT,
  details_param JSONB DEFAULT NULL,
  next_step_param TEXT DEFAULT 'skills'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_goals SET is_active = false WHERE user_id = user_id_param;
  
  INSERT INTO user_goals (user_id, goal_type, details, is_active)
  VALUES (user_id_param, goal_type_param, details_param, true);
  
  UPDATE profiles 
  SET onboarding_step = next_step_param, updated_at = NOW()
  WHERE id = user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save user skills and complete onboarding
CREATE OR REPLACE FUNCTION save_user_skills_and_complete(
  user_id_param UUID,
  skills_param JSON
)
RETURNS BOOLEAN AS $$
DECLARE
  skill_record JSON;
BEGIN
  DELETE FROM user_skills WHERE user_id = user_id_param;
  
  FOR skill_record IN SELECT * FROM json_array_elements(skills_param)
  LOOP
    INSERT INTO user_skills (user_id, skill_id, proficiency, is_offering)
    VALUES (
      user_id_param,
      (skill_record->>'skill_id')::UUID,
      skill_record->>'proficiency',
      (skill_record->>'is_offering')::BOOLEAN
    );
  END LOOP;
  
  UPDATE profiles 
  SET 
    onboarding_step = 'completed',
    onboarding_completed = true,
    onboarding_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 3: Materialized View for Analytics
-- =================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS onboarding_analytics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
  ROUND(
    COUNT(CASE WHEN onboarding_completed = true THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as completion_rate,
  onboarding_step,
  COUNT(*) as users_in_step
FROM profiles
GROUP BY onboarding_step;

CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_step ON onboarding_analytics(onboarding_step);

CREATE OR REPLACE FUNCTION refresh_onboarding_analytics()
RETURNS BOOLEAN AS $$
BEGIN
  REFRESH MATERIALIZED VIEW onboarding_analytics;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 4: Batch Operation and Performance Monitoring Functions
-- =================================================================

CREATE OR REPLACE FUNCTION get_onboarding_reference_data()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'interests', (
      SELECT json_agg(json_build_object('id', id, 'name', name, 'category', category))
      FROM interests
      ORDER BY category, name
    ),
    'skills', (
      SELECT json_agg(json_build_object('id', id, 'name', name, 'category', category))
      FROM skills
      ORDER BY category, name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_onboarding_performance_metrics()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'avg_completion_time', (
      SELECT AVG(EXTRACT(EPOCH FROM (onboarding_completed_at - created_at)))
      FROM profiles
      WHERE onboarding_completed = true AND onboarding_completed_at IS NOT NULL
    ),
    'step_distribution', (
      SELECT json_object_agg(onboarding_step, count)
      FROM (
        SELECT onboarding_step, COUNT(*) as count
        FROM profiles
        GROUP BY onboarding_step
      ) step_counts
    ),
    'daily_completions', (
      SELECT json_agg(json_build_object('date', completion_date, 'count', count))
      FROM (
        SELECT DATE(onboarding_completed_at) as completion_date, COUNT(*) as count
        FROM profiles
        WHERE onboarding_completed = true 
          AND onboarding_completed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(onboarding_completed_at)
        ORDER BY completion_date DESC
      ) daily_stats
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 5: RLS for New Functions
-- =================================================================

GRANT EXECUTE ON FUNCTION get_user_onboarding_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_profile_step_optimized(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION save_user_interests_optimized(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION save_user_goal_optimized(UUID, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION save_user_skills_and_complete(UUID, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_reference_data() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_onboarding_analytics() TO service_role;
GRANT EXECUTE ON FUNCTION get_onboarding_performance_metrics() TO service_role; 