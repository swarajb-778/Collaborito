import Constants from 'expo-constants';
import { supabase } from './supabase';

// Check if we're in development mode
const isDevelopmentMode = 
  Constants.expoConfig?.extra?.CLAUDE_API_KEY === 'development-placeholder';

// Define types for AI responses
export interface AIResponse {
  result: string;
  error?: string;
}

export interface AITask {
  title: string;
  description: string;
}

// Mock responses for development mode
const mockResponses = {
  summarizeDiscussion: "This is a mock summary of the discussion. The team discussed project timelines, feature priorities, and next steps. There was agreement on focusing on the MVP features first.",
  
  generateTasks: [
    { title: "Create wireframes for user dashboard", description: "Design the layout and components for the main user dashboard" },
    { title: "Implement authentication flow", description: "Set up the login, registration, and password recovery flows" },
    { title: "Set up CI/CD pipeline", description: "Configure the continuous integration and deployment workflow" },
  ] as AITask[],
  
  assistWithWriting: "This is a mock writing assistance response. The text has been improved for clarity and impact. Key points have been emphasized and the structure has been enhanced.",
  
  answerProjectQuestion: "This is a mock answer to your project question. Based on the information available, I recommend considering option A because it aligns better with your project goals and timeline constraints."
};

/**
 * Calls the Claude AI through Supabase Edge Function
 * @param prompt The text prompt to send to Claude
 * @param contextType Type of context for the AI (general, project, task)
 * @param contextId Optional ID for the context (project ID, task ID)
 * @returns Promise with the AI response
 */
export const callClaudeAI = async (
  prompt: string, 
  contextType: 'general' | 'project' | 'task' = 'general',
  contextId?: string
): Promise<AIResponse> => {
  try {
    // If in development mode, return mock responses based on prompt keywords
    if (isDevelopmentMode) {
      console.log('Using development mode for AI service');
      
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (prompt.toLowerCase().includes('summarize') || prompt.toLowerCase().includes('summary')) {
        return { result: mockResponses.summarizeDiscussion };
      }
      
      if (prompt.toLowerCase().includes('tasks') || prompt.toLowerCase().includes('todo')) {
        return { result: JSON.stringify(mockResponses.generateTasks) };
      }
      
      if (prompt.toLowerCase().includes('write') || prompt.toLowerCase().includes('writing')) {
        return { result: mockResponses.assistWithWriting };
      }
      
      // Default response
      return { result: mockResponses.answerProjectQuestion };
    }
    
    // Production mode - call the actual Supabase edge function
    const { data, error } = await supabase.functions.invoke('claude-ai', {
      body: { 
        prompt,
        contextType,
        contextId
      },
    });

    if (error) {
      console.error(`Error calling Claude AI: ${error.message}`);
      return { result: '', error: error.message };
    }

    if (!data || !data.result) {
      return { result: '', error: 'No response received from AI service' };
    }

    return data as AIResponse;
  } catch (error: any) {
    console.error('Error in AI service:', error.message);
    return { result: '', error: error.message };
  }
};

/**
 * Summarizes a project discussion
 * @param projectId The project ID to summarize discussions for
 * @returns Promise with the AI summary
 */
export const summarizeDiscussion = async (projectId: string): Promise<AIResponse> => {
  const prompt = `Please summarize the recent discussion in this project.`;
  return callClaudeAI(prompt, 'project', projectId);
};

/**
 * Generates tasks based on project context
 * @param projectId The project ID to generate tasks for
 * @param description Project description to base tasks on
 * @returns Promise with the list of tasks
 */
export const generateTasks = async (projectId: string, description: string): Promise<AITask[]> => {
  const prompt = `Based on this project description: "${description}", please generate a list of tasks that would help complete this project.`;
  const response = await callClaudeAI(prompt, 'project', projectId);
  
  // Parse the response as JSON if it's a task list
  try {
    if (typeof response.result === 'string') {
      return JSON.parse(response.result);
    }
    return response.result as unknown as AITask[];
  } catch (e) {
    // If parsing fails, return an empty array
    console.error('Error parsing AI task response:', e);
    return [];
  }
};

/**
 * Assists with writing project descriptions or messages
 * @param text The text to improve
 * @param contextType Type of context for the AI
 * @param contextId Optional ID for the context
 * @returns Promise with the improved text
 */
export const assistWithWriting = async (
  text: string, 
  contextType: 'general' | 'project' | 'task' = 'general', 
  contextId?: string
): Promise<AIResponse> => {
  const prompt = `Please help me improve this text: "${text}". Make it more clear, professional, and impactful.`;
  return callClaudeAI(prompt, contextType, contextId);
};

/**
 * Logs AI interactions to the database for future reference
 * @param userId User ID who made the request
 * @param prompt The prompt sent to the AI
 * @param response The AI response
 * @param contextType Type of context for the AI
 * @param contextId Optional ID for the context
 */
export const logAIInteraction = async (
  userId: string,
  prompt: string,
  response: string,
  contextType: 'general' | 'project' | 'task',
  contextId?: string
): Promise<void> => {
  try {
    if (isDevelopmentMode) {
      console.log('Skipping AI interaction logging in development mode');
      return;
    }
    
    await supabase.from('ai_chat_history').insert({
      user_id: userId,
      prompt,
      response,
      context_type: contextType,
      context_id: contextId
    });
  } catch (error) {
    console.error('Error logging AI interaction:', error);
  }
}; 