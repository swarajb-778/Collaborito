import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';

const logger = createLogger('HapticFeedbackService');

// Haptic feedback types and patterns
export enum HapticType {
  // Basic feedback
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  
  // Notification feedback
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  
  // Custom patterns
  BUTTON_PRESS = 'button_press',
  SELECTION = 'selection',
  SCROLL_EDGE = 'scroll_edge',
  PULL_REFRESH = 'pull_refresh',
  SWIPE_ACTION = 'swipe_action',
  LONG_PRESS = 'long_press',
  KEYBOARD_TAP = 'keyboard_tap',
  TOGGLE_SWITCH = 'toggle_switch',
  SLIDER_TICK = 'slider_tick',
  PAGE_TURN = 'page_turn',
  MODAL_PRESENT = 'modal_present',
  MODAL_DISMISS = 'modal_dismiss',
  AUTHENTICATION_SUCCESS = 'auth_success',
  AUTHENTICATION_FAILURE = 'auth_failure',
  BIOMETRIC_PROMPT = 'biometric_prompt',
  NETWORK_RECONNECT = 'network_reconnect',
  SYNC_COMPLETE = 'sync_complete',
  FORM_VALIDATION_ERROR = 'form_error',
  COPY_TO_CLIPBOARD = 'copy_clipboard',
  SCREENSHOT_TAKEN = 'screenshot',
  HEARTBEAT = 'heartbeat',
  TIMER_TICK = 'timer_tick',
  COUNTDOWN_END = 'countdown_end',
}

// Haptic intensity levels
export enum HapticIntensity {
  NONE = 0,
  SUBTLE = 0.3,
  LIGHT = 0.5,
  MEDIUM = 0.7,
  STRONG = 1.0,
}

// Haptic pattern configuration
interface HapticPattern {
  type: HapticType;
  intensity: HapticIntensity;
  duration?: number; // milliseconds
  pattern?: number[]; // Custom vibration pattern for Android
  delay?: number; // Delay before playing
  repeat?: number; // Number of repetitions
  accessibility?: boolean; // Whether to respect accessibility settings
}

// Haptic service configuration
interface HapticConfig {
  enabled: boolean;
  respectAccessibilitySettings: boolean;
  respectBatteryLevel: boolean;
  batteryThreshold: number; // Percentage below which haptics are reduced
  intensityScale: number; // Global intensity multiplier
  enableCustomPatterns: boolean;
  enableVibrationFallback: boolean; // Use Vibration API if Haptics unavailable
}

class HapticFeedbackService {
  private static instance: HapticFeedbackService;
  private config: HapticConfig = {
    enabled: true,
    respectAccessibilitySettings: true,
    respectBatteryLevel: true,
    batteryThreshold: 20,
    intensityScale: 1.0,
    enableCustomPatterns: true,
    enableVibrationFallback: true,
  };
  private isHapticsSupported: boolean = false;
  private lastHapticTime: number = 0;
  private hapticThrottleMs: number = 50; // Minimum time between haptics

  // Pre-defined haptic patterns
  private patterns: Map<HapticType, HapticPattern> = new Map();

  public static getInstance(): HapticFeedbackService {
    if (!HapticFeedbackService.instance) {
      HapticFeedbackService.instance = new HapticFeedbackService();
    }
    return HapticFeedbackService.instance;
  }

  // Initialize haptic feedback service
  public async initialize(): Promise<void> {
    try {
      logger.info('📳 Initializing haptic feedback service...');

      // Check haptic support
      await this.checkHapticSupport();

      // Initialize haptic patterns
      this.initializePatterns();

      logger.info('✅ Haptic feedback service initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing haptic feedback service:', error);
      throw error;
    }
  }

  // Check if haptics are supported on the device
  private async checkHapticSupport(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // On iOS, expo-haptics should be available
        this.isHapticsSupported = true;
      } else if (Platform.OS === 'android') {
        // On Android, check if device has vibrator
        this.isHapticsSupported = true; // Assume true, will fallback to Vibration API
      }

