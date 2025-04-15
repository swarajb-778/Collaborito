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
  
  const navigateToRegister = () => {
    router.push('/register');
  };
  
  const navigateBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Image 
              source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={{ width: 24 }} />
          </View>
          
          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in to continue collaborating on projects</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color="#575757" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {/* OR Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Social Login */}
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleLinkedInSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <AntDesign name="linkedin-square" size={20} color="#0077B5" />
              <Text style={styles.socialButtonText}>Continue with LinkedIn</Text>
            </TouchableOpacity>
            
            {/* Register */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  logo: {
    height: 30,
    width: 150,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#242428',
    marginBottom: 8,
    fontFamily: 'Nunito',
  },
  subtitle: {
    fontSize: 14,
    color: '#575757',
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'Nunito',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#242428',
    marginBottom: 8,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    fontFamily: 'Nunito',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Nunito',
  },
  eyeIcon: {
    padding: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#F48D3B',
    fontSize: 14,
    fontFamily: 'Nunito',
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#575757',
    fontSize: 14,
    fontFamily: 'Nunito',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 8,
  },
  socialButtonText: {
    color: '#242428',
    fontSize: 16,
    fontFamily: 'Nunito',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    fontSize: 14,
    color: '#575757',
    fontFamily: 'Nunito',
  },
  registerLink: {
    fontSize: 14,
    color: '#F48D3B',
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Nunito',
  },
}); 