-- Fix for get_onboarding_reference_data function
-- Issue: GROUP BY clause error in the reference data function

-- Drop and recreate the function with correct SQL
DROP FUNCTION IF EXISTS get_onboarding_reference_data();

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_onboarding_reference_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_reference_data() TO anon; 