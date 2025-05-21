// Supabase Edge Function for tracking onboarding completion status
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Get detailed onboarding status for a user with all related data
 */
async function getDetailedOnboardingStatus(userId: string) {
  try {
    // Get user profile data with current onboarding step
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_step, onboarding_completed, first_name, last_name, location, job_title, bio')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Get user interests
    const { data: interests, error: interestsError } = await supabase
      .from('user_interests')
      .select(`
        interest_id,
        interest:interests(id, name)
      `)
      .eq('user_id', userId)

    if (interestsError) throw interestsError

    // Get active user goal
    const { data: goal, error: goalError } = await supabase
      .from('user_goals')
      .select('goal_type, details')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    // No error check for goal since it might not exist

    // Get user skills
    const { data: skills, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        skill_id,
        is_offering,
        proficiency,
        skill:skills(id, name)
      `)
      .eq('user_id', userId)

    if (skillsError) throw skillsError

    // Get user projects if they've chosen to find co-founders or collaborators
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, tags')
      .eq('owner_id', userId)

    if (projectsError) throw projectsError

    // Calculate completion percentage
    let completed = 0
    let total = 4 // Base required steps: profile, interests, goals, skills
    
    // Check if profile info is complete
    if (profile.first_name && profile.last_name) completed++
    
    // Check if interests are selected
    if (interests.length > 0) completed++
    
    // Check if a goal is selected
    if (goal) {
      completed++
      
      // If goal requires project details, add that as a step
      if (goal.goal_type === 'find_cofounder' || goal.goal_type === 'find_collaborators') {
        total++ // Add project details as a required step
        
        // Check if project details are complete
        if (projects.length > 0) completed++
      }
    }
    
    // Check if skills are selected
    if (skills.length > 0) completed++
    
    const completionPercentage = Math.floor((completed / total) * 100)

    return {
      success: true,
      currentStep: profile.onboarding_step || 'profile',
      completed: profile.onboarding_completed || false,
      completionPercentage,
      profile: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        location: profile.location,
        jobTitle: profile.job_title,
        bio: profile.bio
      },
      interests: interests.map(i => ({
        id: i.interest_id,
        name: i.interest?.name
      })),
      goal: goal ? {
        type: goal.goal_type,
        details: goal.details
      } : null,
      skills: skills.map(s => ({
        id: s.skill_id,
        name: s.skill?.name,
        isOffering: s.is_offering,
        proficiency: s.proficiency
      })),
      projects: projects
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update onboarding completion status
 */
async function completeOnboarding(userId: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 'completed'
      })
      .eq('id', userId)

    if (error) throw error

    return { success: true, completed: true }
  } catch (error) {
    throw error
  }
}

/**
 * Reset onboarding status for testing
 */
async function resetOnboarding(userId: string) {
  try {
    // Only allow in development environment
    const isDev = Deno.env.get('ENVIRONMENT') === 'development'
    if (!isDev) {
      throw new Error('Reset function only available in development')
    }

    // Reset profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
        onboarding_step: 'profile',
        first_name: null,
        last_name: null,
        location: null,
        job_title: null
      })
      .eq('id', userId)

    if (profileError) throw profileError

    // Delete interests
    const { error: interestsError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)

    if (interestsError) throw interestsError

    // Delete goals
    const { error: goalsError } = await supabase
      .from('user_goals')
      .delete()
      .eq('user_id', userId)

    if (goalsError) throw goalsError

    // Delete skills
    const { error: skillsError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)

    if (skillsError) throw skillsError

    return { success: true, reset: true }
  } catch (error) {
    throw error
  }
}

// Main handler for the Edge Function
serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }
  
  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers }
      )
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token and get the user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers }
      )
    }

    // Parse the request body if it's not a GET request
    let action = 'get_status' // Default action for GET
    if (req.method !== 'GET') {
      const requestData = await req.json()
      action = requestData.action || 'get_status'
    }

    // Handle different actions
    let result
    switch (action) {
      case 'get_status':
        result = await getDetailedOnboardingStatus(user.id)
        break

      case 'complete':
        result = await completeOnboarding(user.id)
        break

      case 'reset':
        result = await resetOnboarding(user.id)
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers }
        )
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers }
    )
  } catch (error) {
    console.error(`Error processing onboarding status:`, error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process onboarding status',
        message: error.message
      }),
      { status: 500, headers }
    )
  }
}) 