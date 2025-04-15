import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Gallery component to display grid of images
const Gallery = () => {
  return (
    <View style={styles.galleryContainer}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#FFD663', '#F48D3B']}
        locations={[0.2, 0.8]}
        style={styles.gradientBackground}
      />
      
      {/* Grid of images */}
      <View style={styles.galleryGrid}>
        <View style={styles.galleryColumn}>
          <View style={[styles.galleryImage, { backgroundColor: '#3B82F6' }]} />
          <View style={[styles.galleryImage, { backgroundColor: '#1E3A8A' }]} />
          <View style={[styles.galleryImage, { backgroundColor: '#60A5FA' }]} />
        </View>
        <View style={styles.galleryColumn}>
          <View style={[styles.galleryImage, { backgroundColor: '#4ADE80' }]} />
          <View style={[styles.galleryImage, { backgroundColor: '#059669' }]} />
          <View style={[styles.galleryImage, { backgroundColor: '#A7F3D0' }]} />
        </View>
        <View style={styles.galleryColumn}>
          <View style={[styles.galleryImage, { backgroundColor: '#F87171' }]} />
          <View style={[styles.galleryImage, { backgroundColor: '#B91C1C' }]} />
          <View style={[styles.galleryImage, { backgroundColor: '#FCA5A5' }]} />
        </View>
      </View>
    </View>
  );
};

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signInWithLinkedIn } = useAuth();
  
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setError('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await signIn(email, password);
      // Navigation will be handled by auth redirect
    } catch (error) {
      setError('Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLinkedInSignIn = async () => {
    setError('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await signInWithLinkedIn();
      // Navigation will be handled by auth redirect
    } catch (error) {
      setError('LinkedIn sign in failed');
      console.error('LinkedIn login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementation for Google Sign-In would go here
    router.push('/login');
  };
  
  const handleAppleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementation for Apple Sign-In would go here
    router.push('/login');
  };
  
  const navigateToRegister = () => {
    router.push('/register');
  };
  
  const navigateBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background gallery */}
      <Gallery />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Image 
          source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
          style={styles.textLogo}
          resizeMode="contain"
        />
      </View>
      
      {/* Main content card */}
      <View style={styles.card}>
        <Text style={styles.title}>
          Discover like-minded individuals to collaborate on projects together
        </Text>
        <Text style={styles.subtitle}>
          Let our AI-powered community platform introduce you to your next co-founder, advisor, or collaborator.
        </Text>
        
        <View style={styles.buttonsContainer}>
          {/* Google Sign In */}
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <AntDesign name="google" size={20} color="#000" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
          
          {/* Apple Sign In */}
          <TouchableOpacity 
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            <AntDesign name="apple1" size={20} color="#fff" style={styles.socialIcon} />
            <Text style={[styles.socialButtonText, styles.appleButtonText]}>Sign in with Apple</Text>
          </TouchableOpacity>
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Email Sign In */}
          <TouchableOpacity 
            style={[styles.socialButton, styles.emailButton]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Sign in with email</Text>
          </TouchableOpacity>
          
          {/* Sign Up Link */}
          <TouchableOpacity onPress={navigateToRegister} style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  galleryContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  galleryGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 9,
  },
  galleryColumn: {
    flex: 1,
    gap: 9,
  },
  galleryImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textLogo: {
    width: 200,
    height: 40,
    marginTop: 20,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#242428',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito',
  },
  subtitle: {
    fontSize: 14,
    color: '#575757',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Nunito',
    lineHeight: 22,
  },
  buttonsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 335,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    fontFamily: 'Nunito',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
  },
  emailButton: {
    backgroundColor: '#EBF2FC',
    borderColor: '#000',
  },
  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E6E8',
    flex: 1,
  },
  dividerText: {
    fontSize: 14,
    color: '#81848F',
    marginHorizontal: 16,
    fontFamily: 'Nunito',
  },
  signUpContainer: {
    marginTop: 8,
  },
  signUpText: {
    fontSize: 14,
    color: '#575757',
    fontFamily: 'Nunito',
  },
}); 