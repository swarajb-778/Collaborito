import React, { useState, useRef } from 'react';
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
  SafeAreaView
} from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Colors, Gradients } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

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
  const router = useRouter();
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
  const buttonScale = useSharedValue(1);
  const errorShake = useSharedValue(0);
  
  // Animated style for error shake animation
  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: errorShake.value }]
    };
  });

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

  const handleMobileRegister = () => {
    // This would integrate with phone number verification in a real app
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // For demo, just show error animation
    shakeError();
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  return (
    <SafeAreaView style={{ ...styles.container, backgroundColor: colors.primary }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background circles */}
      <View style={{ ...styles.backgroundCircle1, backgroundColor: colors.primaryDark }} />
      <View style={{ ...styles.backgroundCircle2, backgroundColor: colors.primaryLight }} />
      
      {/* Main content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
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
          </View>
          
          <Animated.View 
            entering={FadeInDown.delay(300).duration(800)}
            style={[styles.formContainer, errorAnimatedStyle]}
          >
            <Text style={{ ...styles.title, color: colors.accent }}>Create account</Text>
            
            <View style={styles.form}>
              <TextInput
                label="Username"
                placeholder="Your username"
                value={username}
                onChangeText={setUsername}
                error={usernameError}
                containerStyle={styles.inputContainer}
              />
              
              <TextInput
                label="Email"
                placeholder="Your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
                containerStyle={styles.inputContainer}
              />
              
              <TextInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                secureTextToggle
                error={passwordError}
                containerStyle={styles.inputContainer}
              />
              
              {/* Terms and conditions */}
              <View style={styles.termsContainer}>
                <Checkbox 
                  checked={acceptTerms} 
                  onPress={() => setAcceptTerms(!acceptTerms)} 
                  color={colors.accent}
                />
                <Text style={{ ...styles.termsText, color: colors.accent }}>
                  I accept the terms and privacy policy
                </Text>
              </View>
              
              {termsError ? (
                <Text style={{ ...styles.errorText, color: colors.error }}>{termsError}</Text>
              ) : null}
              
              {/* Primary button */}
              <Button
                style={{ ...styles.primaryButton, backgroundColor: colors.accent }}
                onPress={handleRegister}
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  'Create account'
                )}
              </Button>
              
              {/* Secondary button */}
              <Button
                style={{ ...styles.secondaryButton, borderColor: colors.accent }}
                onPress={handleMobileRegister}
                variant="outline"
                disabled={loading}
              >
                Create account with mobile
              </Button>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={styles.footer}
            entering={FadeInUp.delay(500).duration(800)}
          >
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={{ ...styles.footerText, color: colors.accent }}>
                Already have an account? <Text style={styles.footerLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  backgroundCircle2: {
    position: 'absolute',
    top: 50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.7,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'Nunito',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputContainer: {
    width: '100%',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  checkbox: {
    borderRadius: 11,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    fontFamily: 'Nunito',
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
  },
  primaryButton: {
    marginTop: 10,
    height: 56,
  },
  secondaryButton: {
    height: 56,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  footerLink: {
    fontWeight: 'bold',
  },
}); 