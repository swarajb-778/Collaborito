import { AccessibilityInfo, Platform, findNodeHandle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';

const logger = createLogger('AccessibilityService');

// Accessibility announcement types
export type AnnouncementType = 'polite' | 'assertive';

// Focus management types
export interface FocusableElement {
  ref: React.RefObject<any>;
  accessibilityLabel?: string;
  priority?: number;
}

// Accessibility configuration
interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
  fontScaleEnabled: boolean;
  voiceControlEnabled: boolean;
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private config: AccessibilityConfig = {
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    highContrastEnabled: false,
    fontScaleEnabled: true,
    voiceControlEnabled: false,
  };
  private focusStack: FocusableElement[] = [];
  private announcementQueue: Array<{ message: string; type: AnnouncementType }> = [];
  private isProcessingAnnouncements = false;

  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  // Initialize accessibility service
  public async initialize(): Promise<void> {
    try {
      logger.info('♿ Initializing accessibility service...');

      // Check initial accessibility states
      await this.checkAccessibilityStates();

      // Set up listeners for accessibility changes
      this.setupAccessibilityListeners();

      logger.info('✅ Accessibility service initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing accessibility service:', error);
      throw error;
    }
  }

  // Check current accessibility states
  private async checkAccessibilityStates(): Promise<void> {
    try {
      const [
        isScreenReaderEnabled,
        isReduceMotionEnabled,
        isReduceTransparencyEnabled,
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled(),
        Platform.OS === 'ios' ? AccessibilityInfo.isReduceTransparencyEnabled() : Promise.resolve(false),
      ]);

      this.config = {
        ...this.config,
        screenReaderEnabled: isScreenReaderEnabled,
        reduceMotionEnabled: isReduceMotionEnabled,
        highContrastEnabled: isReduceTransparencyEnabled,
      };

      logger.info(`📱 Accessibility states - Screen Reader: ${isScreenReaderEnabled}, Reduce Motion: ${isReduceMotionEnabled}, High Contrast: ${isReduceTransparencyEnabled}`);
    } catch (error) {
      logger.error('❌ Error checking accessibility states:', error);
    }
  }

  // Set up accessibility change listeners
  private setupAccessibilityListeners(): void {
    try {
      // Screen reader state changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled) => {
        this.config.screenReaderEnabled = isEnabled;
        logger.info(`🔊 Screen reader ${isEnabled ? 'enabled' : 'disabled'}`);
        this.announceAccessibilityChange('Screen reader', isEnabled);
      });

      // Reduce motion changes
      AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
        this.config.reduceMotionEnabled = isEnabled;
        logger.info(`🎬 Reduce motion ${isEnabled ? 'enabled' : 'disabled'}`);
        this.announceAccessibilityChange('Reduce motion', isEnabled);
      });

      // Reduce transparency changes (iOS only)
      if (Platform.OS === 'ios') {
        AccessibilityInfo.addEventListener('reduceTransparencyChanged', (isEnabled) => {
          this.config.highContrastEnabled = isEnabled;
          logger.info(`🌗 High contrast ${isEnabled ? 'enabled' : 'disabled'}`);
          this.announceAccessibilityChange('High contrast', isEnabled);
        });
      }

      logger.info('👂 Accessibility listeners set up successfully');
    } catch (error) {
      logger.error('❌ Error setting up accessibility listeners:', error);
    }
  }

  // Announce accessibility feature changes
  private announceAccessibilityChange(feature: string, isEnabled: boolean): void {
    const message = `${feature} ${isEnabled ? 'enabled' : 'disabled'}`;
    this.announce(message, 'polite');
  }

  // Make accessibility announcements
  public announce(message: string, type: AnnouncementType = 'polite'): void {
    try {
      if (!this.config.screenReaderEnabled) {
        return;
      }

      // Add to announcement queue
      this.announcementQueue.push({ message, type });

      // Process queue if not already processing
      if (!this.isProcessingAnnouncements) {
        this.processAnnouncementQueue();
      }

      logger.info(`📢 Queued announcement: "${message}" (${type})`);
    } catch (error) {
      logger.error('❌ Error queuing announcement:', error);
    }
  }

  // Process announcement queue
  private async processAnnouncementQueue(): Promise<void> {
    this.isProcessingAnnouncements = true;

    try {
      while (this.announcementQueue.length > 0) {
        const announcement = this.announcementQueue.shift();
        if (announcement) {
          await this.makeAnnouncement(announcement.message, announcement.type);
          
          // Brief delay between announcements
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      logger.error('❌ Error processing announcement queue:', error);
    } finally {
      this.isProcessingAnnouncements = false;
    }
  }

  // Make individual announcement
  private async makeAnnouncement(message: string, type: AnnouncementType): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // Use iOS-specific announcement API
        AccessibilityInfo.announceForAccessibility(message);
      } else {
        // Use Android-specific announcement API
        AccessibilityInfo.announceForAccessibility(message);
      }

      // Add subtle haptic feedback for announcements
      if (type === 'assertive') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      logger.info(`📢 Made announcement: "${message}"`);
    } catch (error) {
      logger.error('❌ Error making announcement:', error);
    }
  }

  // Focus management
  public addToFocusStack(element: FocusableElement): void {
    try {
      // Remove if already exists
      this.focusStack = this.focusStack.filter(item => item.ref !== element.ref);
      
      // Add to stack (higher priority first)
      this.focusStack.push(element);
      this.focusStack.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      logger.info(`🎯 Added element to focus stack: ${element.accessibilityLabel || 'unnamed'}`);
    } catch (error) {
      logger.error('❌ Error adding to focus stack:', error);
    }
  }

  public removeFromFocusStack(elementRef: React.RefObject<any>): void {
    try {
      this.focusStack = this.focusStack.filter(item => item.ref !== elementRef);
      logger.info('🎯 Removed element from focus stack');
    } catch (error) {
      logger.error('❌ Error removing from focus stack:', error);
    }
  }

  public focusNext(): void {
    try {
      if (this.focusStack.length === 0) {
        logger.warn('⚠️ No focusable elements in stack');
        return;
      }

      const nextElement = this.focusStack[0];
      this.setFocus(nextElement.ref);
      
      if (nextElement.accessibilityLabel) {
        this.announce(`Focused on ${nextElement.accessibilityLabel}`, 'polite');
      }
    } catch (error) {
      logger.error('❌ Error focusing next element:', error);
    }
  }

  public setFocus(elementRef: React.RefObject<any>): void {
    try {
      if (!elementRef.current) {
        logger.warn('⚠️ Cannot focus null element');
        return;
      }

      const node = findNodeHandle(elementRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
        logger.info('🎯 Set accessibility focus');
      }
    } catch (error) {
      logger.error('❌ Error setting focus:', error);
    }
  }

  // Semantic helpers
  public getSemanticProps(role: string, label?: string, hint?: string) {
    const baseProps = {
      accessible: true,
      accessibilityRole: role as any,
      ...(label && { accessibilityLabel: label }),
      ...(hint && { accessibilityHint: hint }),
    };

    // Add additional props based on platform and settings
    if (this.config.screenReaderEnabled) {
      return {
        ...baseProps,
        importantForAccessibility: 'yes' as any,
      };
    }

    return baseProps;
  }

  public getButtonProps(label: string, hint?: string, disabled?: boolean) {
    return {
      ...this.getSemanticProps('button', label, hint),
      accessibilityState: { disabled: disabled || false },
    };
  }

  public getTextInputProps(label: string, placeholder?: string, secure?: boolean) {
    return {
      ...this.getSemanticProps('text', label),
      accessibilityValue: { text: placeholder || '' },
      ...(secure && { secureTextEntry: true }),
    };
  }

  public getHeaderProps(level: number, text: string) {
    return {
      ...this.getSemanticProps('header', text),
      accessibilityLevel: level,
    };
  }

  // Configuration getters
  public isScreenReaderEnabled(): boolean {
    return this.config.screenReaderEnabled;
  }

  public isReduceMotionEnabled(): boolean {
    return this.config.reduceMotionEnabled;
  }

  public isHighContrastEnabled(): boolean {
    return this.config.highContrastEnabled;
  }

  public isFontScaleEnabled(): boolean {
    return this.config.fontScaleEnabled;
  }

  // Font scaling helpers
  public getScaledFontSize(baseFontSize: number): number {
    try {
      // This would integrate with actual font scale settings
      // For now, return base size (can be enhanced with actual scaling)
      return baseFontSize;
    } catch (error) {
      logger.error('❌ Error getting scaled font size:', error);
      return baseFontSize;
    }
  }

  // High contrast helpers
  public getHighContrastColors(normalColors: any) {
    if (!this.config.highContrastEnabled) {
      return normalColors;
    }

    // Return high contrast versions of colors
    return {
      ...normalColors,
      text: '#000000',
      background: '#FFFFFF',
      border: '#000000',
      primary: '#0000FF',
      secondary: '#008000',
    };
  }

  // Motion helpers
  public shouldReduceMotion(): boolean {
    return this.config.reduceMotionEnabled;
  }

  public getAnimationDuration(normalDuration: number): number {
    return this.shouldReduceMotion() ? 0 : normalDuration;
  }

  // Cleanup
  public cleanup(): void {
    try {
      this.focusStack = [];
      this.announcementQueue = [];
      this.isProcessingAnnouncements = false;
      logger.info('🧹 Accessibility service cleaned up');
    } catch (error) {
      logger.error('❌ Error cleaning up accessibility service:', error);
    }
  }
}

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance();

// Export helper hooks for React components
export const useAccessibility = () => {
  return {
    announce: (message: string, type?: AnnouncementType) => accessibilityService.announce(message, type),
    getButtonProps: (label: string, hint?: string, disabled?: boolean) => 
      accessibilityService.getButtonProps(label, hint, disabled),
    getTextInputProps: (label: string, placeholder?: string, secure?: boolean) => 
      accessibilityService.getTextInputProps(label, placeholder, secure),
    getHeaderProps: (level: number, text: string) => 
      accessibilityService.getHeaderProps(level, text),
    isScreenReaderEnabled: () => accessibilityService.isScreenReaderEnabled(),
    isReduceMotionEnabled: () => accessibilityService.isReduceMotionEnabled(),
    isHighContrastEnabled: () => accessibilityService.isHighContrastEnabled(),
    shouldReduceMotion: () => accessibilityService.shouldReduceMotion(),
    getAnimationDuration: (duration: number) => accessibilityService.getAnimationDuration(duration),
  };
};

export default accessibilityService; 