// Supabase Edge Function for updating onboarding steps
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Valid onboarding steps
const VALID_STEPS = ['profile', 'interests', 'goals', 'project_details', 'skills', 'completed']

/**
 * Update the user's onboarding step
 */
async function updateOnboardingStep(userId: string, step: string) {
  if (!VALID_STEPS.includes(step)) {
    throw new Error(`Invalid step: ${step}`)
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      onboarding_step: step,
      // If step is 'completed', mark onboarding as completed
      ...(step === 'completed' ? { onboarding_completed: true } : {})
    })
    .eq('id', userId)

  if (error) throw error

  return { success: true, step }
}

/**
 * Get the user's current onboarding status
 */
async function getOnboardingStatus(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_step, onboarding_completed')
    .eq('id', userId)
    .single()

  if (error) throw error

  return { 
    success: true, 
    currentStep: data.onboarding_step || 'profile',
    completed: data.onboarding_completed || false
  }
}

/**
 * Calculate the next step based on the current step and user's goal
 */
async function calculateNextStep(userId: string, currentStep: string) {
  if (currentStep === 'completed') {
    return { nextStep: 'completed' }
  }

  // Get current index and calculate next step
  const currentIndex = VALID_STEPS.indexOf(currentStep)
  
  // If current step not found or is the last step, return completed
  if (currentIndex === -1 || currentIndex === VALID_STEPS.length - 1) {
    return { nextStep: 'completed' }
  }

  // Handle special logic for goals step
  if (currentStep === 'goals') {
    // Check user's selected goal to determine the next step
    const { data, error } = await supabase
      .from('user_goals')
      .select('goal_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error) {
      // Default to project_details if no goal found
      return { nextStep: 'project_details' }
    }

    // If goal type is find_cofounder or find_collaborators, go to project_details
    // Otherwise, skip to skills
    if (data.goal_type === 'find_cofounder' || data.goal_type === 'find_collaborators') {
      return { nextStep: 'project_details' }
    } else {
      return { nextStep: 'skills' }
    }
  }

  // For other steps, just go to the next step in the sequence
  return { nextStep: VALID_STEPS[currentIndex + 1] }
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

    // Parse the request body
    const requestData = await req.json()
    const { action } = requestData

    // Handle different actions
    let result
    switch (action) {
      case 'get_status':
        result = await getOnboardingStatus(user.id)
        break

      case 'update_step':
        const { step } = requestData
        if (!step) {
          return new Response(
            JSON.stringify({ error: 'Missing step parameter' }),
            { status: 400, headers }
          )
        }
        result = await updateOnboardingStep(user.id, step)
        break

      case 'next_step':
        // Get current status first
        const status = await getOnboardingStatus(user.id)
        
        // Calculate next step
        const { nextStep } = await calculateNextStep(user.id, status.currentStep)
        
        // Update to the next step
        result = await updateOnboardingStep(user.id, nextStep)
        break

      case 'complete':
        // Mark onboarding as completed
        result = await updateOnboardingStep(user.id, 'completed')
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
    console.error(`Error updating onboarding step:`, error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update onboarding step',
        message: error.message
      }),
      { status: 500, headers }
    )
  }
}) 