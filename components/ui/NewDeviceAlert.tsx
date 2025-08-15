import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  FadeInDown,
  FadeOutUp
} from 'react-native-reanimated';
import { Card } from './Card';
import { Button } from './Button';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DeviceInfo {
  device_name: string;
  os: string;
  browser?: string;
  ip_address?: string;
  location?: string;
  device_fingerprint: string;
}

interface NewDeviceAlertProps {
  isVisible: boolean;
  deviceInfo: DeviceInfo;
  onTrustDevice: () => void;
  onViewDetails: () => void;
  onDismiss: () => void;
  onDontTrust: () => void;
}

export function NewDeviceAlert({
  isVisible,
  deviceInfo,
  onTrustDevice,
  onViewDetails,
  onDismiss,
  onDontTrust
}: NewDeviceAlertProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      scale.value = withTiming(0.9);
      opacity.value = withTiming(0);
    }
  }, [isVisible]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  const getDeviceIcon = () => {
    const os = deviceInfo.os?.toLowerCase() || '';
    if (os.includes('ios') || os.includes('iphone') || os.includes('ipad')) {
      return 'mobile-alt';
    } else if (os.includes('android')) {
      return 'mobile-alt';
    } else if (os.includes('windows') || os.includes('mac') || os.includes('linux')) {
      return 'laptop';
    } else {
      return 'desktop';
    }
  };
  
  const handleTrustDevice = async () => {
    setIsProcessing('trust');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await onTrustDevice();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleDontTrust = async () => {
    setIsProcessing('dont-trust');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      await onDontTrust();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleViewDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewDetails();
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
      entering={FadeInDown.duration(500)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }
      ]}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
              borderColor: colors.warning || '#F59E0B',
            }
          ]}
          padding={0}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: (colors.warning || '#F59E0B') + '15' }]}>
            <View style={styles.headerIcon}>
              <View style={[styles.iconCircle, { backgroundColor: colors.warning || '#F59E0B' }]}>
                <FontAwesome5 name="exclamation-triangle" size={20} color="white" />
              </View>
            </View>
            
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                New Device Login Detected
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
                Someone just signed in to your account
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5 name="times" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
          
          {/* Device Info */}
          <View style={styles.deviceSection}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <FontAwesome5 name={getDeviceIcon()} size={24} color={colors.primary} />
              </View>
              
              <View style={styles.deviceDetails}>
                <Text style={[styles.deviceName, { color: colors.text }]}>
                  {deviceInfo.device_name}
                </Text>
                <Text style={[styles.deviceMeta, { color: colors.muted }]}>
                  {deviceInfo.os}
                  {deviceInfo.browser && ` • ${deviceInfo.browser}`}
                </Text>
                
                {deviceInfo.ip_address && (
                  <Text style={[styles.deviceIP, { color: colors.muted }]}>
                    IP: {deviceInfo.ip_address}
                  </Text>
                )}
                
                {deviceInfo.location && (
                  <Text style={[styles.deviceLocation, { color: colors.muted }]}>
                    📍 {deviceInfo.location}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewDetails}
            >
              <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
                View Details
              </Text>
              <FontAwesome5 name="chevron-right" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Security Message */}
          <View style={[styles.securityMessage, { backgroundColor: colors.destructive + '10' }]}>
            <FontAwesome5 name="shield-alt" size={16} color={colors.destructive} />
            <Text style={[styles.securityText, { color: colors.text }]}>
              If this was you, you can trust this device to skip verification next time.
              If not, secure your account immediately.
            </Text>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.primaryActions}>
              <Button
                style={[styles.actionButton, styles.trustButton, { backgroundColor: colors.success || '#22C55E' }]}
                onPress={handleTrustDevice}
                disabled={!!isProcessing}
              >
                <View style={styles.buttonContent}>
                  {isProcessing === 'trust' ? (
                    <FontAwesome5 name="spinner" size={14} color="white" />
                  ) : (
                    <FontAwesome5 name="shield-alt" size={14} color="white" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isProcessing === 'trust' ? 'Trusting...' : 'Trust Device'}
                  </Text>
                </View>
              </Button>
              
              <Button
                style={[styles.actionButton, styles.dontTrustButton, { backgroundColor: colors.destructive }]}
                onPress={handleDontTrust}
                disabled={!!isProcessing}
              >
                <View style={styles.buttonContent}>
                  {isProcessing === 'dont-trust' ? (
                    <FontAwesome5 name="spinner" size={14} color="white" />
                  ) : (
                    <FontAwesome5 name="times-circle" size={14} color="white" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isProcessing === 'dont-trust' ? 'Processing...' : "This Wasn't Me"}
                  </Text>
                </View>
              </Button>
            </View>
            
            <TouchableOpacity
              style={styles.dismissAction}
              onPress={handleDismiss}
            >
              <Text style={[styles.dismissActionText, { color: colors.muted }]}>
                I'll decide later
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10000,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerIcon: {
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceSection: {
    padding: 20,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  deviceIP: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    padding: 20,
    paddingTop: 16,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
  },
  trustButton: {},
  dontTrustButton: {},
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissAction: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissActionText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
