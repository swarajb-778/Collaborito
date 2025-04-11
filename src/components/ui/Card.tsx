import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity, 
  Animated,
  StyleProp,
  DimensionValue
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: DimensionValue;
  animated?: boolean;
}

export const Card = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 16,
  animated = false,
}: CardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation scaling for press feedback when animated is true
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handlePressOut = () => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  // Base card styles with variant
  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      padding,
      backgroundColor: variant === 'flat' ? 'transparent' : colors.card,
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: colors.border,
      shadowOpacity: variant === 'elevated' ? 0.1 : 0,
      shadowRadius: variant === 'elevated' ? 10 : 0,
      shadowOffset: { width: 0, height: variant === 'elevated' ? 4 : 0 },
      elevation: variant === 'elevated' ? 3 : 0,
    },
    style,
  ];
  
  if (onPress) {
    const animatedStyle = {
      transform: [{ scale: scaleAnim }]
    };
    
    return (
      <Animated.View style={animated ? animatedStyle : undefined}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={cardStyle}>{children}</View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    overflow: 'hidden',
  },
}); 