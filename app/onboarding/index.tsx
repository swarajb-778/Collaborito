import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CollaboritoLogo } from '../../components/ui/CollaboritoLogo';

export default function OnboardingScreen() {
  console.log('Rendering OnboardingScreen');
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user, loading } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);

  // Log user data for debugging
  useEffect(() => {
    console.log('Onboarding screen received user:', user);
  }, [user]);

  // Initialize form fields with user data if available
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [jobTitleError, setJobTitleError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    // First name validation
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    } else {
      setFirstNameError('');
    }
    
    // Last name validation
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    } else {
      setLastNameError('');
    }
    
    // Location validation
    if (!location.trim()) {
      setLocationError('Location is required');
      isValid = false;
    } else {
      setLocationError('');
    }
    
    // Job title validation
    if (!jobTitle.trim()) {
      setJobTitleError('Job title is required');
      isValid = false;
    } else {
      setJobTitleError('');
    }
    
    return isValid;
  };

  const handleComplete = async () => {
    if (!validateForm()) return;
    
    try {
      setSavingProfile(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // In a real app, this would update the user's profile in the database
      // For now, we'll simulate a network request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Profile updated with:', { firstName, lastName, location, jobTitle });
      
      // Navigate to the main app tabs
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        'There was a problem updating your profile. Please try again.'
      );
    } finally {
      setSavingProfile(false);
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
              <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Tell us a bit more about yourself
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="First Name"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={firstNameError}
                />
                
                <TextInput
                  label="Last Name"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChangeText={setLastName}
                  leftIcon={<FontAwesome5 name="user" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={lastNameError}
                />
                
                <TextInput
                  label="Where are you based?"
                  placeholder="City, Country"
                  value={location}
                  onChangeText={setLocation}
                  leftIcon={<FontAwesome5 name="map-marker-alt" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={locationError}
                />
                
                <TextInput
                  label="Job Title"
                  placeholder="What do you do?"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  leftIcon={<FontAwesome5 name="briefcase" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={jobTitleError}
                />

                <Button
                  style={styles.submitButton}
                  onPress={handleComplete}
                  variant="primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
                
                <TouchableOpacity 
                  onPress={() => router.replace('/(tabs)')}
                  style={styles.skipContainer}
                >
                  <Text style={[styles.skipText, { color: colors.muted }]}>
                    I'll complete this later
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
    paddingVertical: screenHeight * 0.05,
  },
  logoContainer: {
    marginBottom: screenHeight * 0.03,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
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
  skipContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}); 