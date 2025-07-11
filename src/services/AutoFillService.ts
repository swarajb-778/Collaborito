import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';

const logger = createLogger('AutoFillService');

// Auto-fill configuration
export interface AutoFillCredentials {
  username: string;
  password: string;
  domain?: string;
  lastUsed: number;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: LocalAuthentication.AuthenticationType;
}

// Supported credential types
export enum CredentialType {
  LOGIN = 'login',
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password_reset',
}

// Auto-fill configuration
interface AutoFillConfig {
  enableBiometrics: boolean;
  enableAutoFill: boolean;
  enableSmartLock: boolean;
  credentialTimeout: number; // minutes
}

class AutoFillService {
  private static instance: AutoFillService;
  private config: AutoFillConfig = {
    enableBiometrics: true,
    enableAutoFill: true,
    enableSmartLock: true,
    credentialTimeout: 30, // 30 minutes
  };

  public static getInstance(): AutoFillService {
    if (!AutoFillService.instance) {
      AutoFillService.instance = new AutoFillService();
    }
    return AutoFillService.instance;
  }

  // Initialize auto-fill service
  public async initialize(): Promise<void> {
    try {
      logger.info('🔐 Initializing auto-fill service...');

      // Check biometric availability
      const biometricsAvailable = await this.checkBiometricAvailability();
      this.config.enableBiometrics = biometricsAvailable;

      // Initialize platform-specific auto-fill
      await this.initializePlatformAutoFill();

      logger.info('✅ Auto-fill service initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing auto-fill service:', error);
      throw error;
    }
  }

  // Check biometric authentication availability
  private async checkBiometricAvailability(): Promise<boolean> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const biometricsAvailable = isAvailable && isEnrolled && supportedTypes.length > 0;

      if (biometricsAvailable) {
               const typeNames = supportedTypes.map((type: LocalAuthentication.AuthenticationType) => {
         switch (type) {
           case LocalAuthentication.AuthenticationType.FINGERPRINT:
             return 'Fingerprint';
           case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
             return 'Face ID';
           case LocalAuthentication.AuthenticationType.IRIS:
             return 'Iris';
           default:
             return 'Unknown';
         }
       }).join(', ');

        logger.info(`🔐 Biometric authentication available: ${typeNames}`);
      } else {
        logger.info('🔐 Biometric authentication not available');
      }

