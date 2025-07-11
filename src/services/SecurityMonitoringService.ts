import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('SecurityMonitoringService');

// Security configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_TIMEOUT_MINUTES: 120,
  DEVICE_TRUST_DURATION_DAYS: 30,
  SUSPICIOUS_LOGIN_THRESHOLD: 3
};

// Device fingerprint interface
interface DeviceFingerprint {
  id: string;
  name: string;
  type: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  modelName: string;
  brand: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
}

// Login attempt interface
interface LoginAttempt {
  email: string;
  success: boolean;
  deviceFingerprint: DeviceFingerprint;
  timestamp: Date;
  ipAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  failureReason?: string;
  suspiciousFlags: string[];
}

// Security alert interface
interface SecurityAlert {
  type: 'suspicious_login' | 'multiple_failures' | 'new_device' | 'unusual_location' | 'account_locked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  metadata: any;
}

// Session management interface
interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceFingerprint: DeviceFingerprint;
  startTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

class SecurityMonitoringService {
  private deviceFingerprint: DeviceFingerprint | null = null;
  private sessionInfo: SessionInfo | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  // Cache keys
  private readonly DEVICE_FINGERPRINT_KEY = 'security_device_fingerprint';
  private readonly TRUSTED_DEVICES_KEY = 'security_trusted_devices';
  private readonly SESSION_INFO_KEY = 'security_session_info';
  private readonly LOGIN_ATTEMPTS_KEY = 'security_login_attempts';

  /**
   * Initialize security monitoring service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🔒 Initializing Security Monitoring Service...');
      
      // Generate or load device fingerprint
      await this.generateDeviceFingerprint();
      
      // Load existing session info
      await this.loadSessionInfo();
      
      // Start session monitoring
      this.startSessionMonitoring();
      
      logger.info('✅ Security Monitoring Service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Security Monitoring Service:', error);
      throw error;
    }
  }

  /**
   * Generate unique device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(this.DEVICE_FINGERPRINT_KEY);
      if (cached) {
        this.deviceFingerprint = JSON.parse(cached);
        return this.deviceFingerprint!;
      }

      // Generate new fingerprint
      const fingerprint: DeviceFingerprint = {
        id: Device.osInternalBuildId || `${Date.now()}-${Math.random()}`,
        name: Device.deviceName || 'Unknown Device',
        type: Device.deviceType?.toString() || 'Unknown',
        osName: Device.osName || 'Unknown OS',
        osVersion: Device.osVersion || 'Unknown Version',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        modelName: Device.modelName || 'Unknown Model',
        brand: Device.brand || 'Unknown Brand',
        userAgent: await this.getUserAgent(),
        screenResolution: await this.getScreenResolution(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Cache the fingerprint
      await AsyncStorage.setItem(this.DEVICE_FINGERPRINT_KEY, JSON.stringify(fingerprint));
      this.deviceFingerprint = fingerprint;
      
      logger.info('🔍 Device fingerprint generated:', fingerprint.id);
      return fingerprint;
    } catch (error) {
      logger.error('❌ Error generating device fingerprint:', error);
      throw error;
    }
  }

  /**
   * Record login attempt with security analysis
   */
  async recordLoginAttempt(
    email: string,
    success: boolean,
    failureReason?: string
  ): Promise<{
    allowed: boolean;
    lockoutInfo?: {
      locked: boolean;
      lockedUntil: Date;
      remainingMinutes: number;
    };
    securityAlerts: SecurityAlert[];
  }> {
    try {
      logger.info(`🔍 Recording login attempt for ${email}: ${success ? 'SUCCESS' : 'FAILURE'}`);
      
      if (!this.deviceFingerprint) {
        await this.generateDeviceFingerprint();
      }

      // Get location (with permission)
      const location = await this.getLocationInfo();
      
      // Get network info
      const networkInfo = await Network.getNetworkStateAsync();
      
      // Create login attempt record
      const attempt: LoginAttempt = {
        email: email.toLowerCase(),
        success,
        deviceFingerprint: this.deviceFingerprint!,
        timestamp: new Date(),
        ipAddress: networkInfo.isConnected ? await this.getIPAddress() : undefined,
        location,
        failureReason,
        suspiciousFlags: await this.analyzeSuspiciousActivity(email, success)
      };

      // Store attempt locally
      await this.storeLoginAttempt(attempt);

      // Send to backend for processing
      const securityCheck = await this.processSecurityCheck(attempt);
      
      // Generate security alerts if needed
      const alerts = await this.generateSecurityAlerts(attempt, securityCheck);
      
      logger.info(`✅ Login attempt recorded. Allowed: ${securityCheck.allowed}`);
      
      return {
        allowed: securityCheck.allowed,
        lockoutInfo: securityCheck.lockoutInfo,
        securityAlerts: alerts
      };
    } catch (error) {
      logger.error('❌ Error recording login attempt:', error);
      // Allow login on error to prevent blocking legitimate users
      return { allowed: true, securityAlerts: [] };
    }
  }

