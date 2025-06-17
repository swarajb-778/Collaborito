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
import { OnboardingStepManager, OnboardingFlowCoordinator, OnboardingErrorRecovery } from '../../src/services';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { useAuth } from '../../src/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Interface for dynamic skills from Supabase
interface SupabaseSkill {
  id: string;
  name: string;
  category?: string;
}

// List of fallback project skills (converted to string IDs for Supabase compatibility)
const PROJECT_SKILLS = [
  { id: '1', name: 'Accounting' },
  { id: '2', name: 'Artificial Intelligence & Machine Learning' },
  { id: '3', name: 'Biotechnology' },
  { id: '4', name: 'Business' },
  { id: '5', name: 'Content Creation (e.g. video, copywriting)' },
  { id: '6', name: 'Counseling & Therapy' },
  { id: '7', name: 'Data Analysis' },
  { id: '8', name: 'DevOps' },
  { id: '9', name: 'Finance' },
  { id: '10', name: 'Fundraising' },
  { id: '11', name: 'Graphic Design' },
  { id: '12', name: 'Legal' },
  { id: '13', name: 'Manufacturing' },
  { id: '14', name: 'Marketing' },
  { id: '15', name: 'Policy' },
  { id: '16', name: 'Product Management' },
  { id: '17', name: 'Project Management' },
  { id: '18', name: 'Public Relations' },
  { id: '19', name: 'Research' },
  { id: '20', name: 'Sales' },
  { id: '21', name: 'Software Development (Backend)' },
  { id: '22', name: 'Software Development (Frontend)' },
  { id: '23', name: 'UI/UX Design' },
  { id: '24', name: 'Other' },
];

