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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('OnboardingInterests');

// Import image assets
const CollaboritoLogo = require('../../assets/images/welcome/collaborito-dark-logo.png');
const CollaboritoTextLogo = require('../../assets/images/welcome/collaborito-text-logo.png');

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Default interests list for fallback (will be replaced by Supabase data)
const FALLBACK_INTERESTS = [
  { id: 'f7bff181-f722-44fd-8704-77816f16cdf8', name: 'Art' },
  { id: 'e9e68517-2d26-46e9-8220-39d3745b3d92', name: 'Artificial Intelligence & Machine Learning' },
  { id: '814d804f-04e3-421e-b1ff-64ba42f30e60', name: 'Biotechnology' },
  { id: 'cc7ee20f-171b-4142-a839-9dc840d9a333', name: 'Business' },
  { id: 'b58c1144-26c5-4f03-a2d1-d631bbdf29ae', name: 'Books' },
  { id: '83be43cd-3d73-403b-9064-980b8fbb1229', name: 'Climate Change' },
  { id: 'c3d05bc9-9de7-4bcd-96b7-f8d0f981dd22', name: 'Civic Engagement' },
  { id: 'e44bdf24-f37d-4ae7-8f21-edd136d51562', name: 'Dancing' },
  { id: '7e7ced62-8869-4679-b8f9-c8eb71eabd87', name: 'Data Science' },
  { id: '37276e28-ecb5-4725-9463-dd8f761973e2', name: 'Education' },
  { id: '3dc59a14-192b-4ed6-9870-51cdaf096c3c', name: 'Entrepreneurship' },
  { id: 'a8107a20-5b9b-4ce8-89df-921386e5ea8f', name: 'Fashion' },
  { id: 'd8c696c3-5201-49eb-afef-3d0b72bc20df', name: 'Fitness' },
  { id: '6cd728f6-8ef3-44de-8da9-c850b057ed86', name: 'Food' },
  { id: '45381efc-cf19-4b85-8cde-ca9f6feb5959', name: 'Gaming' },
  { id: '87956f0e-0645-419d-bf42-4474912af027', name: 'Health & Wellness' },
  { id: 'f89c0306-7e4a-4c70-bc5a-22a6be7e6c9c', name: 'Investing & Finance' },
  { id: '1757bd6e-68fe-43ea-8791-3295852b1247', name: 'Marketing' },
  { id: 'e96d075a-ef2a-4e9c-864b-83ff4cb8d71a', name: 'Movies' },
  { id: 'b76bf249-a009-4a3d-b783-dc4bd255dc12', name: 'Music' },
  { id: '8666b6be-a116-41f0-8ca6-649d75125045', name: 'Parenting' },
  { id: 'b1336a3b-6618-4f94-821c-bb0da99a10be', name: 'Pets' },
  { id: 'e2f41cb9-6639-4694-864c-037258766628', name: 'Product Design' },
  { id: '2115f283-f75e-4ae7-bd76-153b3b171bf7', name: 'Reading' },
  { id: '1ec9804e-9fca-48c6-972a-ddc0ff0612f6', name: 'Real Estate' },
  { id: '556ddf1c-ccac-4d51-be85-299a10934300', name: 'Robotics' },
  { id: '59e5ba19-d150-4321-b0c0-263b6918bfa2', name: 'Science & Tech' },
  { id: '3b726657-705f-4e1a-901b-a1babcdd3cbb', name: 'Social Impact' },
  { id: '6d52af64-2369-4de0-a5d1-54706c4b7616', name: 'Sports' },
  { id: 'b87107cc-2ac3-4402-8ce6-52e2a1b52be8', name: 'Travel' },
  { id: 'dd6970ec-6ed2-4eaa-9098-e56cc1065069', name: 'Writing' },
  { id: '7f3f0d72-5952-4a47-a9fa-25ed02f77053', name: 'Other' },
];

