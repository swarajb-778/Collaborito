import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  available: boolean;
  limitation?: string;
}

export default function GuestModeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [showLimitations, setShowLimitations] = useState(false);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    cardScale.value = withSpring(1);
    opacity.value = withSpring(1);
    loadGuestData();
  }, []);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
      opacity: opacity.value,
    };
  });
  
  const loadGuestData = async () => {
    try {
      const stored = await AsyncStorage.getItem('@collaborito_guest_data');
      if (stored) {
        setGuestData(JSON.parse(stored));
      }
    } catch (error) {
      console.log('No guest data found');
    }
  };
  
  const features: FeatureCard[] = [
    {
      icon: 'project-diagram',
      title: 'Create Projects',
      description: 'Start and manage up to 3 collaborative projects',
      available: true,
      limitation: 'Limited to 3 projects',
    },
    {
      icon: 'users',
      title: 'Team Collaboration',
      description: 'Invite team members and collaborate together',
      available: true,
      limitation: 'Up to 5 team members per project',
    },
    {
      icon: 'comments',
      title: 'Messaging',
      description: 'Communicate with your team in project channels',
      available: true,
      limitation: 'Up to 50 messages',
    },
    {
      icon: 'save',
      title: 'Save Progress',
      description: 'Your work is saved locally for 24 hours',
      available: true,
      limitation: 'Session expires in 24 hours',
    },
    {
      icon: 'sync',
      title: 'Real-time Sync',
      description: 'See updates from your team in real-time',
      available: false,
      limitation: 'Premium feature',
    },
    {
      icon: 'bell',
      title: 'Push Notifications',
      description: 'Get notified about project updates',
      available: false,
      limitation: 'Premium feature',
    },
    {
      icon: 'download',
      title: 'Export Data',
      description: 'Download your projects and data',
      available: false,
      limitation: 'Premium feature',
    },
    {
      icon: 'cloud',
      title: 'Cloud Backup',
      description: 'Automatic backup to secure cloud storage',
      available: false,
      limitation: 'Premium feature',
    },
  ];
  
  const handleStartGuestMode = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Create a simple guest session
      const guestSession = {
        id: `guest_${Date.now()}`,
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        projectsCreated: 0,
        messagesSent: 0,
        limitationsShown: false,
      };
      
      await AsyncStorage.setItem('@collaborito_guest_session', JSON.stringify(guestSession));
      
      // Initialize demo data
      const demoData = {
        projects: [
          {
            id: 'demo-1',
            title: 'AI-Powered Mobile App',
            description: 'Building an intelligent mobile application using React Native and machine learning',
            category: 'Technology',
            status: 'in_progress',
            progress: 45,
            isDemo: true,
          },
          {
            id: 'demo-2',
            title: 'Sustainable Business Initiative',
            description: 'Developing eco-friendly business solutions for local communities',
            category: 'Business',
            status: 'planning',
            progress: 15,
            isDemo: true,
          },
        ],
        interests: ['Artificial Intelligence', 'Mobile Development', 'Business Strategy', 'Sustainability'],
        skills: ['React Native', 'Python', 'Business Development', 'Project Management'],
      };
      
      await AsyncStorage.setItem('@collaborito_guest_data', JSON.stringify(demoData));
      
      // Navigate to onboarding with guest mode
      router.replace('/onboarding/profile?mode=guest' as any);
      
    } catch (error) {
      console.error('Failed to start guest mode:', error);
      Alert.alert('Error', 'Failed to start demo mode. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpgradeAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signup');
  };
  
  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/login');
  };
  
  const renderFeatureCard = (feature: FeatureCard, index: number) => (
    <Animated.View
      key={feature.title}
      entering={FadeInDown.duration(600).delay(index * 100)}
      style={styles.featureCard}
    >
      <View style={[styles.featureIconContainer, { 
        backgroundColor: feature.available ? colors.primary : colors.muted,
        opacity: feature.available ? 1 : 0.6,
      }]}>
        <FontAwesome5 
          name={feature.icon} 
          size={20} 
          color="white" 
        />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>
          {feature.title}
        </Text>
        <Text style={[styles.featureDescription, { color: colors.muted }]}>
          {feature.description}
        </Text>
        {feature.limitation && (
          <Text style={[styles.featureLimitation, { 
            color: feature.available ? colors.primary : colors.muted 
          }]}>
            {feature.limitation}
          </Text>
        )}
      </View>
      <View style={styles.featureStatus}>
        <FontAwesome5 
          name={feature.available ? "check-circle" : "lock"} 
          size={16} 
          color={feature.available ? "#4CAF50" : colors.muted} 
        />
      </View>
    </Animated.View>
  );
  
  return (
    <LinearGradient
      colors={[colors.background, colorScheme === 'dark' ? colors.primary : colors.secondary]}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.logoContainer}>
          <CollaboritoLogo size={100} color={colors.primary} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <Card style={[styles.card, cardAnimatedStyle]}>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Try Collaborito Free</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Experience the full power of collaborative project management with our 24-hour demo
              </Text>
            </View>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <FontAwesome5 name="clock" size={16} color={colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  24-hour full access
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <FontAwesome5 name="project-diagram" size={16} color={colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  Create up to 3 projects
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <FontAwesome5 name="users" size={16} color={colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  Team collaboration tools
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <FontAwesome5 name="mobile-alt" size={16} color={colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  No sign-up required
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                style={styles.demoButton}
                onPress={handleStartGuestMode}
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Starting Demo...</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome5 name="play" size={16} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Start Free Demo</Text>
                  </>
                )}
              </Button>
              
              <TouchableOpacity 
                onPress={() => setShowLimitations(!showLimitations)}
                style={styles.limitationsToggle}
              >
                <Text style={[styles.limitationsText, { color: colors.primary }]}>
                  What's included? {showLimitations ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {showLimitations && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>Features Overview</Text>
            {features.map((feature, index) => renderFeatureCard(feature, index))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={handleSignIn} style={styles.footerButton}>
            <Text style={[styles.footerButtonText, { color: colors.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.upgradeContainer}>
          <Card style={styles.upgradeCard}>
            <View style={styles.upgradeHeader}>
              <FontAwesome5 name="crown" size={24} color="#FFD700" />
              <Text style={[styles.upgradeTitle, { color: colors.text }]}>
                Want More?
              </Text>
            </View>
            <Text style={[styles.upgradeDescription, { color: colors.muted }]}>
              Upgrade to unlock unlimited projects, real-time collaboration, cloud backup, and more!
            </Text>
            <Button
              style={styles.upgradeButton}
              onPress={handleUpgradeAccount}
              variant="secondary"
            >
              <FontAwesome5 name="arrow-up" size={16} color={colors.primary} style={styles.buttonIcon} />
              <Text style={[styles.upgradeButtonText, { color: colors.primary }]}>
                Create Full Account
              </Text>
            </Button>
          </Card>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  card: {
    padding: 32,
    borderRadius: 24,
    marginBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 16,
  },
  demoButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  limitationsToggle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  limitationsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  featureLimitation: {
    fontSize: 12,
    fontWeight: '500',
  },
  featureStatus: {
    marginLeft: 12,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  footerButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeContainer: {
    marginTop: 20,
  },
  upgradeCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  upgradeDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 