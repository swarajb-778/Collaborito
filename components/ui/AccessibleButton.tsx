import React, { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from '../../src/services/AccessibilityService';
import { useTheme } from '../../src/contexts/ThemeContext';

export interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  autoFocus?: boolean;
  focusPriority?: number;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityHint,
  accessibilityLabel,
  style,
  textStyle,
  hapticFeedback = true,
  autoFocus = false,
  focusPriority = 0,
}) => {
  const buttonRef = useRef<any>(null);
  const { theme } = useTheme();
  const {
    getButtonProps,
    isReduceMotionEnabled,
    getAnimationDuration,
    announce,
  } = useAccessibility();

  // Auto-focus management
  useEffect(() => {
    if (autoFocus && buttonRef.current) {
      // Add slight delay to ensure proper mounting
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.focus?.();
        }
      }, 100);
    }
  }, [autoFocus]);

  // Handle button press with accessibility features
  const handlePress = async () => {
    try {
      if (disabled || loading) {
        // Announce why action cannot be performed
        if (disabled) {
          announce('Button is disabled', 'assertive');
        } else if (loading) {
          announce('Please wait, action in progress', 'polite');
        }
        return;
      }

      // Provide haptic feedback
      if (hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Announce button activation for screen readers
      announce(`${accessibilityLabel || title} activated`, 'polite');

      // Call the actual onPress handler
      onPress();
    } catch (error) {
      console.error('Error handling button press:', error);
    }
  };

  // Get accessibility props
  const accessibilityProps = getButtonProps(
    accessibilityLabel || title,
    accessibilityHint,
    disabled || loading
  );

  // Calculate styles
  const buttonStyles = getButtonStyles(theme, variant, size, disabled, loading);
  const textStyles = getTextStyles(theme, variant, size, disabled);

  // Animation duration based on accessibility settings
  const animationDuration = getAnimationDuration(150);

  return (
    <Pressable
      ref={buttonRef}
      onPress={handlePress}
      style={({ pressed }) => [
        buttonStyles.base,
        buttonStyles.variant,
        buttonStyles.size,
        pressed && !isReduceMotionEnabled() && buttonStyles.pressed,
        style,
      ]}
      {...accessibilityProps}
      android_ripple={{
        color: theme.colors.primary + '20',
        borderless: false,
      }}
    >
      {({ pressed }) => (
        <Text
          style={[
            textStyles.base,
            textStyles.variant,
            textStyles.size,
            pressed && !isReduceMotionEnabled() && textStyles.pressed,
            textStyle,
          ]}
        >
          {loading ? 'Loading...' : title}
        </Text>
      )}
    </Pressable>
  );
};

// Style calculation functions
function getButtonStyles(theme: any, variant: string, size: string, disabled: boolean, loading: boolean) {
  const base: ViewStyle = {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    opacity: disabled || loading ? 0.6 : 1,
  };

  const sizes: Record<string, ViewStyle> = {
    small: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      minHeight: 32,
    },
    medium: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 44, // Minimum touch target size for accessibility
    },
    large: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: 56,
    },
  };

  const variants: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    text: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  };

  const pressed: ViewStyle = {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  };

  return {
    base,
    size: sizes[size],
    variant: variants[variant],
    pressed,
  };
}

function getTextStyles(theme: any, variant: string, size: string, disabled: boolean) {
  const base: TextStyle = {
    fontFamily: theme.typography.fonts.medium,
    textAlign: 'center',
    includeFontPadding: false,
  };

  const sizes: Record<string, TextStyle> = {
    small: {
      fontSize: theme.typography.sizes.sm,
      lineHeight: theme.typography.lineHeights.sm,
    },
    medium: {
      fontSize: theme.typography.sizes.md,
      lineHeight: theme.typography.lineHeights.md,
    },
    large: {
      fontSize: theme.typography.sizes.lg,
      lineHeight: theme.typography.lineHeights.lg,
    },
  };

  const variants: Record<string, TextStyle> = {
    primary: {
      color: theme.colors.textInverse,
      fontWeight: theme.typography.weights.semibold,
    },
    secondary: {
      color: theme.colors.textInverse,
      fontWeight: theme.typography.weights.medium,
    },
    outline: {
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
    },
    text: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium,
    },
  };

  const pressed: TextStyle = {
    opacity: 0.9,
  };

  return {
    base,
    size: sizes[size],
    variant: variants[variant],
    pressed,
  };
}

export default AccessibleButton; 