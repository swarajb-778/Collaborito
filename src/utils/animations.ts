import { useSharedValue, withSpring, withTiming, withSequence, withDelay, useAnimatedStyle, interpolate, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Animation presets for consistent timing and easing
export const AnimationPresets = {
  timing: {
    quick: 200,
    normal: 300,
    slow: 500,
    extraSlow: 800,
  },
  
  easing: {
    easeOut: Easing.out(Easing.cubic),
    easeIn: Easing.in(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    bounce: Easing.bounce,
    elastic: Easing.elastic(1.2),
  },
  
  spring: {
    gentle: {
      damping: 20,
      stiffness: 150,
      mass: 1,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
    bouncy: {
      damping: 15,
      stiffness: 200,
      mass: 1,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
    stiff: {
      damping: 25,
      stiffness: 300,
      mass: 1,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
  },
};

// Enhanced button press animation hook
export const useButtonAnimation = (options?: {
  pressScale?: number;
  springConfig?: any;
  hapticFeedback?: boolean;
}) => {
  const {
    pressScale = 0.95,
    springConfig = AnimationPresets.spring.gentle,
    hapticFeedback = true,
  } = options || {};

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(pressScale, springConfig);
    opacity.value = withTiming(0.8, { duration: AnimationPresets.timing.quick });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, { duration: AnimationPresets.timing.quick });
  };

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
};

// Shake animation for errors
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 50 })
    );
  };

  return {
    animatedStyle,
    shake,
  };
};

// Utility function for haptic feedback patterns
export const HapticPatterns = {
  buttonPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  longPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selectionChange: () => Haptics.selectionAsync(),
};
