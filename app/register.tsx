import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Animated as RNAnimated
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming,
  Easing 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '@/components/ui/TextInput';

const { width, height } = Dimensions.get('window');

// Gallery component to display grid of images - similar to signin page
const Gallery = () => {
  // Animation values for staggered entrance
  const fadeAnim1 = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim2 = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim3 = useRef(new RNAnimated.Value(0)).current;
  
  useEffect(() => {
    // Create staggered animation for columns
    RNAnimated.stagger(200, [
      RNAnimated.timing(fadeAnim1, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim2, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim3, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Calculate responsive image height based on screen dimensions
  const imageHeight = Math.min(height * 0.15, 110);
  
  return (
    <View style={styles.galleryGrid}>
      <RNAnimated.View style={[styles.galleryColumn, { opacity: fadeAnim1 }]}>
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-1.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-2.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-3.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </RNAnimated.View>
      <RNAnimated.View style={[styles.galleryColumn, { opacity: fadeAnim2 }]}>
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-4.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-5.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-6.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </RNAnimated.View>
      <RNAnimated.View style={[styles.galleryColumn, { opacity: fadeAnim3 }]}>
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-7.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-8.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/images/welcome/gallery/gallery-9.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </RNAnimated.View>
    </View>
  );
};

/**
 * Checkbox component for terms acceptance
 */
const Checkbox = ({ 
  checked, 
  onPress,
  size = 22,
  color = '#000',
}: { 
  checked: boolean; 
  onPress: () => void;
  size?: number;
  color?: string;
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.checkbox, 
        { 
          width: size, 
          height: size, 
          backgroundColor: checked ? color : 'transparent',
          borderWidth: checked ? 0 : 1,
          borderColor: color
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {checked && (
        <FontAwesome5 name="check" size={size * 0.6} color="#FFF" />
      )}
    </TouchableOpacity>
  );
};

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { signUp, loading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  // Animation values
  const logoScale = useRef(new RNAnimated.Value(0.8)).current;
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonScale = useSharedValue(1);
  const errorShake = useSharedValue(0);
  
  // Animated style for error shake animation
  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: errorShake.value }]
    };
  });

  useEffect(() => {
    // Animate logo and content on screen load
    RNAnimated.sequence([
      RNAnimated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Error shake animation
  const shakeError = () => {
    errorShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  
  const validateForm = () => {
    let isValid = true;
    let hasError = false;
    
    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
      hasError = true;
    } else {
      setUsernameError('');
    }
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
      hasError = true;
    } else {
      setEmailError('');
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
      hasError = true;
    } else {
      setPasswordError('');
    }
    
    // Validate terms acceptance
    if (!acceptTerms) {
      setTermsError('You must accept the terms and privacy policy');
      isValid = false;
      hasError = true;
    } else {
      setTermsError('');
    }
    
    // Trigger error animation if there are errors
    if (hasError) {
      shakeError();
    }
    
    return isValid;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate button press
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      // Split username into first and last name (for demo purposes)
      const nameParts = username.split(' ');
      const firstName = nameParts[0] || username;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      await signUp(email, password, firstName, lastName);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to tabs
      router.push('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      shakeError();
    }
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  // Calculate card height as a percentage of screen height
  const cardHeight = height * 0.58;
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(255,214,99,0.25)', 'rgba(244,141,59,0.15)']}
        locations={[0.2, 0.8]}
        style={styles.gradientBackground}
      />
      
      <SafeAreaView style={styles.mainContent}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="chevron-back" size={28} color="#242428" />
        </TouchableOpacity>
        
        {/* Logo at the top */}
        <RNAnimated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
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
        </RNAnimated.View>
        
        {/* Gallery below the logo */}
        <RNAnimated.View 
          style={{ 
            opacity: contentOpacity, 
            width: '100%',
            height: height * 0.4,
            maxHeight: 380,
            marginBottom: 80
          }}
        >
          <Gallery />
        </RNAnimated.View>
      </SafeAreaView>
      
      {/* Main content card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <RNAnimated.View 
          style={[
            styles.card, 
            { 
              opacity: contentOpacity,
              height: cardHeight,
              paddingBottom: Math.max(insets.bottom + 16, 40),
              zIndex: 5,
            }
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join Collaborito and start finding collaborators
            </Text>
            
            <Animated.View style={[styles.formContainer, errorAnimatedStyle]}>
              {/* Username input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#8C8C8C"
                  value={username}
                  onChangeText={setUsername}
                  error={usernameError}
                />
              </View>
              
              {/* Email input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#8C8C8C"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  error={emailError}
                />
              </View>
              
              {/* Password input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#8C8C8C"
                  secureTextEntry={true}
                  value={password}
                  onChangeText={setPassword}
                  error={passwordError}
                />
              </View>
              
              {/* Terms and conditions */}
              <View style={styles.termsContainer}>
                <Checkbox 
                  checked={acceptTerms} 
                  onPress={() => setAcceptTerms(!acceptTerms)} 
                  color="#0077B5"
                />
                <Text style={styles.termsText}>
                  I accept the terms and privacy policy
                </Text>
              </View>
              
              {termsError ? (
                <Text style={styles.errorText}>{termsError}</Text>
              ) : null}
              
              {/* Register Button */}
              <Animated.View style={[{ transform: [{ scale: buttonScale.value }] }]}>
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#000000', '#333333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.registerButtonText}>
                      {loading ? <ActivityIndicator color="#FFF" size="small" /> : "Create Account"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              {/* Login link */}
              <TouchableOpacity 
                style={styles.loginLink}
                onPress={handleBackToLogin}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </RNAnimated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 60,
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  backButton: {
    position: 'absolute',
    top: 10,
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
    paddingTop: 10,
    marginBottom: 5,
  },
  logo: {
    width: 70,
    height: 70,
  },
  textLogo: {
    width: 180,
    height: 30,
    marginTop: 8,
  },
  galleryGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  galleryColumn: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  galleryImage: {
    width: '100%',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    padding: 28,
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#242428',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Nunito',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#575757',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Nunito',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  inputContainer: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#242428',
    fontFamily: 'Nunito',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
    width: '100%',
  },
  checkbox: {
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#575757',
    fontFamily: 'Nunito',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
    marginTop: -5,
    marginBottom: 15,
    fontFamily: 'Nunito',
  },
  registerButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 10,
  },
  buttonGradient: {
    flex: 1,
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#575757',
    fontFamily: 'Nunito',
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#0077B5',
  },
}); 