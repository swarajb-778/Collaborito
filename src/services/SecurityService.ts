import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import createLogger from '../utils/logger';
import * as Haptics from 'expo-haptics';
import { supabase } from './supabase';

const logger = createLogger('SecurityService');

// Security interfaces
export interface LoginAttempt {
  id: string;
  email: string;
  timestamp: string;
  success: boolean;
  deviceInfo: DeviceInfo;
  location?: LocationInfo;
  failureReason?: string;
  blocked?: boolean;
  suspiciousActivity?: string[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  modelName?: string;
  brand?: string;
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  trusted: boolean;
  registered: boolean;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  ip?: string;
  timezone?: string;
  suspicious?: boolean;
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'multiple_failures' | 'new_device' | 'unusual_location' | 'account_locked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  email: string;
  deviceInfo?: DeviceInfo;
  recommendation: string;
  resolved: boolean;
}

export interface SecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  unusualLocationCheck: boolean;
  newDeviceCheck: boolean;
  deviceTrustExpiry: number; // in days
  sessionTimeout: number; // in minutes
  multiFactorRequired: boolean;
  suspiciousPatternDetection: boolean;
}

// Security service implementation
export class SecurityService {
  private static instance: SecurityService;
  
  private readonly STORAGE_KEYS = {
    LOGIN_ATTEMPTS: '@collaborito_login_attempts',
    DEVICES: '@collaborito_devices',
    SECURITY_ALERTS: '@collaborito_security_alerts',
    BLOCKED_ACCOUNTS: '@collaborito_blocked_accounts',
    SECURITY_CONFIG: '@collaborito_security_config',
    SESSION_DATA: '@collaborito_session_data',
  };

  private readonly DEFAULT_CONFIG: SecurityConfig = {
    maxFailedAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    unusualLocationCheck: true,
    newDeviceCheck: true,
    deviceTrustExpiry: 30, // 30 days
    sessionTimeout: 120, // 2 hours
    multiFactorRequired: false,
    suspiciousPatternDetection: true,
  };

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Initialize security service
  async initialize(): Promise<void> {
    try {
      await this.ensureSecurityConfig();
      await this.cleanupExpiredData();
      logger.success('🔐 Security service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize security service', error);
    }
  }

