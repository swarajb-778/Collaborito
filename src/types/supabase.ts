/**
 * Type definitions for Supabase database tables
 */

export interface User {
  id: string;
  created_at: string;
  updated_at?: string;
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
  first_name?: string;
  last_name?: string;
  location?: string;
  job_title?: string;
  profile_image_path?: string;
  onboarding_completed?: boolean;
  onboarding_step?: 'profile' | 'interests' | 'goals' | 'project_details' | 'skills' | 'completed';
  avatar_url?: string;
  skills?: string[];
  bio?: string;
  linkedin_profile?: string;
  email?: string;
}

export interface Interest {
  id: string;
  created_at: string;
  name: string;
  category?: string;
}

export interface UserInterest {
  id: string;
  created_at: string;
  user_id: string;
  interest_id: string;
  interest?: Interest;
}

export interface Skill {
  id: string;
  created_at: string;
  name: string;
  category?: string;
}

export interface UserSkill {
  id: string;
  created_at: string;
  user_id: string;
  skill_id: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_offering: boolean;
  skill?: Skill;
}

export interface UserGoal {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  goal_type: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  is_active: boolean;
  details?: {
    [key: string]: any;
  };
}

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  status: 'active' | 'completed' | 'archived';
  owner_id: string;
}

export interface ProjectSkill {
  id: string;
  created_at: string;
  project_id: string;
  skill_id: string;
  importance?: 'nice_to_have' | 'important' | 'critical';
  skill?: Skill;
}

export interface ProjectMember {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profile?: Profile;
}

export interface Invitation {
  id: string;
  created_at: string;
  project_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  role: 'admin' | 'member';
  invited_by: string;
  message?: string;
}

export interface Message {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  assignee?: Profile;
}

export interface File {
  id: string;
  created_at: string;
  project_id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_by: string;
  description?: string;
  uploader?: Profile;
}

export interface DeviceToken {
  id: string;
  created_at: string;
  user_id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  is_active: boolean;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: 'invitation' | 'message' | 'task' | 'mention' | 'system';
  title: string;
  body: string;
  is_read: boolean;
  data?: {
    project_id?: string;
    task_id?: string;
    message_id?: string;
    invitation_id?: string;
    [key: string]: any;
  };
}

export interface AIChatHistory {
  id: string;
  created_at: string;
  user_id: string;
  prompt: string;
  response: string;
  context_type: 'general' | 'project' | 'task';
  context_id?: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    [key: string]: any;
  } | null;
} 