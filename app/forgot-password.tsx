import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';
import { passwordResetService } from '../src/services/supabase';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if coming from lockout scenario
  const isFromLockout = params.fromLockout === 'true';
  const prefilledEmail = params.email as string || '';
  
  const [email, setEmail] = useState(prefilledEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    cardScale.value = withSpring(1);
    opacity.value = withSpring(1);
  }, []);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
      opacity: opacity.value,
    };
  });
  
  const validateEmail = () => {
    setEmailError('');
    
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handlePasswordReset = async () => {
    if (!validateEmail()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await passwordResetService.sendResetEmail(email);
      
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      
      setIsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.message?.includes('Invalid email')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Reset Failed', errorMessage, [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  if (isSuccess) {
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
              <CollaboritoLogo size={120} color={colors.primary} />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card style={[styles.card, cardAnimatedStyle]}>
                <View style={styles.successIconContainer}>
                  <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
                    <FontAwesome5 name="check" size={32} color="white" />
                  </View>
                </View>
                
                <Text style={[styles.title, { color: colors.text }]}>Check Your Email</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  We've sent a password reset link to{'\n'}<Text style={{ fontWeight: '600' }}>{email}</Text>
                </Text>
                
                <Text style={[styles.instructions, { color: colors.muted }]}>
                  Click the link in your email to reset your password. The link will expire in 24 hours.
                </Text>
                
                <View style={styles.buttonContainer}>
                  <Button
                    style={styles.primaryButton}
                    onPress={handleBackToLogin}
                    variant="primary"
                  >
                    Back to Sign In
                  </Button>
                  
                  <TouchableOpacity 
                    onPress={() => setIsSuccess(false)}
                    style={styles.resendContainer}
                  >
                    <Text style={[styles.resendText, { color: colors.primary }]}>
                      Didn't receive the email? Try again
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }
  
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
            <CollaboritoLogo size={120} color={colors.primary} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card style={[styles.card, cardAnimatedStyle]}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackToLogin}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <FontAwesome5 name="arrow-left" size={20} color={colors.text} />
              </TouchableOpacity>
              
              {isFromLockout && (
                <View style={[styles.lockoutBanner, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '30' }]}>
                  <FontAwesome5 name="lock" size={16} color={colors.destructive} />
                  <Text style={[styles.lockoutText, { color: colors.destructive }]}>
                    Account temporarily locked
                  </Text>
                </View>
              )}
              
              <Text style={[styles.title, { color: colors.text }]}>
                {isFromLockout ? 'Unlock Your Account' : 'Reset Password'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {isFromLockout 
                  ? 'Reset your password to immediately unlock your account and regain access.'
                  : 'Enter your email address and we\'ll send you a link to reset your password.'
                }
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<FontAwesome5 name="envelope" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={emailError}
                />
                
                <Button
                  style={styles.resetButton}
                  onPress={handlePasswordReset}
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loadingText}>Sending...</Text>
                    </View>
                  ) : (
                    isFromLockout ? 'Send Unlock Link' : 'Send Reset Link'
                  )}
                </Button>
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  card: {
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  formContainer: {
    gap: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  resetButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 40,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 