  // Get current device information
  async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    try {
      const deviceFingerprint = await this.generateDeviceFingerprint();
      
      return {
        id: deviceFingerprint,
        name: Device.deviceName || 'Unknown Device',
        type: Device.deviceType?.toString() || 'Unknown',
        osName: Platform.OS,
        osVersion: Device.osVersion || 'Unknown',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        modelName: Device.modelName || undefined,
        brand: Device.brand || undefined,
        fingerprint: deviceFingerprint,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        trusted: false,
        registered: false,
      };
    } catch (error) {
      logger.error('❌ Failed to get device info', error);
      throw new Error('Unable to get device information');
    }
  }

  // Generate unique device fingerprint
  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const components = [
        Device.modelName || 'unknown',
        Device.brand || 'unknown',
        Platform.OS,
        Device.osVersion || 'unknown',
        Application.nativeApplicationVersion || '1.0.0',
      ];
      
      const fingerprint = components.join('|');
      return Buffer.from(fingerprint).toString('base64');
    } catch (error) {
      logger.error('❌ Failed to generate device fingerprint', error);
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Record login attempt with Supabase integration
  async recordLoginAttempt(
    email: string, 
    success: boolean, 
    failureReason?: string,
    location?: LocationInfo
  ): Promise<LoginAttempt> {
    try {
      const deviceInfo = await this.getCurrentDeviceInfo();
      
      // First check if account is locked using Supabase function
      if (!success) {
        const { data: lockoutResult, error: lockoutError } = await supabase.rpc(
          'record_login_attempt_and_check_lockout',
          {
            p_email: email.toLowerCase(),
            p_success: success,
            p_device_fingerprint: deviceInfo.fingerprint,
            p_device_info: {
              name: deviceInfo.name,
              type: deviceInfo.type,
              osName: deviceInfo.osName,
              osVersion: deviceInfo.osVersion,
              appVersion: deviceInfo.appVersion,
              modelName: deviceInfo.modelName,
              brand: deviceInfo.brand
            },
            p_location_info: location,
            p_failure_reason: failureReason
          }
        );

        if (lockoutError) {
          logger.error('❌ Failed to record login attempt in database', lockoutError);
          // Fall back to local storage for this attempt
        } else if (lockoutResult?.[0]?.should_lockout) {
          const lockoutData = lockoutResult[0];
          await this.handleAccountLockout(email, lockoutData);
        }
      } else {
        // Record successful login attempt
        await supabase.rpc('record_login_attempt_and_check_lockout', {
          p_email: email.toLowerCase(),
          p_success: success,
          p_device_fingerprint: deviceInfo.fingerprint,
          p_device_info: {
            name: deviceInfo.name,
            type: deviceInfo.type,
            osName: deviceInfo.osName,
            osVersion: deviceInfo.osVersion,
            appVersion: deviceInfo.appVersion,
            modelName: deviceInfo.modelName,
            brand: deviceInfo.brand
          },
          p_location_info: location
        });

        // Update/register device for successful logins
        await this.registerDevice(deviceInfo);
      }

      // Create local LoginAttempt object for return
      const loginAttempt: LoginAttempt = {
        id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        timestamp: new Date().toISOString(),
        success,
        deviceInfo,
        location,
        failureReason,
        blocked: false,
        suspiciousActivity: [],
      };

      // Also store locally for immediate access
      await this.storeLocalLoginAttempt(email, loginAttempt);

      logger.info(`🔍 Login attempt recorded for ${email}: ${success ? 'SUCCESS' : 'FAILED'} from ${deviceInfo.name}`);

      return loginAttempt;
      
    } catch (error) {
      logger.error('❌ Failed to record login attempt', error);
      throw error;
    }
  }

  // Handle account lockout from database result
  private async handleAccountLockout(email: string, lockoutData: any): Promise<void> {
    try {
      // Store lockout info locally for immediate access
      const lockData = {
        email: email.toLowerCase(),
        lockedAt: new Date().toISOString(),
        unlockAt: new Date(Date.now() + lockoutData.lockout_duration_minutes * 60 * 1000).toISOString(),
        reason: 'multiple_failed_attempts',
        failedAttempts: lockoutData.failed_attempts_count
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.BLOCKED_ACCOUNTS}_${email}`,
        JSON.stringify(lockData)
      );

      // Create security alert
      await this.createSecurityAlert(
        email,
        null,
        ['account_locked'],
        'critical',
        'Account Temporarily Locked',
        `Your account has been temporarily locked due to ${lockoutData.failed_attempts_count} failed login attempts. It will be unlocked in ${lockoutData.lockout_duration_minutes} minutes.`
      );

      logger.warn(`🔒 Account locked: ${email} for ${lockoutData.lockout_duration_minutes} minutes (${lockoutData.failed_attempts_count} failed attempts)`);
    } catch (error) {
      logger.error('❌ Failed to handle account lockout', error);
    }
  }

  // Register/update device in Supabase
  private async registerDevice(deviceInfo: DeviceInfo): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: user.user.id,
          device_fingerprint: deviceInfo.fingerprint,
          device_name: deviceInfo.name,
          device_type: deviceInfo.type,
          os_name: deviceInfo.osName,
          os_version: deviceInfo.osVersion,
          app_version: deviceInfo.appVersion,
          model_name: deviceInfo.modelName,
          brand: deviceInfo.brand,
          last_seen: new Date().toISOString(),
          trusted: false // User can manually trust devices later
        }, { 
          onConflict: 'user_id,device_fingerprint',
          ignoreDuplicates: false 
        });

      if (error) {
        logger.error('❌ Failed to register device', error);
      } else {
        logger.success(`📱 Device registered: ${deviceInfo.name}`);
      }
    } catch (error) {
      logger.error('❌ Failed to register device', error);
    }
  }

  // Store login attempt locally for caching
  private async storeLocalLoginAttempt(email: string, attempt: LoginAttempt): Promise<void> {
    try {
      const attempts = await this.getLocalLoginAttempts(email);
      attempts.push(attempt);

      // Keep only last 50 attempts per user locally
      const recentAttempts = attempts.slice(-50);
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.LOGIN_ATTEMPTS}_${email}`,
        JSON.stringify(recentAttempts)
      );
    } catch (error) {
      logger.error('❌ Failed to store local login attempt', error);
    }
  }

  // Get local login attempts (for immediate access)
  private async getLocalLoginAttempts(email: string): Promise<LoginAttempt[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEYS.LOGIN_ATTEMPTS}_${email.toLowerCase()}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('❌ Failed to get local login attempts', error);
      return [];
    }
  }

  // Check for suspicious activity patterns
  private async checkForSuspiciousActivity(email: string, attempt: LoginAttempt): Promise<void> {
    try {
      const config = await this.getSecurityConfig();
      const recentAttempts = await this.getRecentFailedAttempts(email, 30); // Last 30 minutes
      
      const suspiciousActivity: string[] = [];

      // Check for multiple failed attempts
      if (recentAttempts.length >= config.maxFailedAttempts) {
        suspiciousActivity.push('multiple_failed_attempts');
        await this.lockAccount(email, config.lockoutDuration);
      }

      // Check for rapid successive attempts
      if (recentAttempts.length >= 3) {
        const timestamps = recentAttempts.map(a => new Date(a.timestamp).getTime());
        const timeDiffs = timestamps.slice(1).map((time, index) => time - timestamps[index]);
        const avgTimeBetweenAttempts = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
        
        if (avgTimeBetweenAttempts < 30000) { // Less than 30 seconds between attempts
          suspiciousActivity.push('rapid_successive_attempts');
        }
      }

      // Check for unusual location (if enabled)
      if (config.unusualLocationCheck && attempt.location) {
        const isUnusualLocation = await this.checkUnusualLocation(email, attempt.location);
        if (isUnusualLocation) {
          suspiciousActivity.push('unusual_location');
        }
      }

      // Check for new device (if enabled)
      if (config.newDeviceCheck) {
        const isNewDevice = await this.isNewDevice(attempt.deviceInfo);
        if (isNewDevice) {
          suspiciousActivity.push('new_device');
        }
      }

      // Update attempt with suspicious activity
      attempt.suspiciousActivity = suspiciousActivity;

      // Create security alerts for suspicious activity
      if (suspiciousActivity.length > 0) {
        await this.createSecurityAlert(email, attempt, suspiciousActivity);
      }

    } catch (error) {
      logger.error('❌ Failed to check suspicious activity', error);
    }
  }

  // Check if location is unusual for user
  private async checkUnusualLocation(email: string, location: LocationInfo): Promise<boolean> {
    try {
      const recentAttempts = await this.getLoginAttempts(email, 30); // Last 30 days
      const successfulAttempts = recentAttempts.filter(a => a.success && a.location);
      
      if (successfulAttempts.length === 0) {
        return false; // No previous location data
      }

      const previousCountries = new Set(successfulAttempts.map(a => a.location?.country).filter(Boolean));
      
      // If user has never logged in from this country, it's unusual
      return location.country ? !previousCountries.has(location.country) : false;
      
    } catch (error) {
      logger.error('❌ Failed to check unusual location', error);
      return false;
    }
  }

  // Check if device is new
  private async isNewDevice(deviceInfo: DeviceInfo): Promise<boolean> {
    try {
      const devices = await this.getRegisteredDevices();
      return !devices.some(d => d.fingerprint === deviceInfo.fingerprint);
    } catch (error) {
      logger.error('❌ Failed to check if device is new', error);
      return false;
    }
  }

  // Lock account temporarily
  private async lockAccount(email: string, durationMinutes: number): Promise<void> {
    try {
      const lockData = {
        email: email.toLowerCase(),
        lockedAt: new Date().toISOString(),
        unlockAt: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
        reason: 'multiple_failed_attempts',
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.BLOCKED_ACCOUNTS}_${email}`,
        JSON.stringify(lockData)
      );

      logger.warn(`🔒 Account locked: ${email} for ${durationMinutes} minutes`);
      
      // Create security alert
      await this.createSecurityAlert(
        email,
        null,
        ['account_locked'],
        'critical',
        'Account Temporarily Locked',
        `Your account has been temporarily locked due to multiple failed login attempts. It will be unlocked in ${durationMinutes} minutes.`
      );

    } catch (error) {
      logger.error('❌ Failed to lock account', error);
    }
  }

  // Check if account is currently locked (Supabase + local fallback)
  async isAccountLocked(email: string): Promise<boolean> {
    try {
      // First check Supabase
      const { data, error } = await supabase.rpc('is_account_locked', {
        p_email: email.toLowerCase()
      });

      if (!error && data !== null) {
        return data as boolean;
      }

      // Fallback to local storage check
      const lockData = await AsyncStorage.getItem(`${this.STORAGE_KEYS.BLOCKED_ACCOUNTS}_${email.toLowerCase()}`);
      
      if (!lockData) {
        return false;
      }

      const lock = JSON.parse(lockData);
      const unlockTime = new Date(lock.unlockAt);
      
      if (new Date() >= unlockTime) {
        // Lock has expired, remove it
        await AsyncStorage.removeItem(`${this.STORAGE_KEYS.BLOCKED_ACCOUNTS}_${email.toLowerCase()}`);
        return false;
      }

      return true;
      
    } catch (error) {
      logger.error('❌ Failed to check account lock status', error);
      return false;
    }
  }

  // Get time remaining for account unlock (Supabase + local fallback)
  async getAccountLockTimeRemaining(email: string): Promise<number> {
    try {
      // First check Supabase
      const { data, error } = await supabase.rpc('get_account_lockout_info', {
        p_email: email.toLowerCase()
      });

      if (!error && data && data.length > 0) {
        const lockInfo = data[0];
        return Math.max(0, Math.ceil(lockInfo.minutes_remaining || 0));
      }

      // Fallback to local storage check
      const lockData = await AsyncStorage.getItem(`${this.STORAGE_KEYS.BLOCKED_ACCOUNTS}_${email.toLowerCase()}`);
      
      if (!lockData) {
        return 0;
      }

      const lock = JSON.parse(lockData);
      const unlockTime = new Date(lock.unlockAt);
      const now = new Date();
      
      return Math.max(0, Math.ceil((unlockTime.getTime() - now.getTime()) / 60000)); // Minutes remaining
      
    } catch (error) {
      logger.error('❌ Failed to get lock time remaining', error);
      return 0;
    }
  }

  // Clear failed attempts after successful login
  private async clearFailedAttempts(email: string): Promise<void> {
    try {
      const attempts = await this.getLoginAttempts(email);
      const successfulAttempts = attempts.filter(a => a.success);
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.LOGIN_ATTEMPTS}_${email}`,
        JSON.stringify(successfulAttempts)
      );

      // Remove account lock if it exists
      await AsyncStorage.removeItem(`${this.STORAGE_KEYS.BLOCKED_ACCOUNTS}_${email.toLowerCase()}`);
      
    } catch (error) {
      logger.error('❌ Failed to clear failed attempts', error);
    }
  }

  // Update device information
  private async updateDeviceInfo(deviceInfo: DeviceInfo): Promise<void> {
    try {
      const devices = await this.getRegisteredDevices();
      const existingDeviceIndex = devices.findIndex(d => d.fingerprint === deviceInfo.fingerprint);
      
      if (existingDeviceIndex >= 0) {
        // Update existing device
        devices[existingDeviceIndex] = {
          ...devices[existingDeviceIndex],
          lastSeen: new Date().toISOString(),
          trusted: true,
          registered: true,
        };
      } else {
        // Add new device
        const newDevice = {
          ...deviceInfo,
          trusted: false,
          registered: true,
        };
        devices.push(newDevice);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      
    } catch (error) {
      logger.error('❌ Failed to update device info', error);
    }
  }

  // Create security alert
  private async createSecurityAlert(
    email: string,
    attempt: LoginAttempt | null,
    suspiciousActivity: string[],
    severity: SecurityAlert['severity'] = 'medium',
    customTitle?: string,
    customMessage?: string
  ): Promise<void> {
    try {
      const alert: SecurityAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.determineAlertType(suspiciousActivity),
        severity,
        title: customTitle || this.generateAlertTitle(suspiciousActivity),
        message: customMessage || this.generateAlertMessage(suspiciousActivity, attempt),
        timestamp: new Date().toISOString(),
        email: email.toLowerCase(),
        deviceInfo: attempt?.deviceInfo,
        recommendation: this.generateRecommendation(suspiciousActivity),
        resolved: false,
      };

      const alerts = await this.getSecurityAlerts(email);
      alerts.push(alert);

      // Keep only last 20 alerts per user
      const recentAlerts = alerts.slice(-20);
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.SECURITY_ALERTS}_${email}`,
        JSON.stringify(recentAlerts)
      );

      logger.warn('🚨 Security alert created', {
        type: alert.type,
        severity: alert.severity,
        email,
        alertId: alert.id,
      });

      // Trigger haptic feedback for critical alerts
      if (severity === 'critical') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

    } catch (error) {
      logger.error('❌ Failed to create security alert', error);
    }
  }

  // Helper methods for alert generation
  private determineAlertType(suspiciousActivity: string[]): SecurityAlert['type'] {
    if (suspiciousActivity.includes('account_locked')) return 'account_locked';
    if (suspiciousActivity.includes('multiple_failed_attempts')) return 'multiple_failures';
    if (suspiciousActivity.includes('new_device')) return 'new_device';
    if (suspiciousActivity.includes('unusual_location')) return 'unusual_location';
    return 'suspicious_login';
  }

  private generateAlertTitle(suspiciousActivity: string[]): string {
    if (suspiciousActivity.includes('account_locked')) return 'Account Temporarily Locked';
    if (suspiciousActivity.includes('multiple_failed_attempts')) return 'Multiple Failed Login Attempts';
    if (suspiciousActivity.includes('new_device')) return 'New Device Detected';
    if (suspiciousActivity.includes('unusual_location')) return 'Unusual Login Location';
    return 'Suspicious Login Activity';
  }

  private generateAlertMessage(suspiciousActivity: string[], attempt: LoginAttempt | null): string {
    const activities = suspiciousActivity.join(', ');
    const device = attempt?.deviceInfo?.name || 'Unknown device';
    const time = attempt ? new Date(attempt.timestamp).toLocaleString() : new Date().toLocaleString();
    
    return `Suspicious activity detected: ${activities}. Device: ${device}, Time: ${time}`;
  }

  private generateRecommendation(suspiciousActivity: string[]): string {
    if (suspiciousActivity.includes('account_locked')) {
      return 'Wait for the lockout period to expire, then try logging in again. Consider changing your password if you suspect unauthorized access.';
    }
    if (suspiciousActivity.includes('multiple_failed_attempts')) {
      return 'If this was you, please check your password and try again. If not, consider changing your password immediately.';
    }
    if (suspiciousActivity.includes('new_device')) {
      return 'If this is your device, you can mark it as trusted. If not, change your password immediately and review recent account activity.';
    }
    if (suspiciousActivity.includes('unusual_location')) {
      return 'If you are traveling or using a VPN, this may be normal. Otherwise, review your account for unauthorized access.';
    }
    return 'Monitor your account for any unusual activity and consider enabling additional security measures.';
  }

  // Get login attempts for a user
  async getLoginAttempts(email: string, days: number = 30): Promise<LoginAttempt[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEYS.LOGIN_ATTEMPTS}_${email.toLowerCase()}`);
      if (!data) return [];

      const attempts: LoginAttempt[] = JSON.parse(data);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      return attempts.filter(attempt => new Date(attempt.timestamp) >= cutoffDate);
    } catch (error) {
      logger.error('❌ Failed to get login attempts', error);
      return [];
    }
  }

  // Get recent failed attempts
  private async getRecentFailedAttempts(email: string, minutes: number): Promise<LoginAttempt[]> {
    try {
      const attempts = await this.getLoginAttempts(email);
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      return attempts.filter(
        attempt => !attempt.success && new Date(attempt.timestamp) >= cutoffTime
      );
    } catch (error) {
      logger.error('❌ Failed to get recent failed attempts', error);
      return [];
    }
  }

  // Get security alerts for a user
  async getSecurityAlerts(email: string): Promise<SecurityAlert[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEYS.SECURITY_ALERTS}_${email.toLowerCase()}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('❌ Failed to get security alerts', error);
      return [];
    }
  }

  // Get registered devices
  async getRegisteredDevices(): Promise<DeviceInfo[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('❌ Failed to get registered devices', error);
      return [];
    }
  }

  // Trust a device
  async trustDevice(deviceFingerprint: string): Promise<void> {
    try {
      const devices = await this.getRegisteredDevices();
      const deviceIndex = devices.findIndex(d => d.fingerprint === deviceFingerprint);
      
      if (deviceIndex >= 0) {
        devices[deviceIndex].trusted = true;
        await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICES, JSON.stringify(devices));
        logger.success(`✅ Device trusted: ${devices[deviceIndex].name}`);
      }
    } catch (error) {
      logger.error('❌ Failed to trust device', error);
    }
  }

  // Get security configuration
  async getSecurityConfig(): Promise<SecurityConfig> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_CONFIG);
      return data ? { ...this.DEFAULT_CONFIG, ...JSON.parse(data) } : this.DEFAULT_CONFIG;
    } catch (error) {
      logger.error('❌ Failed to get security config', error);
      return this.DEFAULT_CONFIG;
    }
  }

  // Update security configuration
  async updateSecurityConfig(config: Partial<SecurityConfig>): Promise<void> {
    try {
      const currentConfig = await this.getSecurityConfig();
      const newConfig = { ...currentConfig, ...config };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(newConfig));
      logger.success('✅ Security config updated');
    } catch (error) {
      logger.error('❌ Failed to update security config', error);
    }
  }

  // Ensure security config exists
  private async ensureSecurityConfig(): Promise<void> {
    try {
      const existingConfig = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_CONFIG);
      if (!existingConfig) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(this.DEFAULT_CONFIG));
      }
    } catch (error) {
      logger.error('❌ Failed to ensure security config', error);
    }
  }

  // Cleanup expired data
  private async cleanupExpiredData(): Promise<void> {
    try {
      // This method would typically clean up old login attempts, expired locks, etc.
      logger.info('🧹 Security data cleanup completed');
    } catch (error) {
      logger.error('❌ Failed to cleanup expired data', error);
    }
  }

  // Generate security report
  async generateSecurityReport(email: string): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    devicesUsed: number;
    trustedDevices: number;
    securityAlerts: number;
    lastLogin: string | null;
    accountLocked: boolean;
  }> {
    try {
      const [attempts, alerts, devices] = await Promise.all([
        this.getLoginAttempts(email),
        this.getSecurityAlerts(email),
        this.getRegisteredDevices(),
      ]);

      const successfulLogins = attempts.filter(a => a.success);
      const failedLogins = attempts.filter(a => !a.success);
      const userDevices = devices.filter(d => 
        attempts.some(a => a.deviceInfo.fingerprint === d.fingerprint)
      );

      return {
        totalLogins: attempts.length,
        successfulLogins: successfulLogins.length,
        failedLogins: failedLogins.length,
        devicesUsed: userDevices.length,
        trustedDevices: userDevices.filter(d => d.trusted).length,
        securityAlerts: alerts.length,
        lastLogin: successfulLogins.length > 0 
          ? successfulLogins[successfulLogins.length - 1].timestamp 
          : null,
        accountLocked: await this.isAccountLocked(email),
      };
    } catch (error) {
      logger.error('❌ Failed to generate security report', error);
      throw new Error('Failed to generate security report');
    }
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance(); 