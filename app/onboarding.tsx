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

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user, loading } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);

  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  const [usernameError, setUsernameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [jobTitleError, setJobTitleError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    // Username validation
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Location validation (optional)
    if (!location.trim()) {
      setLocationError('Location is required');
      isValid = false;
    } else {
      setLocationError('');
    }
    
    // Job title validation (optional)
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
      
      console.log('Profile updated with:', { username, location, jobTitle });
      
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
          <Animated.View entering={FadeInDown.duration(800)} style={styles.headerContainer}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Welcome to Collaborito!
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Let's set up your profile to get started
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(100)}>
            <Card style={styles.card}>
              <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Tell us a bit more about yourself
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  leftIcon={<FontAwesome5 name="user-tag" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={usernameError}
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 25,
  },
  title: {
    fontSize: 24,
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