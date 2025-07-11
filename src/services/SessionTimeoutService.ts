import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';
import { securityMonitoringService } from './SecurityMonitoringService';

const logger = createLogger('SessionTimeoutService');

// Session timeout configuration
const SESSION_CONFIG = {
  WARNING_BEFORE_TIMEOUT_MINUTES: 5,
  TIMEOUT_MINUTES: 120,
  BACKGROUND_TIMEOUT_MINUTES: 30,
  ACTIVITY_CHECK_INTERVAL_MS: 30000, // 30 seconds
  WARNING_INTERVAL_MS: 60000, // 1 minute for repeated warnings
  AUTO_EXTEND_ON_ACTIVITY: true,
  HAPTIC_FEEDBACK_ON_WARNING: true
};

// Session state interface
interface SessionState {
  userId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  warningTime: Date | null;
  isActive: boolean;
  backgroundTime: Date | null;
  inactivityWarningShown: boolean;
}

// Session timeout callback types
type SessionTimeoutCallback = () => void;
type SessionWarningCallback = (minutesRemaining: number) => void;
type ActivityCallback = () => void;

class SessionTimeoutService {
  private sessionState: SessionState | null = null;
  private activityTimer: ReturnType<typeof setInterval> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSubscription: any = null;

  // Callbacks
  private onSessionTimeout: SessionTimeoutCallback | null = null;
  private onSessionWarning: SessionWarningCallback | null = null;
  private onUserActivity: ActivityCallback | null = null;

  // Activity tracking
  private lastUserActivity: Date = new Date();
  private isInBackground: boolean = false;

  // Cache key
  private readonly SESSION_STATE_KEY = 'session_timeout_state';

