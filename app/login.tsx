import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, interpolateColor } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  console.log('Rendering LoginScreen');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signIn, signUp, loading, signInWithLinkedIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    cardScale.value = withSpring(1);
    opacity.value = withSpring(1);
  }, []);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
      opacity: opacity.value,
    };
  });
  
  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleAuth = async () => {
    if (!validateForm()) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log(`Authenticating with mode: ${mode}`);
      if (mode === 'signin') {
        await signIn(email, password);
        console.log('Sign in successful, navigating to tabs');
        router.replace('/(tabs)');
      } else if (mode === 'signup') {
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await signUp(email, password, firstName, lastName);
        console.log('Sign up successful, navigating to tabs');
        router.replace('/(tabs)');
      } else if (mode === 'reset') {
        Alert.alert('Reset Password', `An email will be sent to ${email} with instructions to reset your password.`);
        console.log('Password reset initiated, switching to signin mode');
        setMode('signin');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };
  
  const handleLinkedInLogin = async () => {
    try {
      console.log('Starting LinkedIn login');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signInWithLinkedIn();
      console.log('LinkedIn sign in successful, navigating to tabs');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('LinkedIn login error:', error);
    }
  };
  
  const handleDemoLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmail('demo@collaborito.com');
    setPassword('password123');
    setTimeout(() => {
      handleAuth();
    }, 500);
  };
  
  const toggleMode = (newMode: 'signin' | 'signup' | 'reset') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add spring animation when switching modes
    cardScale.value = withSpring(0.97, {}, () => {
      cardScale.value = withSpring(1);
    });
    setMode(newMode);
  };
  
  const renderForm = () => {
    switch (mode) {
      case 'signin':
        return (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
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
            
            <Button
              style={styles.submitButton}
              onPress={handleAuth}
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                'Sign In'
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
              disabled={loading}
            >
              <View style={styles.buttonContent}>
                <FontAwesome5 name="linkedin" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {loading ? 'Loading...' : 'Continue with LinkedIn'}
                </Text>
              </View>
            </Button>
            
            <TouchableOpacity onPress={handleDemoLogin} style={styles.demoButton}>
              <Text style={[styles.demoButtonText, { color: 'white' }]}>
                Use Demo Account
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      case 'signup':
        return (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} style={styles.inputIcon} />}
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
            
            <Button
              style={styles.submitButton}
              onPress={handleAuth}
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
              disabled={loading}
            >
              <View style={styles.buttonContent}>
                <FontAwesome5 name="linkedin" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {loading ? 'Loading...' : 'Continue with LinkedIn'}
                </Text>
              </View>
            </Button>
          </Animated.View>
        );
      case 'reset':
        return (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
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
            
            <Button
              style={styles.submitButton}
              onPress={handleAuth}
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                'Reset Password'
              )}
            </Button>
          </Animated.View>
        );
    }
  };
  
  const renderFormTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'reset':
        return 'Reset Password';
    }
  };
  
  const renderFormSubtitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign in to continue to Collaborito';
      case 'signup':
        return 'Join our community and start collaborating';
      case 'reset':
        return 'We\'ll send you a link to reset your password';
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
            <CollaboritoLogo size={100} color="white" style={styles.logo} />
            <Text style={[styles.appTitle, { color: 'white' }]}>
              Collaborito
            </Text>
            <Text style={[styles.appSubtitle, { color: 'white' }]}>
              Project collaboration made simple
            </Text>
          </Animated.View>
          
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            <Card 
              variant="elevated" 
              style={[
                styles.card, 
                { backgroundColor: colorScheme === 'dark' ? '#1A2437' : '#FFFFFF' }
              ]} 
              padding={24}
            >
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {renderFormTitle()}
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.muted }]}>
                {renderFormSubtitle()}
              </Text>
              
              {renderForm()}
            </Card>
            
            <Animated.View
              style={styles.footer}
              entering={FadeInUp.delay(500).duration(800)}
            >
              {mode === 'signin' && (
                <>
                  <TouchableOpacity 
                    onPress={() => toggleMode('reset')}
                    style={styles.footerButton}
                  >
                    <Text style={[styles.footerText, { color: 'white' }]}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.footerDivider} />
                  <TouchableOpacity 
                    onPress={() => toggleMode('signup')}
                    style={styles.footerButton}
                  >
                    <Text style={[styles.footerTextSecondary, { color: 'rgba(255,255,255,0.8)' }]}>
                      Don't have an account?{' '}
                      <Text style={{ color: 'white', fontWeight: '600' }}>
                        Sign Up
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {mode === 'signup' && (
                <TouchableOpacity 
                  onPress={() => toggleMode('signin')}
                  style={styles.footerButton}
                >
                  <Text style={[styles.footerTextSecondary, { color: 'rgba(255,255,255,0.8)' }]}>
                    Already have an account?{' '}
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
              {mode === 'reset' && (
                <TouchableOpacity 
                  onPress={() => toggleMode('signin')}
                  style={styles.footerButton}
                >
                  <Text style={[styles.footerText, { color: 'white' }]}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}
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
  demoButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  demoButtonText: {
    fontWeight: '600',
    fontSize: 14,
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