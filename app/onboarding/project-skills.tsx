import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  FlatList,
  StatusBar as RNStatusBar,
  Image,
  Animated as RNAnimated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing 
} from 'react-native-reanimated';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { onboardingService } from '../../src/services';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('ProjectSkills');

const { width, height } = Dimensions.get('window');

// Skill interface
interface Skill {
  id: string;
  name: string;
  category?: string;
}

// User skill with proficiency level
interface UserSkill {
  skill_id: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_offering: boolean;
}

export default function ProjectSkillsScreen() {
  const [selectedSkills, setSelectedSkills] = useState<{[key: string]: { proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert', is_offering: boolean }}>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Get the goal type from navigation
  const goalType = params.goalType || 'contribute_skills';
  
  // Animation values
  const logoScale = useRef(new RNAnimated.Value(0.8)).current;
  const formOpacity = useRef(new RNAnimated.Value(0)).current;

  // Get subtitle text based on the goal
  const getSubtitleText = () => {
    switch (goalType) {
      case 'find_cofounder':
        return "Select the skills you'd like your co-founder to bring to your project.";
      case 'find_collaborators':
        return "Select the skills you'd like collaborators to bring to your project.";
      case 'contribute_skills':
        return "Select the skills you can offer to projects.";
      case 'explore_ideas':
        return "Select the skills you're interested in exploring.";
      default:
        return "Select the skills you'd like collaborators to bring to your project.";
    }
  };

  // Get title text based on the goal
  const getTitleText = () => {
    switch (goalType) {
      case 'find_cofounder':
      case 'find_collaborators':
        return "What skills are you looking for?";
      case 'contribute_skills':
        return "What skills can you offer?";
      case 'explore_ideas':
        return "What skills interest you?";
      default:
        return "What skills are you looking for?";
    }
  };

  useEffect(() => {
    logger.info('ProjectSkills mounted with goal type:', goalType);
    
    // Animate logo and form on screen load
    RNAnimated.parallel([
      RNAnimated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Load available skills from backend
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      logger.info('Loading skills from backend...');
      const result = await onboardingService.getAvailableSkills();
      
      if (result.success && result.data) {
        setAvailableSkills(result.data);
        logger.info('Skills loaded successfully:', result.data.length);
      } else {
        // Fallback to hardcoded skills if backend fails
        logger.warn('Backend skills failed, using fallback:', result.error);
        setAvailableSkills([
          { id: 'accounting', name: 'Accounting' },
          { id: 'ai_ml', name: 'Artificial Intelligence & Machine Learning' },
          { id: 'biotech', name: 'Biotechnology' },
          { id: 'business', name: 'Business' },
          { id: 'content_creation', name: 'Content Creation (e.g. video, copywriting)' },
          { id: 'counseling', name: 'Counseling & Therapy' },
          { id: 'data_analysis', name: 'Data Analysis' },
          { id: 'devops', name: 'DevOps' },
          { id: 'finance', name: 'Finance' },
          { id: 'fundraising', name: 'Fundraising' },
          { id: 'graphic_design', name: 'Graphic Design' },
          { id: 'legal', name: 'Legal' },
          { id: 'manufacturing', name: 'Manufacturing' },
          { id: 'marketing', name: 'Marketing' },
          { id: 'policy', name: 'Policy' },
          { id: 'product_management', name: 'Product Management' },
          { id: 'project_management', name: 'Project Management' },
          { id: 'public_relations', name: 'Public Relations' },
          { id: 'research', name: 'Research' },
          { id: 'sales', name: 'Sales' },
          { id: 'backend_dev', name: 'Software Development (Backend)' },
          { id: 'frontend_dev', name: 'Software Development (Frontend)' },
          { id: 'ui_ux_design', name: 'UI/UX Design' },
          { id: 'other', name: 'Other' }
        ]);
      }
    } catch (error) {
      logger.error('Error loading skills:', error);
      Alert.alert('Error', 'Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedSkills(prevSelected => {
      const newSelected = { ...prevSelected };
      if (newSelected[id]) {
        delete newSelected[id];
      } else {
        newSelected[id] = {
          proficiency: 'intermediate',
          is_offering: goalType === 'contribute_skills'
        };
      }
      return newSelected;
    });
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Error', 'User session not available. Please sign in again.');
      return;
    }

    if (!selectedSkills || Object.keys(selectedSkills).length === 0) {
      Alert.alert('Skills Required', 'Please select at least one skill to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      logger.info('Saving skills to database and completing onboarding...');
      
      // Convert selected skills to the format expected by the service
      const userSkills: UserSkill[] = Object.entries(selectedSkills).map(([skillId, config]) => ({
        skill_id: skillId,
        proficiency: config.proficiency,
        is_offering: config.is_offering
      }));
      
      // Save skills using OnboardingService - this will also mark onboarding as complete
      const result = await onboardingService.saveSkillsStep(user.id, userSkills);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save skills');
      }
      
      logger.info('Skills saved and onboarding completed successfully!');
      
      // Show success message
      Alert.alert(
        'Welcome to Collaborito!',
        'Your onboarding is complete. Let\'s start collaborating!',
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)' as any)
          }
        ]
      );
      
    } catch (error) {
      logger.error('Error completing onboarding:', error);
      Alert.alert('Error', 'There was a problem completing your onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logger.info('Skipping skills, navigating to main app');
    router.replace('/(tabs)' as any);
  };

  // Show loading spinner while loading skills
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading skills...</Text>
      </View>
    );
  }

  // Render skill item
  const renderSkillItem = ({ item }: { item: Skill }) => (
    <TouchableOpacity
      style={[
        styles.skillItem,
        selectedSkills?.[item.id] && styles.skillItemSelected
      ]}
      onPress={() => toggleSkill(item.id)}
      activeOpacity={0.7}
    >
      {selectedSkills?.[item.id] && (
        <MaterialIcons name="check" size={18} color="#FFF" style={styles.checkIcon} />
      )}
      <Text 
        style={[
          styles.skillText,
          selectedSkills?.[item.id] && styles.skillTextSelected
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      {/* Background elements */}
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

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo container */}
          <RNAnimated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <Image 
              source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <Image 
              source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
              style={styles.textLogo}
              resizeMode="contain"
            />
          </RNAnimated.View>

          {/* Content container */}
          <RNAnimated.View style={[styles.formContainer, { opacity: formOpacity }]}>
            <Text style={styles.title}>{getTitleText()}</Text>
            <Text style={styles.subtitle}>
              {getSubtitleText()}
            </Text>
            
            {/* Skills grid */}
            <View style={styles.skillsContainer}>
              <FlatList
                data={availableSkills}
                renderItem={renderSkillItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false} // The parent ScrollView handles scrolling
                contentContainerStyle={styles.skillsList}
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleContinue}
              disabled={isSubmitting}
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
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Skip Link */}
            <TouchableOpacity onPress={handleSkip} style={styles.skipLinkContainer} disabled={isSubmitting}>
              <Text style={styles.skipLinkText}>
                I&apos;ll select skills later
              </Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6, 
  },
  backgroundShapesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', 
  },
  backgroundShape: {
    position: 'absolute',
    borderRadius: (width * 0.8) / 2, 
    opacity: 0.15, 
  },
  shapeOne: {
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.15,
    left: -width * 0.25,
    backgroundColor: '#FFD529', 
    opacity: 0.1,
  },
  shapeTwo: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.05,
    right: -width * 0.2,
    backgroundColor: '#FFA07A', 
    opacity: 0.12,
  },
  shapeThree: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    right: -width * 0.1,
    backgroundColor: '#ADD8E6', 
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',  // Changed to flex-start for better scrolling with long list
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40, 
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.04, 
    marginBottom: height * 0.02, // Reduced for more content space
  },
  logo: {
    width: width * 0.15, // Slightly smaller logo for this screen
    height: width * 0.15, 
    maxWidth: 60, 
    maxHeight: 60,
  },
  textLogo: {
    width: width * 0.35, 
    height: (width * 0.35) / 6, 
    maxWidth: 150,
    maxHeight: 25,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24, 
    fontWeight: '700',
    color: '#1A202C', 
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito', 
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4A5568', 
    fontFamily: 'Nunito',
    paddingHorizontal: 10,
  },
  skillsContainer: {
    width: '100%',
    marginBottom: 10,
  },
  skillsList: {
    paddingVertical: 5,
  },
  skillItem: {
    flex: 1,
    margin: 5,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skillItemSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  skillText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    color: '#555',
    fontFamily: 'Nunito',
  },
  skillTextSelected: {
    color: '#FFF',
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButton: {
    overflow: 'hidden', 
  },
  buttonGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito', 
  },
  primaryButtonText: {
    color: '#FFFFFF', 
  },
  skipLinkContainer: {
    marginTop: 20, 
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 15,
    color: '#575757', 
    fontFamily: 'Nunito',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    fontFamily: 'Nunito',
  },
}); 