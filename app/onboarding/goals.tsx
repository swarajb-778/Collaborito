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

const { width, height } = Dimensions.get('window');

// Define the goals options (keeping icons)
const GOALS = [
  {
    id: 1,
    name: 'Find a co-founder',
    icon: 'people-outline',
    iconType: 'Ionicons',
    description: 'Seek a partner to build your vision together.'
  },
  {
    id: 2,
    name: 'Find collaborators',
    icon: 'account-group-outline',
    iconType: 'MaterialCommunityIcons',
    description: 'Get help with your project or idea.'
  },
  {
    id: 3,
    name: 'Contribute skills',
    icon: 'hammer-outline',
    iconType: 'Ionicons',
    description: 'Offer your expertise to existing projects.'
  },
  {
    id: 4,
    name: 'Explore ideas',
    icon: 'lightbulb-outline',
    iconType: 'MaterialCommunityIcons',
    description: 'Discover new ventures and opportunities.'
  },
];

export default function OnboardingGoalsScreen() {
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Reanimated shared values for animations
  const headerOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
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

  const handleSelectGoal = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(id === selectedGoal ? null : id); // Allow deselecting
  };

  const handleContinue = async () => {
    if (selectedGoal === null) {
      Alert.alert('Select Goal', 'Please select a goal to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Selected goal:', GOALS.find(item => item.id === selectedGoal)?.name);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'There was a problem saving your goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      {/* Subtle background gradient */}
      <LinearGradient
        colors={['rgba(100, 116, 139, 0.05)', 'rgba(100, 116, 139, 0.01)']} // Adjusted to subtle gray
        style={styles.gradient}
      />
      
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
    backgroundColor: '#FFFFFF', // White background like welcome screen
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10, // Adjusted padding
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Slightly smaller title
    fontWeight: '700',
    color: '#1A202C', // Dark text
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System', // Use system font or specify 'Nunito' if added
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568', // Medium gray text
    textAlign: 'center',
    paddingHorizontal: 10,
    fontFamily: 'System', // Use system font or specify 'Nunito' if added
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10, // Space below header
    paddingBottom: 20,
  },
  goalsListContainer: {
     // Removed marginBottom
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)', // Light gray background
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)', // Light border
    overflow: 'hidden',
    shadowColor: '#000', // Subtle shadow like welcome card
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGoalItem: {
    backgroundColor: '#1A202C', // Dark background when selected
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    color: '#FFFFFF', // White text when selected
  },
  checkmarkContainer: {
    marginLeft: 12,
    padding: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 10, // Space above buttons
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light separator line
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 12, // Rounded corners like welcome button
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Needed for gradient border radius
  },
  continueButton: {
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row', // Align text and icon horizontally
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
    opacity: 0.6, // Dim the button when disabled
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#4A5568', // Medium gray for skip text
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
}); 