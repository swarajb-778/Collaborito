import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { AvatarUploadProgress } from '../../src/services/AvatarUploadService';

export interface AvatarUploadProgressProps {
  visible: boolean;
  progress: AvatarUploadProgress;
  onComplete?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const AvatarUploadProgressModal: React.FC<AvatarUploadProgressProps> = ({
  visible,
  progress,
  onComplete,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress.progress]);

  // Pulse animation for active states
  useEffect(() => {
    if (progress.stage === 'compressing' || progress.stage === 'uploading') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [progress.stage]);

  // Fade in animation
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Auto-dismiss on completion
  useEffect(() => {
    if (progress.stage === 'completed' && progress.progress === 100) {
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [progress.stage, progress.progress, onComplete]);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'compressing':
        return '🗜️';
      case 'uploading':
        return '☁️';
      case 'updating_profile':
        return '👤';
      case 'cleaning_up':
        return '🧹';
      case 'completed':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'compressing':
        return ['#ff9a9e', '#fecfef'];
      case 'uploading':
        return ['#667eea', '#764ba2'];
      case 'updating_profile':
        return ['#4facfe', '#00f2fe'];
      case 'cleaning_up':
        return ['#43e97b', '#38f9d7'];
      case 'completed':
        return ['#fa709a', '#fee140'];
      default:
        return ['#a8edea', '#fed6e3'];
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.7)" translucent />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={[styles.card, { backgroundColor }]}>
              {/* Icon */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={getStageColor(progress.stage) as any}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.iconText}>
                    {getStageIcon(progress.stage)}
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: textColor + '20' }]}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={getStageColor(progress.stage) as any}
                      style={styles.progressGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </Animated.View>
                </View>

                {/* Progress Text */}
                <Text style={[styles.progressText, { color: textColor }]}>
                  {Math.round(progress.progress)}%
                </Text>
              </View>

              {/* Status Message */}
              <Text style={[styles.statusMessage, { color: textColor }]}>
                {progress.message}
              </Text>

              {/* Current File (if applicable) */}
              {progress.currentFile && (
                <Text style={[styles.currentFile, { color: textColor + '80' }]}>
                  {progress.currentFile}
                </Text>
              )}

              {/* Stage Indicators */}
              <View style={styles.stageIndicators}>
                {['compressing', 'uploading', 'updating_profile', 'cleaning_up', 'completed'].map((stage, index) => (
                  <View
                    key={stage}
                    style={[
                      styles.stageIndicator,
                      {
                        backgroundColor: getStageIndex(progress.stage) >= index
                          ? tintColor
                          : textColor + '20',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const getStageIndex = (stage: string): number => {
  const stages = ['compressing', 'uploading', 'updating_profile', 'cleaning_up', 'completed'];
  return stages.indexOf(stage);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth - 40,
    maxWidth: 320,
  },
  card: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  currentFile: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  stageIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AvatarUploadProgressModal; 