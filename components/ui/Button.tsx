import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Animated, 
  ViewStyle, 
  TextStyle,
  View
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export const Button = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  hapticFeedback = true,
}: ButtonProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation value for scale effect
  const [scaleAnim] = useState(new Animated.Value(1));

  // Handle press with animation and haptic feedback
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  // Get button styles based on variant
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    };
    
    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: { paddingVertical: 8, paddingHorizontal: 12 },
      md: { paddingVertical: 12, paddingHorizontal: 16 },
      lg: { paddingVertical: 16, paddingHorizontal: 20 },
    };
    
    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: { 
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      secondary: { 
        backgroundColor: colors.secondary,
        borderWidth: 0,
      },
      outline: { 
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      },
      ghost: { 
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: { 
        backgroundColor: colors.error,
        borderWidth: 0,
      },
    };
    
    // Disabled style
    const disabledStyle: ViewStyle = {
      opacity: 0.5,
    };
    
    // Full width style
    const fullWidthStyle: ViewStyle = {
      width: '100%',
    };
    
    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled ? disabledStyle : {}),
      ...(fullWidth ? fullWidthStyle : {}),
    };
  };

  // Get text styles based on variant
  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Size styles
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 16 },
    };
    
    // Variant styles
    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
      danger: { color: '#FFFFFF' },
    };
    
    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        getButtonStyles(),
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.touchable}
        activeOpacity={0.8}
      >
        <View style={styles.contentContainer}>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} 
              style={styles.loader} 
            />
          )}
          
          {!loading && leftIcon && (
            <View style={styles.leftIcon}>
              {leftIcon}
            </View>
          )}
          
          <Text style={[getTextStyles(), textStyle]}>
            {children}
          </Text>
          
          {!loading && rightIcon && (
            <View style={styles.rightIcon}>
              {rightIcon}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
}); 