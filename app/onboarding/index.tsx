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
import { FontAwesome5, Ionicons } from '@expo/vector-icons'; // Keep FontAwesome5, add Ionicons if needed for icons
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // Use expo-status-bar
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Add safe area hook

// Get screen dimensions like in register.tsx
const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  console.log('Rendering OnboardingScreen with register.tsx style');
  
  const router = useRouter();
  const { user } = useAuth(); // Only need user from auth context here
  const [savingProfile, setSavingProfile] = useState(false);
  const insets = useSafeAreaInsets(); // Get safe area insets

  // Animation values like in register.tsx
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


  // Log user data for debugging
  useEffect(() => {
    console.log('Onboarding screen received user:', user);
  }, [user]);

  // Initialize form fields with user data if available
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Keep error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [jobTitleError, setJobTitleError] = useState('');
  
  // Keep validation logic
  const validateForm = () => {
    let isValid = true;
    setFirstNameError('');
    setLastNameError('');
    setLocationError('');
    setJobTitleError('');
    
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }
    if (!location.trim()) {
      setLocationError('Location is required');
      isValid = false;
    }
    if (!jobTitle.trim()) {
      setJobTitleError('Job title is required');
      isValid = false;
    }
    
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    return isValid;
  };

  // Keep completion logic
  const handleComplete = async () => {
    if (!validateForm()) return;
    
    try {
      setSavingProfile(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Simulate profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Profile updated with:', { firstName, lastName, location, jobTitle });
      
      // Navigate to the interests screen instead of tabs
      router.replace('/onboarding/interests' as any);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'There was a problem updating your profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Skipping onboarding, navigating to interests screen');
    router.replace('/onboarding/interests' as any);
  };

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
                source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
                style={styles.textLogo}
                resizeMode="contain"
              />
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
                 {firstNameError ? <Text style={styles.inlineErrorText}>{firstNameError}</Text> : null}
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
                  {lastNameError ? <Text style={styles.inlineErrorText}>{lastNameError}</Text> : null}
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
                  {locationError ? <Text style={styles.inlineErrorText}>{locationError}</Text> : null}
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
                  {jobTitleError ? <Text style={styles.inlineErrorText}>{jobTitleError}</Text> : null}
               </View>
               
              {/* Error Message Area (if needed for general errors) */}
              {/* {error ? <Text style={styles.errorText}>{error}</Text> : null} */}

              {/* Use Primary Button style from register.tsx */}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                  onPress={handleComplete}
                  disabled={savingProfile}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#000000', '#333333']} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#FFF" size="small" /> 
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
  formContainer: { // from register
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
  buttonGradient: { // from register
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
}); 