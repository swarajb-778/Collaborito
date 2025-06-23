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
  StatusBar as RNStatusBar, // Rename to avoid conflict with expo-status-bar
  TextInput as RNTextInput, // Rename to avoid conflict with custom component
  Image,
  Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Keep FontAwesome5, add Ionicons if needed for icons
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // Use expo-status-bar
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Add safe area hook
import { getSimpleOnboardingManager } from '../../src/services';
import { OnboardingProgress } from '../../components/OnboardingProgress';

// Get screen dimensions like in register.tsx
const { width, height } = Dimensions.get('window');

// Import image assets
const CollaboritoLogo = require('../../assets/images/welcome/collaborito-dark-logo.png');
const CollaboritoTextLogo = require('../../assets/images/welcome/collaborito-text-logo.png');

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateUser, loading } = useAuth(); // Get loading state from context
  const [savingProfile, setSavingProfile] = useState(false);
  const [userDataReady, setUserDataReady] = useState(false);
  const [flowInitialized, setFlowInitialized] = useState(false);
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const insets = useSafeAreaInsets();

  // Enhanced onboarding services
  const onboardingManager = getSimpleOnboardingManager();

  // Animation values like in register.tsx
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Log only once when component mounts
    console.log('Rendering OnboardingScreen with register.tsx style');
    
    // Animate logo and form on screen load
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Initialize onboarding flow
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        console.log('🚀 Initializing onboarding flow...');
        const initialized = await onboardingManager.initialize();
        
        if (initialized) {
          setFlowInitialized(true);
          console.log('✅ Onboarding flow initialized successfully');
          
          // Get current progress
          const progress = await onboardingManager.getCurrentProgress();
          console.log('📊 Current progress:', progress);
          
        } else {
          console.warn('Onboarding manager initialization failed');
          Alert.alert(
            'Setup Error',
            'Unable to initialize onboarding. Please try again.',
            [{ text: 'OK', onPress: () => router.replace('/welcome/signin') }]
          );
        }
      } catch (error) {
        console.error('Failed to initialize onboarding:', (error as Error).message);
        Alert.alert(
          'Error',
          'Failed to initialize onboarding system.',
          [{ text: 'OK', onPress: () => router.replace('/welcome/signin') }]
        );
      }
    };

    if (!loading && user && user.id) {
      initializeOnboarding();
    }
  }, [user, loading]);

  // Monitor user data availability
  useEffect(() => {
    console.log('Onboarding screen received user:', user);
    console.log('Auth loading state:', loading);
    
    // Check if user data is available
    if (!loading && user && user.id) {
      setUserDataReady(true);
      console.log('User data is ready for onboarding');
      
      // Pre-fill form if user data exists
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      
    } else if (!loading && !user) {
      console.error('No user data available after auth loading completed');
      Alert.alert(
        'Session Error',
        'Unable to retrieve user data. Please sign in again.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/welcome/signin')
          }
        ]
      );
    }
  }, [user, loading]);

  // Initialize form fields with user data if available
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Keep error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [jobTitleError, setJobTitleError] = useState('');

  // Keep validation logic with popup alerts
  const validateForm = () => {
    setFirstNameError('');
    setLastNameError('');
    setLocationError('');
    setJobTitleError('');
    
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Location is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    if (!jobTitle.trim()) {
      Alert.alert('Validation Error', 'Job title is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    
    return true;
  };

  // Enhanced completion logic with Supabase integration
  const handleComplete = async () => {
    // Check if user data and flow are ready
    if (!userDataReady || !user || !flowInitialized) {
      Alert.alert('Error', 'System not ready. Please try again.');
      return;
    }

    if (!validateForm()) return;
    
    try {
      setSavingProfile(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('💾 Executing profile step with flow coordinator...');
      console.log('Current user ID:', user.id);
      console.log('Profile data:', { firstName, lastName, location, jobTitle });
      
      // Execute profile step using onboarding manager
      const result = await onboardingManager.executeStep('profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        location: location.trim(),
        jobTitle: jobTitle.trim(),
        email: user.email, // Include email for migration
        password: undefined // Will be auto-generated if needed
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile data');
      }
      
      console.log('✅ Profile step executed successfully');
      
      // Update local auth context for immediate UI updates
      const userProfileUpdate = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      
      await updateUser(userProfileUpdate);
      
      // Navigate to next step
      const nextStep = result.nextStep || 'interests';
      console.log('📍 Navigating to next step:', nextStep);
      router.replace(`/onboarding/${nextStep}` as any);
      
    } catch (error: any) {
      console.error('❌ Error saving profile step:', error);
      Alert.alert(
        'Error', 
        error?.message || 'There was a problem saving your profile. Please try again.'
      );
    } finally {
      setSavingProfile(false);
      setMigrationInProgress(false);
    }
  };

  const handleSkip = async () => {
    try {
      console.log('⏭️ Skipping profile step');
      
      const result = await onboardingManager.skipStep('profile');
      
      if (result.success) {
        const nextStep = result.nextStep || 'interests';
        router.replace(`/onboarding/${nextStep}` as any);
      } else {
        throw new Error('Failed to skip profile step');
      }
      
    } catch (error) {
      console.error('❌ Error skipping profile step:', error instanceof Error ? error.message : error);
      // Fallback navigation
      router.replace('/onboarding/interests' as any);
    }
  };

  // Show loading spinner while auth is loading or flow is not ready
  if (loading || !userDataReady || !flowInitialized) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>
          {loading ? 'Loading user data...' : 
           !userDataReady ? 'Preparing onboarding...' : 
           'Initializing flow...'}
        </Text>
      </View>
    );
  }

  // Adapt return statement to match register.tsx structure
  return (
    <View style={styles.container}>
      {/* Use StatusBar from expo-status-bar */}
      <StatusBar style="dark" /> 
      
      {/* Background elements from register.tsx */}
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
            {/* Logo container from register.tsx */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              {/* Ensure these image paths are correct */}
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

            {/* Content container from register.tsx */}
            <Animated.View style={[styles.contentContainer, { opacity: contentOpacity }]}>
              <Text style={styles.title}>Welcome to Collaborito</Text>
              <Text style={styles.subtitle}>
                Let's set up your profile to help you connect with the right people and projects.
              </Text>

              {/* Onboarding Progress Component - Temporarily disabled */}
              {/* {user && (
                <OnboardingProgress 
                  userId={user.id}
                  onProgressChange={(progress) => {
                    console.log('Profile progress updated:', progress);
                  }}
                />
              )} */}

              {/* Migration Progress Indicator */}
              {migrationInProgress && (
                <View style={styles.migrationContainer}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text style={styles.migrationText}>Setting up your account...</Text>
                </View>
              )}
            </Animated.View>

            {/* Form container from register.tsx */}
            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>
                Tell us a bit more about yourself to get started.
              </Text>

              {/* Use Input Wrapper style from register.tsx */}
              <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>First Name</Text>
                 <View style={styles.inputContainer}>
                   <FontAwesome5 name="user" size={18} color="#8C8C8C" style={styles.inputIcon} />
                   <RNTextInput
                     style={styles.input}
                  placeholder="Enter your first name"
                     placeholderTextColor="#B0B0B0"
                  value={firstName}
                  onChangeText={setFirstName}
                     editable={!savingProfile}
                     autoCapitalize="words"
                     returnKeyType="next"
                   />
                 </View>

               </View>

               <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>Last Name</Text>
                 <View style={styles.inputContainer}>
                    <FontAwesome5 name="user" size={18} color="#8C8C8C" style={styles.inputIcon} />
                   <RNTextInput
                     style={styles.input}
                  placeholder="Enter your last name"
                     placeholderTextColor="#B0B0B0"
                  value={lastName}
                  onChangeText={setLastName}
                     editable={!savingProfile}
                     autoCapitalize="words"
                     returnKeyType="next"
                   />
                 </View>

               </View>
                
               <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>Where are you based?</Text>
                 <View style={styles.inputContainer}>
                    <FontAwesome5 name="map-marker-alt" size={18} color="#8C8C8C" style={styles.inputIcon} />
                   <RNTextInput
                     style={styles.input}
                  placeholder="City, Country"
                     placeholderTextColor="#B0B0B0"
                  value={location}
                  onChangeText={setLocation}
                     editable={!savingProfile}
                     autoCapitalize="words"
                     returnKeyType="next"
                   />
                 </View>

               </View>
               
               <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>Job Title</Text>
                 <View style={styles.inputContainer}>
                   <FontAwesome5 name="briefcase" size={18} color="#8C8C8C" style={styles.inputIcon} />
                   <RNTextInput
                     style={styles.input}
                  placeholder="What do you do?"
                     placeholderTextColor="#B0B0B0"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                     editable={!savingProfile}
                     autoCapitalize="sentences"
                     returnKeyType="done"
                   />
                 </View>

               </View>
               
              {/* Error Message Area (if needed for general errors) */}
              {/* {error ? <Text style={styles.errorText}>{error}</Text> : null} */}

              {/* Use Primary Button style from register.tsx */}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, savingProfile && styles.buttonDisabled]}
                  onPress={handleComplete}
                  disabled={savingProfile}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={savingProfile ? ['#ccc', '#999'] : ['#000000', '#333333']} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {savingProfile ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFF" size="small" style={styles.buttonLoader} />
                      <Text style={[styles.buttonText, styles.primaryButtonText]}>
                        {migrationInProgress ? 'Setting up account...' : 'Saving profile...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>Complete Setup</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Skip Link - Styled like login link in register.tsx */}
              <TouchableOpacity onPress={handleSkip} style={styles.skipLinkContainer} disabled={savingProfile}>
                <Text style={styles.skipLinkText}>
                    I'll complete this later
                  </Text>
                </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Combine and adapt styles from register.tsx and onboarding
const styles = StyleSheet.create({
  container: { // from register
    flex: 1,
    backgroundColor: '#F8F9FA', 
  },
  gradientBackground: { // from register
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6, 
  },
  backgroundShapesContainer: { // from register
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', 
  },
  backgroundShape: { // from register
    position: 'absolute',
    borderRadius: (width * 0.8) / 2, 
    opacity: 0.15, 
  },
  shapeOne: { // from register
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.15,
    left: -width * 0.25,
    backgroundColor: '#FFD529', 
    opacity: 0.1,
  },
  shapeTwo: { // from register
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.05,
    right: -width * 0.2,
    backgroundColor: '#FFA07A', 
    opacity: 0.12,
  },
   shapeThree: { // from register
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    right: -width * 0.1,
    backgroundColor: '#ADD8E6', 
    opacity: 0.08,
  },
  safeArea: { // from register
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  keyboardAvoiding: { // from register
    flex: 1,
  },
  scrollContainer: { // from register
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40, 
  },
  logoContainer: { // from register
    alignItems: 'center',
    marginTop: height * 0.05, 
    marginBottom: height * 0.04, 
  },
  logo: { // from register
    width: width * 0.18, 
    height: width * 0.18, 
    maxWidth: 80, 
    maxHeight: 80,
  },
  textLogo: { // from register
    width: width * 0.4, 
    height: (width * 0.4) / 6, 
    maxWidth: 180,
    maxHeight: 30,
    marginTop: 10,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { // from register
    fontSize: 26, 
    fontWeight: '700',
    color: '#1A202C', 
    textAlign: 'center',
    marginBottom: 8, // Adjusted subtitle margin
    fontFamily: 'Nunito', 
  },
  subtitle: { // New or adapted from onboarding
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25, // Keep original margin
    color: '#4A5568', // Use register style color
    fontFamily: 'Nunito',
  },
   inputWrapper: { // from register
     marginBottom: 18, 
   },
   inputLabel: { // from register
     fontSize: 14,
     fontWeight: '600', 
     color: '#4A5568', 
     marginBottom: 8,
     fontFamily: 'Nunito', 
   },
  inputContainer: { // from register
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8DADC', 
    borderRadius: 10, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: { // from register
    marginRight: 12,
    width: 20, // Ensure icon width consistency
    textAlign: 'center', // Center icon if needed
  },
  input: { // from register
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#2D3748', 
    fontFamily: 'Nunito', 
  },
  inlineErrorText: { // New style for inline errors
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2, // Align slightly with input box
    fontFamily: 'Nunito',
  },
  // errorText: { // from register (for general errors if needed)
  //   color: '#E53935', 
  //   fontSize: 14,
  //   textAlign: 'center',
  //   marginBottom: 15, 
  //   fontFamily: 'Nunito',
  // },
  button: { // from register
    width: '100%',
    height: 56, 
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20, // Adjusted margin from original onboarding button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButton: { // from register
     overflow: 'hidden', 
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: { // from register
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonText: { // from register
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito', 
  },
  primaryButtonText: { // from register
    color: '#FFFFFF', 
  },
  skipLinkContainer: { // Adapted from register's loginLinkContainer
    marginTop: 25, 
    alignItems: 'center',
  },
  skipLinkText: { // Adapted from register's loginLinkText
    fontSize: 15,
    color: '#575757', 
    fontFamily: 'Nunito',
    textDecorationLine: 'underline', // Make it look like a link
    fontWeight: '600', // Slightly bolder
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 20,
  },
  migrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  migrationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'Nunito',
  },
}); 