  /**
   * Register device as trusted
   */
  async registerTrustedDevice(userId: string): Promise<void> {
    try {
      if (!this.deviceFingerprint) {
        await this.generateDeviceFingerprint();
      }

      logger.info('🔐 Registering trusted device...');
      
      // Store in backend
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: this.deviceFingerprint!.id,
          device_name: this.deviceFingerprint!.name,
          device_type: this.deviceFingerprint!.type,
          os_name: this.deviceFingerprint!.osName,
          os_version: this.deviceFingerprint!.osVersion,
          app_version: this.deviceFingerprint!.appVersion,
          model_name: this.deviceFingerprint!.modelName,
          brand: this.deviceFingerprint!.brand,
          trusted: true,
          trust_expires_at: new Date(Date.now() + SECURITY_CONFIG.DEVICE_TRUST_DURATION_DAYS * 24 * 60 * 60 * 1000),
          last_seen: new Date()
        });

      if (error) throw error;

      // Store locally
      const trustedDevices = await this.getTrustedDevices();
      trustedDevices[this.deviceFingerprint!.id] = {
        registeredAt: new Date(),
        expiresAt: new Date(Date.now() + SECURITY_CONFIG.DEVICE_TRUST_DURATION_DAYS * 24 * 60 * 60 * 1000)
      };
      
      await AsyncStorage.setItem(this.TRUSTED_DEVICES_KEY, JSON.stringify(trustedDevices));
      
