import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  useAnimatedProps
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { calculatePasswordStrength } from '../../src/utils/securityConfig';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
  style?: any;
}

export function PasswordStrengthIndicator({ 
  password, 
  showDetails = true, 
  style 
}: PasswordStrengthIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { score, level, feedback } = calculatePasswordStrength(password);
  
  // Animation values
  const progressWidth = useSharedValue(0);
  const barScale = useSharedValue(1);
  
  React.useEffect(() => {
    progressWidth.value = withTiming(score, { duration: 500 });
    
    // Pulse animation when password changes
    if (password) {
      barScale.value = withSequence(
        withSpring(1.02, { duration: 100 }),
        withSpring(1, { duration: 100 })
      );
    }
  }, [password, score]);
  
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });
  
  const barAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleY: barScale.value }],
    };
  });
  
  const getStrengthColor = () => {
    if (score < 20) return '#FF4444'; // Very Weak - Red
    if (score < 40) return '#FF8C00'; // Weak - Orange
    if (score < 60) return '#FFD700'; // Fair - Yellow
    if (score < 80) return '#9ACD32'; // Good - Yellow-Green
    if (score < 95) return '#32CD32'; // Strong - Green
    return '#228B22'; // Very Strong - Dark Green
  };
  
  const getStrengthIcon = () => {
    if (score < 20) return 'exclamation-triangle';
    if (score < 40) return 'exclamation-circle';
    if (score < 60) return 'minus-circle';
    if (score < 80) return 'check-circle';
    return 'shield-alt';
  };
  
  if (!password) {
    return null;
  }
  
  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBackground, 
            { backgroundColor: colorScheme === 'dark' ? '#333' : '#E5E5E5' },
            barAnimatedStyle
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              { backgroundColor: getStrengthColor() },
              progressAnimatedStyle,
            ]}
          />
        </Animated.View>
        
        <View style={styles.strengthInfo}>
          <FontAwesome5 
            name={getStrengthIcon()} 
            size={14} 
            color={getStrengthColor()} 
            style={styles.strengthIcon}
          />
          <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
            {level}
          </Text>
          <Text style={[styles.scoreText, { color: colors.muted }]}>
            ({score}%)
          </Text>
        </View>
      </View>
      
      {/* Detailed Feedback */}
      {showDetails && feedback.length > 0 && (
        <Animated.View 
          entering={FadeInDown.duration(300)}
          style={styles.feedbackContainer}
        >
          <Text style={[styles.feedbackTitle, { color: colors.text }]}>
            To improve strength:
          </Text>
          {feedback.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.feedbackItem}>
              <FontAwesome5 
                name="chevron-right" 
                size={10} 
                color={colors.muted} 
                style={styles.feedbackIcon}
              />
              <Text style={[styles.feedbackText, { color: colors.muted }]}>
                {item}
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
      
      {/* Strength Legend */}
      {showDetails && score > 0 && (
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            {[
              { label: 'Very Weak', color: '#FF4444', range: '0-19%' },
              { label: 'Weak', color: '#FF8C00', range: '20-39%' },
              { label: 'Fair', color: '#FFD700', range: '40-59%' },
              { label: 'Good', color: '#9ACD32', range: '60-79%' },
              { label: 'Strong', color: '#32CD32', range: '80-94%' },
              { label: 'Very Strong', color: '#228B22', range: '95-100%' },
            ].map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.muted }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Helper function for sequence animation (since it's not in the import)
function withSequence(...animations: any[]) {
  return animations.reduce((acc, animation, index) => {
    if (index === 0) return animation;
    return withTiming(animation);
  });
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  strengthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthIcon: {
    width: 14,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '400',
  },
  feedbackContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    gap: 4,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackIcon: {
    width: 10,
  },
  feedbackText: {
    fontSize: 11,
    flex: 1,
  },
  legendContainer: {
    marginTop: 12,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});

