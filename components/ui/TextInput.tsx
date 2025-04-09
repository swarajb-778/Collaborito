import React, { useState, useRef, useEffect } from 'react';
import { 
  View,
  TextInput as RNTextInput,
  StyleSheet, 
  Text, 
  TouchableOpacity,
  Animated,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
  Easing,
  Platform
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  containerStyle?: ViewStyle;
  secureTextToggle?: boolean;
}

export const TextInput = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onLeftIconPress,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  containerStyle,
  secureTextToggle = false,
  ...props
}: TextInputProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const [inputValue, setInputValue] = useState(props.value || '');
  
  // Animation values
  const labelPositionAnim = useRef(new Animated.Value(inputValue ? 1 : 0)).current;
  const labelSizeAnim = useRef(new Animated.Value(inputValue ? 1 : 0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  
  // Handle secureTextEntry toggling
  const isSecureTextEntry = secureTextToggle 
    ? props.secureTextEntry && !isSecureTextVisible 
    : props.secureTextEntry;
  
  // Update input value state when props.value changes
  useEffect(() => {
    if (props.value !== undefined) {
      setInputValue(props.value);
    }
  }, [props.value]);
  
  // Animation configurations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(labelPositionAnim, {
        toValue: (isFocused || inputValue) ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(labelSizeAnim, {
        toValue: (isFocused || inputValue) ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(focusAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      })
    ]).start();
  }, [isFocused, inputValue]);
  
  // Interpolated values for animations
  const labelPositionTop = labelPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });
  
  const labelSize = labelSizeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });
  
  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.muted, colors.primary],
  });
  
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });
  
  // Event handlers
  const handleFocus = (e: any) => {
    setIsFocused(true);
    props.onFocus && props.onFocus(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    props.onBlur && props.onBlur(e);
  };
  
  const handleChangeText = (text: string) => {
    setInputValue(text);
    props.onChangeText && props.onChangeText(text);
  };
  
  const toggleSecureTextVisibility = () => {
    setIsSecureTextVisible(!isSecureTextVisible);
  };
  
  // Get container border color based on state (focused, error, default)
  const getContainerBorderColor = () => {
    if (error) return colors.error;
    return borderColor;
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, { backgroundColor: colors.card }, style]}>
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor: getContainerBorderColor(),
              borderWidth: isFocused ? 2 : 1,
            },
          ]}
        >
          {/* Floating Label */}
          {label && (
            <Animated.Text
              style={[
                styles.label,
                {
                  top: labelPositionTop,
                  fontSize: labelSize,
                  color: error ? colors.error : labelColor,
                  backgroundColor: colors.card,
                },
                labelStyle,
              ]}
            >
              {label}
            </Animated.Text>
          )}
          
          {/* Left Icon */}
          {leftIcon && (
            <View
              style={[
                styles.leftIcon,
                { opacity: isFocused || inputValue ? 1 : 0.7 }
              ]}
            >
              {leftIcon}
            </View>
          )}
          
          {/* TextInput */}
          <RNTextInput
            {...props}
            style={[
              styles.input,
              {
                color: colors.text,
                paddingLeft: leftIcon ? 56 : 12,
                paddingRight: (rightIcon || secureTextToggle) ? 40 : 12,
              },
              inputStyle,
            ]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            secureTextEntry={isSecureTextEntry}
            placeholderTextColor={Platform.OS === 'ios' ? colors.muted : 'rgba(0,0,0,0.4)'}
            placeholder={isFocused || !label ? props.placeholder : ''}
          />
          
          {/* Right Icon */}
          {(rightIcon || (secureTextToggle && props.secureTextEntry)) && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={secureTextToggle ? toggleSecureTextVisibility : onRightIconPress}
              disabled={!secureTextToggle && !onRightIconPress}
              activeOpacity={0.6}
            >
              {secureTextToggle && props.secureTextEntry ? (
                <Text style={{ color: colors.primary, fontSize: 14 }}>
                  {isSecureTextVisible ? 'Hide' : 'Show'}
                </Text>
              ) : (
                rightIcon
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
      
      {/* Error Message */}
      {error && (
        <Animated.Text
          style={[
            styles.errorText,
            { color: colors.error },
            errorStyle,
          ]}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWrapper: {
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    minHeight: 56,
  },
  input: {
    height: 54,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  label: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    width: 24,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
}); 