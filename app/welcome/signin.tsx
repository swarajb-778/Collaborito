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
  Animated
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Gallery component to display grid of images
const Gallery = () => {
  // Animation values for staggered entrance
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Create staggered animation for columns
    Animated.stagger(200, [
      Animated.timing(fadeAnim1, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Calculate responsive image height based on screen dimensions
  const imageHeight = Math.min(height * 0.20, 140); // Adjusted height for better visibility
  
  return (
    <View style={styles.galleryGrid}>
      <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim1 }]}>
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
      </Animated.View>
      <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim2 }]}>
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
      </Animated.View>
      <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim3 }]}>
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
      </Animated.View>
    </View>
  );
};

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  const { signIn, signInWithLinkedIn, signInWithDemo } = useAuth();
  
  useEffect(() => {
    // Animate logo and content on screen load
    Animated.sequence([
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
      Animated.timing(buttonScale, {
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
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setError('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Log the credentials for debugging
      console.log('Attempting to sign in with:', { email, password });
      
      // For demo account, use the dedicated demo login function
      if (email === 'demo@collaborito.com' && password === 'demo123') {
        // Use the signInWithDemo function from auth context
        const success = await signInWithDemo();
        
        if (success) {
          // Directly navigate to tabs
          router.replace('/(tabs)');
        } else {
          setError('Demo sign in failed');
        }
        return;
      }
      
      // Regular authentication for non-demo accounts
      await signIn(email, password);
      
      // After successful sign in, manually navigate to tabs
      router.replace('/(tabs)');
    } catch (error) {
      setError('Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLinkedInSignIn = async () => {
    setError('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await signInWithLinkedIn();
      // After successful LinkedIn sign in, manually navigate to tabs
      router.replace('/(tabs)');
    } catch (error) {
      setError('LinkedIn sign in failed');
      console.error('LinkedIn login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDemoSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    // Directly use the signInWithDemo function
    signInWithDemo()
      .then(success => {
        if (success) {
          // Navigate directly to tabs on success
          router.replace('/(tabs)');
        } else {
          setError('Demo sign in failed');
        }
      })
      .catch(error => {
        console.error('Demo login error:', error);
        setError('Failed to sign in with demo account');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  const navigateToRegister = () => {
    router.push('/register');
  };
  
  const navigateBack = () => {
    router.back();
  };
  
  // Calculate card height as a percentage of screen height
  const cardHeight = height * 0.55; // Increased height for email form
  
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
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
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
        
        {/* Gallery below the logo */}
        <Animated.View style={{ opacity: contentOpacity, width: '100%' }}>
          <Gallery />
        </Animated.View>
      </SafeAreaView>
      
      {/* Main content card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: showEmailForm ? 1 : 0 }}
      >
        <Animated.View 
          style={[
            styles.card, 
            { 
              opacity: contentOpacity,
              height: showEmailForm ? cardHeight : undefined,
              paddingBottom: Math.max(insets.bottom + 16, 40), // Adjust for safe area
            }
          ]}
        >
          <ScrollView style={styles.cardScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.cardContent}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your journey with Collaborito
              </Text>
              
              {showEmailForm ? (
                <Animated.View style={[styles.emailFormContainer, { opacity: formOpacity }]}>
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
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#000000', '#333333']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={[styles.socialButtonText, styles.emailButtonText]}>
                        {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : "Sign In"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {/* Back to options */}
                  <TouchableOpacity 
                    style={styles.backToOptions}
                    onPress={toggleEmailForm}
                    disabled={isLoading}
                  >
                    <Text style={styles.backToOptionsText}>Back to other options</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View style={[
                  styles.buttonsContainer, 
                  { transform: [{ scale: buttonScale }] }
                ]}>
                  {/* LinkedIn Sign In */}
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={handleLinkedInSignIn}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <AntDesign name="linkedin-square" size={20} color="#0077B5" style={styles.socialIcon} />
                    <Text style={styles.socialButtonText}>Sign in with LinkedIn</Text>
                  </TouchableOpacity>
                  
                  {/* Demo Account Sign In */}
                  <TouchableOpacity 
                    style={[styles.socialButton, styles.demoButton]}
                    onPress={handleDemoSignIn}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <FontAwesome name="user-circle" size={20} color="#fff" style={styles.socialIcon} />
                    <Text style={[styles.socialButtonText, styles.demoButtonText]}>Sign in with Demo Account</Text>
                  </TouchableOpacity>
                  
                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  {/* Email Sign In */}
                  <TouchableOpacity 
                    style={[styles.socialButton, styles.emailButton]}
                    onPress={toggleEmailForm}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#000000', '#333333']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={[styles.socialButtonText, styles.emailButtonText]}>
                        {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : "Sign in with email"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {/* Error message if any */}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  
                  {/* Sign Up Link */}
                  <TouchableOpacity onPress={navigateToRegister} style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don't have an account? <Text style={styles.signUpTextBold}>Sign up</Text></Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
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
    padding: 15,
    gap: 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 15,
  },
  galleryColumn: {
    flex: 1,
    gap: 9,
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
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
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
  },
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    padding: 28,
    flex: 1,
    justifyContent: 'space-between',
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
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
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
  socialButton: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242428',
    fontFamily: 'Nunito',
  },
  demoButton: {
    backgroundColor: '#4B5563',
    borderColor: '#4B5563',
  },
  demoButtonText: {
    color: '#FFF',
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
  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#8C8C8C',
    fontSize: 14,
    fontFamily: 'Nunito',
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
  }
}); 