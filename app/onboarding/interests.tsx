import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions, 
  Alert,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Image,
  Animated,
  FlatList 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { OnboardingStepManager, OnboardingFlowCoordinator, OnboardingErrorRecovery } from '../../src/services';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { useAuth } from '../../src/contexts/AuthContext';

// Import image assets
const CollaboritoLogo = require('../../assets/images/welcome/collaborito-dark-logo.png');
const CollaboritoTextLogo = require('../../assets/images/welcome/collaborito-text-logo.png');

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Default interests list for fallback (will be replaced by Supabase data)
const FALLBACK_INTERESTS = [
  { id: '1', name: 'Art' },
  { id: '2', name: 'Artificial Intelligence & Machine Learning' },
  { id: '3', name: 'Biotechnology' },
  { id: '4', name: 'Business' },
  { id: '5', name: 'Books' },
  { id: '6', name: 'Climate Change' },
  { id: '7', name: 'Civic Engagement' },
  { id: '8', name: 'Dancing' },
  { id: '9', name: 'Data Science' },
  { id: '10', name: 'Education' },
  { id: '11', name: 'Entrepreneurship' },
  { id: '12', name: 'Fashion' },
  { id: '13', name: 'Fitness' },
  { id: '14', name: 'Food' },
  { id: '15', name: 'Gaming' },
  { id: '16', name: 'Health & Wellness' },
  { id: '17', name: 'Investing & Finance' },
  { id: '18', name: 'Marketing' },
  { id: '19', name: 'Movies' },
  { id: '20', name: 'Music' },
  { id: '21', name: 'Parenting' },
  { id: '22', name: 'Pets' },
  { id: '23', name: 'Product Design' },
  { id: '24', name: 'Reading' },
  { id: '25', name: 'Real Estate' },
  { id: '26', name: 'Robotics' },
  { id: '27', name: 'Science & Tech' },
  { id: '28', name: 'Social Impact' },
  { id: '29', name: 'Sports' },
  { id: '30', name: 'Travel' },
  { id: '31', name: 'Writing' },
  { id: '32', name: 'Other' },
];

export default function OnboardingInterestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowInitialized, setFlowInitialized] = useState(false);

  // Enhanced onboarding services
  const stepManager = OnboardingStepManager.getInstance();
  const flowCoordinator = OnboardingFlowCoordinator.getInstance();
  const errorRecovery = new OnboardingErrorRecovery();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo and form on screen load
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Initialize onboarding flow and load interests
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Initialize flow
        const flowReady = await flowCoordinator.initializeFlow();
        if (flowReady) {
          setFlowInitialized(true);
        }

        // Load interests from Supabase
        const availableInterests = await stepManager.getAvailableInterests();
        setInterests(availableInterests);

        // Load user's selected interests if they exist
        const userInterests = await stepManager.getUserInterests();
        if (userInterests && userInterests.length > 0) {
          setSelectedInterests(userInterests.map((interest: any) => interest.id));
        }

      } catch (error) {
        console.error('Failed to initialize interests screen:', error);
        // Use fallback interests
        setInterests(FALLBACK_INTERESTS);
        
        // Try recovery
        const recovered = await errorRecovery.recoverFromError(error, 'initializeInterestsScreen');
        if (recovered) {
          setFlowInitialized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      initializeScreen();
    }
  }, [user]);

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedInterests(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(itemId => itemId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Saving interests step with IDs:', selectedInterests);
      
      // Save interests using step manager (saves to Supabase)
      const interestsData = {
        interestIds: selectedInterests
      };
      
      const success = await stepManager.saveInterestsStep(interestsData);
      
      if (!success) {
        throw new Error('Failed to save interests');
      }
      
      console.log('Interests step saved successfully');
      
      // Get next step route from step manager
      const nextRoute = await stepManager.getNextStepRoute('interests');
      if (nextRoute) {
        router.replace(nextRoute as any);
      } else {
        router.replace('/onboarding/goals');
      }
      
    } catch (error) {
      console.error('Error saving interests step:', error);
      
      // Use error recovery to handle the error gracefully
      const recovered = await errorRecovery.recoverFromError(error, 'saveInterestsStep');
      if (!recovered) {
        Alert.alert('Error', 'There was a problem saving your interests. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('Skipping interests step');
      
      if (flowInitialized) {
        // Skip through step manager for proper tracking
        await stepManager.skipStep('interests', 'User chose to skip');
        
        const nextRoute = await stepManager.getNextStepRoute('interests');
        if (nextRoute) {
          router.replace(nextRoute as any);
          return;
        }
      }
      
      // Fallback navigation
      router.replace('/onboarding/goals');
    } catch (error) {
      console.error('Error skipping interests step:', error);
      router.replace('/onboarding/goals');
    }
  };

  // Render interest item
  const renderInterestItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.interestItem,
        selectedInterests.includes(item.id) && styles.interestItemSelected
      ]}
      onPress={() => toggleInterest(item.id)}
      activeOpacity={0.7}
    >
      {selectedInterests.includes(item.id) && (
        <MaterialIcons name="check" size={18} color="#FFF" style={styles.checkIcon} />
      )}
      <Text 
        style={[
          styles.interestText,
          selectedInterests.includes(item.id) && styles.interestTextSelected
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Show loading spinner while data is loading
  if (loading || !flowInitialized) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>
          {loading ? 'Loading interests...' : 'Initializing...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo container */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <Image 
                source={CollaboritoLogo} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Image 
                source={CollaboritoTextLogo} 
                style={styles.textLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Content container */}
            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <Text style={styles.title}>Your Interests</Text>
              <Text style={styles.subtitle}>
                I'm interested in the following topics. Select a few to make it easier to find people and projects you might find interesting.
              </Text>

              {/* Onboarding Progress Component */}
              {user && (
                <OnboardingProgress 
                  userId={user.id}
                  onProgressChange={(progress) => {
                    console.log('Interests progress updated:', progress);
                  }}
                />
              )}
              
              {/* Interests grid */}
              <View style={styles.interestsContainer}>
                <FlatList
                  data={interests}
                  renderItem={renderInterestItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false} // The parent ScrollView handles scrolling
                  contentContainerStyle={styles.interestsList}
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
                  I'll select my interests later
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoiding: {
    flex: 1,
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
  interestsContainer: {
    width: '100%',
    marginBottom: 10,
  },
  interestsList: {
    paddingVertical: 5,
  },
  interestItem: {
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
  interestItemSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  interestText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    color: '#555',
    fontFamily: 'Nunito',
  },
  interestTextSelected: {
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
    fontSize: 16,
    color: '#4A5568',
    marginTop: 16,
    fontFamily: 'Nunito',
  },
}); 