import React, { useState, forwardRef, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput as RNTextInput, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  TextInputProps as RNTextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      rightIcon,
      leftIcon,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      onRightIconPress,
      onLeftIconPress,
      onFocus,
      onBlur,
      value,
      placeholder,
      ...rest
    },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    
    const [isFocused, setIsFocused] = useState(false);
    const [hasText, setHasText] = useState(!!value);
    
    // Animation values
    const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;
    const inputBorder = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      setHasText(!!value);
      
      Animated.timing(labelPosition, {
        toValue: value ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }, [value, labelPosition]);

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      
      Animated.parallel([
        Animated.timing(labelPosition, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(inputBorder, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
      
      onFocus && onFocus(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      
      if (!hasText) {
        Animated.timing(labelPosition, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }).start();
      }
      
      Animated.timing(inputBorder, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
      
      onBlur && onBlur(e);
    };

    // Interpolate label position and font size
    const labelTop = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [17, -8],
    });
    
    const labelFontSize = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    });
    
    // Interpolate border color based on focus state and error
    const borderColor = inputBorder.interpolate({
      inputRange: [0, 1],
      outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
    });

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: error 
                  ? colors.error
                  : isFocused 
                    ? colors.primary 
                    : colors.muted,
                backgroundColor: colors.background,
              },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
        )}
        
        <Animated.View
          style={[
            styles.inputContainer,
            {
              borderColor,
              backgroundColor: colors.background,
            },
          ]}
        >
          {leftIcon && (
            <TouchableOpacity 
              style={styles.leftIcon} 
              onPress={onLeftIconPress}
              disabled={!onLeftIconPress}
            >
              {leftIcon}
            </TouchableOpacity>
          )}
          
          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.text,
                paddingLeft: leftIcon ? 0 : 16,
                paddingRight: rightIcon ? 0 : 16,
              },
              inputStyle,
            ]}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor={colors.muted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            selectionColor={colors.primary}
            {...rest}
          />
          
          {rightIcon && (
            <TouchableOpacity 
              style={styles.rightIcon} 
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {error && (
          <Text style={[styles.error, { color: colors.error }, errorStyle]}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 56,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 16,
  },
  leftIcon: {
    paddingHorizontal: 16,
  },
  rightIcon: {
    paddingHorizontal: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
}); 