export default function ProjectSkillsScreen() {
  const { user } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SupabaseSkill[]>(PROJECT_SKILLS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowInitialized, setFlowInitialized] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Enhanced onboarding services
  const stepManager = OnboardingStepManager.getInstance();
  const flowCoordinator = OnboardingFlowCoordinator.getInstance();
  const errorRecovery = new OnboardingErrorRecovery();
  
  // Get the goalId from URL params and convert to number
  const goalId = params.goalId ? Number(params.goalId) : 2; // Default to 2 if not provided
  
  // Animation values
  const logoScale = useRef(new RNAnimated.Value(0.8)).current;
  const formOpacity = useRef(new RNAnimated.Value(0)).current;

  // Initialize onboarding flow and load data
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setLoading(true);
        
        // Initialize flow coordinator
        const flowReady = await flowCoordinator.initializeFlow();
        if (!flowReady) {
          const recovered = await errorRecovery.attemptRecovery();
          if (!recovered) {
            Alert.alert('Setup Error', 'Unable to initialize onboarding. Please try again.');
            router.replace('/welcome/signin');
            return;
          }
        }
        
        setFlowInitialized(true);
        
        // Try to load skills from Supabase and restore user selections
        await Promise.all([
          loadAvailableSkills(),
          restoreUserSkills()
        ]);
        
      } catch (error) {
        console.error('Failed to initialize project skills screen:', error);
        const showRecovery = await errorRecovery.showRecoveryDialog();
        if (!showRecovery) {
          router.replace('/welcome/signin');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      initializeScreen();
    }
  }, [user]);

  const loadAvailableSkills = async () => {
    try {
      // Try to load skills from Supabase
      const supabaseSkills = await stepManager.getAvailableSkills();
      
      if (supabaseSkills && supabaseSkills.length > 0) {
        setAvailableSkills(supabaseSkills);
        console.log(`Loaded ${supabaseSkills.length} skills from Supabase`);
      } else {
        // Keep using fallback skills
        console.log('Using fallback skills - Supabase skills not available');
      }
    } catch (error) {
      console.error('Failed to load skills from Supabase:', error);
      // Continue with fallback skills - not critical
    }
  };

  const restoreUserSkills = async () => {
    try {
      // Try to restore existing user skills
      const userSkills = await stepManager.getUserSkills();
      if (userSkills && userSkills.length > 0) {
        const skillIds = userSkills.map(skill => skill.skillId || skill.id);
        setSelectedSkills(skillIds);
        console.log('Restored user skills:', skillIds);
      }
    } catch (error) {
      console.error('Failed to restore user skills:', error);
      // Continue without restoring - not critical
    }
  };

  // Get subtitle text based on the goalId
  const getSubtitleText = () => {
    switch (goalId) {
      case 1:
        return "Select the skills you'd like your co-founder to bring to your project.";
      case 2:
        return "Select the skills you'd like collaborators to bring to your project.";
      case 3:
        return "Select the skills you can offer to projects.";
      case 4:
        return "Select the skills you're interested in exploring.";
      default:
        return "Select the skills you'd like collaborators to bring to your project.";
    }
  };

  // Get title text based on the goalId
  const getTitleText = () => {
    switch (goalId) {
      case 1:
      case 2:
        return "What skills are you looking for?";
      case 3:
        return "What skills can you offer?";
      case 4:
        return "What skills interest you?";
      default:
        return "What skills are you looking for?";
    }
  };

  useEffect(() => {
    console.log('Rendering ProjectSkillsScreen with enhanced Supabase integration');
    
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
  }, []);

  const toggleSkill = (skillId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedSkills(prevSelected => {
      if (prevSelected.includes(skillId)) {
        return prevSelected.filter(id => id !== skillId);
      } else {
        return [...prevSelected, skillId];
      }
    });
  };

  const handleContinue = async () => {
    if (!flowInitialized || !user) {
      Alert.alert('Error', 'System not ready. Please try again.');
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert('Skills Required', 'Please select at least one skill to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Saving skills to Supabase...');
      
      // Prepare skills data for Supabase
      const isOffering = goalId === 3; // If goal is "contribute skills", user is offering
      const skillsData = {
        skills: selectedSkills.map(skillId => ({
          skillId: skillId,
          isOffering: isOffering,
          proficiency: 'intermediate' as const
        }))
      };
      
      const success = await stepManager.saveSkillsStep(skillsData);
      
      if (success) {
        console.log('Skills saved successfully');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
        // Get next step route from flow coordinator
        const nextRoute = await stepManager.getNextStepRoute('skills');
        if (nextRoute) {
          router.replace(nextRoute as any);
        } else {
          // Complete onboarding - navigate to main app
          router.replace('/(tabs)');
        }
      } else {
        throw new Error('Failed to save skills');
      }
      
    } catch (error) {
      console.error('Error saving skills:', error);
      
      // Use error recovery for better UX
      const canRecover = await errorRecovery.recoverFromError(error as Error, 'skills_save');
      if (!canRecover) {
        Alert.alert('Error', 'There was a problem saving your skills. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = async () => {
    if (!flowInitialized) {
      Alert.alert('Error', 'System not ready. Please try again.');
      return;
    }

    try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Skip step using step manager
      await stepManager.skipStep('skills', 'User chose to skip skills selection');
      
      // Get next step route
      const nextRoute = await stepManager.getNextStepRoute('skills');
      if (nextRoute) {
        router.replace(nextRoute as any);
      } else {
        // Complete onboarding
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error skipping step:', error);
      // Fallback navigation
      router.replace('/(tabs)');
    }
  };

  // Render skill item
  const renderSkillItem = ({ item }: { item: SupabaseSkill }) => (
    <TouchableOpacity
      style={[
        styles.skillItem,
        selectedSkills.includes(item.id) && styles.skillItemSelected
      ]}
      onPress={() => toggleSkill(item.id)}
      activeOpacity={0.7}
    >
      {selectedSkills.includes(item.id) && (
        <MaterialIcons name="check" size={18} color="#FFF" style={styles.checkIcon} />
      )}
      <Text 
        style={[
          styles.skillText,
          selectedSkills.includes(item.id) && styles.skillTextSelected
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Show loading screen while initializing
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.subtitle, { marginTop: 16, textAlign: 'center' }]}>
          Loading skills...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      {/* Add OnboardingProgress component */}
      <OnboardingProgress userId={user?.id || ''} />
      
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
            <Image 
              source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
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
                I'll select skills later
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
}); 