export default function OnboardingInterestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [savingInterests, setSavingInterests] = useState(false);
  const [flowReady, setFlowReady] = useState(false);
  const insets = useSafeAreaInsets();

  // Services
  const flowCoordinator = OnboardingFlowCoordinator.getInstance();
  const stepManager = OnboardingStepManager.getInstance();
  const errorRecovery = new OnboardingErrorRecovery();

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initialize flow and load interests
  useEffect(() => {
    const initializeInterestsFlow = async () => {
      try {
        logger.info('🎯 Initializing interests flow...');

        // Check if flow coordinator is ready
        if (!flowCoordinator.canProceed()) {
          logger.warn('⚠️ Flow coordinator not ready, attempting initialization...');
          const flowReady = await flowCoordinator.initializeFlow();
          
          if (!flowReady) {
            logger.error('❌ Flow coordinator initialization failed');
            const recovered = await errorRecovery.attemptRecovery();
            if (!recovered) {
              Alert.alert(
                'Setup Error',
                'Unable to continue with onboarding. Please restart the app.',
                [{ text: 'OK', onPress: () => router.replace('/welcome/signin') }]
              );
              return;
            }
          }
        }

        setFlowReady(true);
        logger.info('✅ Flow ready for interests step');

        // Load available interests
        await loadInterests();

      } catch (error) {
        logger.error('❌ Error initializing interests flow:', error);
        const recovered = await errorRecovery.recoverFromError(error, 'initializeInterestsFlow');
        if (!recovered) {
          Alert.alert('Error', 'Failed to load interests. Please try again.');
        }
      }
    };

    if (user && user.id) {
      initializeInterestsFlow();
    }
  }, [user]);

  const loadInterests = async () => {
    try {
      setLoadingInterests(true);
      logger.info('📖 Loading available interests...');

      const availableInterests = await stepManager.getAvailableInterests();
      
      if (availableInterests && availableInterests.length > 0) {
        setInterests(availableInterests);
        logger.info(`✅ Loaded ${availableInterests.length} interests`);
      } else {
        logger.warn('⚠️ No interests loaded, using fallback data');
        setInterests(FALLBACK_INTERESTS);
      }

    } catch (error) {
      logger.error('❌ Error loading interests:', error);
      
      // Use error recovery for graceful fallback
      const recovered = await errorRecovery.recoverFromError(error, 'loadInterests');
      if (recovered) {
        logger.info('🔄 Using fallback interests due to error recovery');
        setInterests(FALLBACK_INTERESTS);
      } else {
        Alert.alert('Error', 'Failed to load interests. Please try again.');
      }
    } finally {
      setLoadingInterests(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert(
        'No Interests Selected',
        'Please select at least one interest to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (selectedInterests.length > 10) {
      Alert.alert(
        'Too Many Interests',
        'Please select no more than 10 interests.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSavingInterests(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      logger.info('💾 Executing interests step...');
      logger.info('Selected interests:', selectedInterests);

      // Execute interests step using flow coordinator
      const result = await flowCoordinator.executeStep('interests', {
        interestIds: selectedInterests
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save interests');
      }

      logger.info('✅ Interests step completed successfully');

      // Navigate to next step
      const nextRoute = await flowCoordinator.getStepRoute(result.nextStep || 'goals');
      if (nextRoute) {
        logger.info('📍 Navigating to next step:', nextRoute);
        router.replace(nextRoute as any);
      } else {
        logger.info('📍 Defaulting to goals screen');
        router.replace('/onboarding/goals' as any);
      }

    } catch (error) {
      logger.error('❌ Error saving interests:', error);
      
      // Use error recovery
      const recovered = await errorRecovery.recoverFromError(error, 'saveInterests');
      if (!recovered) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to save interests. Please try again.'
        );
      }
    } finally {
      setSavingInterests(false);
    }
  };

  const handleSkip = async () => {
    try {
      logger.info('⏭️ Skipping interests step');

      const result = await flowCoordinator.skipStep('interests', 'User chose to skip interests selection');

      if (result.success) {
        const nextRoute = await flowCoordinator.getStepRoute(result.nextStep || 'goals');
        if (nextRoute) {
          router.replace(nextRoute as any);
        } else {
          router.replace('/onboarding/goals' as any);
        }
      } else {
        throw new Error('Failed to skip interests step');
      }

    } catch (error) {
      logger.error('❌ Error skipping interests:', error);
      // Fallback navigation
      router.replace('/onboarding/goals' as any);
    }
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Show loading screen while initializing
  if (!flowReady || !user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Preparing interests...</Text>
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
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
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
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              <Text style={styles.title}>Your Interests</Text>
              <Text style={styles.subtitle}>
                I'm interested in the following topics. Select a few to make it easier to find people and projects you might find interesting.
              </Text>

              {/* Onboarding Progress Component */}
              {user && (
                <OnboardingProgress 
                  userId={user.id}
                  onProgressChange={(progress) => {
                    logger.info('Interests progress updated:', progress);
                  }}
                />
              )}
              
              {/* Interests grid */}
              <View style={styles.interestsContainer}>
                <FlatList
                  data={interests}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      key={item.id}
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
                  )}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.interestsList}
                />
              </View>

              {/* Selection Counter */}
              <View style={styles.selectionCounter}>
                <Text style={styles.counterText}>
                  {selectedInterests.length} of 10 interests selected
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, 
                       (selectedInterests.length === 0 || savingInterests) && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={selectedInterests.length === 0 || savingInterests}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={savingInterests ? ['#ccc', '#999'] : ['#000000', '#333333']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {savingInterests ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFF" size="small" style={styles.buttonLoader} />
                      <Text style={styles.primaryButtonText}>Saving...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Skip Link */}
              <TouchableOpacity onPress={handleSkip} style={styles.skipLinkContainer} disabled={savingInterests}>
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
  selectionCounter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  counterText: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Nunito',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 