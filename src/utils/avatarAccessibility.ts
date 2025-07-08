import { AccessibilityInfo, Platform, AccessibilityActionInfo } from 'react-native';
import { createLogger } from './logger';

const logger = createLogger('AvatarAccessibility');

export interface AvatarAccessibilityProps {
  // Basic accessibility props
  accessible: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: 'image' | 'button' | 'imagebutton';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
  };
  
  // Advanced accessibility props
  accessibilityActions?: AccessibilityActionInfo[];
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  
  // Platform-specific props
  accessibilityTraits?: string | string[];
  accessibilityComponentType?: string;
  accessibilityLabelledBy?: string;
  accessibilityDescribedBy?: string;
  
  // Custom accessibility props
  accessibilityIgnoresInvertColors?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

export interface AvatarAccessibilityConfig {
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableVoiceOver: boolean;
  enableTalkBack: boolean;
  enableReduceMotion: boolean;
  enableLargeText: boolean;
  enableBoldText: boolean;
  enableReduceTransparency: boolean;
  announceUploads: boolean;
  announceErrors: boolean;
  announceCompletions: boolean;
}

export interface AccessibilityAnnouncement {
  message: string;
  priority: 'low' | 'medium' | 'high';
  type: 'success' | 'error' | 'info' | 'warning';
  delay?: number;
}

class AvatarAccessibilityService {
  private static instance: AvatarAccessibilityService;
  private config: AvatarAccessibilityConfig;
  private isScreenReaderEnabled = false;
  private isHighContrastEnabled = false;
  private isReduceMotionEnabled = false;
  private isLargeTextEnabled = false;
  private isBoldTextEnabled = false;
  private isReduceTransparencyEnabled = false;

  private constructor() {
    this.config = {
      enableScreenReader: true,
      enableHighContrast: true,
      enableVoiceOver: Platform.OS === 'ios',
      enableTalkBack: Platform.OS === 'android',
      enableReduceMotion: true,
      enableLargeText: true,
      enableBoldText: true,
      enableReduceTransparency: true,
      announceUploads: true,
      announceErrors: true,
      announceCompletions: true,
    };

    this.initializeAccessibility();
  }

  static getInstance(): AvatarAccessibilityService {
    if (!AvatarAccessibilityService.instance) {
      AvatarAccessibilityService.instance = new AvatarAccessibilityService();
    }
    return AvatarAccessibilityService.instance;
  }

  private async initializeAccessibility(): Promise<void> {
    try {
      // Check if screen reader is enabled
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check if high contrast is enabled (iOS only)
      if (Platform.OS === 'ios') {
        this.isHighContrastEnabled = await AccessibilityInfo.isHighTextContrastEnabled?.() || false;
      }

      // Check if reduce motion is enabled
      this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled?.() || false;

      // Check if bold text is enabled (iOS only)  
      if (Platform.OS === 'ios') {
        this.isLargeTextEnabled = await AccessibilityInfo.isBoldTextEnabled?.() || false;
      }

      // Check if bold text is enabled (iOS only)
      if (Platform.OS === 'ios') {
        this.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled?.() || false;
      }

      // Check if reduce transparency is enabled (iOS only)
      if (Platform.OS === 'ios') {
        this.isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled?.() || false;
      }

      // Set up event listeners for accessibility changes
      this.setupAccessibilityListeners();

      logger.info('Accessibility initialized', {
        screenReader: this.isScreenReaderEnabled,
        highContrast: this.isHighContrastEnabled,
        reduceMotion: this.isReduceMotionEnabled,
        largeText: this.isLargeTextEnabled,
        boldText: this.isBoldTextEnabled,
        reduceTransparency: this.isReduceTransparencyEnabled,
      });
    } catch (error) {
      logger.error('Failed to initialize accessibility', error);
    }
  }