      logger.info(`📳 Haptic support: ${this.isHapticsSupported ? 'Yes' : 'No'}`);
    } catch (error) {
      logger.error('❌ Error checking haptic support:', error);
      this.isHapticsSupported = false;
    }
  }

  // Initialize pre-defined haptic patterns
  private initializePatterns(): void {
    // Basic patterns
    this.patterns.set(HapticType.LIGHT, {
      type: HapticType.LIGHT,
      intensity: HapticIntensity.LIGHT,
      accessibility: true,
    });

    this.patterns.set(HapticType.MEDIUM, {
      type: HapticType.MEDIUM,
      intensity: HapticIntensity.MEDIUM,
      accessibility: true,
    });

    this.patterns.set(HapticType.HEAVY, {
      type: HapticType.HEAVY,
      intensity: HapticIntensity.STRONG,
      accessibility: true,
    });

    // Notification patterns
    this.patterns.set(HapticType.SUCCESS, {
      type: HapticType.SUCCESS,
      intensity: HapticIntensity.MEDIUM,
      accessibility: true,
    });

    this.patterns.set(HapticType.WARNING, {
      type: HapticType.WARNING,
      intensity: HapticIntensity.MEDIUM,
      pattern: [0, 100, 50, 100], // Android pattern
      accessibility: true,
    });

    this.patterns.set(HapticType.ERROR, {
      type: HapticType.ERROR,
      intensity: HapticIntensity.STRONG,
      pattern: [0, 100, 50, 100, 50, 100], // Android pattern
      accessibility: true,
    });

    // UI interaction patterns
    this.patterns.set(HapticType.BUTTON_PRESS, {
      type: HapticType.BUTTON_PRESS,
      intensity: HapticIntensity.LIGHT,
      accessibility: false,
    });

    this.patterns.set(HapticType.SELECTION, {
      type: HapticType.SELECTION,
      intensity: HapticIntensity.SUBTLE,
      accessibility: false,
    });

    this.patterns.set(HapticType.LONG_PRESS, {
      type: HapticType.LONG_PRESS,
      intensity: HapticIntensity.MEDIUM,
      duration: 200,
      accessibility: true,
    });

    this.patterns.set(HapticType.TOGGLE_SWITCH, {
      type: HapticType.TOGGLE_SWITCH,
      intensity: HapticIntensity.LIGHT,
      accessibility: false,
    });

    // Authentication patterns
    this.patterns.set(HapticType.AUTHENTICATION_SUCCESS, {
      type: HapticType.AUTHENTICATION_SUCCESS,
      intensity: HapticIntensity.MEDIUM,
      pattern: [0, 50, 25, 50], // Short success pattern
      accessibility: true,
    });

    this.patterns.set(HapticType.AUTHENTICATION_FAILURE, {
      type: HapticType.AUTHENTICATION_FAILURE,
      intensity: HapticIntensity.STRONG,
      pattern: [0, 100, 50, 100, 50, 100], // Triple buzz for failure
      accessibility: true,
    });

    this.patterns.set(HapticType.BIOMETRIC_PROMPT, {
      type: HapticType.BIOMETRIC_PROMPT,
      intensity: HapticIntensity.LIGHT,
      accessibility: true,
    });

    // Special patterns
    this.patterns.set(HapticType.HEARTBEAT, {
      type: HapticType.HEARTBEAT,
      intensity: HapticIntensity.SUBTLE,
      pattern: [0, 100, 100, 100], // Heartbeat rhythm
      repeat: 2,
      accessibility: false,
    });

    this.patterns.set(HapticType.TIMER_TICK, {
      type: HapticType.TIMER_TICK,
      intensity: HapticIntensity.SUBTLE,
      accessibility: false,
    });

    this.patterns.set(HapticType.SYNC_COMPLETE, {
      type: HapticType.SYNC_COMPLETE,
      intensity: HapticIntensity.LIGHT,
      pattern: [0, 50, 25, 50, 25, 50], // Three quick pulses
      accessibility: true,
    });

    logger.info(`📳 Initialized ${this.patterns.size} haptic patterns`);
  }

  // Play haptic feedback
  public async play(
    type: HapticType,
    options?: {
      intensity?: HapticIntensity;
      respectAccessibility?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    try {
      // Check if haptics are enabled
      if (!this.config.enabled && !options?.force) {
        return;
      }

      // Check if device supports haptics
      if (!this.isHapticsSupported && !this.config.enableVibrationFallback) {
        return;
      }

      // Throttle haptic feedback to prevent spam
      const now = Date.now();
      if (now - this.lastHapticTime < this.hapticThrottleMs && !options?.force) {
        return;
      }
      this.lastHapticTime = now;

      // Get pattern configuration
      const pattern = this.patterns.get(type);
      if (!pattern) {
        logger.warn(`⚠️ Unknown haptic type: ${type}`);
        return;
      }

      // Check accessibility settings
      if (options?.respectAccessibility !== false && pattern.accessibility && this.config.respectAccessibilitySettings) {
        // Here you could check actual accessibility settings
        // For now, we'll proceed with haptics
      }

      // Calculate effective intensity
      const baseIntensity = options?.intensity || pattern.intensity;
      const effectiveIntensity = Math.min(1.0, baseIntensity * this.config.intensityScale);

      // Play haptic feedback
      await this.playHapticPattern(pattern, effectiveIntensity);

      logger.info(`📳 Played haptic: ${type} (intensity: ${effectiveIntensity})`);
    } catch (error) {
      logger.error(`❌ Error playing haptic ${type}:`, error);
      
      // Fallback to basic vibration if haptics fail
      if (this.config.enableVibrationFallback) {
        this.playVibrationFallback(type);
      }
    }
  }

  // Play the actual haptic pattern
  private async playHapticPattern(pattern: HapticPattern, intensity: number): Promise<void> {
    try {
      // Add delay if specified
      if (pattern.delay && pattern.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, pattern.delay));
      }

      // Repeat the pattern if specified
      const repeatCount = pattern.repeat || 1;
      
      for (let i = 0; i < repeatCount; i++) {
        await this.executeSingleHaptic(pattern, intensity);
        
        // Add small delay between repetitions
        if (i < repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      logger.error('❌ Error playing haptic pattern:', error);
      throw error;
    }
  }

  // Execute a single haptic feedback
  private async executeSingleHaptic(pattern: HapticPattern, intensity: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await this.playIOSHaptic(pattern, intensity);
      } else if (Platform.OS === 'android') {
        await this.playAndroidHaptic(pattern, intensity);
      }
    } catch (error) {
      logger.error('❌ Error executing haptic:', error);
      throw error;
    }
  }

  // Play iOS haptic feedback
  private async playIOSHaptic(pattern: HapticPattern, intensity: number): Promise<void> {
    try {
      switch (pattern.type) {
        case HapticType.LIGHT:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case HapticType.MEDIUM:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case HapticType.HEAVY:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case HapticType.SUCCESS:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case HapticType.WARNING:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case HapticType.ERROR:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case HapticType.SELECTION:
          await Haptics.selectionAsync();
          break;
        default:
          // For custom patterns, use appropriate impact feedback
          if (intensity >= HapticIntensity.STRONG) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } else if (intensity >= HapticIntensity.MEDIUM) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          break;
      }
    } catch (error) {
      logger.error('❌ Error playing iOS haptic:', error);
      throw error;
    }
  }

  // Play Android haptic feedback
  private async playAndroidHaptic(pattern: HapticPattern, intensity: number): Promise<void> {
    try {
      if (pattern.pattern && pattern.pattern.length > 0) {
        // Use custom vibration pattern
        Vibration.vibrate(pattern.pattern);
      } else {
        // Use duration-based vibration
        const duration = this.getVibrationDuration(pattern.type, intensity);
        Vibration.vibrate(duration);
      }
    } catch (error) {
      logger.error('❌ Error playing Android haptic:', error);
      throw error;
    }
  }

  // Get vibration duration for different haptic types
  private getVibrationDuration(type: HapticType, intensity: number): number {
    const baseDuration = 50; // Base duration in milliseconds
    const intensityMultiplier = intensity;
    
    switch (type) {
      case HapticType.LIGHT:
      case HapticType.SELECTION:
        return Math.round(baseDuration * 0.5 * intensityMultiplier);
      case HapticType.MEDIUM:
        return Math.round(baseDuration * intensityMultiplier);
      case HapticType.HEAVY:
      case HapticType.ERROR:
        return Math.round(baseDuration * 1.5 * intensityMultiplier);
      case HapticType.SUCCESS:
        return Math.round(baseDuration * 0.8 * intensityMultiplier);
      case HapticType.WARNING:
        return Math.round(baseDuration * 1.2 * intensityMultiplier);
      default:
        return Math.round(baseDuration * intensityMultiplier);
    }
  }

  // Vibration fallback for unsupported devices
  private playVibrationFallback(type: HapticType): void {
    try {
      const pattern = this.patterns.get(type);
      if (!pattern) return;

      if (pattern.pattern && pattern.pattern.length > 0) {
        Vibration.vibrate(pattern.pattern);
      } else {
        const duration = this.getVibrationDuration(type, pattern.intensity);
        Vibration.vibrate(duration);
      }

      logger.info(`📳 Vibration fallback for: ${type}`);
    } catch (error) {
      logger.error('❌ Error in vibration fallback:', error);
    }
  }

  // Convenience methods for common haptic types
  public async light(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.LIGHT, options);
  }

  public async medium(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.MEDIUM, options);
  }

  public async heavy(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.HEAVY, options);
  }

  public async success(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.SUCCESS, options);
  }

  public async warning(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.WARNING, options);
  }

  public async error(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.ERROR, options);
  }

  public async selection(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.SELECTION, options);
  }

  public async buttonPress(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.BUTTON_PRESS, options);
  }

  public async authSuccess(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.AUTHENTICATION_SUCCESS, options);
  }

  public async authFailure(options?: { force?: boolean }): Promise<void> {
    await this.play(HapticType.AUTHENTICATION_FAILURE, options);
  }

  // Configuration methods
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    logger.info(`📳 Haptic feedback ${enabled ? 'enabled' : 'disabled'}`);
  }

  public setIntensityScale(scale: number): void {
    this.config.intensityScale = Math.max(0, Math.min(1, scale));
    logger.info(`📳 Haptic intensity scale set to: ${this.config.intensityScale}`);
  }

  public setAccessibilityRespect(respect: boolean): void {
    this.config.respectAccessibilitySettings = respect;
    logger.info(`📳 Accessibility respect ${respect ? 'enabled' : 'disabled'}`);
  }

  // Custom pattern registration
  public registerCustomPattern(type: HapticType, pattern: Omit<HapticPattern, 'type'>): void {
    this.patterns.set(type, { ...pattern, type });
    logger.info(`📳 Registered custom pattern: ${type}`);
  }

  // Status getters
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public isSupported(): boolean {
    return this.isHapticsSupported;
  }

  public getConfig(): HapticConfig {
    return { ...this.config };
  }

  // Cleanup
  public cleanup(): void {
    try {
      // Cancel any pending vibrations
      Vibration.cancel();
      logger.info('🧹 Haptic feedback service cleaned up');
    } catch (error) {
      logger.error('❌ Error cleaning up haptic feedback service:', error);
    }
  }
}

