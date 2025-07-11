import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useAutoFill, CredentialType, AutoFillCredentials } from '../../src/services/AutoFillService';
import { useAccessibility } from '../../src/services/AccessibilityService';
import { useTheme } from '../../src/contexts/ThemeContext';
import AccessibleTextInput from './AccessibleTextInput';
import AccessibleButton from './AccessibleButton';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('AutoFillLoginForm');

export interface AutoFillLoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
  onForgotPassword?: () => void;
  domain?: string;
  title?: string;
  isRegistration?: boolean;
  loading?: boolean;
  initialUsername?: string;
  showBiometricLogin?: boolean;
}

export const AutoFillLoginForm: React.FC<AutoFillLoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  domain = 'collaborito.com',
  title = 'Sign In',
  isRegistration = false,
  loading = false,
  initialUsername = '',
  showBiometricLogin = true,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCredentialsAvailable, setSavedCredentialsAvailable] = useState(false);

  const { theme } = useTheme();
  const { announce } = useAccessibility();
  const {
    saveCredentials,
    getCredentials,
    authenticateWithBiometrics,
    getAutoFillProps,
    isBiometricsEnabled,
    getSavedDomains,
  } = useAutoFill();

  // Check for saved credentials on mount
  useEffect(() => {
    checkForSavedCredentials();
  }, [domain]);

  const checkForSavedCredentials = async () => {
    try {
      const credentials = await getCredentials(
        domain,
        isRegistration ? CredentialType.REGISTRATION : CredentialType.LOGIN,
        false // Don't require biometrics for checking availability
      );

      if (credentials) {
        setSavedCredentialsAvailable(true);
        logger.info('💾 Saved credentials available for domain:', domain);
      }
    } catch (error) {
      logger.error('❌ Error checking for saved credentials:', error);
    }
  };

  // Load saved credentials with biometric authentication
  const loadSavedCredentials = async () => {
    try {
      announce('Loading saved credentials', 'polite');
      
      const credentials = await getCredentials(
        domain,
        isRegistration ? CredentialType.REGISTRATION : CredentialType.LOGIN,
        true // Require biometrics
      );

      if (credentials) {
        setUsername(credentials.username);
        setPassword(credentials.password);
        announce('Credentials loaded successfully', 'polite');
        logger.info('🔓 Credentials loaded for:', domain);
      } else {
        announce('No saved credentials found', 'polite');
      }
    } catch (error) {
      logger.error('❌ Error loading saved credentials:', error);
      announce('Failed to load credentials', 'assertive');
    }
  };

  // Biometric login (skip password entry entirely)
  const handleBiometricLogin = async () => {
    try {
      announce('Authenticating with biometrics', 'polite');
      
      const credentials = await getCredentials(
        domain,
        CredentialType.LOGIN,
        true // Require biometrics
      );

      if (credentials) {
        // Directly submit with saved credentials
        await onSubmit({
          username: credentials.username,
          password: credentials.password,
        });
        announce('Biometric login successful', 'polite');
      } else {
        announce('No saved credentials for biometric login', 'assertive');
      }
    } catch (error) {
      logger.error('❌ Error during biometric login:', error);
      announce('Biometric login failed', 'assertive');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setUsernameError('');
    setPasswordError('');

    // Username validation
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.includes('@') && !isValidEmail(username)) {
      setUsernameError('Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (isRegistration && password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    return isValid;
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting || loading) return;

    if (!validateForm()) {
      announce('Please fix form errors and try again', 'assertive');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit credentials
      await onSubmit({ username, password });

      // After successful login/registration, offer to save credentials
      if (!isRegistration) {
        await offerToSaveCredentials();
      }

      announce(`${isRegistration ? 'Registration' : 'Login'} successful`, 'polite');
    } catch (error) {
      logger.error('❌ Error during form submission:', error);
      announce(`${isRegistration ? 'Registration' : 'Login'} failed`, 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Offer to save credentials after successful login
  const offerToSaveCredentials = async () => {
    try {
      if (!isBiometricsEnabled()) {
        return; // Don't offer if biometrics not available
      }

      Alert.alert(
        'Save Credentials',
        'Would you like to save your login credentials for faster access using biometric authentication?',
        [
          {
            text: 'No Thanks',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: async () => {
              const credentials: AutoFillCredentials = {
                username,
                password,
                domain,
                lastUsed: Date.now(),
              };

              const saved = await saveCredentials(
                credentials,
                CredentialType.LOGIN,
                true
              );

              if (saved) {
                announce('Credentials saved successfully', 'polite');
                setSavedCredentialsAvailable(true);
              }
            },
          },
        ]
      );
    } catch (error) {
      logger.error('❌ Error offering to save credentials:', error);
    }
  };

  // Get the appropriate credential type
  const getCredentialType = (): CredentialType => {
    if (isRegistration) return CredentialType.REGISTRATION;
    return CredentialType.LOGIN;
  };

  const styles = getFormStyles(theme);

  return (
    <View style={styles.container}>
      {/* Username Input */}
      <AccessibleTextInput
        label={isRegistration ? 'Email' : 'Email or Username'}
        placeholder={isRegistration ? 'Enter your email' : 'Enter email or username'}
        value={username}
        onChangeText={setUsername}
        error={usernameError}
        type={username.includes('@') ? 'email' : 'text'}
        required
        autoFocus
        {...getAutoFillProps('username', getCredentialType())}
      />

      {/* Password Input */}
      <AccessibleTextInput
        label={isRegistration ? 'Create Password' : 'Password'}
        placeholder={isRegistration ? 'Create a strong password' : 'Enter your password'}
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        type="password"
        required
        helpText={isRegistration ? 'Password must be at least 8 characters' : undefined}
        showCharacterCount={isRegistration}
        maxLength={isRegistration ? 50 : undefined}
        {...getAutoFillProps('password', getCredentialType())}
      />

      {/* Auto-fill Actions */}
      {!isRegistration && savedCredentialsAvailable && (
        <View style={styles.autoFillActions}>
          <AccessibleButton
            title="Load Saved Credentials"
            onPress={loadSavedCredentials}
            variant="outline"
            size="small"
            accessibilityHint="Load your saved username and password using biometric authentication"
          />
        </View>
      )}

      {/* Biometric Login Button */}
      {!isRegistration && showBiometricLogin && savedCredentialsAvailable && isBiometricsEnabled() && (
        <View style={styles.biometricActions}>
          <AccessibleButton
            title="Sign in with Biometrics"
            onPress={handleBiometricLogin}
            variant="secondary"
            accessibilityHint="Sign in directly using your saved credentials and biometric authentication"
          />
        </View>
      )}

      {/* Submit Button */}
      <AccessibleButton
        title={isRegistration ? 'Create Account' : 'Sign In'}
        onPress={handleSubmit}
        loading={isSubmitting || loading}
        disabled={isSubmitting || loading}
        accessibilityHint={`${isRegistration ? 'Create your account' : 'Sign in to your account'} with the entered credentials`}
      />

      {/* Forgot Password */}
      {!isRegistration && onForgotPassword && (
        <View style={styles.forgotPasswordContainer}>
          <AccessibleButton
            title="Forgot Password?"
            onPress={onForgotPassword}
            variant="text"
            size="small"
            accessibilityHint="Reset your password via email"
          />
        </View>
      )}
    </View>
  );
};

// Style calculation function
function getFormStyles(theme: any) {
  return StyleSheet.create({
    container: {
      padding: theme.spacing.md,
    },
    autoFillActions: {
      marginBottom: theme.spacing.md,
      alignItems: 'center',
    },
    biometricActions: {
      marginBottom: theme.spacing.lg,
    },
    forgotPasswordContainer: {
      marginTop: theme.spacing.md,
      alignItems: 'center',
    },
  });
}

export default AutoFillLoginForm; 