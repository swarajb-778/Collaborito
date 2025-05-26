import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signUp, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    let isValid = true;
    if (!fullName.trim()) {
      setNameError('Full Name is required');
      isValid = false;
    } else if (containsSqlInjection(fullName)) {
      setNameError('Invalid characters detected');
      isValid = false;
      console.error('Potential SQL injection attempt detected in name field');
    } else {
      setNameError('');
    }

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    } else if (containsSqlInjection(email)) {
      setEmailError('Invalid email format detected');
      isValid = false;
      console.error('Potential SQL injection attempt detected in email');
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else if (containsSqlInjection(password)) {
      setPasswordError('Invalid password format detected');
      isValid = false;
      console.error('Potential SQL injection attempt detected in password');
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  // Helper function to detect SQL injection patterns
  const containsSqlInjection = (input: string): boolean => {
    const sqlPatterns = [
      /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)(\s|$)/i,
      /(\s|^)(FROM|WHERE|UNION|JOIN|INTO|EXEC|EXECUTE)(\s|$)/i,
      /--/,
      /;/,
      /\/\*/,
      /\*\//,
      /xp_/i,
      /'.*OR.*--/i,
      /'.*OR.*'/i,
      /".*OR.*--/i,
      /".*OR.*"/i,
      /'\s*OR\s+.+[=<>].+/i,
      /"\s*OR\s+.+[=<>].+/i,
      /'.*=.*/i,
      /".*=.*/i,
      /'.*<>.*/i,
      /".*<>.*/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Try signup with sanitized inputs
      await signUp(email, password, firstName, lastName);
      
      // Add a small delay for any state updates to complete
      console.log('Signup completed, preparing to navigate to onboarding');
      
      // Show success message
      Alert.alert(
        'Account Created!', 
        'Welcome to Collaborito! Let\'s complete your profile.', 
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to onboarding after user acknowledges success
              setTimeout(() => {
                router.replace('/onboarding');
              }, 100);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('SignUp error:', error);
      
      // Show specific error message to user
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      
      Alert.alert(
        'Sign Up Failed', 
        errorMessage,
        [{ text: 'OK' }]
      );
      
      // Clear form errors if they were set
      setNameError('');
      setEmailError('');
      setPasswordError('');
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colorScheme === 'dark' ? colors.primary : colors.secondary]}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.logoContainer}>
             <CollaboritoLogo size={150} color={colors.primary} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card style={styles.card}>
              <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Join Collaborito and start collaborating!
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={nameError}
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
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={passwordError}
                />

                <Button
                  style={styles.submitButton}
                  onPress={handleSignUp}
                  variant="primary"
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </View>

              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: colors.muted }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: screenHeight * 0.05, // Responsive padding
  },
  logoContainer: {
    marginBottom: screenHeight * 0.03, // Responsive margin
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400, // Max width for larger screens
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  formContainer: {
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  submitButton: {
    marginTop: 20,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 