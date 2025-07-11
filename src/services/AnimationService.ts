import { 
  Easing,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
  SharedValue,
  AnimationCallback
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';

const logger = createLogger('AnimationService');

// Animation configuration presets
export const ANIMATION_CONFIG = {
  // Timing configurations
  timing: {
    fast: { duration: 150, easing: Easing.out(Easing.quad) },
    medium: { duration: 300, easing: Easing.out(Easing.cubic) },
    slow: { duration: 500, easing: Easing.out(Easing.cubic) },
    smooth: { duration: 250, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }
  },
  
  // Spring configurations
  spring: {
    gentle: { damping: 20, stiffness: 300, mass: 1 },
    bouncy: { damping: 15, stiffness: 400, mass: 0.8 },
    snappy: { damping: 25, stiffness: 500, mass: 0.7 },
    wobbly: { damping: 10, stiffness: 200, mass: 1.2 }
  },
  
  // Button interaction presets
  button: {
    pressScale: 0.95,
    pressOpacity: 0.8,
    hoverScale: 1.02,
    tapScale: 0.98
  },
  
  // Loading animation presets
  loading: {
    rotation: { duration: 1000, easing: Easing.linear },
    pulse: { duration: 800, easing: Easing.inOut(Easing.quad) },
    fade: { duration: 600, easing: Easing.inOut(Easing.sin) }
  },
  
  // Transition presets
  transition: {
    slideIn: { duration: 400, easing: Easing.out(Easing.exp) },
    slideOut: { duration: 300, easing: Easing.in(Easing.exp) },
    fadeIn: { duration: 300, easing: Easing.out(Easing.quad) },
    fadeOut: { duration: 200, easing: Easing.in(Easing.quad) }
  }
};

// Animation state management
interface AnimationState {
  isPlaying: boolean;
  progress: number;
  direction: 'forward' | 'reverse';
}

class AnimationService {
  private animationStates: Map<string, AnimationState> = new Map();
  
  /**
   * Initialize animation service
   */
  initialize(): void {
    logger.info('🎬 Animation Service initialized');
  }

  /**
   * Create smooth button press animation with haptic feedback
   */
  createButtonPressAnimation(
    scale: SharedValue<number>,
    opacity?: SharedValue<number>,
    config?: {
      pressScale?: number;
      pressOpacity?: number;
      hapticType?: 'light' | 'medium' | 'heavy';
      springConfig?: any;
    }
  ) {
    const {
      pressScale = ANIMATION_CONFIG.button.pressScale,
      pressOpacity = ANIMATION_CONFIG.button.pressOpacity,
      hapticType = 'light',
      springConfig = ANIMATION_CONFIG.spring.snappy
    } = config || {};

    return {
      onPressIn: () => {
        'worklet';
        scale.value = withSpring(pressScale, springConfig);
        if (opacity) {
          opacity.value = withTiming(pressOpacity, ANIMATION_CONFIG.timing.fast);
        }
        // Trigger haptic feedback
        runOnJS(() => {
          switch (hapticType) {
            case 'light':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
            case 'medium':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            case 'heavy':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              break;
          }
        })();
      },
      
      onPressOut: () => {
        'worklet';
        scale.value = withSpring(1, springConfig);
        if (opacity) {
          opacity.value = withTiming(1, ANIMATION_CONFIG.timing.fast);
        }
      }
    };
  }

  /**
   * Create loading spinner animation
   */
  createLoadingAnimation(
    rotation: SharedValue<number>,
    type: 'spin' | 'pulse' | 'bounce' = 'spin'
  ) {
    switch (type) {
      case 'spin':
        rotation.value = withRepeat(
          withTiming(360, ANIMATION_CONFIG.loading.rotation),
          -1,
          false
        );
        break;
        
      case 'pulse':
        rotation.value = withRepeat(
          withSequence(
            withTiming(1.2, ANIMATION_CONFIG.loading.pulse),
            withTiming(1, ANIMATION_CONFIG.loading.pulse)
          ),
          -1,
          true
        );
        break;
        
      case 'bounce':
        rotation.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withSpring(1.3, ANIMATION_CONFIG.spring.bouncy),
            withSpring(1, ANIMATION_CONFIG.spring.bouncy)
          ),
          -1,
          false
        );
        break;
    }
  }

  /**
   * Create smooth fade in/out animation
   */
  createFadeAnimation(
    opacity: SharedValue<number>,
    show: boolean,
    config?: {
      duration?: number;
      delay?: number;
      onComplete?: () => void;
    }
  ) {
    const { 
      duration = ANIMATION_CONFIG.timing.medium.duration,
      delay = 0,
      onComplete
    } = config || {};

    const animation = show 
      ? withTiming(1, { duration, easing: ANIMATION_CONFIG.timing.medium.easing })
      : withTiming(0, { duration, easing: ANIMATION_CONFIG.timing.fast.easing });

    if (delay > 0) {
      opacity.value = withDelay(delay, animation);
    } else {
      opacity.value = animation;
    }

    if (onComplete) {
      opacity.value = withTiming(
        show ? 1 : 0,
        { duration, easing: show ? ANIMATION_CONFIG.timing.medium.easing : ANIMATION_CONFIG.timing.fast.easing },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onComplete)();
          }
        }
      );
    }
  }

  /**
   * Create slide in/out animation
   */
  createSlideAnimation(
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    direction: 'left' | 'right' | 'up' | 'down',
    show: boolean,
    distance: number = 100,
    config?: {
      duration?: number;
      springConfig?: any;
      onComplete?: () => void;
    }
  ) {
    const { 
      duration = ANIMATION_CONFIG.transition.slideIn.duration,
      springConfig = ANIMATION_CONFIG.spring.gentle,
      onComplete
    } = config || {};

    let targetX = 0;
    let targetY = 0;

    if (!show) {
      switch (direction) {
        case 'left':
          targetX = -distance;
          break;
        case 'right':
          targetX = distance;
          break;
        case 'up':
          targetY = -distance;
          break;
        case 'down':
          targetY = distance;
          break;
      }
    }

    const animationCallback: AnimationCallback | undefined = onComplete ? 
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onComplete)();
        }
      } : undefined;

    translateX.value = withSpring(targetX, springConfig, animationCallback);
    translateY.value = withSpring(targetY, springConfig);
  }

  /**
   * Create scale animation with bounce effect
   */
  createScaleAnimation(
    scale: SharedValue<number>,
    show: boolean,
    config?: {
      overshoot?: number;
      springConfig?: any;
      onComplete?: () => void;
    }
  ) {
    const {
      overshoot = 1.1,
      springConfig = ANIMATION_CONFIG.spring.bouncy,
      onComplete
    } = config || {};

    if (show) {
      scale.value = withSequence(
        withSpring(overshoot, springConfig),
        withSpring(1, springConfig, onComplete ? (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onComplete)();
          }
        } : undefined)
      );
    } else {
      scale.value = withSpring(0, springConfig, onComplete ? (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onComplete)();
        }
      } : undefined);
    }
  }

  /**
   * Create shake animation for error states
   */
  createShakeAnimation(
    translateX: SharedValue<number>,
    intensity: number = 10,
    config?: {
      duration?: number;
      onComplete?: () => void;
    }
  ) {
    const { 
      duration = 80,
      onComplete
    } = config || {};

    // Trigger error haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    translateX.value = withSequence(
      withTiming(intensity, { duration }),
      withTiming(-intensity, { duration }),
      withTiming(intensity, { duration }),
      withTiming(-intensity, { duration }),
      withTiming(0, { duration }, onComplete ? (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onComplete)();
        }
      } : undefined)
    );
  }

  /**
   * Create stagger animation for list items
   */
  createStaggerAnimation(
    items: SharedValue<number>[],
    show: boolean,
    config?: {
      delay?: number;
      staggerDelay?: number;
      springConfig?: any;
    }
  ) {
    const {
      delay = 0,
      staggerDelay = 100,
      springConfig = ANIMATION_CONFIG.spring.gentle
    } = config || {};

    items.forEach((item, index) => {
      const itemDelay = delay + (index * staggerDelay);
      
      if (show) {
        item.value = withDelay(
          itemDelay,
          withSpring(1, springConfig)
        );
      } else {
        item.value = withDelay(
          itemDelay,
          withSpring(0, springConfig)
        );
      }
    });
  }

  /**
   * Create ripple effect animation
   */
  createRippleAnimation(
    scale: SharedValue<number>,
    opacity: SharedValue<number>,
    config?: {
      maxScale?: number;
      duration?: number;
      onComplete?: () => void;
    }
  ) {
    const {
      maxScale = 2,
      duration = 600,
      onComplete
    } = config || {};

    // Reset values
    scale.value = 0;
    opacity.value = 0.3;

    // Animate ripple
    scale.value = withTiming(maxScale, { 
      duration, 
      easing: Easing.out(Easing.quad) 
    });
    
    opacity.value = withTiming(0, { 
      duration, 
      easing: Easing.out(Easing.quad) 
    }, onComplete ? (finished) => {
      'worklet';
      if (finished) {
        runOnJS(onComplete)();
      }
    } : undefined);
  }

  /**
   * Create progress bar animation
   */
  createProgressAnimation(
    progress: SharedValue<number>,
    targetProgress: number,
    config?: {
      duration?: number;
      onComplete?: () => void;
    }
  ) {
    const {
      duration = ANIMATION_CONFIG.timing.medium.duration,
      onComplete
    } = config || {};

    progress.value = withTiming(
      targetProgress,
      { duration, easing: ANIMATION_CONFIG.timing.smooth.easing },
      onComplete ? (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onComplete)();
        }
      } : undefined
    );
  }

  /**
   * Create morphing animation between shapes/sizes
   */
  createMorphAnimation(
    width: SharedValue<number>,
    height: SharedValue<number>,
    borderRadius: SharedValue<number>,
    targetWidth: number,
    targetHeight: number,
    targetBorderRadius: number,
    config?: {
      duration?: number;
      springConfig?: any;
      onComplete?: () => void;
    }
  ) {
    const {
      duration = ANIMATION_CONFIG.timing.medium.duration,
      springConfig = ANIMATION_CONFIG.spring.gentle,
      onComplete
    } = config || {};

    width.value = withSpring(targetWidth, springConfig);
    height.value = withSpring(targetHeight, springConfig);
    borderRadius.value = withSpring(targetBorderRadius, springConfig, onComplete ? (finished) => {
      'worklet';
      if (finished) {
        runOnJS(onComplete)();
      }
    } : undefined);
  }

  /**
   * Create floating animation for elements
   */
  createFloatingAnimation(
    translateY: SharedValue<number>,
    amplitude: number = 10,
    config?: {
      duration?: number;
    }
  ) {
    const { duration = 2000 } = config || {};

    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(amplitude, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }

  /**
   * Create attention-seeking animation (pulse)
   */
  createAttentionAnimation(
    scale: SharedValue<number>,
    config?: {
      intensity?: number;
      duration?: number;
      repeatCount?: number;
    }
  ) {
    const {
      intensity = 1.05,
      duration = 300,
      repeatCount = 3
    } = config || {};

    // Light haptic for attention
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration, easing: Easing.in(Easing.quad) })
      ),
      repeatCount,
      false
    );
  }

  /**
   * Stop all animations for a given animated value
   */
  stopAnimation(animatedValue: SharedValue<number>): void {
    'worklet';
    // Cancel any running animation
    animatedValue.value = animatedValue.value;
  }

  /**
   * Create interpolated animation styles
   */
  createInterpolatedStyle(
    inputRange: number[],
    outputRange: number[],
    animatedValue: SharedValue<number>,
    extrapolate = Extrapolate.CLAMP
  ) {
    'worklet';
    return interpolate(animatedValue.value, inputRange, outputRange, extrapolate);
  }

  /**
   * Get animation state
   */
  getAnimationState(id: string): AnimationState | undefined {
    return this.animationStates.get(id);
  }

  /**
   * Set animation state
   */
  setAnimationState(id: string, state: Partial<AnimationState>): void {
    const currentState = this.animationStates.get(id) || {
      isPlaying: false,
      progress: 0,
      direction: 'forward'
    };
    
    this.animationStates.set(id, { ...currentState, ...state });
  }

  /**
   * Cleanup animation states
   */
  cleanup(): void {
    this.animationStates.clear();
    logger.info('🧹 Animation Service cleaned up');
  }
}

