import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

// Initialize Supabase with environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase URL or Anon Key. Please set up your environment variables.');
}

// Get the base URL for the app based on the scheme
const getBaseUrl = () => {
  const scheme = Constants.expoConfig?.scheme || 'collaborito';
  return Linking.createURL('/');
};

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: __DEV__,
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

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  avatar_url?: string;
  skills?: string[];
  bio?: string;
  linkedin_profile?: string;
}

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  status: 'active' | 'completed' | 'archived';
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