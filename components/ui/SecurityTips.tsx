import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { Card } from './Card';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';

interface SecurityTip {
  id: string;
  title: string;
  description: string;
  category: 'password' | 'device' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
  completed?: boolean;
}

interface SecurityTipsProps {
  onNavigateToSecurity?: () => void;
  onDismissTip?: (tipId: string) => void;
}

export function SecurityTips({ onNavigateToSecurity, onDismissTip }: SecurityTipsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [tips, setTips] = useState<SecurityTip[]>([
    {
      id: 'strong-password',
      title: 'Use a Strong Password',
      description: 'Your password should be at least 12 characters long with a mix of letters, numbers, and symbols.',
      category: 'password',
      priority: 'high',
      icon: 'key',
      actionLabel: 'Update Password',
      onAction: () => console.log('Navigate to password change')
    },
    {
      id: 'trust-devices',
      title: 'Review Trusted Devices',
      description: 'Regularly check your trusted devices and remove any you no longer use or recognize.',
      category: 'device',
      priority: 'medium',
      icon: 'shield-alt',
      actionLabel: 'Manage Devices',
      onAction: onNavigateToSecurity
    },
    {
      id: 'enable-notifications',
      title: 'Enable Security Notifications',
      description: 'Get alerted when someone signs in from a new device or location.',
      category: 'account',
      priority: 'medium',
      icon: 'bell',
      actionLabel: 'Enable Alerts'
    },
    {
      id: 'regular-review',
      title: 'Review Account Activity',
      description: 'Check your login history and security logs regularly for any suspicious activity.',
      category: 'general',
      priority: 'low',
      icon: 'history',
      actionLabel: 'View Activity'
    },
    {
      id: 'secure-connection',
      title: 'Use Secure Networks',
      description: 'Avoid using public Wi-Fi for sensitive activities. Use a VPN when necessary.',
      category: 'general',
      priority: 'medium',
      icon: 'wifi',
    },
    {
      id: 'logout-public',
      title: 'Sign Out on Public Devices',
      description: 'Always sign out when using shared or public computers.',
      category: 'account',
      priority: 'high',
      icon: 'sign-out-alt',
    }
  ]);

  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return colors.muted;
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'password':
        return 'key';
      case 'device':
        return 'mobile-alt';
      case 'account':
        return 'user-shield';
      case 'general':
        return 'shield-alt';
      default:
        return 'info-circle';
    }
  };
  
  const handleTipPress = (tipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedTip(expandedTip === tipId ? null : tipId);
  };
  
  const handleTipAction = (tip: SecurityTip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tip.onAction?.();
  };
  
  const handleDismissTip = (tipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTips(tips.filter(tip => tip.id !== tipId));
    onDismissTip?.(tipId);
  };
  
  const markTipCompleted = (tipId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTips(tips.map(tip => 
      tip.id === tipId ? { ...tip, completed: true } : tip
    ));
  };
  
  const groupedTips = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) {
      acc[tip.category] = [];
    }
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, SecurityTip[]>);
  
  const categoryTitles = {
    password: 'Password Security',
    device: 'Device Management',
    account: 'Account Protection',
    general: 'General Security'
  };
  
  const renderTip = (tip: SecurityTip, index: number) => {
    const isExpanded = expandedTip === tip.id;
    
    return (
      <Animated.View
        key={tip.id}
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={styles.tipContainer}
      >
        <TouchableOpacity
          onPress={() => handleTipPress(tip.id)}
          activeOpacity={0.7}
        >
          <Card
            style={[
              styles.tipCard,
              {
                backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                borderLeftColor: getPriorityColor(tip.priority),
                borderLeftWidth: 4,
              }
            ]}
            padding={16}
          >
            <View style={styles.tipHeader}>
              <View style={styles.tipInfo}>
                <View style={[styles.tipIcon, { backgroundColor: getPriorityColor(tip.priority) + '20' }]}>
                  <FontAwesome5 
                    name={tip.icon} 
                    size={16} 
                    color={getPriorityColor(tip.priority)} 
                  />
                </View>
                
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>
                    {tip.title}
                  </Text>
                  <Text style={[styles.tipPriority, { color: getPriorityColor(tip.priority) }]}>
                    {tip.priority.charAt(0).toUpperCase() + tip.priority.slice(1)} Priority
                  </Text>
                </View>
              </View>
              
              <View style={styles.tipActions}>
                {tip.completed && (
                  <View style={[styles.completedBadge, { backgroundColor: colors.success || '#22C55E' }]}>
                    <FontAwesome5 name="check" size={12} color="white" />
                  </View>
                )}
                
                <FontAwesome5 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color={colors.muted} 
                />
              </View>
            </View>
            
            {isExpanded && (
              <Animated.View 
                entering={FadeInDown.duration(200)}
                style={styles.tipDetails}
              >
                <Text style={[styles.tipDescription, { color: colors.muted }]}>
                  {tip.description}
                </Text>
                
                <View style={styles.tipButtons}>
                  {tip.actionLabel && tip.onAction && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleTipAction(tip)}
                    >
                      <Text style={styles.actionButtonText}>
                        {tip.actionLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {!tip.completed && (
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: colors.success || '#22C55E' }]}
                      onPress={() => markTipCompleted(tip.id)}
                    >
                      <FontAwesome5 name="check" size={14} color="white" />
                      <Text style={styles.completeButtonText}>
                        Mark Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.dismissButton, { backgroundColor: colors.muted + '20' }]}
                    onPress={() => handleDismissTip(tip.id)}
                  >
                    <FontAwesome5 name="times" size={12} color={colors.muted} />
                    <Text style={[styles.dismissButtonText, { color: colors.muted }]}>
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderCategory = (category: string, categoryTips: SecurityTip[]) => (
    <View key={category} style={styles.categoryContainer}>
      <Animated.View 
        entering={FadeInRight.duration(500)}
        style={styles.categoryHeader}
      >
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
          <FontAwesome5 
            name={getCategoryIcon(category)} 
            size={18} 
            color={colors.primary} 
          />
        </View>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          {categoryTitles[category as keyof typeof categoryTitles]}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.categoryBadgeText}>
            {categoryTips.length}
          </Text>
        </View>
      </Animated.View>
      
      {categoryTips.map((tip, index) => renderTip(tip, index))}
    </View>
  );
  
  if (tips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="shield-alt" size={48} color={colors.muted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          All Security Tips Completed!
        </Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          You're following all our security best practices.
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View 
        entering={FadeInRight.duration(600)}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Security Tips
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          Follow these recommendations to keep your account secure
        </Text>
      </Animated.View>
      
      {Object.entries(groupedTips).map(([category, categoryTips]) =>
        renderCategory(category, categoryTips)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tipContainer: {
    marginBottom: 12,
  },
  tipCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tipPriority: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  tipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tipButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

