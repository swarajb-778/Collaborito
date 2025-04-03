// Supabase Edge Function for Claude AI integration
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const claudeApiKey = Deno.env.get('CLAUDE_API_KEY') || ''

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Claude AI integration using Anthropic API
 */
async function callClaude(
  prompt: string,
  model: string = 'claude-3-opus-20240229', 
  maxTokens: number = 1000,
  temperature: number = 0.7
) {
  const url = 'https://api.anthropic.com/v1/messages'
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Claude API Error: ${errorData.error?.message || response.statusText}`)
    }
    
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error('Error calling Claude API:', error)
    throw error
  }
}

/**
 * Handle different AI use cases based on the context_type
 */
async function handleAiRequest(
  userId: string,
  projectId: string | null,
  message: string,
  contextType: 'general' | 'project' | 'task'
) {
  // Get user information
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
    
  if (userError) {
    throw new Error(`Error fetching user profile: ${userError.message}`)
  }
  
  let prompt = ''
  let context = ''
  
  // Gather context based on the request type
  if (contextType === 'project' && projectId) {
    // Get project information
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .single()
      
    if (projectError) {
      throw new Error(`Error fetching project: ${projectError.message}`)
    }
    
    // Get recent messages for context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content, user_id, created_at, profiles(full_name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)
      
    if (messagesError) {
      throw new Error(`Error fetching messages: ${messagesError.message}`)
    }
    
    // Format context
    context = `
Project: ${project.name}
Description: ${project.description || 'No description'}

Recent messages:
${messages.map(msg => `${msg.profiles.full_name}: ${msg.content}`).join('\n')}
`
    
    prompt = `You are an AI assistant for a project collaboration app. You're helping with a project named "${project.name}".
    
${context}

User ${userProfile.full_name} asks: "${message}"

Provide a helpful, concise response related to this project context.`
  } else if (contextType === 'task' && projectId) {
    // Get tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('title, description, status, created_at, profiles(full_name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      
    if (tasksError) {
      throw new Error(`Error fetching tasks: ${tasksError.message}`)
    }
    
    context = `
Project Tasks:
${tasks.map(task => `- ${task.title} (${task.status}): ${task.description || 'No description'}`).join('\n')}
`
    
    prompt = `You are an AI assistant for project task management. You're helping with tasks in a project.
    
${context}

User ${userProfile.full_name} asks: "${message}"

Provide a helpful, concise response about the tasks, such as suggestions, summaries, or status updates.`
  } else {
    // General AI assistant
    prompt = `You are Claude, an AI assistant for a project collaboration app called Collaborito.
    
User ${userProfile.full_name} asks: "${message}"

Provide a helpful, concise response to assist them with their question or request.`
  }
  
  // Call Claude API
  const aiResponse = await callClaude(prompt)
  
  // Log the interaction
  await supabase
    .from('ai_chat_history')
    .insert({
      user_id: userId,
      project_id: projectId,
      user_message: message,
      ai_response: aiResponse,
      context_type: contextType
    })
  
  return {
    response: aiResponse
  }
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token and get the user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }
    
    // Parse the request body
    const { message, projectId, contextType } = await req.json()
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }
    
    // Process the AI request
    const result = await handleAiRequest(
      user.id,
      projectId || null,
      message,
      contextType || 'general'
    )
    
    // Return the response
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
}) 