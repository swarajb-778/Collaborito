import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse';
  color?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'spinner',
  color
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const loadingColor = color || colors.primary;
  
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 32;
      case 'large': return 48;
      default: return 32;
    }
  };
  
  const renderSpinner = () => (
    <ActivityIndicator size={size === 'small' ? 'small' : 'large'} color={loadingColor} />
  );
  
  const renderDots = () => {
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);
    
    React.useEffect(() => {
      dot1.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
      setTimeout(() => {
        dot2.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
      }, 200);
      setTimeout(() => {
        dot3.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
      }, 400);
    }, []);
    
    const dot1Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot1.value, [0, 1], [0.8, 1.2]) }],
    }));
    
    const dot2Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot2.value, [0, 1], [0.8, 1.2]) }],
    }));
    
    const dot3Style = useAnimatedStyle(() => ({
      opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(dot3.value, [0, 1], [0.8, 1.2]) }],
    }));
    
    const dotSize = getSizeValue() / 4;
    
    return (
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: loadingColor }, dot1Style]} />
        <Animated.View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: loadingColor }, dot2Style]} />
        <Animated.View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: loadingColor }, dot3Style]} />
      </View>
    );
  };
  
  const renderPulse = () => {
    const pulse = useSharedValue(0);
    
    React.useEffect(() => {
      pulse.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
    }, []);
    
    const pulseStyle = useAnimatedStyle(() => ({
      opacity: interpolate(pulse.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
    }));
    
    return (
      <Animated.View style={[styles.pulseContainer, pulseStyle]}>
        <View style={[styles.pulseCircle, { 
          width: getSizeValue(), 
          height: getSizeValue(), 
          borderColor: loadingColor 
        }]} />
      </Animated.View>
    );
  };
  
  const getLoadingComponent = () => {
    switch (variant) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      default: return renderSpinner();
    }
  };
  
  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.container}>
      {getLoadingComponent()}
      {message && (
        <Text style={[styles.message, { color: colors.text, fontSize: size === 'small' ? 12 : 14 }]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
};

export interface FeedbackStateProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  iconSize?: number;
  showIcon?: boolean;
}

export const FeedbackState: React.FC<FeedbackStateProps> = ({
  type,
  title,
  message,
  iconSize = 32,
  showIcon = true
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', color: '#4CAF50' };
      case 'error':
        return { icon: 'times-circle', color: '#F44336' };
      case 'warning':
        return { icon: 'exclamation-triangle', color: '#FF9800' };
      case 'info':
        return { icon: 'info-circle', color: colors.primary };
      default:
        return { icon: 'info-circle', color: colors.primary };
    }
  };
  
  const { icon, color } = getIconAndColor();
  
  const iconScale = useSharedValue(0);
  
  React.useEffect(() => {
    iconScale.value = withTiming(1, { duration: 400 });
  }, []);
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.feedbackContainer}>
      {showIcon && (
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <FontAwesome5 name={icon} size={iconSize} color={color} />
        </Animated.View>
      )}
      <Text style={[styles.feedbackTitle, { color: colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.feedbackMessage, { color: colors.muted }]}>{message}</Text>
      )}
    </Animated.View>
  );
};

export interface ProgressStateProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
}

export const ProgressState: React.FC<ProgressStateProps> = ({
  progress,
  message,
  showPercentage = true,
  color,
  height = 4
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const progressColor = color || colors.primary;
  
  const progressWidth = useSharedValue(0);
  
  React.useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 500 });
  }, [progress]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.progressContainer}>
      {message && (
        <View style={styles.progressHeader}>
          <Text style={[styles.progressMessage, { color: colors.text }]}>{message}</Text>
          {showPercentage && (
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.progressBar, { backgroundColor: colors.border, height }]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { backgroundColor: progressColor, height },
            progressStyle
          ]} 
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  message: {
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: 10,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    borderRadius: 100,
    borderWidth: 2,
  },
  feedbackContainer: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  iconContainer: {
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 2,
  },
}); 