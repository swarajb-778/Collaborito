// Comprehensive Onboarding Analytics Service
// Tracks user journey, performance metrics, and provides insights for optimization

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { ONBOARDING_CONFIG } from '../config/onboardingConfig';

export interface OnboardingEvent {
  id: string;
  userId: string;
  stepId: string;
  action: 'start' | 'complete' | 'skip' | 'abandon' | 'retry' | 'error';
  timestamp: Date;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
  userAgent?: string;
  platform?: string;
}

export interface OnboardingMetrics {
  totalTime: number;
  stepTimes: Record<string, number>;
  errors: OnboardingError[];
  retries: Record<string, number>;
  skippedSteps: string[];
  completionRate: number;
  dropoffPoints: string[];
}

export interface OnboardingError {
  stepId: string;
  errorType: string;
  errorMessage: string;
  timestamp: Date;
  resolved: boolean;
}

export interface AnalyticsInsights {
  avgCompletionTime: number;
  mostTimeConsumingStep: string;
  highestDropoffStep: string;
  commonErrors: Record<string, number>;
  improvementSuggestions: string[];
}

export class OnboardingAnalytics {
  private static instance: OnboardingAnalytics;
  private events: OnboardingEvent[] = [];
  private startTimes: Record<string, number> = {};
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.loadCachedEvents();
  }

  static getInstance(): OnboardingAnalytics {
    if (!OnboardingAnalytics.instance) {
      OnboardingAnalytics.instance = new OnboardingAnalytics();
    }
    return OnboardingAnalytics.instance;
  }

  // Track when user starts a step
  async trackStepStart(userId: string, stepId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const event: OnboardingEvent = {
        id: this.generateEventId(),
        userId,
        stepId,
        action: 'start',
        timestamp: new Date(),
        metadata: {
          ...metadata,
          sessionId: this.sessionId,
        },
        platform: this.getPlatform(),
      };

      this.startTimes[stepId] = Date.now();
      this.events.push(event);
      
      await this.persistEvent(event);
      console.log(`📊 Analytics: Started step ${stepId}`);
    } catch (error) {
      console.error('Failed to track step start:', error);
    }
  }

  // Track when user completes a step
  async trackStepComplete(userId: string, stepId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const duration = this.startTimes[stepId] ? Date.now() - this.startTimes[stepId] : undefined;
      
      const event: OnboardingEvent = {
        id: this.generateEventId(),
        userId,
        stepId,
        action: 'complete',
        timestamp: new Date(),
        duration,
        metadata: {
          ...metadata,
          sessionId: this.sessionId,
        },
        platform: this.getPlatform(),
      };

      this.events.push(event);
      delete this.startTimes[stepId]; // Clean up
      
      await this.persistEvent(event);
      console.log(`📊 Analytics: Completed step ${stepId} in ${duration}ms`);
    } catch (error) {
      console.error('Failed to track step completion:', error);
    }
  }

  // Track when user skips a step
  async trackStepSkip(userId: string, stepId: string, reason?: string): Promise<void> {
    try {
      const event: OnboardingEvent = {
        id: this.generateEventId(),
        userId,
        stepId,
        action: 'skip',
        timestamp: new Date(),
        metadata: {
          reason,
          sessionId: this.sessionId,
        },
        platform: this.getPlatform(),
      };

      this.events.push(event);
      
      await this.persistEvent(event);
      console.log(`📊 Analytics: Skipped step ${stepId}. Reason: ${reason}`);
    } catch (error) {
      console.error('Failed to track step skip:', error);
    }
  }

  // Track when user abandons onboarding
  async trackAbandon(userId: string, stepId: string, reason?: string): Promise<void> {
    try {
      const event: OnboardingEvent = {
        id: this.generateEventId(),
        userId,
        stepId,
        action: 'abandon',
        timestamp: new Date(),
        metadata: {
          reason,
          sessionId: this.sessionId,
        },
        platform: this.getPlatform(),
      };

      this.events.push(event);
      
      await this.persistEvent(event);
      console.log(`📊 Analytics: Abandoned at step ${stepId}. Reason: ${reason}`);
    } catch (error) {
      console.error('Failed to track abandon:', error);
    }
  }

  // Track errors during onboarding
  async trackError(userId: string, stepId: string, errorType: string, errorMessage: string): Promise<void> {
    try {
      const event: OnboardingEvent = {
        id: this.generateEventId(),
        userId,
        stepId,
        action: 'error',
        timestamp: new Date(),
        metadata: {
          errorType,
          errorMessage,
          sessionId: this.sessionId,
        },
        platform: this.getPlatform(),
      };

      this.events.push(event);
      
      await this.persistEvent(event);
      console.log(`📊 Analytics: Error in step ${stepId}: ${errorType} - ${errorMessage}`);
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }

  // Track retry attempts
  async trackRetry(userId: string, stepId: string, attemptNumber: number): Promise<void> {
    try {
      const event: OnboardingEvent = {
        id: this.generateEventId(),
        userId,
        stepId,
        action: 'retry',
        timestamp: new Date(),
        metadata: {
          attemptNumber,
          sessionId: this.sessionId,
        },
        platform: this.getPlatform(),
      };

      this.events.push(event);
      
      await this.persistEvent(event);
      console.log(`📊 Analytics: Retry attempt ${attemptNumber} for step ${stepId}`);
    } catch (error) {
      console.error('Failed to track retry:', error);
    }
  }

  // Calculate metrics for current user session
  calculateSessionMetrics(userId: string): OnboardingMetrics {
    const userEvents = this.events.filter(e => e.userId === userId);
    
    const stepTimes: Record<string, number> = {};
    const retries: Record<string, number> = {};
    const errors: OnboardingError[] = [];
    const skippedSteps: string[] = [];
    const dropoffPoints: string[] = [];

    let totalTime = 0;
    let completedSteps = 0;
    let totalSteps = 0;

    userEvents.forEach(event => {
      switch (event.action) {
        case 'complete':
          if (event.duration) {
            stepTimes[event.stepId] = event.duration;
            totalTime += event.duration;
          }
          completedSteps++;
          break;
        case 'skip':
          skippedSteps.push(event.stepId);
          break;
        case 'error':
          errors.push({
            stepId: event.stepId,
            errorType: event.metadata?.errorType || 'unknown',
            errorMessage: event.metadata?.errorMessage || 'Unknown error',
            timestamp: event.timestamp,
            resolved: false, // Will be updated if user completes step later
          });
          break;
        case 'retry':
          retries[event.stepId] = (retries[event.stepId] || 0) + 1;
          break;
        case 'abandon':
          dropoffPoints.push(event.stepId);
          break;
        case 'start':
          totalSteps++;
          break;
      }
    });

    const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      totalTime,
      stepTimes,
      errors,
      retries,
      skippedSteps,
      completionRate,
      dropoffPoints,
    };
  }

  // Generate insights from analytics data
  async generateInsights(): Promise<AnalyticsInsights> {
    try {
      // This could fetch data from Supabase for broader insights
      const { data: events, error } = await supabase
        .from('onboarding_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const allEvents = events || this.events;
      
      // Calculate average completion time
      const completionEvents = allEvents.filter(e => e.action === 'complete');
      const avgCompletionTime = completionEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / completionEvents.length;

      // Find most time-consuming step
      const stepDurations: Record<string, number[]> = {};
      completionEvents.forEach(event => {
        if (event.duration && event.stepId) {
          if (!stepDurations[event.stepId]) stepDurations[event.stepId] = [];
          stepDurations[event.stepId].push(event.duration);
        }
      });

      let mostTimeConsumingStep = '';
      let maxAvgTime = 0;
      Object.keys(stepDurations).forEach(stepId => {
        const avgTime = stepDurations[stepId].reduce((a, b) => a + b, 0) / stepDurations[stepId].length;
        if (avgTime > maxAvgTime) {
          maxAvgTime = avgTime;
          mostTimeConsumingStep = stepId;
        }
      });

      // Find highest dropoff step
      const abandonEvents = allEvents.filter(e => e.action === 'abandon');
      const dropoffCounts: Record<string, number> = {};
      abandonEvents.forEach(event => {
        dropoffCounts[event.stepId] = (dropoffCounts[event.stepId] || 0) + 1;
      });

      const highestDropoffStep = Object.keys(dropoffCounts).reduce((a, b) => 
        dropoffCounts[a] > dropoffCounts[b] ? a : b, ''
      );

      // Common errors
      const errorEvents = allEvents.filter(e => e.action === 'error');
      const commonErrors: Record<string, number> = {};
      errorEvents.forEach(event => {
        const errorType = event.metadata?.errorType || 'unknown';
        commonErrors[errorType] = (commonErrors[errorType] || 0) + 1;
      });

      // Generate improvement suggestions
      const improvementSuggestions: string[] = [];
      
      if (maxAvgTime > 5 * 60 * 1000) { // 5 minutes
        improvementSuggestions.push(`${mostTimeConsumingStep} step takes too long (${Math.round(maxAvgTime / 1000)}s avg). Consider simplifying.`);
      }
      
      if (dropoffCounts[highestDropoffStep] > 5) {
        improvementSuggestions.push(`High abandonment at ${highestDropoffStep}. Review UX and content.`);
      }
      
      const topError = Object.keys(commonErrors).reduce((a, b) => 
        commonErrors[a] > commonErrors[b] ? a : b, ''
      );
      if (commonErrors[topError] > 3) {
        improvementSuggestions.push(`Frequent ${topError} errors. Improve validation and error handling.`);
      }

      return {
        avgCompletionTime: Math.round(avgCompletionTime),
        mostTimeConsumingStep,
        highestDropoffStep,
        commonErrors,
        improvementSuggestions,
      };
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return {
        avgCompletionTime: 0,
        mostTimeConsumingStep: '',
        highestDropoffStep: '',
        commonErrors: {},
        improvementSuggestions: ['Unable to generate insights due to data access error'],
      };
    }
  }

  // Persist event to storage and Supabase
  private async persistEvent(event: OnboardingEvent): Promise<void> {
    try {
      // Cache locally first
      await this.cacheEvent(event);
      
      // Then sync to Supabase (non-blocking)
      this.syncToSupabase(event).catch(error => {
        console.warn('Failed to sync event to Supabase:', error);
      });
    } catch (error) {
      console.error('Failed to persist event:', error);
    }
  }

  // Cache event locally
  private async cacheEvent(event: OnboardingEvent): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('onboarding_analytics_events');
      const events = cached ? JSON.parse(cached) : [];
      events.push(event);
      
      // Keep only last 100 events to avoid storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await AsyncStorage.setItem('onboarding_analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to cache event:', error);
    }
  }

  // Sync event to Supabase
  private async syncToSupabase(event: OnboardingEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('onboarding_events')
        .insert([{
          id: event.id,
          user_id: event.userId,
          step_id: event.stepId,
          action: event.action,
          timestamp: event.timestamp.toISOString(),
          duration: event.duration,
          metadata: event.metadata,
          platform: event.platform,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync to Supabase:', error);
      // Don't throw - this is non-critical
    }
  }

  // Load cached events on initialization
  private async loadCachedEvents(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('onboarding_analytics_events');
      if (cached) {
        const events = JSON.parse(cached);
        this.events = events.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load cached events:', error);
    }
  }

  // Utility methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPlatform(): string {
    // In a real app, this would detect the platform
    return 'mobile'; // or 'ios' | 'android' | 'web'
  }

  // Export analytics data for debugging
  async exportAnalyticsData(): Promise<{
    events: OnboardingEvent[];
    metrics: OnboardingMetrics;
    insights: AnalyticsInsights;
  }> {
    const userId = 'current_user'; // This should come from auth context
    const metrics = this.calculateSessionMetrics(userId);
    const insights = await this.generateInsights();

    return {
      events: this.events,
      metrics,
      insights,
    };
  }

  // Clear analytics data (for privacy compliance)
  async clearAnalyticsData(): Promise<void> {
    try {
      this.events = [];
      this.startTimes = {};
      await AsyncStorage.removeItem('onboarding_analytics_events');
      console.log('📊 Analytics: Data cleared');
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  }

  // Get real-time analytics dashboard data
  getRealtimeDashboard(userId: string): {
    currentStep: string | null;
    progress: number;
    timeSpent: number;
    errorsCount: number;
    retriesCount: number;
  } {
    const userEvents = this.events.filter(e => e.userId === userId);
    const lastEvent = userEvents[userEvents.length - 1];
    
    const completedSteps = userEvents.filter(e => e.action === 'complete').length;
    const totalSteps = Object.keys(ONBOARDING_CONFIG.ROUTES).length - 2; // Exclude COMPLETE and SIGNIN
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    
    const timeSpent = userEvents
      .filter(e => e.action === 'complete' && e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    const errorsCount = userEvents.filter(e => e.action === 'error').length;
    const retriesCount = userEvents.filter(e => e.action === 'retry').length;

    return {
      currentStep: lastEvent?.stepId || null,
      progress: Math.round(progress),
      timeSpent: Math.round(timeSpent / 1000), // Convert to seconds
      errorsCount,
      retriesCount,
    };
  }
} 