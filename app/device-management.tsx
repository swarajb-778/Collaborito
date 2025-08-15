import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/OptimizedAuthContext';
import { DeviceRegistrationService } from '../src/services/DeviceRegistrationService';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Device {
  id: string;
  device_name: string;
  device_fingerprint: string;
  os: string;
  browser?: string;
  ip_address?: string;
  first_seen: string;
  last_seen: string;
  is_trusted: boolean;
  is_current?: boolean;
}

export default function DeviceManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingDeviceId, setProcessingDeviceId] = useState<string | null>(null);
  
  // Animation values
  const headerScale = useSharedValue(0.95);
  
  useEffect(() => {
    loadDevices();
    
    // Entrance animation
    headerScale.value = withSpring(1);
  }, []);
  
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: headerScale.value }],
    };
  });
  
  const loadDevices = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Use the enhanced service method to get all devices
      const allDevices = await DeviceRegistrationService.getAllDevices(user.id);
      
      // Add current device detection
      const devicesWithCurrent = await Promise.all(
        allDevices.map(async (device: any) => {
          const isCurrent = await DeviceRegistrationService.isCurrentDevice(device.device_fingerprint);
          return {
            ...device,
            is_current: isCurrent
          };
        })
      );
      
      setDevices(devicesWithCurrent);
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Error', 'Failed to load device list. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };
  
  const handleTrustDevice = async (device: Device) => {
    if (!user?.id) return;
    
    try {
      setProcessingDeviceId(device.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await DeviceRegistrationService.trustDevice(user.id, device.device_fingerprint);
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === device.id ? { ...d, is_trusted: true } : d
      ));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to trust device:', error);
      Alert.alert('Error', 'Failed to trust device. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessingDeviceId(null);
    }
  };
  
  const handleUntrustDevice = async (device: Device) => {
    if (!user?.id) return;
    
    Alert.alert(
      'Untrust Device',
      `Are you sure you want to untrust "${device.device_name}"? You'll need to verify your identity again when signing in from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Untrust',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingDeviceId(device.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              await DeviceRegistrationService.untrustDevice(user.id, device.device_fingerprint);
              
              // Update local state
              setDevices(devices.map(d => 
                d.id === device.id ? { ...d, is_trusted: false } : d
              ));
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to untrust device:', error);
              Alert.alert('Error', 'Failed to untrust device. Please try again.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setProcessingDeviceId(null);
            }
          }
        }
      ]
    );
  };
  
  const handleRevokeDevice = async (device: Device) => {
    if (!user?.id) return;
    
    Alert.alert(
      'Revoke Device Access',
      `Are you sure you want to completely revoke access for "${device.device_name}"? This device will be logged out and removed from your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingDeviceId(device.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              
              await DeviceRegistrationService.revokeDevice(user.id, device.device_fingerprint);
              
              // Remove from local state
              setDevices(devices.filter(d => d.id !== device.id));
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to revoke device:', error);
              Alert.alert('Error', 'Failed to revoke device access. Please try again.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setProcessingDeviceId(null);
            }
          }
        }
      ]
    );
  };
  
  const getDeviceIcon = (device: Device) => {
    const os = device.os?.toLowerCase() || '';
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
  
  const getDeviceColor = (device: Device) => {
    if (device.is_current) return colors.primary;
    if (device.is_trusted) return colors.success || '#22C55E';
    return colors.muted;
  };
  
  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  const renderDevice = (device: Device, index: number) => {
    const isProcessing = processingDeviceId === device.id;
    
    return (
      <Animated.View
        key={device.id}
        entering={FadeInDown.delay(index * 100).duration(400)}
      >
        <Card
          style={[
            styles.deviceCard,
            {
              backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
              borderColor: device.is_current 
                ? colors.primary 
                : colorScheme === 'dark' ? '#333' : '#E5E5E5'
            }
          ]}
          padding={16}
        >
          <View style={styles.deviceHeader}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIconContainer, { backgroundColor: getDeviceColor(device) + '20' }]}>
                <FontAwesome5 
                  name={getDeviceIcon(device)} 
                  size={20} 
                  color={getDeviceColor(device)} 
                />
              </View>
              
              <View style={styles.deviceDetails}>
                <View style={styles.deviceNameRow}>
                  <Text style={[styles.deviceName, { color: colors.text }]}>
                    {device.device_name}
                  </Text>
                  {device.is_current && (
                    <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                  {device.is_trusted && !device.is_current && (
                    <FontAwesome5 name="shield-alt" size={14} color={colors.success || '#22C55E'} />
                  )}
                </View>
                
                <Text style={[styles.deviceMeta, { color: colors.muted }]}>
                  {device.os} • {formatLastSeen(device.last_seen)}
                </Text>
                
                {device.ip_address && (
                  <Text style={[styles.deviceIP, { color: colors.muted }]}>
                    {device.ip_address}
                  </Text>
                )}
              </View>
            </View>
            
            {isProcessing && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
          
          <View style={styles.deviceActions}>
            {!device.is_trusted && !device.is_current && (
              <TouchableOpacity
                style={[styles.actionButton, styles.trustButton, { backgroundColor: colors.success || '#22C55E' }]}
                onPress={() => handleTrustDevice(device)}
                disabled={isProcessing}
              >
                <FontAwesome5 name="shield-alt" size={14} color="white" />
                <Text style={styles.actionButtonText}>Trust</Text>
              </TouchableOpacity>
            )}
            
            {device.is_trusted && !device.is_current && (
              <TouchableOpacity
                style={[styles.actionButton, styles.untrustButton, { backgroundColor: colors.warning || '#F59E0B' }]}
                onPress={() => handleUntrustDevice(device)}
                disabled={isProcessing}
              >
                <FontAwesome5 name="shield-alt" size={14} color="white" />
                <Text style={styles.actionButtonText}>Untrust</Text>
              </TouchableOpacity>
            )}
            
            {!device.is_current && (
              <TouchableOpacity
                style={[styles.actionButton, styles.revokeButton, { backgroundColor: colors.destructive }]}
                onPress={() => handleRevokeDevice(device)}
                disabled={isProcessing}
              >
                <FontAwesome5 name="times" size={14} color="white" />
                <Text style={styles.actionButtonText}>Revoke</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top }, headerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <FontAwesome5 name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Device Management
        </Text>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <FontAwesome5 
            name="sync-alt" 
            size={18} 
            color={colors.text} 
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={styles.infoCard}>
          <Card style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#F8F9FA' }]} padding={16}>
            <View style={styles.infoHeader}>
              <FontAwesome5 name="info-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Device Security
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Manage devices that have access to your account. Trusted devices won't require additional verification when signing in.
            </Text>
          </Card>
        </Animated.View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading devices...
            </Text>
          </View>
        ) : devices.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.emptyContainer}>
            <FontAwesome5 name="mobile-alt" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Devices Found
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No trusted devices are registered to your account yet.
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.devicesList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Devices ({devices.length})
            </Text>
            {devices.map(renderDevice)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deviceMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  deviceIP: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trustButton: {},
  untrustButton: {},
  revokeButton: {},
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
