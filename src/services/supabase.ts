import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Initialize Supabase
// We'll replace these with environment variables once they're available
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase URL or Anon Key. Please set up your environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// TypeScript interfaces for Supabase tables
export interface User {
  id: string;
  created_at: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  linkedin_id?: string;
}

export interface Project {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  owner_id: string;
}

export interface ProjectMember {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
}

export interface Message {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  content: string;
}

export interface Task {
  id: string;
  created_at: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  assigned_to?: string;
} 