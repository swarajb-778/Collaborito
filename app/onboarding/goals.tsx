import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Define the goals options
const GOALS = [
  {
    id: 1,
    name: 'Find a co-founder to join my idea',
    icon: 'people-outline',
    iconType: 'Ionicons',
  },
  {
    id: 2,
    name: 'Find people to help with my project',
    icon: 'account-group-outline',
    iconType: 'MaterialCommunityIcons',
  },
  {
    id: 3,
    name: 'Contribute my skills to an existing project',
    icon: 'hammer-outline',
    iconType: 'Ionicons',
  },
  {
    id: 4,
    name: 'Explore new ideas',
    icon: 'lightbulb-outline',
    iconType: 'MaterialCommunityIcons',
  },
];

export default function OnboardingGoalsScreen() {
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSelectGoal = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(id);
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
      
      // In a real app, this would save the selected goal to the user's profile
      console.log('Selected goal:', GOALS.find(item => item.id === selectedGoal)?.name);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to main app
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <StatusBar style="light" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#4e54c8', '#8f94fb']}
        style={styles.gradient}
      />
      
      {/* Animated shapes in background */}
      <Animated.View 
        entering={FadeInUp.delay(100).duration(1000)} 
        style={[styles.backgroundShape, { top: height * 0.1, left: -width * 0.2 }]} 
      />
      <Animated.View 
        entering={FadeInUp.delay(200).duration(1000)} 
        style={[styles.backgroundShape, { top: height * 0.5, right: -width * 0.3 }]} 
      />
      <Animated.View 
        entering={FadeInUp.delay(300).duration(1000)} 
        style={[styles.backgroundShape, { bottom: -height * 0.1, left: width * 0.3 }]} 
      />
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Text style={styles.title}>What's your goal?</Text>
          <Text style={styles.subtitle}>Select one option that best describes why you're here</Text>
        </Animated.View>
        
        {/* Goals List */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.goalsContainer}>
          {GOALS.map((goal, index) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalItem,
                selectedGoal === goal.id && styles.selectedGoalItem,
              ]}
              onPress={() => handleSelectGoal(goal.id)}
              activeOpacity={0.7}
            >
              <BlurView intensity={90} style={styles.blurView} tint="light">
                <View style={styles.goalContent}>
                  <View style={[styles.iconContainer, selectedGoal === goal.id && styles.selectedIconContainer]}>
                    {goal.iconType === 'Ionicons' ? (
                      <Ionicons 
                        name={goal.icon as any} 
                        size={24} 
                        color={selectedGoal === goal.id ? '#ffffff' : '#4e54c8'} 
                      />
                    ) : (
                      <MaterialCommunityIcons 
                        name={goal.icon as any} 
                        size={24} 
                        color={selectedGoal === goal.id ? '#ffffff' : '#4e54c8'} 
                      />
                    )}
                  </View>
                  
                  <Text style={[styles.goalText, selectedGoal === goal.id && styles.selectedGoalText]}>
                    {goal.name}
                  </Text>
                  
                  {selectedGoal === goal.id && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#4e54c8" />
                    </View>
                  )}
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
      
      {/* Bottom Actions */}
      <Animated.View 
        entering={FadeInUp.delay(500).duration(800)}
        style={styles.bottomContainer}
      >
        <TouchableOpacity 
          style={[
            styles.continueButton,
            (selectedGoal === null || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedGoal === null || isSubmitting}
        >
          <Text style={styles.continueButtonText}>
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Text>
          {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          disabled={isSubmitting}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundShape: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  goalsContainer: {
    marginBottom: 30,
  },
  goalItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  blurView: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedGoalItem: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: '#4e54c8',
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedGoalText: {
    color: '#4e54c8',
    fontWeight: 'bold',
  },
  checkmark: {
    marginLeft: 10,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#4e54c8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(78, 84, 200, 0.6)',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 