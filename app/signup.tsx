import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Import components
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';
import { useColorScheme } from '../components/ui/useColorScheme';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen() {
  const { signUp, linkedInLogin } = useAuth();
  const { colorScheme, colors } = useColorScheme();
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Error states
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  
  // Form validation
  const validateForm = () => {
    let isValid = true;
    
    // Full name validation
    if (!fullName.trim()) {
      setFullNameError('Full name is required');
      isValid = false;
    } else {
      setFullNameError('');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };
  
  // Handle sign up
  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      // Success - user will be redirected by the auth context
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          setEmailError(error.message);
        } else if (error.message.includes('password')) {
          setPasswordError(error.message);
        } else {
          // Show general error
          alert(`Error: ${error.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle LinkedIn login
  const handleLinkedInLogin = async () => {
    setLinkedInLoading(true);
    try {
      await linkedInLogin();
      // Success - user will be redirected by the auth context
    } catch (error) {
      alert(`LinkedIn login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLinkedInLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <LinearGradient
        colors={[
          '#4361EE',
          '#3A0CA3'
        ]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={styles.logoContainer} entering={FadeInDown.duration(800)}>
            <CollaboritoLogo size={80} color="white" style={styles.logo} />
            <Text style={[styles.appTitle, { color: 'white' }]}>
              Collaborito
            </Text>
            <Text style={[styles.appSubtitle, { color: 'white' }]}>
              Project collaboration made simple
            </Text>
          </Animated.View>
          
          <Animated.View style={styles.cardContainer} entering={FadeInUp.duration(800)}>
            <Card 
              variant="elevated" 
              style={[
                styles.card, 
                { backgroundColor: colorScheme === 'dark' ? '#1A2437' : '#FFFFFF' }
              ]} 
              padding={24}
            >
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Create Account
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.muted }]}>
                Join our community and start collaborating
              </Text>
              
              <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={fullNameError}
                />
                
                <TextInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<FontAwesome5 name="envelope" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={emailError}
                />
                
                <TextInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={passwordError}
                />
                
                <TextInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={confirmPasswordError}
                />
                
                <Button
                  style={styles.submitButton}
                  onPress={handleSignUp}
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
                
                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }]} />
                  <Text style={[styles.dividerText, { color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }]}>or</Text>
                  <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }]} />
                </View>
                
                <Button
                  style={styles.linkedInButton}
                  onPress={handleLinkedInLogin}
                  variant="primary"
                  disabled={loading || linkedInLoading}
                >
                  <View style={styles.buttonContent}>
                    <FontAwesome5 name="linkedin" size={20} color="white" />
                    <Text style={styles.buttonText}>
                      {linkedInLoading ? 'Loading...' : 'Continue with LinkedIn'}
                    </Text>
                  </View>
                </Button>
              </Animated.View>
            </Card>
            
            <Animated.View
              style={styles.footer}
              entering={FadeInUp.delay(500).duration(800)}
            >
              <TouchableOpacity 
                onPress={() => router.push('/login')}
                style={styles.footerButton}
              >
                <Text style={[styles.footerTextSecondary, { color: 'rgba(255,255,255,0.8)' }]}>
                  Already have an account?{' '}
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    Sign In
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = Math.min(width - 40, 400);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContainer: {
    width: cardWidth,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  submitButton: {
    height: 56,
    marginTop: 16,
  },
  linkedInButton: {
    backgroundColor: '#0077B5',
    marginTop: 12,
    height: 56,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  footerButton: {
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerTextSecondary: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footerDivider: {
    height: 16,
  },
  inputIcon: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 