export const animationService = new AnimationService();
export default animationService;

// Utility hooks for common animations
export const useButtonAnimation = (
  config?: {
    pressScale?: number;
    pressOpacity?: number;
    hapticType?: 'light' | 'medium' | 'heavy';
  }
) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlers = animationService.createButtonPressAnimation(scale, opacity, config);

  return { animatedStyle, handlers };
};

export const useLoadingAnimation = (type: 'spin' | 'pulse' | 'bounce' = 'spin') => {
  const rotation = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => {
    switch (type) {
      case 'spin':
        return {
          transform: [{ rotate: `${rotation.value}deg` }],
        };
      case 'pulse':
      case 'bounce':
        return {
          transform: [{ scale: rotation.value }],
        };
      default:
        return {};
    }
  });

  const startAnimation = () => {
    animationService.createLoadingAnimation(rotation, type);
  };

  const stopAnimation = () => {
    animationService.stopAnimation(rotation);
  };

  return { animatedStyle, startAnimation, stopAnimation };
};

export const useFadeAnimation = (initialOpacity: number = 0) => {
  const opacity = useSharedValue(initialOpacity);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fadeIn = (config?: { duration?: number; delay?: number; onComplete?: () => void }) => {
    animationService.createFadeAnimation(opacity, true, config);
  };

  const fadeOut = (config?: { duration?: number; delay?: number; onComplete?: () => void }) => {
    animationService.createFadeAnimation(opacity, false, config);
  };

  return { animatedStyle, fadeIn, fadeOut };
}; 