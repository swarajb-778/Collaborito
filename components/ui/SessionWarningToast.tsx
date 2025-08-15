import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
  FadeInUp,
  FadeOutUp
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SessionWarningToastProps {
  isVisible: boolean;
  minutesRemaining: number;
  onExtendSession: () => void;
  onDismiss: () => void;
  onSessionExpired?: () => void;
}

export function SessionWarningToast({
  isVisible,
  minutesRemaining,
  onExtendSession,
  onDismiss,
  onSessionExpired
}: SessionWarningToastProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  const [timeLeft, setTimeLeft] = useState(minutesRemaining * 60); // Convert to seconds
  const [isExpired, setIsExpired] = useState(false);
  
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(1);
  
  useEffect(() => {
    if (isVisible && !isExpired) {
      // Show toast with spring animation
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      
      // Haptic feedback when warning appears
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Reset time left when props change
      setTimeLeft(minutesRemaining * 60);
      progressWidth.value = 1;
    } else {
      // Hide toast
      scale.value = withTiming(0.9);
      opacity.value = withTiming(0);
    }
  }, [isVisible, minutesRemaining, isExpired]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVisible && timeLeft > 0 && !isExpired) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          
          // Update progress bar
          const totalTime = minutesRemaining * 60;
          const progress = Math.max(0, newTime / totalTime);
          progressWidth.value = withTiming(progress, { duration: 500 });
          
          // Haptic feedback for last 30 seconds
          if (newTime <= 30 && newTime > 0 && newTime % 5 === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          // When time expires
          if (newTime <= 0) {
            setIsExpired(true);
            runOnJS(() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              onSessionExpired?.();
            })();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVisible, timeLeft, minutesRemaining, isExpired, onSessionExpired]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
    };
  });
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getProgressColor = () => {
    if (timeLeft <= 60) return '#FF4444'; // Red for last minute
    if (timeLeft <= 120) return '#FF8C00'; // Orange for last 2 minutes
    return colors.warning || '#F59E0B'; // Yellow/warning for normal
  };
  
  const handleExtendSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onExtendSession();
  };
  
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#FFFFFF',
          borderColor: colorScheme === 'dark' ? '#404040' : '#E5E5E5',
          shadowColor: colorScheme === 'dark' ? '#000000' : '#000000',
        },
        animatedStyle,
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: colorScheme === 'dark' ? '#404040' : '#F0F0F0' }]}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: getProgressColor() },
            progressAnimatedStyle,
          ]}
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: getProgressColor() }]}>
            <FontAwesome5 name="clock" size={16} color="white" />
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Session expiring soon
          </Text>
          <Text style={[styles.message, { color: colors.muted }]}>
            Your session will expire in{' '}
            <Text style={[styles.timeText, { color: getProgressColor() }]}>
              {formatTime(timeLeft)}
            </Text>
          </Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.extendButton, { backgroundColor: colors.primary }]}
            onPress={handleExtendSession}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="refresh" size={14} color="white" />
            <Text style={styles.extendButtonText}>Extend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.6}
          >
            <FontAwesome5 name="times" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: width - 32,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
    overflow: 'hidden',
  },
  progressBarContainer: {
    height: 3,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  timeText: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  extendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
