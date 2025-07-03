import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../components/ui/CollaboritoLogo';
import { supabase } from '../src/services/supabase';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { access_token, refresh_token, error, error_description, type } = useLocalSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [linkError, setLinkError] = useState('');
  
  const cardScale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const strengthShake = useSharedValue(0);
  
  useEffect(() => {
    cardScale.value = withSpring(1);
    opacity.value = withSpring(1);
    
    if (error) {
      setLinkError(error_description as string || error as string || 'Reset link is invalid or expired');
    } else if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      }).then((result) => {
        if (result.error) {
          setLinkError('Invalid or expired reset link. Please request a new one.');
        }
      });
    } else if (type === 'recovery') {
      setLinkError('Reset link appears to be invalid. Please request a new password reset.');
    }
  }, [access_token, refresh_token, error, error_description, type]);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
      opacity: opacity.value,
    };
  });
  
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd)) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
    return Math.min(strength, 100);
  };
  
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#FF6B6B';
    if (passwordStrength < 50) return '#FFB347';
    if (passwordStrength < 75) return '#87CEEB';
    return '#4CAF50';
  };
  
  const handlePasswordUpdate = async () => {
    if (!password || password.length < 8 || passwordStrength < 50 || password !== confirmPassword) {
      Alert.alert('Validation Error', 'Please ensure passwords match and meet requirements');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      
      if (error) throw error;
      
      setIsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error: any) {
      console.error('Password update error:', error);
      Alert.alert('Update Failed', 'Failed to update password. Please try again.', [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
  };
  
  if (linkError) {
    return (
      <LinearGradient
        colors={[colors.background, colorScheme === 'dark' ? colors.primary : colors.secondary]}
        style={styles.container}
      >
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <CollaboritoLogo size={120} color={colors.primary} />
          <Card style={[styles.card, cardAnimatedStyle]}>
            <View style={styles.errorIconContainer}>
              <View style={[styles.errorIcon, { backgroundColor: '#FF6B6B' }]}>
                <FontAwesome5 name="exclamation" size={32} color="white" />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Link Expired</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{linkError}</Text>
            <Button
              style={styles.primaryButton}
                             onPress={() => router.replace('/forgot-password' as any)}
              variant="primary"
            >
              Request New Reset Link
            </Button>
          </Card>
        </View>
      </LinearGradient>
    );
  }
  
  if (isSuccess) {
    return (
      <LinearGradient
        colors={[colors.background, colorScheme === 'dark' ? colors.primary : colors.secondary]}
        style={styles.container}
      >
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <CollaboritoLogo size={120} color={colors.primary} />
          <Card style={[styles.card, cardAnimatedStyle]}>
            <View style={styles.successIconContainer}>
              <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
                <FontAwesome5 name="check" size={32} color="white" />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Password Updated!</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Your password has been successfully updated. You can now sign in with your new password.
            </Text>
            <Button
              style={styles.primaryButton}
              onPress={() => router.replace('/login')}
              variant="primary"
            >
              Continue to Sign In
            </Button>
          </Card>
        </View>
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
              <Text style={[styles.title, { color: colors.text }]}>Set New Password</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Choose a strong password for your account
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="New Password"
                  placeholder="Enter your new password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <FontAwesome5 name={showPassword ? "eye-slash" : "eye"} size={16} color={colors.muted} />
                    </TouchableOpacity>
                  }
                />
                
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthHeader}>
                      <Text style={[styles.strengthLabel, { color: colors.muted }]}>Password Strength</Text>
                      <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                        {passwordStrength < 25 ? 'Weak' : passwordStrength < 50 ? 'Fair' : passwordStrength < 75 ? 'Good' : 'Strong'}
                      </Text>
                    </View>
                    <View style={[styles.strengthBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.strengthFill, 
                          { 
                            width: `${passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor()
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
                
                <TextInput
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  leftIcon={<FontAwesome5 name="lock" size={16} color={colors.muted} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <FontAwesome5 name={showConfirmPassword ? "eye-slash" : "eye"} size={16} color={colors.muted} />
                    </TouchableOpacity>
                  }
                />
                
                <Button
                  style={styles.updateButton}
                  onPress={handlePasswordUpdate}
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loadingText}>Updating...</Text>
                    </View>
                  ) : (
                    'Update Password'
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
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  card: { padding: 32, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 16 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  formContainer: { gap: 24 },
  strengthContainer: { marginTop: 12, gap: 8 },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strengthLabel: { fontSize: 12, fontWeight: '500' },
  strengthText: { fontSize: 12, fontWeight: '600' },
  strengthBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  updateButton: { height: 56, borderRadius: 16, marginTop: 8 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  successIconContainer: { alignItems: 'center', marginBottom: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  errorIconContainer: { alignItems: 'center', marginBottom: 24 },
  errorIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  primaryButton: { height: 56, borderRadius: 16 },
});