// Export singleton instance
export const hapticFeedbackService = HapticFeedbackService.getInstance();

// Export React hook
export const useHapticFeedback = () => {
  return {
    play: hapticFeedbackService.play.bind(hapticFeedbackService),
    light: hapticFeedbackService.light.bind(hapticFeedbackService),
    medium: hapticFeedbackService.medium.bind(hapticFeedbackService),
    heavy: hapticFeedbackService.heavy.bind(hapticFeedbackService),
    success: hapticFeedbackService.success.bind(hapticFeedbackService),
    warning: hapticFeedbackService.warning.bind(hapticFeedbackService),
    error: hapticFeedbackService.error.bind(hapticFeedbackService),
    selection: hapticFeedbackService.selection.bind(hapticFeedbackService),
    buttonPress: hapticFeedbackService.buttonPress.bind(hapticFeedbackService),
    authSuccess: hapticFeedbackService.authSuccess.bind(hapticFeedbackService),
    authFailure: hapticFeedbackService.authFailure.bind(hapticFeedbackService),
    isEnabled: hapticFeedbackService.isEnabled.bind(hapticFeedbackService),
    isSupported: hapticFeedbackService.isSupported.bind(hapticFeedbackService),
    setEnabled: hapticFeedbackService.setEnabled.bind(hapticFeedbackService),
    setIntensityScale: hapticFeedbackService.setIntensityScale.bind(hapticFeedbackService),
  };
};

export default hapticFeedbackService; 