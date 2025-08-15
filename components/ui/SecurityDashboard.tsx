import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { Card } from './Card';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAuth } from '../../src/contexts/OptimizedAuthContext';

interface SecurityMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface SecurityDashboardProps {
  onNavigateToDevices?: () => void;
  onNavigateToLogs?: () => void;
  onNavigateToSettings?: () => void;
}

export function SecurityDashboard({
  onNavigateToDevices,
  onNavigateToLogs,
  onNavigateToSettings
}: SecurityDashboardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const cardScale = useSharedValue(0.95);
  
  useEffect(() => {
    loadSecurityMetrics();
    cardScale.value = withSpring(1);
  }, []);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });
  
  const loadSecurityMetrics = async () => {
    try {
      setLoading(true);
      
      // Simulate loading metrics - in a real app, these would come from APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: SecurityMetric[] = [
        {
          id: 'login-attempts',
          title: 'Login Attempts',
          value: 23,
          subtitle: 'Last 30 days',
          icon: 'sign-in-alt',
          color: colors.primary,
          trend: 'down',
          trendValue: '12%'
        },
        {
          id: 'trusted-devices',
          title: 'Trusted Devices',
          value: 3,
          subtitle: 'Active devices',
          icon: 'shield-alt',
          color: colors.success || '#22C55E',
          trend: 'stable',
          trendValue: '0'
        },
        {
          id: 'security-alerts',
          title: 'Security Alerts',
          value: 0,
          subtitle: 'Unresolved',
          icon: 'exclamation-triangle',
          color: colors.warning || '#F59E0B',
          trend: 'down',
          trendValue: '100%'
        },
        {
          id: 'session-duration',
          title: 'Avg Session',
          value: '2.4h',
          subtitle: 'This month',
          icon: 'clock',
          color: colors.primary,
          trend: 'up',
          trendValue: '8%'
        }
      ];
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'minus';
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#22C55E';
      case 'down':
        return '#EF4444';
      default:
        return colors.muted;
    }
  };
  
  const renderMetricCard = (metric: SecurityMetric, index: number) => (
    <Animated.View
      key={metric.id}
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={styles.metricCard}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF' }
        ]}
        padding={16}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
            <FontAwesome5 name={metric.icon} size={18} color={metric.color} />
          </View>
          
          {metric.trend && (
            <View style={styles.trendContainer}>
              <FontAwesome5 
                name={getTrendIcon(metric.trend)} 
                size={12} 
                color={getTrendColor(metric.trend)} 
              />
              <Text style={[styles.trendText, { color: getTrendColor(metric.trend) }]}>
                {metric.trendValue}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.metricValue, { color: colors.text }]}>
          {metric.value}
        </Text>
        
        <Text style={[styles.metricTitle, { color: colors.text }]}>
          {metric.title}
        </Text>
        
        {metric.subtitle && (
          <Text style={[styles.metricSubtitle, { color: colors.muted }]}>
            {metric.subtitle}
          </Text>
        )}
      </Card>
    </Animated.View>
  );
  
  const securityActions = [
    {
      id: 'devices',
      title: 'Manage Devices',
      subtitle: 'Trust, untrust, or revoke device access',
      icon: 'cogs',
      color: colors.primary,
      onPress: onNavigateToDevices
    },
    {
      id: 'logs',
      title: 'Security Logs',
      subtitle: 'View login attempts and security events',
      icon: 'list-alt',
      color: colors.warning || '#F59E0B',
      onPress: onNavigateToLogs
    },
    {
      id: 'settings',
      title: 'Security Settings',
      subtitle: 'Configure security preferences',
      icon: 'shield-alt',
      color: colors.success || '#22C55E',
      onPress: onNavigateToSettings
    }
  ];
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View 
        entering={FadeInRight.duration(600)}
        style={[styles.header, cardAnimatedStyle]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Security Overview
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            Monitor your account security and activity
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary + '20' }]}
          onPress={loadSecurityMetrics}
        >
          <FontAwesome5 name="sync-alt" size={16} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Security Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Security Metrics
        </Text>
        
        <View style={styles.metricsGrid}>
          {metrics.map(renderMetricCard)}
        </View>
      </View>
      
      {/* Security Status */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(600)}
        style={styles.statusContainer}
      >
        <Card
          style={[
            styles.statusCard,
            { 
              backgroundColor: colorScheme === 'dark' ? '#1A3D2E' : '#F0FDF4',
              borderColor: colors.success || '#22C55E'
            }
          ]}
          padding={16}
        >
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: colors.success || '#22C55E' }]}>
              <FontAwesome5 name="check-circle" size={20} color="white" />
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Account Security: Good
              </Text>
              <Text style={[styles.statusSubtitle, { color: colors.muted }]}>
                No security issues detected
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>
      
      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Security Actions
        </Text>
        
        {securityActions.map((action, index) => (
          <Animated.View
            key={action.id}
            entering={FadeInDown.delay(500 + index * 100).duration(400)}
          >
            <TouchableOpacity
              style={[
                styles.actionItem,
                { 
                  backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                  borderColor: colorScheme === 'dark' ? '#333' : '#E5E5E5'
                }
              ]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <FontAwesome5 name={action.icon} size={18} color={action.color} />
              </View>
              
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  {action.title}
                </Text>
                <Text style={[styles.actionSubtitle, { color: colors.muted }]}>
                  {action.subtitle}
                </Text>
              </View>
              
              <FontAwesome5 name="chevron-right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
});
