import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';

export default function LoginScreen() {
  console.log('Rendering LoginScreen');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signIn, signUp, resetPassword, loading, signInWithLinkedIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
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
      console.log(`Authenticating with mode: ${mode}`);
      if (mode === 'signin') {
        await signIn(email, password);
        console.log('Sign in successful, navigating to tabs');
        router.replace('/(tabs)');
      } else if (mode === 'signup') {
        await signUp(email, password, fullName);
        console.log('Sign up successful, navigating to tabs');
        router.replace('/(tabs)');
      } else if (mode === 'reset') {
        await resetPassword(email);
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
    setEmail('demo@collaborito.com');
    setPassword('password123');
    setTimeout(() => {
      handleAuth();
    }, 500);
  };
  
  const toggleMode = (newMode: 'signin' | 'signup' | 'reset') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              leftIcon={<FontAwesome5 name="envelope" size={16} color={colors.muted} />}
              error={emailError}
            />
            
            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} />}
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
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            
            <Button
              style={styles.linkedInButton}
              onPress={handleLinkedInLogin}
              variant="primary"
              disabled={loading}
            >
              <FontAwesome5 name="linkedin" size={18} color="white" style={{ marginRight: 8 }} />
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                'Sign In with LinkedIn'
              )}
            </Button>
            
            <TouchableOpacity onPress={handleDemoLogin} style={styles.demoButton}>
              <Text style={styles.demoButtonText}>Use Demo Account</Text>
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
              leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} />}
            />
            
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<FontAwesome5 name="envelope" size={16} color={colors.muted} />}
              error={emailError}
            />
            
            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} />}
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
                'Sign Up'
              )}
            </Button>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            
            <Button
              style={styles.linkedInButton}
              onPress={handleLinkedInLogin}
              variant="primary"
              disabled={loading}
            >
              <FontAwesome5 name="linkedin" size={18} color="white" style={{ marginRight: 8 }} />
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                'Sign Up with LinkedIn'
              )}
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
              leftIcon={<FontAwesome5 name="envelope" size={16} color={colors.muted} />}
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
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primary, colorScheme === 'dark' ? colors.background : colors.secondary]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={styles.container} entering={FadeIn.duration(800)}>
          <Animated.View
            style={styles.header}
            entering={FadeInDown.duration(800)}
          >
            <CollaboritoLogo size={120} color={Colors.light.primary} style={styles.logo} />
            <Text style={[styles.title, { color: colors.text }]}>
              Collaborito
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Project collaboration made simple
            </Text>
            
            {renderForm()}
          </Animated.View>
          
          <Animated.View
            style={styles.footer}
            entering={FadeInUp.delay(500).duration(800)}
          >
            {mode === 'signin' && (
              <>
                <TouchableOpacity onPress={() => toggleMode('reset')}>
                  <Text style={[styles.footerText, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleMode('signup')}>
                  <Text style={[styles.footerText, { color: colors.primary }]}>
                    Don't have an account? Sign Up
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'signup' && (
              <TouchableOpacity onPress={() => toggleMode('signin')}>
                <Text style={[styles.footerText, { color: colors.primary }]}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
            )}
            {mode === 'reset' && (
              <TouchableOpacity onPress={() => toggleMode('signin')}>
                <Text style={[styles.footerText, { color: colors.primary }]}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  demoButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
}); 