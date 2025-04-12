import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { router } from 'expo-router';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('WelcomeDetailsScreen');
const { width, height } = Dimensions.get('window');
const WELCOME_COMPLETED_KEY = 'welcome_completed';

// Feature highlights to display on the welcome screen
const FEATURES = [
  {
    icon: 'project-diagram',
    title: 'Project Management',
    description: 'Create and manage projects with ease'
  },
  {
    icon: 'comments',
    title: 'Real-time Collaboration',
    description: 'Chat and collaborate with your team in real-time'
  },
  {
    icon: 'tasks',
    title: 'Task Tracking',
    description: 'Manage tasks and deadlines efficiently'
  },
  {
    icon: 'robot',
    title: 'AI Assistance',
    description: 'Get intelligent suggestions powered by Claude 3.7'
  }
];

export default function WelcomeDetailsScreen() {
  const [loading, setLoading] = useState<Record<string, boolean>>({
    google: false,
    linkedin: false,
    email: false,
  });
  const { signInWithLinkedIn } = useAuth();
  
  // Mark welcome as completed
  const markWelcomeCompleted = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_COMPLETED_KEY, 'true');
      logger.debug('Welcome marked as completed');
    } catch (error) {
      logger.error('Error saving welcome status', error);
    }
  };
  
  const handleLinkedInSignIn = async () => {
    try {
      setLoading(prev => ({ ...prev, linkedin: true }));
      logger.info('Initiating LinkedIn sign-in');
      await markWelcomeCompleted();
      await signInWithLinkedIn();
      // Navigation will be handled by the auth redirect in AuthContext
    } catch (error) {
      logger.error('LinkedIn sign-in failed', error);
      setLoading(prev => ({ ...prev, linkedin: false }));
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      setLoading(prev => ({ ...prev, google: true }));
      logger.info('Google sign-in not implemented yet');
      await markWelcomeCompleted();
      // Placeholder for future implementation
      setTimeout(() => {
        setLoading(prev => ({ ...prev, google: false }));
      }, 1000);
    } catch (error) {
      logger.error('Google sign-in failed', error);
      setLoading(prev => ({ ...prev, google: false }));
    }
  };
  
  const navigateToEmailSignIn = async () => {
    try {
      setLoading(prev => ({ ...prev, email: true }));
      logger.info('Navigating to email sign-in');
      await markWelcomeCompleted();
      router.navigate('/login');
    } catch (error) {
      logger.error('Error navigating to login', error);
      setLoading(prev => ({ ...prev, email: false }));
    }
  };
  
  const navigateToRegister = async () => {
    try {
      setLoading(prev => ({ ...prev, email: true }));
      logger.info('Navigating to registration');
      await markWelcomeCompleted();
      router.navigate('/register');
    } catch (error) {
      logger.error('Error navigating to register', error);
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1E2747', '#0B1121']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={styles.header}
          >
            <FontAwesome name="connectdevelop" size={40} color="#6C63FF" />
            <Text style={styles.headerTitle}>Collaborito</Text>
          </MotiView>
          
          {/* Welcome Text */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
            style={styles.welcomeContainer}
          >
            <Text style={styles.welcomeTitle}>Welcome to Collaborito</Text>
            <Text style={styles.welcomeSubtitle}>Your all-in-one collaboration platform</Text>
          </MotiView>
          
          {/* Features */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000, delay: 500 }}
            style={styles.featuresContainer}
          >
            {FEATURES.map((feature, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 700 + (index * 150) }}
                style={styles.featureItem}
              >
                <View style={styles.featureIconContainer}>
                  <FontAwesome5 name={feature.icon} size={24} color="#6C63FF" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </MotiView>
            ))}
          </MotiView>
          
          {/* Auth Options */}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000, delay: 1300 }}
            style={styles.authContainer}
          >
            <Text style={styles.authTitle}>Get Started</Text>
            
            {/* Social Auth Buttons */}
            <View style={styles.socialAuthContainer}>
              {/* Google Sign In */}
              <TouchableOpacity
                style={[styles.socialAuthButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading.google}
                activeOpacity={0.8}
              >
                {loading.google ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome5 name="google" size={18} color="#FFFFFF" style={styles.socialIcon} />
                    <Text style={styles.socialButtonText}>Sign in with Google</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* LinkedIn Sign In */}
              <TouchableOpacity
                style={[styles.socialAuthButton, styles.linkedinButton]}
                onPress={handleLinkedInSignIn}
                disabled={loading.linkedin}
                activeOpacity={0.8}
              >
                {loading.linkedin ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome5 name="linkedin" size={18} color="#FFFFFF" style={styles.socialIcon} />
                    <Text style={styles.socialButtonText}>Sign in with LinkedIn</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            
            {/* Email Sign In */}
            <TouchableOpacity
              style={styles.emailButton}
              onPress={navigateToEmailSignIn}
              activeOpacity={0.8}
            >
              {loading.email ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.emailButtonText}>Sign in with Email</Text>
              )}
            </TouchableOpacity>
            
            {/* Register */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
        
        {/* Decorative elements */}
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ type: 'timing', duration: 1500, delay: 500 }}
          style={styles.decorativeShape1}
        />
        
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ type: 'timing', duration: 1500, delay: 800 }}
          style={styles.decorativeShape2}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  welcomeContainer: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  authContainer: {
    marginTop: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  socialAuthContainer: {
    marginBottom: 24,
  },
  socialAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 27,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  emailButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginRight: 4,
  },
  registerLink: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  decorativeShape1: {
    position: 'absolute',
    top: height * 0.05,
    right: -width * 0.15,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    zIndex: -1,
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: -height * 0.05,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: -1,
  },
}); 