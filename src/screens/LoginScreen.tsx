import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

export default function LoginScreen() {
  const { signIn, devSignIn, isDevelopmentMode } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signIn('linkedin');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await devSignIn();
    } catch (error) {
      console.error('Dev login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Collaborito</Text>
        <Text style={styles.tagline}>Community platform for entrepreneurs</Text>
      </View>

      <BlurView intensity={30} style={styles.formContainer}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.description}>
          Sign in to collaborate on projects, chat with team members, and leverage AI to boost productivity.
        </Text>

        <TouchableOpacity 
          style={styles.linkedinButton}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Image
                source={require('../../assets/images/linkedin-logo.svg')}
                style={styles.linkedinLogo}
              />
              <Text style={styles.buttonText}>Sign in with LinkedIn</Text>
            </>
          )}
        </TouchableOpacity>

        {isDevelopmentMode && (
          <TouchableOpacity 
            style={styles.devButton}
            onPress={handleDevSignIn}
            disabled={loading}
          >
            <Text style={styles.devButtonText}>Development Login</Text>
          </TouchableOpacity>
        )}
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    lineHeight: 20,
  },
  linkedinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0077B5',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  linkedinLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  devButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3748',
    borderRadius: 8,
    padding: 14,
  },
  devButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 