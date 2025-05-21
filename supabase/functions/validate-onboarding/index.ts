// Supabase Edge Function for validating and saving onboarding data
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as Ajv from 'https://esm.sh/ajv@8.12.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialize the JSON schema validator
const ajv = new Ajv.default()

// JSON Schemas for validating different types of onboarding data
const schemas = {
  profile: {
    type: 'object',
    required: ['firstName', 'lastName'],
    properties: {
      firstName: { type: 'string', minLength: 1, maxLength: 50 },
      lastName: { type: 'string', minLength: 1, maxLength: 50 },
      location: { type: 'string', maxLength: 100 },
      jobTitle: { type: 'string', maxLength: 100 },
      bio: { type: 'string', maxLength: 500 },
    },
    additionalProperties: false
  },
  interests: {
    type: 'object',
    required: ['interestIds'],
    properties: {
      interestIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        minItems: 1,
        maxItems: 20
      }
    },
    additionalProperties: false
  },
  goals: {
    type: 'object',
    required: ['goalType'],
    properties: {
      goalType: { 
        type: 'string', 
        enum: ['find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas'] 
      },
      details: { type: 'object' }
    },
    additionalProperties: false
  },
  project_details: {
    type: 'object',
    required: ['name', 'description'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', minLength: 10, maxLength: 1000 },
      tags: { 
        type: 'array', 
        items: { type: 'string' },
        maxItems: 10
      }
    },
    additionalProperties: false
  },
  skills: {
    type: 'object',
    required: ['skills'],
    properties: {
      skills: {
        type: 'array',
        items: {
          type: 'object',
          required: ['skillId', 'isOffering'],
          properties: {
            skillId: { type: 'string', format: 'uuid' },
            isOffering: { type: 'boolean' },
            proficiency: { 
              type: 'string', 
              enum: ['beginner', 'intermediate', 'advanced', 'expert'],
              nullable: true
            }
          }
        },
        minItems: 1,
        maxItems: 20
      }
    },
    additionalProperties: false
  }
}

// Compile schemas
const validators = {
  profile: ajv.compile(schemas.profile),
  interests: ajv.compile(schemas.interests),
  goals: ajv.compile(schemas.goals),
  project_details: ajv.compile(schemas.project_details),
  skills: ajv.compile(schemas.skills)
}

/**
 * Validate and save profile data
 */
async function saveProfileData(userId: string, data: any) {
  // Convert from camelCase to snake_case for DB
  const profileData = {
    first_name: data.firstName,
    last_name: data.lastName,
    location: data.location,
    job_title: data.jobTitle,
    bio: data.bio,
    onboarding_step: 'profile'
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)

  if (error) throw error

  return { success: true }
}

/**
 * Save user interests
 */
async function saveInterests(userId: string, data: { interestIds: string[] }) {
  // First delete any existing interests
  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  // Insert new interests
  const interestsData = data.interestIds.map(id => ({
    user_id: userId,
    interest_id: id
  }))

  const { error: insertError } = await supabase
    .from('user_interests')
    .insert(interestsData)

  if (insertError) throw insertError

  // Update onboarding step
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ onboarding_step: 'interests' })
    .eq('id', userId)

  if (updateError) throw updateError

  return { success: true }
}

/**
 * Save user goal selection
 */
async function saveGoal(userId: string, data: { goalType: string, details?: Record<string, any> }) {
  // First deactivate any existing goals
  const { error: updateError } = await supabase
    .from('user_goals')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (updateError) throw updateError

  // Insert the new goal
  const { error: insertError } = await supabase
    .from('user_goals')
    .insert({
      user_id: userId,
      goal_type: data.goalType,
      is_active: true,
      details: data.details || {}
    })

  if (insertError) throw insertError

  // Update onboarding step
  const { error: stepError } = await supabase
    .from('profiles')
    .update({ onboarding_step: 'goals' })
    .eq('id', userId)

  if (stepError) throw stepError

  return { success: true }
}

/**
 * Save project details (when user selects find_cofounder or find_collaborators)
 */
async function saveProjectDetails(userId: string, data: { name: string, description: string, tags?: string[] }) {
  // Create a new project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: data.name,
      description: data.description,
      owner_id: userId,
      tags: data.tags || [],
      status: 'active'
    })
    .select()
    .single()

  if (projectError) throw projectError

  // Add the user as a project member with owner role
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: userId,
      role: 'owner'
    })

  if (memberError) throw memberError

  // Update onboarding step
  const { error: stepError } = await supabase
    .from('profiles')
    .update({ onboarding_step: 'project_details' })
    .eq('id', userId)

  if (stepError) throw stepError

  return { success: true, projectId: project.id }
}

/**
 * Save user skills
 */
async function saveSkills(
  userId: string, 
  data: { 
    skills: { skillId: string, isOffering: boolean, proficiency?: string }[] 
  }
) {
  // First delete any existing skills
  const { error: deleteError } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  // Insert new skills
  const skillsData = data.skills.map(skill => ({
    user_id: userId,
    skill_id: skill.skillId,
    is_offering: skill.isOffering,
    proficiency: skill.proficiency
  }))

  const { error: insertError } = await supabase
    .from('user_skills')
    .insert(skillsData)

  if (insertError) throw insertError

  // Update onboarding step
  const { error: stepError } = await supabase
    .from('profiles')
    .update({ onboarding_step: 'skills' })
    .eq('id', userId)

  if (stepError) throw stepError

  return { success: true }
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
    const { step, data } = requestData

    // Validate the step
    if (!step || !['profile', 'interests', 'goals', 'project_details', 'skills'].includes(step)) {
      return new Response(
        JSON.stringify({ error: 'Invalid step parameter' }),
        { status: 400, headers }
      )
    }

    // Validate the data using the appropriate schema
    const validate = validators[step]
    const valid = validate(data)

    if (!valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid data', 
          details: validate.errors 
        }),
        { status: 400, headers }
      )
    }

    // Process data based on step
    let result
    switch (step) {
      case 'profile':
        result = await saveProfileData(user.id, data)
        break
      case 'interests':
        result = await saveInterests(user.id, data)
        break
      case 'goals':
        result = await saveGoal(user.id, data)
        break
      case 'project_details':
        result = await saveProjectDetails(user.id, data)
        break
      case 'skills':
        result = await saveSkills(user.id, data)
        break
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers }
    )
  } catch (error) {
    console.error(`Error processing onboarding data:`, error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process onboarding data',
        message: error.message
      }),
      { status: 500, headers }
    )
  }
}) 