      logger.info('✅ Device registered as trusted');
    } catch (error) {
      logger.error('❌ Error registering trusted device:', error);
      throw error;
    }
  }

  /**
   * Check if current device is trusted
   */
  async isDeviceTrusted(userId: string): Promise<boolean> {
    try {
      if (!this.deviceFingerprint) {
        await this.generateDeviceFingerprint();
      }

      // Check local cache first
      const trustedDevices = await this.getTrustedDevices();
      const localTrust = trustedDevices[this.deviceFingerprint!.id];
      
      if (localTrust && localTrust.expiresAt > new Date()) {
        return true;
      }

      // Check backend
      const { data, error } = await supabase
        .from('user_devices')
        .select('trusted, trust_expires_at')
        .eq('user_id', userId)
        .eq('device_fingerprint', this.deviceFingerprint!.id)
        .eq('trusted', true)
        .single();

      if (error || !data) return false;

      const trustExpired = new Date(data.trust_expires_at) < new Date();
      return !trustExpired;
    } catch (error) {
      logger.error('❌ Error checking device trust:', error);
      return false;
    }
  }

  /**
   * Start session with security monitoring
   */
  async startSecureSession(userId: string, sessionId: string): Promise<void> {
    try {
      logger.info('🔒 Starting secure session...');
      
      if (!this.deviceFingerprint) {
        await this.generateDeviceFingerprint();
      }

      const now = new Date();
      this.sessionInfo = {
        sessionId,
        userId,
        deviceFingerprint: this.deviceFingerprint!,
        startTime: now,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000),
        isActive: true
      };

      await AsyncStorage.setItem(this.SESSION_INFO_KEY, JSON.stringify(this.sessionInfo));
      
      // Start session monitoring
      this.startSessionMonitoring();
      
      logger.info('✅ Secure session started');
    } catch (error) {
      logger.error('❌ Error starting secure session:', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(): Promise<void> {
    if (!this.sessionInfo) return;

    try {
      const now = new Date();
      this.sessionInfo.lastActivity = now;
      this.sessionInfo.expiresAt = new Date(now.getTime() + SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000);

      await AsyncStorage.setItem(this.SESSION_INFO_KEY, JSON.stringify(this.sessionInfo));
      
      // Reset inactivity timer
      this.resetInactivityTimer();
    } catch (error) {
      logger.error('❌ Error updating session activity:', error);
    }
  }

  /**
   * Check if session is valid
   */
  async isSessionValid(): Promise<boolean> {
    if (!this.sessionInfo) return false;

    const now = new Date();
    const isExpired = this.sessionInfo.expiresAt < now;
    
    if (isExpired) {
      await this.endSession();
      return false;
    }

    return this.sessionInfo.isActive;
  }

  /**
   * End session
   */
  async endSession(): Promise<void> {
    try {
      logger.info('🔒 Ending session...');
      
      if (this.sessionInfo) {
        this.sessionInfo.isActive = false;
        await AsyncStorage.removeItem(this.SESSION_INFO_KEY);
      }

      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }

      this.sessionInfo = null;
      
      logger.info('✅ Session ended');
    } catch (error) {
      logger.error('❌ Error ending session:', error);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<{
    deviceTrusted: boolean;
    sessionValid: boolean;
    recentLoginAttempts: number;
    securityScore: number;
  }> {
    try {
      const attempts = await this.getRecentLoginAttempts();
      const sessionValid = await this.isSessionValid();
      const deviceTrusted = this.sessionInfo ? 
        await this.isDeviceTrusted(this.sessionInfo.userId) : false;

      const failedAttempts = attempts.filter(a => !a.success).length;
      const securityScore = this.calculateSecurityScore(
        deviceTrusted,
        sessionValid,
        failedAttempts
      );

      return {
        deviceTrusted,
        sessionValid,
        recentLoginAttempts: failedAttempts,
        securityScore
      };
    } catch (error) {
      logger.error('❌ Error getting security metrics:', error);
      return {
        deviceTrusted: false,
        sessionValid: false,
        recentLoginAttempts: 0,
        securityScore: 0
      };
    }
  }

  // Private helper methods
  private async getUserAgent(): Promise<string> {
    return `Collaborito/${Application.nativeApplicationVersion} (${Device.osName} ${Device.osVersion})`;
  }

  private async getScreenResolution(): Promise<string> {
    // This would need to be implemented with Dimensions or expo-screen-orientation
    return 'unknown';
  }

  private async getLocationInfo(): Promise<any> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      logger.warn('Failed to get location:', error);
      return null;
    }
  }

  private async getIPAddress(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      logger.warn('Failed to get IP address:', error);
      return undefined;
    }
  }

  private async analyzeSuspiciousActivity(email: string, success: boolean): Promise<string[]> {
    const flags: string[] = [];
    
    try {
      const recentAttempts = await this.getRecentLoginAttempts(email);
      
      // Check for rapid successive failures
      const recentFailures = recentAttempts.filter(a => 
        !a.success && 
        Date.now() - a.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
      );
      
      if (recentFailures.length >= 3) {
        flags.push('rapid_failures');
      }

      // Check for unusual time patterns
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        flags.push('unusual_time');
      }

      // Add more sophisticated analysis here
      
    } catch (error) {
      logger.warn('Error analyzing suspicious activity:', error);
    }
    
    return flags;
  }

  private async storeLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      const attempts = await this.getRecentLoginAttempts();
      attempts.push(attempt);
      
      // Keep only last 50 attempts
      const trimmed = attempts.slice(-50);
      
      await AsyncStorage.setItem(this.LOGIN_ATTEMPTS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      logger.error('Error storing login attempt:', error);
    }
  }

  private async getRecentLoginAttempts(email?: string): Promise<LoginAttempt[]> {
    try {
      const stored = await AsyncStorage.getItem(this.LOGIN_ATTEMPTS_KEY);
      if (!stored) return [];
      
      const attempts: LoginAttempt[] = JSON.parse(stored);
      
      // Filter by email if provided
      if (email) {
        return attempts.filter(a => a.email === email.toLowerCase());
      }
      
      return attempts;
    } catch (error) {
      logger.error('Error getting recent login attempts:', error);
      return [];
    }
  }

  private async processSecurityCheck(attempt: LoginAttempt): Promise<{
    allowed: boolean;
    lockoutInfo?: any;
  }> {
    // This would typically call the backend edge function
    // For now, implement basic local logic
    const recentFailures = (await this.getRecentLoginAttempts(attempt.email))
      .filter(a => !a.success && Date.now() - a.timestamp.getTime() < 60 * 60 * 1000) // Last hour
      .length;

    if (recentFailures >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      return {
        allowed: false,
        lockoutInfo: {
          locked: true,
          lockedUntil,
          remainingMinutes: SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES
        }
      };
    }

    return { allowed: true };
  }

  private async generateSecurityAlerts(attempt: LoginAttempt, securityCheck: any): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    if (!securityCheck.allowed) {
      alerts.push({
        type: 'account_locked',
        severity: 'high',
        title: 'Account Temporarily Locked',
        message: 'Your account has been temporarily locked due to multiple failed login attempts.',
        recommendation: 'Please try again later or reset your password if you\'ve forgotten it.',
        metadata: securityCheck.lockoutInfo
      });
    }
    
    if (attempt.suspiciousFlags.length > 0) {
      alerts.push({
        type: 'suspicious_login',
        severity: 'medium',
        title: 'Suspicious Login Activity Detected',
        message: 'We detected unusual activity on your account.',
        recommendation: 'Please verify this login attempt was made by you.',
        metadata: { flags: attempt.suspiciousFlags }
      });
    }
    
    return alerts;
  }

  private async getTrustedDevices(): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem(this.TRUSTED_DEVICES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error('Error getting trusted devices:', error);
      return {};
    }
  }

  private async loadSessionInfo(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SESSION_INFO_KEY);
      if (stored) {
        this.sessionInfo = JSON.parse(stored);
        
        // Check if session is still valid
        if (!(await this.isSessionValid())) {
          this.sessionInfo = null;
          await AsyncStorage.removeItem(this.SESSION_INFO_KEY);
        }
      }
    } catch (error) {
      logger.error('Error loading session info:', error);
    }
  }

  private startSessionMonitoring(): void {
    if (!this.sessionInfo) return;
    
    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(async () => {
      logger.info('⏰ Session timeout due to inactivity');
      await this.endSession();
      
      // Notify the app about session timeout
      // This would trigger a logout in the auth context
    }, SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }

  private calculateSecurityScore(
    deviceTrusted: boolean,
    sessionValid: boolean,
    failedAttempts: number
  ): number {
    let score = 100;
    
    if (!deviceTrusted) score -= 30;
    if (!sessionValid) score -= 40;
    score -= failedAttempts * 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

export const securityMonitoringService = new SecurityMonitoringService();
export default securityMonitoringService; 