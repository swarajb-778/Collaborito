import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/services/supabase';
import { SessionManager } from '@/src/services/SessionManager';
import { OnboardingFlowCoordinator } from '@/src/services/OnboardingFlowCoordinator';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';

interface OnboardingProgressProps {
  userId: string;
  onProgressChange?: (progress: any) => void;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ 
  userId, 
  onProgressChange 
}) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionManager = SessionManager.getInstance();
  const flowCoordinator = OnboardingFlowCoordinator.getInstance();

  useEffect(() => {
    fetchOnboardingStatus();
    
    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.onboarding_step || payload.new.onboarding_completed) {
            fetchOnboardingStatus();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchOnboardingStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session first
      const session = sessionManager.getSession();
      if (!session) {
        throw new Error('No valid session');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/onboarding-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_status' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStatus(result);
        
        // Update flow coordinator with latest status
        await flowCoordinator.updateProgress();
        
        // Call progress change callback
        if (onProgressChange) {
          onProgressChange(result);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch status');
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Try to load cached data as fallback
      const cachedState = sessionManager.getOnboardingState();
      if (cachedState) {
        setStatus(cachedState);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepDisplayName = (step: string): string => {
    const stepNames: Record<string, string> = {
      'profile': 'Profile Setup',
      'interests': 'Interests Selection',
      'goals': 'Goals Definition', 
      'project_details': 'Project Details',
      'skills': 'Skills Selection',
      'completed': 'Completed'
    };
    return stepNames[step] || step;
  };

  const getProgressColor = (percentage: number): [string, string] => {
    if (percentage < 25) {
      return ['#FF6B6B', '#FF8E53']; // Red to orange
    } else if (percentage < 50) {
      return ['#FF8E53', '#FFD93D']; // Orange to yellow
    } else if (percentage < 75) {
      return ['#FFD93D', '#6BCF7F']; // Yellow to light green
    } else {
      return ['#6BCF7F', '#4ECDC4']; // Light green to teal
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load progress</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const progressPercentage = status.completionPercentage || 0;
  const currentStepDisplay = getStepDisplayName(status.currentStep || 'profile');
  const progressColors = getProgressColor(progressPercentage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Setup Progress</Text>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={progressColors}
            style={[
              styles.progressBar, 
              { width: `${progressPercentage}%` }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
      
      <View style={styles.progressInfo}>
        <Text style={styles.percentage}>{progressPercentage}% Complete</Text>
        <Text style={styles.currentStep}>Current: {currentStepDisplay}</Text>
      </View>

      {status.completed && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Onboarding Complete</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  currentStep: {
    fontSize: 12,
    color: '#4A5568',
    fontStyle: 'italic',
  },
  completedBadge: {
    marginTop: 8,
    backgroundColor: '#48BB78',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  completedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#4A5568',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
  },
}); 