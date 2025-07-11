import React, { useRef, useState, useEffect } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from '../../src/services/AccessibilityService';
import { useTheme } from '../../src/contexts/ThemeContext';

export interface AccessibleTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone' | 'numeric';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helpTextStyle?: TextStyle;
  autoFocus?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  accessibilityHint?: string;
}

export const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helpText,
  required = false,
  disabled = false,
  type = 'text',
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helpTextStyle,
  autoFocus = false,
  showCharacterCount = false,
  maxLength,
  accessibilityHint,
  ...textInputProps
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const {
    getTextInputProps,
    announce,
    getAnimationDuration,
    isReduceMotionEnabled,
  } = useAccessibility();

  // Auto-focus management
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Announce errors when they change
  useEffect(() => {
    if (error) {
      announce(`Error in ${label}: ${error}`, 'assertive');
    }
  }, [error, label, announce]);

  // Handle focus events
  const handleFocus = (event: any) => {
    setIsFocused(true);
    announce(`Focused on ${label} ${required ? 'required ' : ''}input field`, 'polite');
    textInputProps.onFocus?.(event);
  };

  const handleBlur = (event: any) => {
    setIsFocused(false);
    textInputProps.onBlur?.(event);
  };

  // Handle text changes with feedback
  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // Provide subtle haptic feedback for typing (iOS only, light feedback)
    if (text.length > value.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  // Get appropriate keyboard type
  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'email': return 'email-address';
      case 'phone': return 'phone-pad';
      case 'numeric': return 'numeric';
      default: return 'default';
    }
  };

  // Get text content type for autofill
  const getTextContentType = (): TextInputProps['textContentType'] => {
    switch (type) {
      case 'email': return 'emailAddress';
      case 'password': return 'password';
      case 'phone': return 'telephoneNumber';
      default: return 'none';
    }
  };

  // Get accessibility props
  const accessibilityProps = getTextInputProps(
    label,
    placeholder,
    type === 'password'
  );

  // Calculate styles
  const styles = getInputStyles(theme, isFocused, error, disabled);

  // Character count text
  const characterCountText = showCharacterCount && maxLength 
    ? `${value.length}/${maxLength}` 
    : null;

  // Accessibility description combining help text, error, and character count
  const accessibilityDescription = [
    helpText,
    error,
    characterCountText && `${characterCountText} characters`,
    required && 'Required field',
  ].filter(Boolean).join('. ');

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text
        style={[styles.label, labelStyle]}
        {...{
          accessible: true,
          accessibilityRole: 'text',
          accessibilityLabel: `${label}${required ? ' required' : ''}`,
        }}
      >
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Input Field */}
      <TextInput
        ref={inputRef}
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        editable={!disabled}
        secureTextEntry={type === 'password'}
        keyboardType={getKeyboardType()}
        textContentType={getTextContentType()}
        autoCapitalize={type === 'email' ? 'none' : 'sentences'}
        autoCorrect={type !== 'email' && type !== 'password'}
        maxLength={maxLength}
        {...accessibilityProps}
        accessibilityLabelledBy={undefined} // Remove to avoid conflicts
        accessibilityLabel={`${label} input field${required ? ', required' : ''}`}
        accessibilityHint={accessibilityHint || accessibilityDescription}
        accessibilityState={{
          disabled,
        }}
        {...textInputProps}
      />

      {/* Error Message */}
      {error && (
        <Text
          style={[styles.errorText, errorStyle]}
          {...{
            accessible: true,
            accessibilityRole: 'text',
            accessibilityLabel: `Error: ${error}`,
            accessibilityLiveRegion: 'assertive',
          }}
        >
          {error}
        </Text>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <Text
          style={[styles.helpText, helpTextStyle]}
          {...{
            accessible: true,
            accessibilityRole: 'text',
            accessibilityLabel: `Help: ${helpText}`,
          }}
        >
          {helpText}
        </Text>
      )}

      {/* Character Count */}
      {characterCountText && (
        <Text
          style={styles.characterCount}
          {...{
            accessible: true,
            accessibilityRole: 'text',
            accessibilityLabel: `Character count: ${characterCountText}`,
          }}
        >
          {characterCountText}
        </Text>
      )}
    </View>
  );
};

// Style calculation function
function getInputStyles(theme: any, isFocused: boolean, error?: string, disabled?: boolean) {
  const container: ViewStyle = {
    marginBottom: theme.spacing.md,
  };

  const label: TextStyle = {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.medium,
  };

  const required: TextStyle = {
    color: theme.colors.error,
  };

  const input: TextStyle = {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text,
    backgroundColor: disabled ? theme.colors.backgroundSecondary : theme.colors.surface,
    borderColor: error 
      ? theme.colors.error 
      : isFocused 
        ? theme.colors.primary 
        : theme.colors.border,
    minHeight: 44, // Accessibility minimum touch target
    opacity: disabled ? 0.6 : 1,
  };

  const errorText: TextStyle = {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fonts.regular,
  };

  const helpText: TextStyle = {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fonts.regular,
  };

  const characterCount: TextStyle = {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textTertiary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fonts.regular,
  };

  return {
    container,
    label,
    required,
    input,
    errorText,
    helpText,
    characterCount,
  };
}

export default AccessibleTextInput; 