import { supabase } from './supabase';
import { createLogger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = createLogger('OptimizedOnboardingService');

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INTERESTS_CACHE_KEY = 'onboarding_interests_cache';
const SKILLS_CACHE_KEY = 'onboarding_skills_cache';

// Interfaces
export interface Interest {
  id: string;
  name: string;
  category?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface UserSkill {
  skillId: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isOffering: boolean;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
}

export interface UserGoal {
  goalType: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: any;
}

export interface OptimizedOnboardingResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: string;
}

export interface OnboardingProgress {
  currentStep: string;
  completed: boolean;
  completionPercentage: number;
  profileData?: ProfileData;
  interests?: Interest[];
  goal?: UserGoal;
  skills?: UserSkill[];
  timeSpent?: number;
}

class OptimizedOnboardingService {
  private static instance: OptimizedOnboardingService;
  private interestsCache: { data: Interest[]; timestamp: number } | null = null;
  private skillsCache: { data: Skill[]; timestamp: number } | null = null;

  static getInstance(): OptimizedOnboardingService {
    if (!OptimizedOnboardingService.instance) {
      OptimizedOnboardingService.instance = new OptimizedOnboardingService();
    }
    return OptimizedOnboardingService.instance;
  }

  /**
   * OPTIMIZED: Get interests with caching
   */
  async getAvailableInterests(): Promise<OptimizedOnboardingResult> {
    try {
      // Check cache first
      if (this.interestsCache && (Date.now() - this.interestsCache.timestamp < CACHE_DURATION)) {
        logger.info('📦 Returning cached interests');
        return { success: true, data: this.interestsCache.data };
      }

      // Try memory cache first
      const cached = await this.getFromCache(INTERESTS_CACHE_KEY);
      if (cached) {
        this.interestsCache = cached;
        logger.info('📦 Returning persistent cached interests');
        return { success: true, data: cached.data };
      }

      // Fetch from database with optimized query
      logger.info('🔍 Fetching interests from database...');
      const { data, error } = await supabase
        .from('interests')
        .select('id, name, category')
        .order('category, name'); // Order by category for better UX

      if (error) throw error;

      // Cache the result
      const cacheData = { data: data || [], timestamp: Date.now() };
      this.interestsCache = cacheData;
      await this.setCache(INTERESTS_CACHE_KEY, cacheData);

      logger.info(`✅ Loaded and cached ${data?.length || 0} interests`);
      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('❌ Error fetching interests:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch interests' 
      };
    }
  }

  /**
   * OPTIMIZED: Get skills with caching
   */
  async getAvailableSkills(): Promise<OptimizedOnboardingResult> {
    try {
      // Check cache first
      if (this.skillsCache && (Date.now() - this.skillsCache.timestamp < CACHE_DURATION)) {
        logger.info('📦 Returning cached skills');
        return { success: true, data: this.skillsCache.data };
      }

      // Try persistent cache
      const cached = await this.getFromCache(SKILLS_CACHE_KEY);
      if (cached) {
        this.skillsCache = cached;
        logger.info('📦 Returning persistent cached skills');
        return { success: true, data: cached.data };
      }

      // Fetch from database with optimized query
      logger.info('🔍 Fetching skills from database...');
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('category, name'); // Order by category for better UX

      if (error) throw error;

      // Cache the result
      const cacheData = { data: data || [], timestamp: Date.now() };
      this.skillsCache = cacheData;
      await this.setCache(SKILLS_CACHE_KEY, cacheData);

      logger.info(`✅ Loaded and cached ${data?.length || 0} skills`);
      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('❌ Error fetching skills:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch skills' 
      };
    }
  }

  /**
   * OPTIMIZED: Get complete onboarding status with single query
   */
  async getOnboardingProgress(userId: string): Promise<OptimizedOnboardingResult> {
    try {
      logger.info('🔍 Fetching optimized onboarding progress...');

      // OPTIMIZATION: Single query with joins instead of 4 separate queries
      const { data, error } = await supabase.rpc('get_user_onboarding_progress', {
        user_id_param: userId
      });

      if (error) {
        // Fallback to individual queries if RPC doesn't exist
        return await this.getOnboardingProgressFallback(userId);
      }

      const progress = this.calculateProgress(data);
      logger.info(`✅ Progress calculated: ${progress.completionPercentage}%`);
      
      return { success: true, data: progress };

    } catch (error) {
      logger.error('❌ Error fetching onboarding progress:', error);
      return await this.getOnboardingProgressFallback(userId);
    }
  }

  /**
   * OPTIMIZED: Save profile step with batch operations
   */
  async saveProfile(userId: string, profileData: ProfileData): Promise<OptimizedOnboardingResult> {
    try {
      logger.info('💾 Saving profile with optimization...');

      // OPTIMIZATION: Batch profile update and step progression in single transaction
      const { data, error } = await supabase.rpc('save_profile_step_optimized', {
        user_id_param: userId,
        first_name_param: profileData.firstName,
        last_name_param: profileData.lastName,
        location_param: profileData.location,
        job_title_param: profileData.jobTitle,
        bio_param: profileData.bio,
        next_step_param: 'interests'
      });

      if (error) {
        // Fallback to traditional method
        return await this.saveProfileFallback(userId, profileData);
      }

      logger.info('✅ Profile saved with optimization');
      return { success: true, data, nextStep: 'interests' };

    } catch (error) {
      logger.error('❌ Error saving profile:', error);
      return await this.saveProfileFallback(userId, profileData);
    }
  }

  /**
   * OPTIMIZED: Save interests with batch operations
   */
  async saveInterests(userId: string, interestIds: string[]): Promise<OptimizedOnboardingResult> {
    try {
      logger.info('💾 Saving interests with optimization...');

      if (!interestIds || interestIds.length === 0) {
        return { success: false, error: 'At least one interest must be selected' };
      }

      // OPTIMIZATION: Batch delete and insert in single transaction
      const { error } = await supabase.rpc('save_user_interests_optimized', {
        user_id_param: userId,
        interest_ids_param: interestIds
      });

      if (error) {
        // Fallback to traditional method
        return await this.saveInterestsFallback(userId, interestIds);
      }

      logger.info('✅ Interests saved with optimization');
      return { success: true, nextStep: 'goals' };

    } catch (error) {
      logger.error('❌ Error saving interests:', error);
      return await this.saveInterestsFallback(userId, interestIds);
    }
  }

  /**
   * OPTIMIZED: Save goal with batch operations
   */
  async saveGoal(userId: string, goal: UserGoal): Promise<OptimizedOnboardingResult> {
    try {
      logger.info('💾 Saving goal with optimization...');

      const nextStep = goal.goalType === 'find_cofounder' ? 'project_details' : 'skills';

      // OPTIMIZATION: Batch goal save and step progression
      const { error } = await supabase.rpc('save_user_goal_optimized', {
        user_id_param: userId,
        goal_type_param: goal.goalType,
        details_param: goal.details,
        next_step_param: nextStep
      });

      if (error) {
        // Fallback to traditional method
        return await this.saveGoalFallback(userId, goal);
      }

      logger.info('✅ Goal saved with optimization');
      return { success: true, nextStep };

    } catch (error) {
      logger.error('❌ Error saving goal:', error);
      return await this.saveGoalFallback(userId, goal);
    }
  }

  /**
   * OPTIMIZED: Save skills and complete onboarding
   */
  async saveSkills(userId: string, skills: UserSkill[]): Promise<OptimizedOnboardingResult> {
    try {
      logger.info('💾 Saving skills and completing onboarding...');

      if (!skills || skills.length === 0) {
        return { success: false, error: 'At least one skill must be selected' };
      }

      // OPTIMIZATION: Batch skills save and onboarding completion
      const { error } = await supabase.rpc('save_user_skills_and_complete', {
        user_id_param: userId,
        skills_param: skills.map(skill => ({
          skill_id: skill.skillId,
          proficiency: skill.proficiency,
          is_offering: skill.isOffering
        }))
      });

      if (error) {
        // Fallback to traditional method
        return await this.saveSkillsFallback(userId, skills);
      }

      logger.info('✅ Skills saved and onboarding completed with optimization');
      return { success: true, data: { completed: true } };

    } catch (error) {
      logger.error('❌ Error saving skills:', error);
      return await this.saveSkillsFallback(userId, skills);
    }
  }

  /**
   * OPTIMIZED: Preload all onboarding data in parallel
   */
  async preloadOnboardingData(): Promise<void> {
    try {
      logger.info('🚀 Preloading onboarding data...');
      
      // OPTIMIZATION: Load interests and skills in parallel
      await Promise.all([
        this.getAvailableInterests(),
        this.getAvailableSkills()
      ]);
      
      logger.info('✅ Onboarding data preloaded');
    } catch (error) {
      logger.warn('⚠️ Failed to preload onboarding data:', error);
    }
  }

  // Cache utilities
  private async setCache(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      logger.warn('Cache set failed:', error);
    }
  }

  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed;
        }
      }
    } catch (error) {
      logger.warn('Cache get failed:', error);
    }
    return null;
  }

  // Fallback methods (original implementation for when RPC functions don't exist)
  private async getOnboardingProgressFallback(userId: string): Promise<OptimizedOnboardingResult> {
    try {
      // Parallel execution of independent queries
      const [profileResult, interestsResult, goalsResult, skillsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_interests').select('interest_id, interests(id, name, category)').eq('user_id', userId),
        supabase.from('user_goals').select('*').eq('user_id', userId).eq('is_active', true).single(),
        supabase.from('user_skills').select('skill_id, proficiency, is_offering, skills(id, name, category)').eq('user_id', userId)
      ]);

      const profile = profileResult.data;
      const interests = interestsResult.data?.map((ui: any) => ({
        id: ui.interests?.id,
        name: ui.interests?.name,
        category: ui.interests?.category
      })).filter(i => i.id) || [];

      const goal = goalsResult.data ? {
        goalType: goalsResult.data.goal_type,
        details: goalsResult.data.details
      } : undefined;

      const skills = skillsResult.data?.map((us: any) => ({
        skillId: us.skill_id,
        proficiency: us.proficiency,
        isOffering: us.is_offering
      })) || [];

      const progress: OnboardingProgress = {
        currentStep: profile?.onboarding_step || 'profile',
        completed: profile?.onboarding_completed || false,
        completionPercentage: this.calculateCompletionPercentage(profile, interests, goal, skills),
        profileData: profile ? {
          firstName: profile.first_name,
          lastName: profile.last_name,
          location: profile.location,
          jobTitle: profile.job_title,
          bio: profile.bio
        } : undefined,
        interests,
        goal,
        skills
      };

      return { success: true, data: progress };
    } catch (error) {
      logger.error('❌ Fallback progress fetch failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch progress' };
    }
  }

  private async saveProfileFallback(userId: string, profileData: ProfileData): Promise<OptimizedOnboardingResult> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: `${profileData.firstName} ${profileData.lastName}`,
        location: profileData.location,
        job_title: profileData.jobTitle,
        bio: profileData.bio,
        onboarding_step: 'interests',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, nextStep: 'interests' };
  }

  private async saveInterestsFallback(userId: string, interestIds: string[]): Promise<OptimizedOnboardingResult> {
    // Delete existing
    await supabase.from('user_interests').delete().eq('user_id', userId);
    
    // Insert new
    const { error } = await supabase
      .from('user_interests')
      .insert(interestIds.map(id => ({ user_id: userId, interest_id: id })));

    if (error) {
      return { success: false, error: error.message };
    }

    // Update step
    await supabase
      .from('profiles')
      .update({ onboarding_step: 'goals' })
      .eq('id', userId);

    return { success: true, nextStep: 'goals' };
  }

  private async saveGoalFallback(userId: string, goal: UserGoal): Promise<OptimizedOnboardingResult> {
    // Deactivate existing goals
    await supabase
      .from('user_goals')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Insert new goal
    const { error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        goal_type: goal.goalType,
        details: goal.details,
        is_active: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const nextStep = goal.goalType === 'find_cofounder' ? 'project_details' : 'skills';
    
    // Update step
    await supabase
      .from('profiles')
      .update({ onboarding_step: nextStep })
      .eq('id', userId);

    return { success: true, nextStep };
  }

  private async saveSkillsFallback(userId: string, skills: UserSkill[]): Promise<OptimizedOnboardingResult> {
    // Delete existing skills
    await supabase.from('user_skills').delete().eq('user_id', userId);
    
    // Insert new skills
    const { error } = await supabase
      .from('user_skills')
      .insert(skills.map(skill => ({
        user_id: userId,
        skill_id: skill.skillId,
        proficiency: skill.proficiency,
        is_offering: skill.isOffering
      })));

    if (error) {
      return { success: false, error: error.message };
    }

    // Complete onboarding
    await supabase
      .from('profiles')
      .update({
        onboarding_step: 'completed',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { success: true, data: { completed: true } };
  }

  private calculateProgress(data: any): OnboardingProgress {
    // Implementation depends on the RPC function return structure
    return data;
  }

  private calculateCompletionPercentage(profile: any, interests: any[], goal: any, skills: any[]): number {
    let completed = 0;
    const total = 4;

    if (profile?.first_name && profile?.last_name) completed++;
    if (interests.length > 0) completed++;
    if (goal) completed++;
    if (skills.length > 0) completed++;

    return Math.floor((completed / total) * 100);
  }
}

export const optimizedOnboardingService = OptimizedOnboardingService.getInstance(); 