      return biometricsAvailable;
    } catch (error) {
      logger.error('❌ Error checking biometric availability:', error);
      return false;
    }
  }

  // Initialize platform-specific auto-fill
  private async initializePlatformAutoFill(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS AutoFill setup
        logger.info('📱 Setting up iOS AutoFill...');
        // Note: iOS AutoFill is primarily handled through textContentType props
      } else if (Platform.OS === 'android') {
        // Android Smart Lock setup
        logger.info('🤖 Setting up Android Smart Lock...');
        // Note: Android autofill is handled through autofillHints and other props
      }
    } catch (error) {
      logger.error('❌ Error initializing platform auto-fill:', error);
    }
  }

  // Save credentials securely
  public async saveCredentials(
    credentials: AutoFillCredentials,
    type: CredentialType = CredentialType.LOGIN,
    requireBiometrics: boolean = true
  ): Promise<boolean> {
    try {
      if (requireBiometrics && this.config.enableBiometrics) {
        const authResult = await this.authenticateWithBiometrics('Save login credentials');
        if (!authResult.success) {
          logger.info('🔐 Biometric authentication failed, credentials not saved');
          return false;
        }
      }

      const key = this.getCredentialKey(credentials.domain || 'default', type);
      const credentialData = {
        ...credentials,
        lastUsed: Date.now(),
        type,
      };

      await SecureStore.setItemAsync(key, JSON.stringify(credentialData), {
        requireAuthentication: requireBiometrics && this.config.enableBiometrics,
      });

      // Provide haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      logger.info(`💾 Credentials saved for ${credentials.domain || 'default'} (${type})`);
      return true;
    } catch (error) {
      logger.error('❌ Error saving credentials:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }

  // Retrieve saved credentials
  public async getCredentials(
    domain: string = 'default',
    type: CredentialType = CredentialType.LOGIN,
    requireBiometrics: boolean = true
  ): Promise<AutoFillCredentials | null> {
    try {
      if (requireBiometrics && this.config.enableBiometrics) {
        const authResult = await this.authenticateWithBiometrics('Access saved login credentials');
        if (!authResult.success) {
          logger.info('🔐 Biometric authentication failed, credentials not retrieved');
          return null;
        }
      }

      const key = this.getCredentialKey(domain, type);
      const credentialData = await SecureStore.getItemAsync(key, {
        requireAuthentication: requireBiometrics && this.config.enableBiometrics,
      });

      if (!credentialData) {
        logger.info(`🔍 No credentials found for ${domain} (${type})`);
        return null;
      }

      const credentials = JSON.parse(credentialData) as AutoFillCredentials & { type: CredentialType };

      // Check if credentials are expired
      const now = Date.now();
      const expirationTime = credentials.lastUsed + (this.config.credentialTimeout * 60 * 1000);

      if (now > expirationTime) {
        logger.info(`⏰ Credentials expired for ${domain}, removing...`);
        await this.removeCredentials(domain, type, false);
        return null;
      }

      // Update last used timestamp
      credentials.lastUsed = now;
      await SecureStore.setItemAsync(key, JSON.stringify(credentials));

      logger.info(`🔓 Retrieved credentials for ${domain} (${type})`);
      return {
        username: credentials.username,
        password: credentials.password,
        domain: credentials.domain,
        lastUsed: credentials.lastUsed,
      };
    } catch (error) {
      logger.error('❌ Error retrieving credentials:', error);
      return null;
    }
  }

  // Remove saved credentials
  public async removeCredentials(
    domain: string = 'default',
    type: CredentialType = CredentialType.LOGIN,
    requireBiometrics: boolean = true
  ): Promise<boolean> {
    try {
      if (requireBiometrics && this.config.enableBiometrics) {
        const authResult = await this.authenticateWithBiometrics('Remove saved login credentials');
        if (!authResult.success) {
          logger.info('🔐 Biometric authentication failed, credentials not removed');
          return false;
        }
      }

      const key = this.getCredentialKey(domain, type);
      await SecureStore.deleteItemAsync(key);

      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      logger.info(`🗑️ Removed credentials for ${domain} (${type})`);
      return true;
    } catch (error) {
      logger.error('❌ Error removing credentials:', error);
      return false;
    }
  }

  // List all saved domains
  public async getSavedDomains(): Promise<string[]> {
    try {
      // Note: SecureStore doesn't provide a way to list keys
      // This is a simplified implementation
      const commonDomains = ['default', 'collaborito.com'];
      const existingDomains: string[] = [];

      for (const domain of commonDomains) {
        const credentials = await this.getCredentials(domain, CredentialType.LOGIN, false);
        if (credentials) {
          existingDomains.push(domain);
        }
      }

      return existingDomains;
    } catch (error) {
      logger.error('❌ Error getting saved domains:', error);
      return [];
    }
  }

  // Authenticate with biometrics
  public async authenticateWithBiometrics(
    promptMessage: string = 'Authenticate to continue'
  ): Promise<BiometricAuthResult> {
    try {
      if (!this.config.enableBiometrics) {
        return { success: false, error: 'Biometric authentication disabled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Provide haptic feedback for successful authentication
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        logger.info('✅ Biometric authentication successful');
        return { success: true };
      } else {
        // Get the authentication type that was attempted
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const primaryType = supportedTypes[0];

        logger.info(`❌ Biometric authentication failed: ${result.error}`);
        return {
          success: false,
          error: result.error,
          biometricType: primaryType,
        };
      }
    } catch (error) {
      logger.error('❌ Error during biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get auto-fill props for iOS
  public getIOSAutoFillProps(type: CredentialType): object {
    if (Platform.OS !== 'ios') return {};

    switch (type) {
      case CredentialType.LOGIN:
        return {
          textContentType: 'username',
          autoComplete: 'username',
        };
      case CredentialType.REGISTRATION:
        return {
          textContentType: 'newPassword',
          autoComplete: 'password-new',
        };
      case CredentialType.PASSWORD_RESET:
        return {
          textContentType: 'newPassword',
          autoComplete: 'password-new',
        };
      default:
        return {};
    }
  }

  // Get auto-fill props for Android
  public getAndroidAutoFillProps(type: CredentialType): object {
    if (Platform.OS !== 'android') return {};

    switch (type) {
      case CredentialType.LOGIN:
        return {
          autoComplete: 'username',
          importantForAutofill: 'yes',
        };
      case CredentialType.REGISTRATION:
        return {
          autoComplete: 'password-new',
          importantForAutofill: 'yes',
        };
      case CredentialType.PASSWORD_RESET:
        return {
          autoComplete: 'password-new',
          importantForAutofill: 'yes',
        };
      default:
        return {};
    }
  }

  // Get platform-specific auto-fill props
  public getAutoFillProps(field: 'username' | 'password', type: CredentialType): object {
    const baseProps = {
      autoCorrect: false,
      autoCapitalize: 'none' as any,
    };

    if (Platform.OS === 'ios') {
      const iosProps = field === 'username' 
        ? { textContentType: 'username' as any, autoComplete: 'username' as any }
        : { textContentType: this.getIOSPasswordContentType(type), autoComplete: this.getPasswordAutoComplete(type) };
      
      return { ...baseProps, ...iosProps };
    } else if (Platform.OS === 'android') {
      const androidProps = field === 'username'
        ? { autoComplete: 'username' as any, importantForAutofill: 'yes' as any }
        : { autoComplete: this.getPasswordAutoComplete(type), importantForAutofill: 'yes' as any };
      
      return { ...baseProps, ...androidProps };
    }

    return baseProps;
  }

  // Helper methods
  private getCredentialKey(domain: string, type: CredentialType): string {
    return `autofill_${domain}_${type}`;
  }

  private getIOSPasswordContentType(type: CredentialType): string {
    switch (type) {
      case CredentialType.LOGIN:
        return 'password';
      case CredentialType.REGISTRATION:
      case CredentialType.PASSWORD_RESET:
        return 'newPassword';
      default:
        return 'password';
    }
  }

  private getPasswordAutoComplete(type: CredentialType): string {
    switch (type) {
      case CredentialType.LOGIN:
        return 'current-password';
      case CredentialType.REGISTRATION:
      case CredentialType.PASSWORD_RESET:
        return 'new-password';
      default:
        return 'current-password';
    }
  }

  // Configuration methods
  public enableBiometrics(enabled: boolean): void {
    this.config.enableBiometrics = enabled;
    logger.info(`🔐 Biometric authentication ${enabled ? 'enabled' : 'disabled'}`);
  }

  public enableAutoFill(enabled: boolean): void {
    this.config.enableAutoFill = enabled;
    logger.info(`📝 Auto-fill ${enabled ? 'enabled' : 'disabled'}`);
  }

  public setCredentialTimeout(minutes: number): void {
    this.config.credentialTimeout = minutes;
    logger.info(`⏰ Credential timeout set to ${minutes} minutes`);
  }

  // Status methods
  public isBiometricsEnabled(): boolean {
    return this.config.enableBiometrics;
  }

  public isAutoFillEnabled(): boolean {
    return this.config.enableAutoFill;
  }

  public getConfig(): AutoFillConfig {
    return { ...this.config };
  }

  // Cleanup
  public async cleanup(): Promise<void> {
    try {
      // Clear any temporary data if needed
      logger.info('🧹 Auto-fill service cleaned up');
    } catch (error) {
      logger.error('❌ Error cleaning up auto-fill service:', error);
    }
  }
}

// Export singleton instance
export const autoFillService = AutoFillService.getInstance();

// Export helper hooks for React components
export const useAutoFill = () => {
  return {
    saveCredentials: (credentials: AutoFillCredentials, type?: CredentialType, requireBiometrics?: boolean) =>
      autoFillService.saveCredentials(credentials, type, requireBiometrics),
    getCredentials: (domain?: string, type?: CredentialType, requireBiometrics?: boolean) =>
      autoFillService.getCredentials(domain, type, requireBiometrics),
    removeCredentials: (domain?: string, type?: CredentialType, requireBiometrics?: boolean) =>
      autoFillService.removeCredentials(domain, type, requireBiometrics),
    authenticateWithBiometrics: (promptMessage?: string) =>
      autoFillService.authenticateWithBiometrics(promptMessage),
    getAutoFillProps: (field: 'username' | 'password', type: CredentialType) =>
      autoFillService.getAutoFillProps(field, type),
    getSavedDomains: () => autoFillService.getSavedDomains(),
    isBiometricsEnabled: () => autoFillService.isBiometricsEnabled(),
    isAutoFillEnabled: () => autoFillService.isAutoFillEnabled(),
  };
};

export default autoFillService; 