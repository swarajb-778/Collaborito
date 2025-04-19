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
  Animated as RNAnimated
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import Reanimated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming, 
  Easing,
  SlideInDown,
  SlideInUp  
} from 'react-native-reanimated';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Gallery component to display grid of images
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
  // Reduced image height to prevent overlap with the card
  const imageHeight = Math.min(height * 0.15, 110);
  
  return (
    <View style={styles.galleryGrid}>
      <RNAnimated.View style={[styles.galleryColumn, { opacity: fadeAnim1 }]}>
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-1.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-2.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-3.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </RNAnimated.View>
      <RNAnimated.View style={[styles.galleryColumn, { opacity: fadeAnim2 }]}>
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-4.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-5.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-6.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </RNAnimated.View>
      <RNAnimated.View style={[styles.galleryColumn, { opacity: fadeAnim3 }]}>
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-7.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-8.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-9.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </RNAnimated.View>
    </View>
  );
};

// Add email validation function
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Define the type for the SocialLoginButton component
type SocialLoginButtonProps = {
  icon: React.ReactNode;
  text: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  border?: string;
  muted?: string;
  isLoading?: string | null;
};

// Social Login Button Component with animation
const SocialLoginButton = ({
  icon,
  text,
  onPress,
  color = '#FFFFFF',
  textColor = '#000000',
  border = 'transparent',
  isLoading = null,
  muted = '#8C8C8C'
}: SocialLoginButtonProps) => {
  // Local animation values for button press feedback
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const handlePress = () => {
    // Animate scale and trigger haptic feedback
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  
  return (
    <Reanimated.View style={animatedStyle}>
      <TouchableOpacity 
        style={[styles.socialButton, { backgroundColor: color }]} 
        onPress={handlePress}
        disabled={!!isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            <View style={styles.socialIcon}>{icon}</View>
            <Text style={[styles.socialButtonText, { color: textColor }]}>{text}</Text>
          </>
        )}
      </TouchableOpacity>
    </Reanimated.View>
  );
};

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  
  // Animation values
  const logoScale = useRef(new RNAnimated.Value(0.8)).current;
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonScale = useRef(new RNAnimated.Value(0.95)).current;
  const formOpacity = useRef(new RNAnimated.Value(0)).current;
  
  const { signIn, signInWithLinkedIn, signInWithDemo } = useAuth();
  
  // Add these additional animation values to the component
  const signInButtonScale = useSharedValue(1);
  const socialButtonsOpacity = useSharedValue(1);
  const loadingIndicatorOpacity = useSharedValue(0);
  const loadingProgress = useSharedValue(0);
  const successCheckOpacity = useSharedValue(0);
  const successCheckScale = useSharedValue(0);
  
  // Add these animated styles
  const signInButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: signInButtonScale.value }],
    };
  });
  
  const socialButtonsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: socialButtonsOpacity.value,
    };
  });
  
  const loadingIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: loadingIndicatorOpacity.value,
      transform: [{ scale: loadingIndicatorOpacity.value }],
    };
  });
  
  const successCheckStyle = useAnimatedStyle(() => {
    return {
      opacity: successCheckOpacity.value,
      transform: [{ scale: successCheckScale.value }],
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
      RNAnimated.timing(buttonScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm);
    if (!showEmailForm) {
      // Animate form appearance
      RNAnimated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handleSignIn = async () => {
    try {
      // Validate inputs
      if (!validateEmail(email)) {
        setError('Please enter a valid email');
        return;
      }
      if (!password) {
        setError('Please enter your password');
        return;
      }
      
      setError('');
      setIsLoading('signin');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Implement your auth logic here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // On successful login
      router.replace('/(tabs)');
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(null);
    }
  };
  
  const handleLinkedInSignIn = async () => {
    try {
      // Start animation and haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      signInButtonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
      
      socialButtonsOpacity.value = withTiming(0.7, { duration: 300 });
      loadingIndicatorOpacity.value = withTiming(1, { duration: 300 });
      
      // Simulate a loading progress animation
      const animateProgress = () => {
        loadingProgress.value = withTiming(1, { 
          duration: 1200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
      };
      
      animateProgress();
      
      console.log('Starting LinkedIn login flow');
      await signInWithLinkedIn();
      
      // Show success animation before navigating
      socialButtonsOpacity.value = withTiming(0, { duration: 200 });
      loadingIndicatorOpacity.value = withTiming(0, { duration: 200 });
      
      successCheckOpacity.value = withTiming(1, { duration: 300 });
      successCheckScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Wait a moment to show success animation before navigating
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      
      // Error animation and haptic feedback
      socialButtonsOpacity.value = withTiming(1, { duration: 300 });
      loadingIndicatorOpacity.value = withTiming(0, { duration: 200 });
      loadingProgress.value = withTiming(0, { duration: 200 });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const handleDemoSignIn = async () => {
    try {
      // Start animation and haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDemoLoading(true);
      
      signInButtonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
      
      socialButtonsOpacity.value = withTiming(0.7, { duration: 300 });
      loadingIndicatorOpacity.value = withTiming(1, { duration: 300 });
      
      // Simulate a loading progress animation
      loadingProgress.value = withTiming(1, { 
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
      
      // For visual feedback, wait a bit
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const success = await signInWithDemo();
      
      if (success) {
        // Show success animation before navigating
        socialButtonsOpacity.value = withTiming(0, { duration: 200 });
        loadingIndicatorOpacity.value = withTiming(0, { duration: 200 });
        
        successCheckOpacity.value = withTiming(1, { duration: 300 });
        successCheckScale.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
        
        // Success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Wait a moment to show success animation before navigating
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      }
    } catch (error) {
      console.error('Demo sign in error:', error);
      
      // Error animation and haptic feedback
      socialButtonsOpacity.value = withTiming(1, { duration: 300 });
      loadingIndicatorOpacity.value = withTiming(0, { duration: 200 });
      loadingProgress.value = withTiming(0, { duration: 200 });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setDemoLoading(false);
    }
  };
  
  const navigateToRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/register');
  };
  
  const navigateBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  // Calculate card height as a percentage of screen height - adjusted for content
  const cardHeight = showEmailForm ? height * 0.55 : height * 0.46;
  
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
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="chevron-back" size={28} color="#242428" />
        </TouchableOpacity>
        
        {/* Logo at the top */}
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
        
        {/* Gallery below the logo - wrapped in a container with fixed height to prevent overlap */}
        <RNAnimated.View 
          style={{ 
            opacity: contentOpacity, 
            width: '100%', 
            height: height * 0.4,  // Fixed height for gallery container
            maxHeight: 380,        // Maximum height to prevent overflow
            marginBottom: 80       // Add margin at bottom to create space before card
          }}
        >
          <Gallery />
        </RNAnimated.View>
      </SafeAreaView>
      
      {/* Main content card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: showEmailForm ? 1 : 0 }}
      >
        <RNAnimated.View 
          style={[
            styles.card, 
            { 
              opacity: contentOpacity,
              height: cardHeight,
              paddingBottom: Math.max(insets.bottom + 16, 40), // Adjust for safe area
              zIndex: 5, // Ensure card appears on top
            }
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your journey with Collaborito
            </Text>
            
            {showEmailForm ? (
              <RNAnimated.View style={[styles.emailFormContainer, { opacity: formOpacity }]}>
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
                    editable={!isLoading}
                  />
                </View>
                
                {/* Password input */}
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#8C8C8C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8C8C8C"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.visibilityIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#8C8C8C" 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Sign In Button */}
                <TouchableOpacity 
                  style={[styles.socialButton, styles.emailButton]}
                  onPress={handleSignIn}
                  disabled={!!isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#000000', '#333333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={[styles.socialButtonText, styles.emailButtonText]}>
                      {isLoading === 'signin' ? <ActivityIndicator color="#FFF" size="small" /> : "Sign In"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Back to options */}
                <TouchableOpacity 
                  style={styles.backToOptions}
                  onPress={toggleEmailForm}
                  disabled={!!isLoading}
                >
                  <Text style={styles.backToOptionsText}>Back to other options</Text>
                </TouchableOpacity>
              </RNAnimated.View>
            ) : (
              <View style={styles.socialLoginContainer}>
                <Text style={[styles.socialLoginTitle, { color: colors.muted }]}>
                  Continue with
                </Text>
                
                <RNAnimated.View style={socialButtonsAnimatedStyle}>
                  <SocialLoginButton
                    icon={<FontAwesome name="linkedin" size={20} color="#FFFFFF" />}
                    text="LinkedIn"
                    onPress={handleLinkedInSignIn}
                    color="#0077B5"
                    textColor="#FFFFFF"
                    isLoading={isLoading === 'linkedin' ? 'linkedin' : null}
                    muted={colors.muted}
                    border={colors.border}
                  />
                  
                  <SocialLoginButton
                    icon={<MaterialCommunityIcons name="email-outline" size={20} color="#FFFFFF" />}
                    text="Sign in with Email"
                    onPress={toggleEmailForm}
                    color={colors.secondary}
                    textColor="#FFFFFF"
                    isLoading={isLoading === 'email' ? 'email' : null}
                    muted={colors.muted}
                    border={colors.border}
                  />
                </RNAnimated.View>
                
                <View style={styles.orDivider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.muted }]}>OR</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>
                
                {/* Sign up button */}
                <TouchableOpacity 
                  style={[styles.signUpButton, { borderColor: colors.primary }]}
                  onPress={navigateToRegister}
                >
                  <Text style={[styles.signUpButtonText, { color: colors.primary }]}>Create an Account</Text>
                </TouchableOpacity>
                
                {/* Demo Account */}
                <TouchableOpacity 
                  style={styles.demoAccountButton}
                  onPress={handleDemoSignIn}
                >
                  <Text style={[styles.demoAccountText, { color: colors.muted }]}>Try Demo Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Loading and success indicators moved outside the main content */}
          <RNAnimated.View 
            style={[styles.loadingContainer, loadingIndicatorStyle]}
            pointerEvents="none"
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Signing In...
            </Text>
          </RNAnimated.View>
          
          {/* Sign in success overlay - moved outside main card content and adjusted z-index */}
          <RNAnimated.View 
            style={[styles.successContainer, successCheckStyle]}
            pointerEvents="none"
          >
            <View style={[styles.successCircle, { backgroundColor: colors.success }]}>
              <FontAwesome5 name="check" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.successTextContainer}>
              <Text style={[styles.successText, { color: colors.accent }]}>
                Sign In Successful!
              </Text>
            </View>
          </RNAnimated.View>
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
    paddingBottom: 60, // Added padding to create space before the card
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
  galleryGrid: {
    flexDirection: 'row',
    padding: 12, // Reduced padding
    gap: 8,      // Reduced gap
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 10, // Reduced vertical margin
  },
  galleryColumn: {
    flex: 1,
    gap: 8, // Reduced gap between images
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
  logoContainer: {
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 5, // Reduced margin
  },
  logo: {
    width: 70,  // Slightly smaller logo
    height: 70, // Slightly smaller logo
  },
  textLogo: {
    width: 180,
    height: 30,
    marginTop: 8,
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
    zIndex: 5, // Added zIndex to ensure card appears on top
  },
  cardContent: {
    padding: 28,
    flex: 1,
    justifyContent: 'flex-start', // Changed from space-between to flex-start
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
  socialLoginContainer: {
    width: '100%',
    marginBottom: 20,
  },
  socialLoginTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    marginBottom: 12,
    position: 'relative',
  },
  socialIcon: {
    position: 'absolute',
    left: 16,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    paddingHorizontal: 10,
  },
  emailFormContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
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
  visibilityIcon: {
    padding: 8,
  },
  emailButton: {
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  emailButtonText: {
    color: '#FFF',
  },
  buttonGradient: {
    flex: 1,
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 15,
    color: '#575757',
    fontFamily: 'Nunito',
  },
  signUpTextBold: {
    fontWeight: '700',
    color: '#242428',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Nunito',
  },
  backToOptions: {
    marginTop: 20,
  },
  backToOptionsText: {
    fontSize: 14,
    color: '#0077B5',
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  signUpButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  emailSignInButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emailSignInText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Increased z-index to ensure it's above all other content
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Added semi-transparent background
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15, // Higher z-index than loading indicator
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Added semi-transparent background
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  demoAccountButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoAccountText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}); 