  /**
   * Initialize session timeout service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('⏰ Initializing Session Timeout Service...');
      
      // Load existing session state
      await this.loadSessionState();
      
      // Set up app state listening
      this.setupAppStateListening();
      
      // Start activity monitoring if session exists
      if (this.sessionState) {
        this.startActivityMonitoring();
      }
      
      logger.info('✅ Session Timeout Service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Session Timeout Service:', error);
      throw error;
    }
  }

  /**
   * Start a new session with timeout monitoring
   */
  async startSession(userId: string, sessionId: string): Promise<void> {
    try {
      logger.info('🕐 Starting session timeout monitoring...');
      
      const now = new Date();
      this.sessionState = {
        userId,
        sessionId,
        startTime: now,
        lastActivity: now,
        warningTime: null,
        isActive: true,
        backgroundTime: null,
        inactivityWarningShown: false
      };

      // Save state
      await this.saveSessionState();
      
      // Start monitoring
      this.startActivityMonitoring();
      
      // Record activity
      this.recordActivity();
      
      logger.info('✅ Session timeout monitoring started');
    } catch (error) {
      logger.error('❌ Error starting session:', error);
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    try {
      logger.info('🕐 Ending session timeout monitoring...');
      
      if (this.sessionState) {
        this.sessionState.isActive = false;
        await this.saveSessionState();
      }

      // Clear all timers
      this.clearAllTimers();
      
      // Clear session state
      this.sessionState = null;
      await AsyncStorage.removeItem(this.SESSION_STATE_KEY);
      
      logger.info('✅ Session timeout monitoring ended');
    } catch (error) {
      logger.error('❌ Error ending session:', error);
    }
  }

  /**
   * Record user activity to extend session
   */
  recordActivity(): void {
    if (!this.sessionState || !this.sessionState.isActive) return;

    const now = new Date();
    this.lastUserActivity = now;
    this.sessionState.lastActivity = now;
    this.sessionState.inactivityWarningShown = false;

    // Auto-extend session if configured
    if (SESSION_CONFIG.AUTO_EXTEND_ON_ACTIVITY) {
      this.extendSession();
    }

    // Update security monitoring
    securityMonitoringService.updateSessionActivity().catch(error => {
      logger.warn('Failed to update security activity:', error);
    });

    // Save state
    this.saveSessionState().catch(error => {
      logger.warn('Failed to save session state:', error);
    });

    // Notify activity callback
    if (this.onUserActivity) {
      this.onUserActivity();
    }

    logger.debug('📱 User activity recorded');
  }

  /**
   * Extend current session
   */
  extendSession(additionalMinutes?: number): void {
    if (!this.sessionState || !this.sessionState.isActive) return;

    const extensionMinutes = additionalMinutes || SESSION_CONFIG.TIMEOUT_MINUTES;
    const now = new Date();
    
    logger.info(`⏰ Extending session by ${extensionMinutes} minutes`);
    
    // Reset warning state
    this.sessionState.warningTime = null;
    this.sessionState.inactivityWarningShown = false;
    
    // Clear existing timers and restart
    this.clearTimeoutTimers();
    this.scheduleTimeoutWarning();
    this.scheduleSessionTimeout();
    
    this.saveSessionState();
  }

  /**
   * Get time remaining until session timeout
   */
  getTimeRemaining(): number {
    if (!this.sessionState || !this.sessionState.isActive) return 0;

    const now = new Date();
    const sessionEnd = new Date(
      this.sessionState.lastActivity.getTime() + 
      SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000
    );
    
    const remainingMs = sessionEnd.getTime() - now.getTime();
    return Math.max(0, Math.floor(remainingMs / (60 * 1000))); // Return minutes
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    if (!this.sessionState || !this.sessionState.isActive) return false;
    
    const timeRemaining = this.getTimeRemaining();
    return timeRemaining > 0;
  }

  /**
   * Get session information
   */
  getSessionInfo(): {
    isActive: boolean;
    timeRemaining: number;
    lastActivity: Date | null;
    warningShown: boolean;
  } {
    if (!this.sessionState) {
      return {
        isActive: false,
        timeRemaining: 0,
        lastActivity: null,
        warningShown: false
      };
    }

    return {
      isActive: this.sessionState.isActive,
      timeRemaining: this.getTimeRemaining(),
      lastActivity: this.sessionState.lastActivity,
      warningShown: this.sessionState.inactivityWarningShown
    };
  }

  /**
   * Set callback for session timeout
   */
  setSessionTimeoutCallback(callback: SessionTimeoutCallback): void {
    this.onSessionTimeout = callback;
  }

  /**
   * Set callback for session warning
   */
  setSessionWarningCallback(callback: SessionWarningCallback): void {
    this.onSessionWarning = callback;
  }

  /**
   * Set callback for user activity
   */
  setActivityCallback(callback: ActivityCallback): void {
    this.onUserActivity = callback;
  }

  // Private methods

  private async loadSessionState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SESSION_STATE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        
        // Convert date strings back to Date objects
        state.startTime = new Date(state.startTime);
        state.lastActivity = new Date(state.lastActivity);
        state.warningTime = state.warningTime ? new Date(state.warningTime) : null;
        state.backgroundTime = state.backgroundTime ? new Date(state.backgroundTime) : null;
        
        // Check if session is still valid
        if (state.isActive && this.isSessionValidForState(state)) {
          this.sessionState = state;
          logger.info('📱 Restored session state from storage');
        } else {
          logger.info('⏰ Stored session has expired, clearing');
          await AsyncStorage.removeItem(this.SESSION_STATE_KEY);
        }
      }
    } catch (error) {
      logger.error('❌ Error loading session state:', error);
    }
  }

  private async saveSessionState(): Promise<void> {
    if (!this.sessionState) return;

    try {
      await AsyncStorage.setItem(this.SESSION_STATE_KEY, JSON.stringify(this.sessionState));
    } catch (error) {
      logger.error('❌ Error saving session state:', error);
    }
  }

  private isSessionValidForState(state: any): boolean {
    const now = new Date();
    const sessionEnd = new Date(
      state.lastActivity.getTime() + 
      SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000
    );
    
    return sessionEnd > now;
  }

  private setupAppStateListening(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (!this.sessionState || !this.sessionState.isActive) return;

    logger.info(`📱 App state changed to: ${nextAppState}`);

    if (nextAppState === 'background') {
      this.handleAppGoingToBackground();
    } else if (nextAppState === 'active') {
      this.handleAppComingToForeground();
    }
  }

  private handleAppGoingToBackground(): void {
    if (!this.sessionState) return;

    this.isInBackground = true;
    this.sessionState.backgroundTime = new Date();
    
    // Switch to background timeout (shorter)
    this.clearTimeoutTimers();
    this.scheduleBackgroundTimeout();
    
    this.saveSessionState();
    
    logger.info('📱 App went to background, using background timeout');
  }

  private handleAppComingToForeground(): void {
    if (!this.sessionState) return;

    const now = new Date();
    this.isInBackground = false;
    
    if (this.sessionState.backgroundTime) {
      const backgroundDuration = now.getTime() - this.sessionState.backgroundTime.getTime();
      const backgroundMinutes = backgroundDuration / (60 * 1000);
      
      logger.info(`📱 App returned from background after ${Math.round(backgroundMinutes)} minutes`);
      
      // Check if session expired while in background
      if (backgroundMinutes > SESSION_CONFIG.BACKGROUND_TIMEOUT_MINUTES) {
        logger.info('⏰ Session expired while in background');
        this.handleSessionTimeout();
        return;
      }
    }

    this.sessionState.backgroundTime = null;
    
    // Resume normal timeout monitoring
    this.clearTimeoutTimers();
    this.scheduleTimeoutWarning();
    this.scheduleSessionTimeout();
    
    // Record activity
    this.recordActivity();
    
    logger.info('📱 App returned to foreground, resumed normal timeout');
  }

  private startActivityMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }

    this.activityTimer = setInterval(() => {
      this.checkSessionActivity();
    }, SESSION_CONFIG.ACTIVITY_CHECK_INTERVAL_MS);

    // Schedule initial timeout warning and final timeout
    this.scheduleTimeoutWarning();
    this.scheduleSessionTimeout();
  }

  private checkSessionActivity(): void {
    if (!this.sessionState || !this.sessionState.isActive) return;

    const timeRemaining = this.getTimeRemaining();
    
    if (timeRemaining <= 0) {
      this.handleSessionTimeout();
    } else if (timeRemaining <= SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MINUTES && 
               !this.sessionState.inactivityWarningShown) {
      this.handleSessionWarning(timeRemaining);
    }
  }

  private scheduleTimeoutWarning(): void {
    if (!this.sessionState) return;

    const warningTime = new Date(
      this.sessionState.lastActivity.getTime() + 
      (SESSION_CONFIG.TIMEOUT_MINUTES - SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MINUTES) * 60 * 1000
    );

    const now = new Date();
    const timeToWarning = warningTime.getTime() - now.getTime();

    if (timeToWarning > 0) {
      this.warningTimer = setTimeout(() => {
        const timeRemaining = this.getTimeRemaining();
        if (timeRemaining > 0 && timeRemaining <= SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MINUTES) {
          this.handleSessionWarning(timeRemaining);
        }
      }, timeToWarning);
    }
  }

  private scheduleSessionTimeout(): void {
    if (!this.sessionState) return;

    const timeoutTime = new Date(
      this.sessionState.lastActivity.getTime() + 
      SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000
    );

    const now = new Date();
    const timeToTimeout = timeoutTime.getTime() - now.getTime();

    if (timeToTimeout > 0) {
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, timeToTimeout);
    }
  }

  private scheduleBackgroundTimeout(): void {
    if (!this.sessionState) return;

    const timeoutTime = new Date(
      Date.now() + SESSION_CONFIG.BACKGROUND_TIMEOUT_MINUTES * 60 * 1000
    );

    const timeToTimeout = timeoutTime.getTime() - Date.now();

    if (timeToTimeout > 0) {
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, timeToTimeout);
    }
  }

  private handleSessionWarning(minutesRemaining: number): void {
    if (!this.sessionState) return;

    logger.info(`⚠️ Session warning: ${minutesRemaining} minutes remaining`);
    
    this.sessionState.warningTime = new Date();
    this.sessionState.inactivityWarningShown = true;
    
    // Haptic feedback if enabled
    if (SESSION_CONFIG.HAPTIC_FEEDBACK_ON_WARNING) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    // Notify callback
    if (this.onSessionWarning) {
      this.onSessionWarning(minutesRemaining);
    }
    
    this.saveSessionState();
  }

  private handleSessionTimeout(): void {
    logger.info('⏰ Session has timed out');
    
    if (this.sessionState) {
      this.sessionState.isActive = false;
    }
    
    // Clear all timers
    this.clearAllTimers();
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    // Notify callback
    if (this.onSessionTimeout) {
      this.onSessionTimeout();
    }
    
    this.saveSessionState();
  }

  private clearTimeoutTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private clearAllTimers(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    
    this.clearTimeoutTimers();
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up Session Timeout Service...');
      
      this.clearAllTimers();
      
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      await this.endSession();
      
      logger.info('✅ Session Timeout Service cleaned up');
    } catch (error) {
      logger.error('❌ Error during cleanup:', error);
    }
  }
}

export const sessionTimeoutService = new SessionTimeoutService();
export default sessionTimeoutService; 