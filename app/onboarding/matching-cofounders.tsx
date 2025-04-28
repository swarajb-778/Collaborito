import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Mock data for co-founder matches
const COFOUNDERS = [
  {
    id: '1',
    name: 'Sophia Chen',
    skills: ['UX Design', 'Frontend', 'Product'],
    bio: 'Former design lead at Airbnb. Passionate about creating intuitive user experiences.',
    match: 92,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    skills: ['Backend', 'AI/ML', 'Cloud'],
    bio: 'Ex-Google engineer with 8 years experience in scalable systems and machine learning.',
    match: 87,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '3',
    name: 'Aisha Patel',
    skills: ['Growth', 'Marketing', 'Analytics'],
    bio: 'Marketing strategist who helped scale 3 startups from zero to $1M+ ARR.',
    match: 81,
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
];

export default function MatchingCofoundersScreen() {
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  
  useEffect(() => {
    // Start animations when component mounts
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    contentTranslateY.value = withDelay(300, withTiming(0, { 
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleViewProfile = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to individual profile (placeholder for future implementation)
    console.log(`View profile for cofounder ${id}`);
  };

  const handleConnect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implement connection logic (placeholder for future implementation)
    console.log(`Connect with cofounder ${id}`);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to the next screen in the flow
    router.push('/onboarding/complete' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.background}
      />
      
      {/* Decorative shapes */}
      <View style={[styles.decorativeShape, styles.decorativeShape1]} />
      <View style={[styles.decorativeShape, styles.decorativeShape2]} />
      
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.title}>Co-Founder Matches</Text>
        <Text style={styles.subtitle}>
          Based on your project description, here are potential co-founders who might be a great fit
        </Text>
      </Animated.View>

      {/* Matches list */}
      <Animated.ScrollView
        style={[styles.scrollView, contentAnimatedStyle]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {COFOUNDERS.map((cofounder) => (
          <BlurView key={cofounder.id} intensity={30} tint="dark" style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Image source={{ uri: cofounder.avatar }} style={styles.avatar} />
              <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{cofounder.name}</Text>
                <View style={styles.matchScoreContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.matchScore}>{cofounder.match}% Match</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.skillsContainer}>
              {cofounder.skills.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.bio}>{cofounder.bio}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => handleViewProfile(cofounder.id)}
              >
                <Text style={styles.viewButtonText}>View Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.connectButton]}
                onPress={() => handleConnect(cofounder.id)}
              >
                <LinearGradient
                  colors={['#4d80e4', '#2e5ff2']}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        ))}
      </Animated.ScrollView>

      {/* Continue button */}
      <View style={styles.continueButtonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <LinearGradient
            colors={['#4d80e4', '#2e5ff2']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeShape: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.2,
  },
  decorativeShape1: {
    width: 250,
    height: 250,
    backgroundColor: '#5567da',
    top: -50,
    right: -80,
  },
  decorativeShape2: {
    width: 200,
    height: 200,
    backgroundColor: '#2e5ff2',
    bottom: -50,
    left: -80,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffffcc',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  matchCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 14,
    color: '#ffffffcc',
    marginLeft: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: 'rgba(46, 95, 242, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#4d80e4',
  },
  bio: {
    fontSize: 14,
    color: '#ffffffdd',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  connectButton: {
    marginLeft: 8,
    overflow: 'hidden',
  },
  viewButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  continueButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 