import React, { useState, useEffect } from 'react';
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
  // We'll need a new function from useAuth to update the profile
  const { user, updateUserProfile, loading } = useAuth(); 

  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  const [usernameError, setUsernameError] = useState('');

  // Pre-fill fields if data already exists (e.g., coming back to onboarding)
  useEffect(() => {
    if (user?.user_metadata) {
        if (user.user_metadata.username) setUsername(user.user_metadata.username);
        // Add checks for location and job_title if they exist in metadata
    }
  }, [user]);

  const validateForm = () => {
    let isValid = true;
    // Basic username validation (e.g., required, maybe length or characters)
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.trim().length < 3) {
        setUsernameError('Username must be at least 3 characters');
        isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
        isValid = false;
    } else {
      setUsernameError('');
    }
    // Add validation for location and jobTitle if needed (e.g., required)
    return isValid;
  };

  const handleCompleteProfile = async () => {
    if (!validateForm()) return;
    if (!user) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        router.replace('/login');
        return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const profileData = {
        username: username.trim(),
        location: location.trim(),
        job_title: jobTitle.trim(),
        // Make sure to set updated_at and potentially other fields
      };

      // Call the new updateUserProfile function from AuthContext
      await updateUserProfile(profileData);
      
      console.log('Profile update successful, navigating to tabs');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Update Failed', error?.message || 'Could not update profile. Please try again.');
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
          <Animated.View entering={FadeInUp.duration(800)} style={styles.headerContainer}>
             <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
             <Text style={[styles.subtitle, { color: colors.muted }]}>
                Just a few more details to get started.
             </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.cardWrapper}>
            <Card style={styles.card}>
              <View style={styles.formContainer}>
                <TextInput
                  label="Username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChangeText={setUsername}
                  leftIcon={<FontAwesome5 name="at" size={16} color={colors.muted} style={styles.inputIcon} />}
                  error={usernameError}
                  autoCapitalize="none"
                />
                <TextInput
                  label="Where are you based?"
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChangeText={setLocation}
                  leftIcon={<FontAwesome5 name="map-marker-alt" size={16} color={colors.muted} style={styles.inputIcon} />}
                  // No error state shown for optional fields, adjust if needed
                />
                <TextInput
                  label="Job Title"
                  placeholder="e.g., Software Engineer"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  leftIcon={<FontAwesome5 name="briefcase" size={16} color={colors.muted} style={styles.inputIcon} />}
                  // No error state shown for optional fields, adjust if needed
                />

                <Button
                  style={styles.submitButton}
                  onPress={handleCompleteProfile}
                  variant="primary"
                  disabled={loading} // Use loading state from useAuth
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    'Complete Profile'
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

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

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
    marginBottom: screenHeight * 0.04, 
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
  },
  cardWrapper: {
      width: '100%',
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
    marginBottom: 15, // Reduced margin below subtitle
  },
  formContainer: {
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  submitButton: {
    marginTop: 25, // Increased top margin for the button
  },
}); 