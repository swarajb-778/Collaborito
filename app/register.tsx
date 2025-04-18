import React, { useState, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSequence, withTiming, withDelay, interpolateColor } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollaboritoLogo } from '@/components/ui/CollaboritoLogo';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// PasswordStrengthMeter component
const PasswordStrengthMeter = ({ 
  password,
  containerStyle
}: { 
  password: string;
  containerStyle?: any;
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Calculate password strength
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    
    let score = 0;
    
    // Length check
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(pass)) score += 1;  // Has uppercase
    if (/[0-9]/.test(pass)) score += 1;  // Has number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;  // Has special char
    
    return Math.min(score, 4);  // Max score of 4
  };
  
  const strength = getStrength(password);
  
  // Get color based on strength
  const getColor = () => {
    switch (strength) {
      case 0: return colors.muted;
      case 1: return colors.error;
      case 2: return colors.warning;
      case 3: return colors.tertiary;
      case 4: return colors.success;
      default: return colors.muted;
    }
  };
  
  // Get text based on strength
  const getText = () => {
    switch (strength) {
      case 0: return 'Enter password';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };
  
  return (
    <View style={[styles.strengthContainer, containerStyle]}>
      {/* Strength meter bars */}
      <View style={styles.meterContainer}>
        {[...Array(4)].map((_, index) => (
          <View 
            key={index}
            style={[
              styles.meterBar,
              { 
                backgroundColor: index < strength 
                  ? getColor() 
                  : `${colors.muted}40`
              }
            ]}
          />
        ))}
      </View>
      
      {/* Strength text */}
      <Text style={[styles.strengthText, { color: getColor() }]}>
        {getText()}
      </Text>
    </View>
  );
};

// Password requirements component
const PasswordRequirements = ({ 
  password 
}: { 
  password: string 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Define requirements
  const requirements = [
    { id: 'length', text: 'At least 6 characters', test: (pass: string) => pass.length >= 6 },
    { id: 'uppercase', text: 'At least 1 uppercase letter', test: (pass: string) => /[A-Z]/.test(pass) },
    { id: 'number', text: 'At least 1 number', test: (pass: string) => /[0-9]/.test(pass) },
    { id: 'special', text: 'At least 1 special character', test: (pass: string) => /[^A-Za-z0-9]/.test(pass) }
  ];
  
  return (
    <View style={styles.requirementsContainer}>
      {requirements.map(req => (
        <View key={req.id} style={styles.requirementRow}>
          <FontAwesome5 
            name={req.test(password) ? 'check-circle' : 'circle'} 
            size={12} 
            color={req.test(password) ? colors.success : colors.muted} 
            style={styles.requirementIcon}
          />
          <Text style={[
            styles.requirementText, 
            { color: req.test(password) ? colors.success : colors.muted }
          ]}>
            {req.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, loading } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);
  const errorShake = useSharedValue(0);
  
  // Animated styles for register button
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      opacity: buttonOpacity.value
    };
  });
  
  // Animated style for error shake animation
  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: errorShake.value }]
    };
  });

  // Register button animation on press
  const animateButton = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
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
  
  // Validate password strength
  const isStrongPassword = (pass: string) => {
    // At least 6 chars, 1 uppercase, 1 number, and 1 special char
    if (pass.length < 6) return false;
    
    // Count the number of criteria met
    let criteriaCount = 0;
    if (/[A-Z]/.test(pass)) criteriaCount++;
    if (/[0-9]/.test(pass)) criteriaCount++;
    if (/[^A-Za-z0-9]/.test(pass)) criteriaCount++;
    
    // Need to meet at least 2 complexity criteria
    return criteriaCount >= 2;
  };
  
  const validateForm = () => {
    let isValid = true;
    let hasError = false;
    
    // Validate first name
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
      hasError = true;
    } else {
      setFirstNameError('');
    }
    
    // Validate last name
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
      hasError = true;
    } else {
      setLastNameError('');
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
    } else if (!isStrongPassword(password)) {
      setPasswordError('Password must meet strength requirements');
      isValid = false;
      hasError = true;
    } else {
      setPasswordError('');
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
      hasError = true;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
      hasError = true;
    } else {
      setConfirmPasswordError('');
    }
    
    // Trigger error animation if there are errors
    if (hasError) {
      shakeError();
    }
    
    return isValid;
  };
  
  const handleRegister = async () => {
    animateButton();
    
    if (!validateForm()) return;
    
    try {
      // Feedback and animation when starting registration
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      buttonOpacity.value = withTiming(0.7, { duration: 300 });
      
      await signUp(email, password, firstName, lastName);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to tabs
      router.push('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      shakeError();
    } finally {
      buttonOpacity.value = withTiming(1, { duration: 300 });
    }
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header with gradient background */}
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? colors.card : colors.primary, 
          colorScheme === 'dark' ? colors.background : colors.secondary
        ]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToLogin}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        
        <Animated.View 
          style={styles.logoContainer}
          entering={FadeIn.delay(200).duration(800)}
        >
          <CollaboritoLogo size={50} color="#fff" />
          <Text style={styles.appName}>Collaborito</Text>
        </Animated.View>
      </LinearGradient>
      
      {/* Main content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeInDown.delay(300).duration(800)}
            style={errorAnimatedStyle}
          >
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Sign up to start collaborating on projects
            </Text>
            
            <View style={styles.form}>
              {/* First and Last Name in a row */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <TextInput
                    label="First Name"
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} />}
                    error={firstNameError}
                    containerStyle={styles.nameInputContainer}
                  />
                </View>
                
                <View style={styles.nameField}>
                  <TextInput
                    label="Last Name"
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} />}
                    error={lastNameError}
                    containerStyle={styles.nameInputContainer}
                  />
                </View>
              </View>
              
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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} />}
                error={passwordError}
                secureTextToggle
              />
              
              {/* Password strength meter */}
              <PasswordStrengthMeter 
                password={password} 
                containerStyle={{ marginTop: -8, marginBottom: 8 }}
              />
              
              {/* Password requirements */}
              {password.length > 0 && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <PasswordRequirements password={password} />
                </Animated.View>
              )}
              
              <TextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} />}
                error={confirmPasswordError}
                secureTextToggle
              />
              
              <Animated.View style={buttonAnimatedStyle}>
                <Button
                  style={styles.registerButton}
                  onPress={handleRegister}
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Animated.View>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={styles.footer}
            entering={FadeInUp.delay(500).duration(800)}
          >
            <Text style={[styles.footerText, { color: colors.muted }]}>
              Already have an account?
            </Text>
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/login');
              }}
            >
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View 
            style={styles.termsContainer}
            entering={FadeInUp.delay(600).duration(800)}
          >
            <Text style={[styles.termsText, { color: colors.muted }]}>
              By signing up, you agree to our{' '}
              <Text style={[styles.termsLink, { color: colors.primary }]}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={[styles.termsLink, { color: colors.primary }]}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  nameInputContainer: {
    marginBottom: 0,
  },
  registerButton: {
    marginTop: 8,
    height: 56,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: 'bold',
  },
  strengthContainer: {
    marginBottom: 12,
  },
  meterContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  meterBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  requirementsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementText: {
    fontSize: 12,
  },
}); 