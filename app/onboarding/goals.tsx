import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing 
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/OptimizedAuthContext';
import { optimizedOnboardingService } from '../../src/services/OptimizedOnboardingService';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('OnboardingGoals');

const { width, height } = Dimensions.get('window');

// Define the goal types with proper mapping to database values
const GOALS = [
  {
    id: 'find_cofounder',
    name: 'Find a co-founder',
    icon: 'people-outline',
    iconType: 'Ionicons' as const,
    description: 'Seek a partner to build your vision together.',
    nextStep: 'project-detail'
  },
  {
    id: 'find_collaborators',
    name: 'Find collaborators',
    icon: 'account-group-outline',
    iconType: 'MaterialCommunityIcons' as const,
    description: 'Get help with your project or idea.',
    nextStep: 'project-detail'
  },
  {
    id: 'contribute_skills',
    name: 'Contribute skills',
    icon: 'hammer-outline',
    iconType: 'Ionicons' as const,
    description: 'Offer your expertise to existing projects.',
    nextStep: 'project-skills'
  },
  {
    id: 'explore_ideas',
    name: 'Explore ideas',
    icon: 'lightbulb-outline',
    iconType: 'MaterialCommunityIcons' as const,
    description: 'Discover new ventures and opportunities.',
    nextStep: 'project-skills'
  },
];

export default function OnboardingGoalsScreen() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Reanimated shared values for animations
  const headerOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    logger.info('OnboardingGoals mounted');
    
    // Staggered fade-in animations using Reanimated
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    listOpacity.value = withDelay(250, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    buttonsOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const listAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: listOpacity.value,
    };
  });

  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonsOpacity.value,
    };
  });

  const handleSelectGoal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(id === selectedGoal ? null : id); // Allow deselecting
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Error', 'User session not available. Please sign in again.');
      return;
    }

    if (selectedGoal === null) {
      Alert.alert('Select Goal', 'Please select a goal to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const selectedGoalData = GOALS.find(goal => goal.id === selectedGoal);
      logger.info('Saving goal to database:', selectedGoalData);
      
      // Save goal using OnboardingService
                      const result = await optimizedOnboardingService.saveGoal(user.id, {
          goalType: selectedGoal as any,
        details: {
          description: selectedGoalData?.description,
          selectedAt: new Date().toISOString()
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save goal');
      }
      
      logger.info('Goal saved successfully, navigating based on goal type');
      
      // Navigate based on the selected goal's next step
      const nextStep = selectedGoalData?.nextStep;
      if (nextStep === 'project-detail') {
        router.replace('/onboarding/project-detail' as any);
      } else if (nextStep === 'project-skills') {
        router.replace('/onboarding/project-skills' as any);
      } else {
        // Fallback - go to main app
        router.replace('/(tabs)');
      }
      
    } catch (error) {
      logger.error('Error saving goal:', error);
      Alert.alert('Error', 'There was a problem saving your goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logger.info('Skipping goals, navigating to main app');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      {/* Background elements from interests screen */}
      <View style={styles.backgroundShapesContainer}>
        <LinearGradient
          colors={['rgba(255, 220, 100, 0.3)', 'rgba(250, 160, 80, 0.15)', 'rgba(255, 255, 255, 0.7)']} 
          locations={[0, 0.4, 0.8]}
          style={styles.gradientBackground}
        />
        <View style={[styles.backgroundShape, styles.shapeOne]} />
        <View style={[styles.backgroundShape, styles.shapeTwo]} />
        <View style={[styles.backgroundShape, styles.shapeThree]} />
      </View>
      
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        <Text style={styles.title}>What brings you here?</Text>
        <Text style={styles.subtitle}>Choose your primary goal for joining Collaborito.</Text>
      </Animated.View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Goals List */}
        <Animated.View style={[styles.goalsListContainer, listAnimatedStyle]}>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalItem,
                selectedGoal === goal.id && styles.selectedGoalItem,
              ]}
              onPress={() => handleSelectGoal(goal.id)}
              activeOpacity={0.7}
            >
              <View style={styles.goalIconContainer}>
                {goal.iconType === 'Ionicons' ? (
                  <Ionicons 
                    name={goal.icon as any} 
                    size={28} 
                    color={selectedGoal === goal.id ? '#FFFFFF' : '#333333'} 
                  />
                ) : (
                  <MaterialCommunityIcons 
                    name={goal.icon as any} 
                    size={28} 
                    color={selectedGoal === goal.id ? '#FFFFFF' : '#333333'} 
                  />
                )}
              </View>
              <View style={styles.goalTextContainer}>
                <Text style={[styles.goalName, selectedGoal === goal.id && styles.selectedGoalText]}>
                  {goal.name}
                </Text>
                <Text style={[styles.goalDescription, selectedGoal === goal.id && styles.selectedGoalText]}>
                  {goal.description}
                </Text>
              </View>
              {selectedGoal === goal.id && (
                // Use reanimated FadeIn for the checkmark for smoother appearance
                <Animated.View entering={FadeInDown.duration(200)} style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </Animated.View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
      
      {/* Bottom Actions Container */}
      <Animated.View 
        style={[
          styles.bottomContainer, 
          { paddingBottom: Math.max(insets.bottom, 16) }, 
          buttonsAnimatedStyle
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.button,
            styles.continueButton,
            (selectedGoal === null || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedGoal === null || isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000000', '#333333']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" /> 
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          disabled={isSubmitting}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Match interest screen background base color
  },
  gradientBackground: { // Renamed from gradient
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6, // Match interest screen gradient height
  },
  backgroundShapesContainer: { // Added container for shapes
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', 
  },
  backgroundShape: { // Added base shape style
    position: 'absolute',
    borderRadius: (width * 0.8) / 2, 
    opacity: 0.15, 
  },
  shapeOne: { // Added shapeOne style
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.15,
    left: -width * 0.25,
    backgroundColor: '#FFD529', 
    opacity: 0.1,
  },
  shapeTwo: { // Added shapeTwo style
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.05,
    right: -width * 0.2,
    backgroundColor: '#FFA07A', 
    opacity: 0.12,
  },
  shapeThree: { // Added shapeThree style
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    right: -width * 0.1,
    backgroundColor: '#ADD8E6', 
    opacity: 0.08,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20, // Increased top padding slightly
    paddingBottom: 10,
    alignItems: 'center',
    // Ensure header is above the shapes
    zIndex: 1,
  },
  title: {
    fontSize: 26, 
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System', 
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 10,
    fontFamily: 'System',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    // Ensure scroll content is above the shapes
    zIndex: 1,
  },
  goalsListContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Add slight white transparency to list container
    borderRadius: 20,
    padding: 15, // Add padding around the list
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.9)', // Slightly more opaque item background
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGoalItem: {
    backgroundColor: '#1A202C', 
    borderColor: '#1A202C',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  goalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly more opaque icon background
    marginRight: 16,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
    fontFamily: 'System',
  },
  goalDescription: {
    fontSize: 13,
    color: '#4A5568',
    fontFamily: 'System',
  },
  selectedGoalText: {
    color: '#FFFFFF',
  },
  checkmarkContainer: {
    marginLeft: 12,
    padding: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 15, // Slightly more padding
    borderTopWidth: 0, // Remove top border as it's inside a container now
    backgroundColor: 'transparent', // Make transparent to show gradient/shapes behind
    // Ensure buttons are above shapes
    zIndex: 1,
    marginTop: 10, // Add margin to separate from the list container
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButton: {
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#4A5568',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
}); 