  private setupAccessibilityListeners(): void {
    // Listen for screen reader state changes
    AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled: boolean) => {
      this.isScreenReaderEnabled = isEnabled;
      this.onAccessibilityChange('screenReader', isEnabled);
    });

    // Listen for accessibility changes (using supported events only)
    if (Platform.OS === 'ios' && AccessibilityInfo.addEventListener) {
      // Listen for reduce motion changes (supported event)
      try {
        AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled: boolean) => {
          this.isReduceMotionEnabled = isEnabled;
          this.onAccessibilityChange('reduceMotion', isEnabled);
        });
      } catch (error) {
        logger.warn('reduceMotionChanged event not supported:', error);
      }

      // Listen for bold text changes (supported event)
      try {
        AccessibilityInfo.addEventListener('boldTextChanged', (isEnabled: boolean) => {
          this.isBoldTextEnabled = isEnabled;
          this.onAccessibilityChange('boldText', isEnabled);
        });
      } catch (error) {
        logger.warn('boldTextChanged event not supported:', error);
      }

      // Listen for reduce transparency changes (supported event)
      try {
        AccessibilityInfo.addEventListener('reduceTransparencyChanged', (isEnabled: boolean) => {
          this.isReduceTransparencyEnabled = isEnabled;
          this.onAccessibilityChange('reduceTransparency', isEnabled);
        });
      } catch (error) {
        logger.warn('reduceTransparencyChanged event not supported:', error);
      }

      // Note: highContrastChanged and largeTextChanged events are not available in current RN versions
      // These states are checked synchronously in initializeAccessibility() method instead
    }
  }

  private onAccessibilityChange(type: string, isEnabled: boolean): void {
    logger.info(`Accessibility setting changed: ${type} = ${isEnabled}`);
    
    // Announce accessibility changes if screen reader is enabled
    if (this.isScreenReaderEnabled && this.config.announceCompletions) {
      this.announceToScreenReader({
        message: `${type} ${isEnabled ? 'enabled' : 'disabled'}`,
        priority: 'medium',
        type: 'info',
      });
    }
  }

  // Avatar-specific accessibility methods
  generateAvatarAccessibilityProps(
    userName: string,
    userRole?: string,
    isOnline?: boolean,
    isClickable?: boolean,
    hasImage?: boolean
  ): AvatarAccessibilityProps {
    const baseLabel = this.generateAccessibilityLabel(userName, userRole, isOnline, hasImage);
    const hint = this.generateAccessibilityHint(isClickable, hasImage);
    const role = this.determineAccessibilityRole(isClickable, hasImage);

    const props: AvatarAccessibilityProps = {
      accessible: true,
      accessibilityLabel: baseLabel,
      accessibilityHint: hint,
      accessibilityRole: role,
      accessibilityState: {
        disabled: false,
        selected: false,
      },
      importantForAccessibility: 'yes',
    };

    // Add accessibility actions if clickable
    if (isClickable) {
      props.accessibilityActions = [
        { name: 'activate', label: 'View profile' },
        { name: 'longpress', label: 'Show user options' },
      ];
    }

    // Add high contrast support
    if (this.isHighContrastEnabled) {
      props.accessibilityIgnoresInvertColors = false;
    }

    // Add platform-specific props
    if (Platform.OS === 'ios') {
      props.accessibilityTraits = isClickable ? ['button', 'image'] : ['image'];
    } else {
      props.accessibilityComponentType = isClickable ? 'button' : 'image';
    }

    return props;
  }

  private generateAccessibilityLabel(
    userName: string,
    userRole?: string,
    isOnline?: boolean,
    hasImage?: boolean
  ): string {
    let label = '';

    if (hasImage) {
      label += `Profile picture of ${userName}`;
    } else {
      label += `Profile placeholder for ${userName}`;
    }

    if (userRole) {
      label += `, ${userRole}`;
    }

    if (isOnline !== undefined) {
      label += `, ${isOnline ? 'online' : 'offline'}`;
    }

    return label;
  }

  private generateAccessibilityHint(isClickable?: boolean, hasImage?: boolean): string {
    if (isClickable) {
      return hasImage 
        ? 'Double tap to view profile details' 
        : 'Double tap to view profile or add profile picture';
    }
    return hasImage 
      ? 'User profile picture' 
      : 'User profile placeholder';
  }

  private determineAccessibilityRole(isClickable?: boolean, hasImage?: boolean): 'image' | 'button' | 'imagebutton' {
    if (isClickable && hasImage) {
      return 'imagebutton';
    }
    if (isClickable) {
      return 'button';
    }
    return 'image';
  }

  // Upload accessibility
  generateUploadAccessibilityProps(
    uploadState: 'idle' | 'uploading' | 'success' | 'error',
    progress?: number
  ): AvatarAccessibilityProps {
    const props: AvatarAccessibilityProps = {
      accessible: true,
      accessibilityLabel: this.generateUploadAccessibilityLabel(uploadState, progress),
      accessibilityRole: 'button',
      accessibilityState: {
        disabled: uploadState === 'uploading',
      },
      importantForAccessibility: 'yes',
    };

    // Add progress information for uploading state
    if (uploadState === 'uploading' && progress !== undefined) {
      props.accessibilityValue = {
        min: 0,
        max: 100,
        now: progress,
        text: `${Math.round(progress)}% uploaded`,
      };
      props.accessibilityLiveRegion = 'polite';
    }

    // Add accessibility actions
    if (uploadState === 'idle') {
      props.accessibilityActions = [
        { name: 'activate', label: 'Select new profile picture' },
      ];
    } else if (uploadState === 'error') {
      props.accessibilityActions = [
        { name: 'activate', label: 'Retry upload' },
      ];
    }

    return props;
  }

  private generateUploadAccessibilityLabel(
    uploadState: 'idle' | 'uploading' | 'success' | 'error',
    progress?: number
  ): string {
    switch (uploadState) {
      case 'idle':
        return 'Upload profile picture';
      case 'uploading':
        return `Uploading profile picture${progress ? `, ${Math.round(progress)}% complete` : ''}`;
      case 'success':
        return 'Profile picture uploaded successfully';
      case 'error':
        return 'Profile picture upload failed';
      default:
        return 'Profile picture upload';
    }
  }

  // Screen reader announcements
  async announceToScreenReader(announcement: AccessibilityAnnouncement): Promise<void> {
    if (!this.isScreenReaderEnabled || !this.shouldAnnounce(announcement.type)) {
      return;
    }

    try {
      // Add delay if specified
      if (announcement.delay) {
        await new Promise(resolve => setTimeout(resolve, announcement.delay));
      }

      // Make the announcement
      await AccessibilityInfo.announceForAccessibility(announcement.message);

      logger.info('Screen reader announcement made', {
        message: announcement.message,
        priority: announcement.priority,
        type: announcement.type,
      });
    } catch (error) {
      logger.error('Failed to announce to screen reader', error);
    }
  }

  private shouldAnnounce(type: string): boolean {
    switch (type) {
      case 'success':
        return this.config.announceCompletions;
      case 'error':
        return this.config.announceErrors;
      case 'info':
        return this.config.announceUploads;
      case 'warning':
        return this.config.announceErrors;
      default:
        return true;
    }
  }

  // Avatar upload announcements
  async announceUploadStarted(userName: string): Promise<void> {
    await this.announceToScreenReader({
      message: `Uploading profile picture for ${userName}`,
      priority: 'medium',
      type: 'info',
    });
  }

  async announceUploadProgress(progress: number): Promise<void> {
    // Only announce at 25%, 50%, 75% to avoid overwhelming
    if (progress % 25 === 0) {
      await this.announceToScreenReader({
        message: `Upload ${progress}% complete`,
        priority: 'low',
        type: 'info',
      });
    }
  }

  async announceUploadSuccess(userName: string): Promise<void> {
    await this.announceToScreenReader({
      message: `Profile picture uploaded successfully for ${userName}`,
      priority: 'high',
      type: 'success',
      delay: 500,
    });
  }

  async announceUploadError(error: string): Promise<void> {
    await this.announceToScreenReader({
      message: `Profile picture upload failed: ${error}`,
      priority: 'high',
      type: 'error',
      delay: 500,
    });
  }

  // Accessibility state getters
  getAccessibilityState(): {
    screenReader: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
    largeText: boolean;
    boldText: boolean;
    reduceTransparency: boolean;
  } {
    return {
      screenReader: this.isScreenReaderEnabled,
      highContrast: this.isHighContrastEnabled,
      reduceMotion: this.isReduceMotionEnabled,
      largeText: this.isLargeTextEnabled,
      boldText: this.isBoldTextEnabled,
      reduceTransparency: this.isReduceTransparencyEnabled,
    };
  }

  isScreenReaderActive(): boolean {
    return this.isScreenReaderEnabled;
  }

  isHighContrastActive(): boolean {
    return this.isHighContrastEnabled;
  }

  isReduceMotionActive(): boolean {
    return this.isReduceMotionEnabled;
  }

  isLargeTextActive(): boolean {
    return this.isLargeTextEnabled;
  }

  isBoldTextActive(): boolean {
    return this.isBoldTextEnabled;
  }

  isReduceTransparencyActive(): boolean {
    return this.isReduceTransparencyEnabled;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<AvatarAccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Avatar accessibility config updated', newConfig);
  }

  getConfig(): AvatarAccessibilityConfig {
    return { ...this.config };
  }

  // Utility methods for components
  getAccessibilityFontSize(baseSize: number): number {
    if (this.isLargeTextEnabled) {
      return Math.min(baseSize * 1.3, baseSize + 4); // Increase by 30% or 4pt max
    }
    return baseSize;
  }

  getAccessibilityFontWeight(baseWeight: string): string {
    if (this.isBoldTextEnabled && baseWeight === 'normal') {
      return 'bold';
    }
    if (this.isBoldTextEnabled && baseWeight === '400') {
      return '700';
    }
    return baseWeight;
  }

  getAccessibilityOpacity(baseOpacity: number): number {
    if (this.isReduceTransparencyEnabled) {
      return Math.min(baseOpacity * 1.2, 1); // Reduce transparency
    }
    return baseOpacity;
  }

  shouldReduceAnimations(): boolean {
    return this.isReduceMotionEnabled;
  }

  getHighContrastColors(): {
    background: string;
    text: string;
    border: string;
    accent: string;
  } {
    if (this.isHighContrastEnabled) {
      return {
        background: '#000000',
        text: '#FFFFFF',
        border: '#FFFFFF',
        accent: '#FFFF00',
      };
    }
    return {
      background: '#FFFFFF',
      text: '#000000',
      border: '#E0E0E0',
      accent: '#007AFF',
    };
  }
}

export default AvatarAccessibilityService; 