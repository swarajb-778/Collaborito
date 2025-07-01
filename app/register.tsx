import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../src/contexts/OptimizedAuthContext';
import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState(''); // Added username state
  const [usernameError, setUsernameError] = useState(''); // Add username-specific error state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false); // Added terms state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  const { signUp } = useAuth();

  useEffect(() => {
    // Animate logo and content on screen load
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
        duration: 800, // Slower fade-in for form
        delay: 300, // Delay after initial elements
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Helper function to validate username
  const validateUsername = (username: string): boolean => {
    // Username must be 3-20 characters and only contain letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  // Handle username change with live validation
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    
    if (text.trim() === '') {
      // Don't show error when field is empty (user just started typing)
      setUsernameError('');
      return;
    }
    
    // Check if username contains any invalid characters
    if (/[^a-zA-Z0-9_]/.test(text)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      Haptics.selectionAsync(); // Light feedback for invalid character
      return;
    }
    
    // Check length constraints
    if (text.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    
    if (text.length > 20) {
      setUsernameError('Username must be no more than 20 characters');
      return;
    }
    
    // Valid username
    setUsernameError('');
  };

  const handleSignUp = async () => {
    // Validate inputs first
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (!validateUsername(username)) {
      Alert.alert('Invalid Username', 'Username must be 3-20 characters with letters, numbers, and underscores only', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Password is required', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'You must accept the terms and privacy policy to continue.', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('Starting signup process with username:', username);
      
      // signUp now throws errors instead of returning boolean
      await signUp(email, password, { firstName: username });
      
      // Wait a moment for user data to be stored
      console.log('Sign up successful, waiting for user data to be set...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to onboarding screen after successful sign-up
      console.log('Navigating to onboarding');
      
      // Show brief success message then navigate
      Alert.alert(
        'Account Created!', 
        'Welcome to Collaborito. Let\'s complete your profile.', 
        [
          { 
            text: 'Continue', 
            onPress: () => {
              console.log('Executing navigation to onboarding');
              router.replace('/onboarding');
            }
          }
        ],
        { cancelable: false }
      );

    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Sign Up Failed', error.message || 'Sign up failed. Please try again.', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToLogin = () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
     if (router.canGoBack()) {
        router.back();
     } else {
        router.replace('/welcome/signin'); // Fallback if no back history
     }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Enhanced Background Elements */}
      <View style={styles.backgroundShapesContainer}>
        <LinearGradient
          colors={['rgba(255, 220, 100, 0.3)', 'rgba(250, 160, 80, 0.15)', 'rgba(255, 255, 255, 0.7)']} 
          locations={[0, 0.4, 0.8]}
          style={styles.gradientBackground}
        />
         {/* Subtle background shapes */}
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
            keyboardShouldPersistTaps="handled" // Allow taps outside inputs to dismiss keyboard
          >
            {/* Back Button */}
             <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
               <Ionicons name="chevron-back" size={28} color="#242428" />
             </TouchableOpacity>

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <Image 
                source={require('../assets/images/welcome/collaborito-dark-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Image 
                source={require('../assets/images/welcome/collaborito-text-logo.png')} 
                style={styles.textLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <Text style={styles.title}>Create account</Text>
              
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>Username</Text>
                 <View style={[
                   styles.inputContainer,
                   usernameError ? styles.inputContainerError : null
                 ]}>
                   <Ionicons name="person-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                   <TextInput
                     style={styles.input}
                     placeholder="Choose a unique username (e.g. john_doe123)"
                     placeholderTextColor="#B0B0B0"
                     value={username}
                     onChangeText={handleUsernameChange}
                     editable={!isLoading}
                     autoCapitalize="none"
                     returnKeyType="next" // Suggests next field
                   />
                 </View>
                 {usernameError ? (
                   <Text style={styles.inputError}>{usernameError}</Text>
                 ) : (
                   <Text style={styles.inputHint}>3-20 characters, letters, numbers, and underscores only</Text>
                 )}
               </View>

              {/* Email Input */}
               <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>Email</Text>
                 <View style={styles.inputContainer}>
                   <MaterialCommunityIcons name="email-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                   <TextInput
                     style={styles.input}
                     placeholder="Your email address"
                     placeholderTextColor="#B0B0B0"
                     keyboardType="email-address"
                     autoCapitalize="none"
                     value={email}
                     onChangeText={setEmail}
                     editable={!isLoading}
                     returnKeyType="next"
                   />
                 </View>
               </View>

              {/* Password Input */}
               <View style={styles.inputWrapper}>
                 <Text style={styles.inputLabel}>Password</Text>
                 <View style={styles.inputContainer}>
                   <MaterialCommunityIcons name="lock-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                   <TextInput
                     style={styles.input}
                     placeholder="Create a password (min. 6 characters)"
                     placeholderTextColor="#B0B0B0"
                     secureTextEntry={!showPassword}
                     value={password}
                     onChangeText={setPassword}
                     editable={!isLoading}
                     returnKeyType="done" // Suggests form completion
                   />
                   <TouchableOpacity 
                     style={styles.visibilityIcon} 
                     onPress={() => setShowPassword(!showPassword)}
                   >
                     <Ionicons 
                       name={showPassword ? "eye-off-outline" : "eye-outline"} 
                       size={22} 
                       color="#8C8C8C" 
                     />
                   </TouchableOpacity>
                 </View>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I accept the <Text style={styles.linkText}>Terms</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>



              {/* Create Account Button */}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={handleSignUp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#000000', '#333333']} // Match Figma primary button
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" size="small" /> 
                  ) : (
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>Create account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* "Create with Mobile" Button (Secondary - Optional) */}
              {/* 
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                // onPress={handleMobileSignUp} // Add handler if needed
                disabled={isLoading}
                activeOpacity={0.8}
              >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>Create account with mobile</Text>
              </TouchableOpacity> 
              */}

              {/* Login Link */}
              <TouchableOpacity onPress={navigateToLogin} style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkTextBold}>Log in</Text>
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
    backgroundColor: '#F8F9FA', // Add a light base background color
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6, // Cover top 60% of the screen
  },
  backgroundShapesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', // Prevent shapes leaking out
  },
  backgroundShape: {
    position: 'absolute',
    borderRadius: (width * 0.8) / 2, // Make them circular
    opacity: 0.15, 
    filter: 'blur(80px)', // Simulate blur effect (React Native doesn't have native blur filter, this is conceptual)
    // For actual blur, would need react-native-blur or similar
  },
  shapeOne: {
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.15,
    left: -width * 0.25,
    backgroundColor: '#FFD529', // Yellowish tint
    opacity: 0.1,
  },
  shapeTwo: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.05,
    right: -width * 0.2,
    backgroundColor: '#FFA07A', // Light Salmon tint
    opacity: 0.12,
  },
   shapeThree: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    right: -width * 0.1,
    backgroundColor: '#ADD8E6', // Light Blue tint
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40, // Extra padding at bottom
  },
   backButton: {
    position: 'absolute',
    top: 10, // Adjust based on safe area
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05, // Relative margin top
    marginBottom: height * 0.04, // Relative margin bottom
  },
  logo: {
    width: width * 0.18, // Responsive width
    height: width * 0.18, // Responsive height
    maxWidth: 80, // Max size
    maxHeight: 80,
  },
  textLogo: {
    width: width * 0.4, // Responsive width
    height: (width * 0.4) / 6, // Maintain aspect ratio (assuming 180x30)
    maxWidth: 180,
    maxHeight: 30,
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white card
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26, // Slightly larger
    fontWeight: '700',
    color: '#1A202C', // Darker text
    textAlign: 'center',
    marginBottom: 25, // More space below title
    fontFamily: 'Nunito', // Match Figma
  },
   inputWrapper: {
     marginBottom: 18, // Space between input sections
   },
   inputLabel: {
     fontSize: 14,
     fontWeight: '600', // Semibold
     color: '#4A5568', // Grayish blue
     marginBottom: 8,
     fontFamily: 'Nunito', // Match Figma
   },
  inputContainer: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8DADC', // Figma border color
    borderRadius: 10, // Figma border radius
    backgroundColor: '#FFFFFF', // Figma input background
    paddingHorizontal: 16,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#2D3748', // Darker input text
    fontFamily: 'Nunito', // Match Figma
  },
  visibilityIcon: {
    padding: 8, // Easier to tap
    marginLeft: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20, // More vertical space
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5, // Slightly rounded square
    borderWidth: 1.5,
    borderColor: '#718096', // Grayish blue border
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#FFF'
  },
  checkboxChecked: {
    backgroundColor: '#000000', // Figma checked color (black)
    borderColor: '#000000',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'Nunito', // Match Figma
    flex: 1, // Allow text to wrap
  },
  linkText: {
    color: '#0077B5', // Use a standard link blue
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#E53935', // Standard error red
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15, // Space before button
    fontFamily: 'Nunito',
  },
  button: {
    width: '100%',
    height: 56, // Match Figma button height
    borderRadius: 10, // Match Figma border radius
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Space above button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButton: {
     overflow: 'hidden', // Needed for LinearGradient border radius
  },
  secondaryButton: {
     borderWidth: 1,
     borderColor: '#000000', // Figma secondary border
     backgroundColor: '#FFFFFF', // White background
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
    fontFamily: 'Nunito', // Match Figma
  },
  primaryButtonText: {
    color: '#FFFFFF', // Figma primary text
  },
  secondaryButtonText: {
     color: '#000000', // Figma secondary text
  },
  loginLinkContainer: {
    marginTop: 25, // More space above link
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 15,
    color: '#575757', // Match signin screen
    fontFamily: 'Nunito',
  },
  loginLinkTextBold: {
    fontWeight: '700',
    color: '#242428', // Match signin screen
    textDecorationLine: 'underline',
  },
  inputHint: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    marginLeft: 2,
    fontFamily: 'Nunito',
  },
  inputContainerError: {
    borderColor: '#E53935', // Red border for error state
    borderWidth: 1.5,
  },
  inputError: {
    fontSize: 12,
    color: '#E53935', // Error red
    marginTop: 4,
    marginLeft: 2,
    fontFamily: 'Nunito',
  },
}); 