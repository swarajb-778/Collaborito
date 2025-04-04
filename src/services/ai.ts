import Constants from 'expo-constants';
import { supabase } from './supabase';

// Check if we're in development mode
const isDevelopmentMode = 
  Constants.expoConfig?.extra?.CLAUDE_API_KEY === 'development-placeholder';

// Mock responses for development mode
const mockResponses = {
  summarizeDiscussion: "This is a mock summary of the discussion. The team discussed project timelines, feature priorities, and next steps. There was agreement on focusing on the MVP features first.",
  
  generateTasks: [
    { title: "Create wireframes for user dashboard", description: "Design the layout and components for the main user dashboard" },
    { title: "Implement authentication flow", description: "Set up the login, registration, and password recovery flows" },
    { title: "Set up CI/CD pipeline", description: "Configure the continuous integration and deployment workflow" },
  ],
  
  assistWithWriting: "This is a mock writing assistance response. The text has been improved for clarity and impact. Key points have been emphasized and the structure has been enhanced.",
  
  answerProjectQuestion: "This is a mock answer to your project question. Based on the information available, I recommend considering option A because it aligns better with your project goals and timeline constraints."
};

/**
 * Calls the Claude AI through Supabase Edge Function
 */
export const callClaudeAI = async (
  prompt: string, 
  contextType: 'general' | 'project' | 'task' = 'general',
  contextId?: string
) => {
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
      throw new Error(`Error calling Claude AI: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error in AI service:', error.message);
    throw error;
  }
};

/**
 * Summarizes a project discussion
 */
export const summarizeDiscussion = async (projectId: string) => {
  const prompt = `Please summarize the recent discussion in this project.`;
  return callClaudeAI(prompt, 'project', projectId);
};

/**
 * Generates tasks based on project context
 */
export const generateTasks = async (projectId: string, description: string) => {
  const prompt = `Based on this project description: "${description}", please generate a list of tasks that would help complete this project.`;
  const response = await callClaudeAI(prompt, 'project', projectId);
  
  // Parse the response as JSON if it's a task list
  try {
    if (typeof response.result === 'string') {
      return JSON.parse(response.result);
    }
    return response.result;
  } catch (e) {
    // If parsing fails, return the raw response
    return response.result;
  }
};

/**
 * Assists with writing project descriptions or messages
 */
export const assistWithWriting = async (text: string, contextType: 'general' | 'project' | 'task', contextId?: string) => {
  const prompt = `Please help me improve this text: "${text}". Make it more clear, professional, and impactful.`;
  return callClaudeAI(prompt, contextType, contextId);
}; 