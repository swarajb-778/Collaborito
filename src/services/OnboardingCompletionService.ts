import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingCompletionService');

export interface OnboardingCompletionMetrics {
  userId: string;
  completedAt: Date;
  totalStepsCompleted: number;
  skippedSteps: string[];
  timeToComplete: number; // in milliseconds
  completionPercentage: number;
  deviceInfo?: {
    platform: string;
    version: string;
  };
}

export class OnboardingCompletionService {
  private static instance: OnboardingCompletionService;
  
  static getInstance(): OnboardingCompletionService {
    if (!OnboardingCompletionService.instance) {
      OnboardingCompletionService.instance = new OnboardingCompletionService();
    }
    return OnboardingCompletionService.instance;
  }

  /**
   * Mark onboarding as completed and track metrics
   */
  async completeOnboarding(
    userId: string, 
    metrics: Partial<OnboardingCompletionMetrics>
  ): Promise<boolean> {
    try {
      logger.info(`Completing onboarding for user: ${userId}`);

      // Update user profile to mark onboarding as completed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      // Save completion metrics for analytics
      await this.saveCompletionMetrics(userId, metrics);

      // Send completion event for analytics
      await this.sendCompletionEvent(userId, metrics);

      logger.info(`✅ Onboarding completed successfully for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Failed to complete onboarding:', error);
      return false;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async isOnboardingCompleted(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        logger.warn('Could not check onboarding status:', error);
        return false;
      }

      return data?.onboarding_completed === true;

    } catch (error) {
      logger.error('Error checking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Get onboarding completion percentage
   */
  async getCompletionPercentage(userId: string): Promise<number> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const { data: interests } = await supabase
        .from('user_interests')
        .select('id')
        .eq('user_id', userId);

      const { data: goals } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      const { data: skills } = await supabase
        .from('user_skills')
        .select('id')
        .eq('user_id', userId);

      let completed = 0;
      const total = 4; // profile, interests, goals, skills

      if (profile?.first_name && profile?.last_name) completed++;
      if (interests && interests.length > 0) completed++;
      if (goals && goals.length > 0) completed++;
      if (skills && skills.length > 0) completed++;

      return Math.floor((completed / total) * 100);

    } catch (error) {
      logger.error('Error calculating completion percentage:', error);
      return 0;
    }
  }

  /**
   * Get onboarding analytics summary
   */
  async getOnboardingAnalytics(): Promise<any> {
    try {
      // This would be used for admin/analytics purposes
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          onboarding_completed,
          onboarding_step,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalUsers = data.length;
      const completedUsers = data.filter(u => u.onboarding_completed).length;
      const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

      const stepDistribution = data.reduce((acc: any, user) => {
        const step = user.onboarding_step || 'profile';
        acc[step] = (acc[step] || 0) + 1;
        return acc;
      }, {});

      return {
        totalUsers,
        completedUsers,
        completionRate: Math.round(completionRate),
        stepDistribution,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting onboarding analytics:', error);
      return null;
    }
  }

  /**
   * Reset onboarding for a user (development only)
   */
  async resetOnboarding(userId: string): Promise<boolean> {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Onboarding reset not allowed in production');
        return false;
      }

      logger.info(`Resetting onboarding for user: ${userId}`);

      // Reset profile onboarding status
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: false,
          onboarding_step: 'profile',
          first_name: null,
          last_name: null,
          location: null,
          job_title: null
        })
        .eq('id', userId);

      // Clear user data
      await Promise.all([
        supabase.from('user_interests').delete().eq('user_id', userId),
        supabase.from('user_goals').delete().eq('user_id', userId),
        supabase.from('user_skills').delete().eq('user_id', userId)
      ]);

      logger.info(`✅ Onboarding reset completed for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Failed to reset onboarding:', error);
      return false;
    }
  }

  /**
   * Save completion metrics for analytics
   */
  private async saveCompletionMetrics(
    userId: string, 
    metrics: Partial<OnboardingCompletionMetrics>
  ): Promise<void> {
    try {
      // This could be saved to a separate analytics table
      // For now, we'll just log it
      logger.info('Onboarding completion metrics:', {
        userId,
        completedAt: new Date().toISOString(),
        ...metrics
      });

      // In a real implementation, you might save to an analytics service
      // or a dedicated table for tracking onboarding metrics

    } catch (error) {
      logger.error('Failed to save completion metrics:', error);
    }
  }

  /**
   * Send completion event for analytics
   */
  private async sendCompletionEvent(
    userId: string, 
    metrics: Partial<OnboardingCompletionMetrics>
  ): Promise<void> {
    try {
      // This could integrate with analytics services like Mixpanel, Amplitude, etc.
      logger.info('Sending onboarding completion event', {
        event: 'onboarding_completed',
        userId,
        properties: metrics
      });

      // Example: Analytics.track('onboarding_completed', { userId, ...metrics });

    } catch (error) {
      logger.error('Failed to send completion event:', error);
    }
  }
} 