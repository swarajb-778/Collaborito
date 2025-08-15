import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence 
} from 'react-native-reanimated';
import { Card } from './Card';
import { Button } from './Button';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';

interface AccountLockoutDisplayProps {
  email: string;
  lockoutDurationMinutes: number;
  onResetPassword?: () => void;
  onDismiss?: () => void;
  onCountdownComplete?: () => void;
}

export function AccountLockoutDisplay({
  email,
  lockoutDurationMinutes,
  onResetPassword,
  onDismiss,
  onCountdownComplete
}: AccountLockoutDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [timeRemaining, setTimeRemaining] = useState(lockoutDurationMinutes * 60); // Convert to seconds
  const [isActive, setIsActive] = useState(true);
  
  // Animation values
  const scale = useSharedValue(0.9);
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    
    // Subtle shake animation for the lock icon
    rotation.value = withRepeat(
      withSequence(
        withSpring(-2, { duration: 100 }),
        withSpring(2, { duration: 100 }),
        withSpring(0, { duration: 100 })
      ),
      3,
      false
    );
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          
          // Haptic feedback for last 10 seconds
          if (newTime <= 10 && newTime > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          // When countdown reaches 0
          if (newTime <= 0) {
            setIsActive(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
              onCountdownComplete?.();
            }, 1000);
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
  }, [isActive, timeRemaining, onCountdownComplete]);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const lockIconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getTimeColor = () => {
    if (timeRemaining <= 30) return '#FF4444'; // Red for last 30 seconds
    if (timeRemaining <= 60) return '#FF8C00'; // Orange for last minute
    return colors.destructive; // Default destructive color
  };
  
  const handleResetPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResetPassword?.();
  };
  
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };
  
  if (timeRemaining <= 0 && !isActive) {
    return (
      <Animated.View
        entering={FadeInDown.duration(500)}
        exiting={FadeOutUp.duration(300)}
        style={[styles.container, cardAnimatedStyle]}
      >
        <Card
          style={[
            styles.card,
            { 
              backgroundColor: colorScheme === 'dark' ? '#1A3D2E' : '#E8F5E8',
              borderColor: '#22C55E'
            }
          ]}
          padding={20}
        >
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#22C55E' }]}>
              <FontAwesome5 name="check" size={24} color="white" />
            </View>
          </View>
          
          <Text style={[styles.title, { color: '#22C55E' }]}>
            Account Unlocked
          </Text>
          
          <Text style={[styles.message, { color: colors.text }]}>
            You can now try signing in again.
          </Text>
          
          <Button
            style={styles.actionButton}
            onPress={handleDismiss}
            variant="primary"
          >
            Continue
          </Button>
        </Card>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      exiting={FadeOutUp.duration(300)}
      style={[styles.container, cardAnimatedStyle]}
    >
      <Card
        style={[
          styles.card,
          { 
            backgroundColor: colorScheme === 'dark' ? '#3D1A1A' : '#FFF5F5',
            borderColor: colors.destructive
          }
        ]}
        padding={20}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.iconCircle, { backgroundColor: colors.destructive }, lockIconAnimatedStyle]}>
            <FontAwesome5 name="lock" size={24} color="white" />
          </Animated.View>
        </View>
        
        <Text style={[styles.title, { color: colors.destructive }]}>
          Account Temporarily Locked
        </Text>
        
        <Text style={[styles.message, { color: colors.text }]}>
          Too many failed login attempts for{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdownLabel, { color: colors.muted }]}>
            Try again in:
          </Text>
          <View style={styles.timerContainer}>
            <Text style={[styles.countdownTime, { color: getTimeColor() }]}>
              {formatTime(timeRemaining)}
            </Text>
            <ActivityIndicator 
              size="small" 
              color={getTimeColor()} 
              style={styles.loadingIndicator}
            />
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          {onResetPassword && (
            <Button
              style={[styles.actionButton, styles.resetButton]}
              onPress={handleResetPassword}
              variant="outline"
            >
              <View style={styles.buttonContent}>
                <FontAwesome5 name="key" size={16} color={colors.primary} />
                <Text style={[styles.resetButtonText, { color: colors.primary }]}>
                  Reset Password
                </Text>
              </View>
            </Button>
          )}
          
          {onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Text style={[styles.dismissText, { color: colors.muted }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.helpContainer}>
          <FontAwesome5 name="info-circle" size={14} color={colors.muted} />
          <Text style={[styles.helpText, { color: colors.muted }]}>
            This security measure protects your account from unauthorized access attempts.
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  countdownLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownTime: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    height: 48,
  },
  resetButton: {
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
