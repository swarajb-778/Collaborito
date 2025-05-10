import React, { useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Haptics from 'expo-haptics';
import { Card } from '../../components/ui/Card';
import { router } from 'expo-router';
import { getOptimizedAnimationDuration, cacheImages } from '../../src/utils/performance';

// Performance optimizations
const MemoizedCard = memo(Card);
const ANIMATION_DURATION = getOptimizedAnimationDuration(800);
const ANIMATION_DELAY = getOptimizedAnimationDuration(400);

// Mock data for recent activities
const RECENT_ACTIVITIES = [
  {
    id: '1',
    type: 'comment',
    title: 'Jane Smith commented on Mobile App Redesign',
    time: '10 minutes ago',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '2',
    type: 'task',
    title: 'Task "Create wireframes" marked as complete',
    time: '2 hours ago',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '3',
    type: 'project',
    title: 'You were added to Web Development project',
    time: '1 day ago',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Team meeting scheduled for tomorrow at 10 AM',
    time: '2 days ago',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
];

// Mock statistics
const STATS = [
  { id: '1', title: 'Projects', value: 5, icon: 'briefcase', color: '#4361EE' },
  { id: '2', title: 'Tasks', value: 12, icon: 'tasks', color: '#3F83F8' },
  { id: '3', title: 'Messages', value: 8, icon: 'comment-alt', color: '#8B5CF6' },
];

// Quick action items
const QUICK_ACTIONS = [
  { id: '1', title: 'New Project', icon: 'plus-square', color: '#4361EE', route: '/(tabs)/projects' },
  { id: '2', title: 'Start Meeting', icon: 'video', color: '#3F83F8', route: '/(tabs)/projects' },
  { id: '3', title: 'Add Task', icon: 'clipboard-list', color: '#8B5CF6', route: '/(tabs)/projects' },
  { id: '4', title: 'Send Message', icon: 'paper-plane', color: '#10B981', route: '/(tabs)/messages' },
];

// Memoized Activity Item Component
const ActivityItem = memo(({ item, colors }: { item: typeof RECENT_ACTIVITIES[0], colors: any }) => {
  const scale = useSharedValue(1);
  
  const onPressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };
  
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View entering={SlideInRight.duration(ANIMATION_DURATION).springify()} style={animatedStyle}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.8}
        style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.activityItemLeft}>
          <Image source={{ uri: item.avatar }} style={styles.activityAvatar} />
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.activityTime, { color: colors.muted }]}>{item.time}</Text>
          </View>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: colors.primary + '20' }]}>
          <FontAwesome5
            name={
              item.type === 'comment'
                ? 'comment'
                : item.type === 'task'
                ? 'check-circle'
                : item.type === 'project'
                ? 'folder-plus'
                : 'calendar'
            }
            size={12}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Memoized Stat Card Component
const StatCard = memo(({ item }: { item: any }) => {
  const animatedTextValue = useAnimatedStyle(() => {
    return {
      fontSize: 24,
      fontWeight: 'bold',
      color: item.color,
    };
  });
  
  return (
    <MemoizedCard
      style={[
        styles.statCard,
        { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }
      ]}
    >
      <View style={styles.statIconContainer}>
        <LinearGradient
          colors={[item.color + '40', item.color + '10']}
          style={styles.statIconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome5 name={item.icon} size={20} color={item.color} />
        </LinearGradient>
      </View>
      <Animated.Text style={animatedTextValue}>
        {Math.round(item.animatedValue.value)}
      </Animated.Text>
      <Text style={[styles.statTitle, { color: '#6B7280' }]}>{item.title}</Text>
    </MemoizedCard>
  );
});

// Memoized Quick Action Button
const QuickActionButton = memo(({ item, onPress }: { item: typeof QUICK_ACTIONS[0], onPress: () => void }) => {
  const scale = useSharedValue(1);
  
  const onPressIn = () => {
    scale.value = withTiming(0.92, { duration: 100 });
  };
  
  const onPressOut = () => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={[styles.quickActionContainer, animatedStyle]}>
      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: item.color + '10' }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[item.color + '30', item.color + '10']}
          style={styles.quickActionIconBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome5 name={item.icon} size={20} color={item.color} />
        </LinearGradient>
        <Text style={[styles.quickActionText, { color: item.color }]}>{item.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function Dashboard() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.8);
  const activityOpacity = useSharedValue(0);
  const quickActionsTranslateY = useSharedValue(100);
  
  // Animate stats values
  const animatedStats = STATS.map(stat => ({
    ...stat,
    animatedValue: useSharedValue(0),
  }));
  
  // Handle button press with haptic feedback
  const handleQuickAction = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  }, []);
  
  // Cache avatar images
  useEffect(() => {
    const cacheAvatars = async () => {
      const avatarUrls = RECENT_ACTIVITIES.map(activity => activity.avatar);
      for (const url of avatarUrls) {
        await cacheImages(url);
      }
    };
    
    cacheAvatars();
  }, []);
  
  useEffect(() => {
    // Faster animations with shorter durations
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATION / 2 });
    statsScale.value = withDelay(ANIMATION_DELAY / 2, withTiming(1, { duration: ANIMATION_DURATION / 2 }));
    activityOpacity.value = withDelay(ANIMATION_DELAY, withTiming(1, { duration: ANIMATION_DURATION / 2 }));
    quickActionsTranslateY.value = withDelay(ANIMATION_DELAY, withTiming(0, { duration: ANIMATION_DURATION / 2 }));
    
    // Animate stat numbers faster
    animatedStats.forEach((stat, index) => {
      stat.animatedValue.value = withDelay(
        ANIMATION_DELAY / 2 + index * 50,
        withTiming(stat.value, { 
          duration: ANIMATION_DURATION, 
          easing: Easing.out(Easing.cubic) 
        })
      );
    });
  }, []);
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statsScale.value }],
  }));
  
  const activityAnimatedStyle = useAnimatedStyle(() => ({
    opacity: activityOpacity.value,
  }));
  
  const quickActionsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: quickActionsTranslateY.value }],
  }));
  
  // Optimized rendering for the activity list
  const renderActivity = useCallback(({ item }: { item: typeof RECENT_ACTIVITIES[0] }) => (
    <ActivityItem item={item} colors={colors} />
  ), [colors]);
  
  // Keyextractor for FlatList
  const keyExtractor = useCallback((item: any) => item.id, []);
  
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Hello, {user?.firstName || 'User'}</Text>
            <Text style={[styles.greetingSubtext, { color: colors.muted }]}>Let's be productive today!</Text>
          </View>
          
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={{
                uri: user?.profileImage || 'https://randomuser.me/api/portraits/men/1.jpg',
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Stats section */}
      <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          {animatedStats.map((stat) => (
            <StatCard key={stat.id} item={stat} />
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* Recent Activity */}
      <Animated.View style={[styles.activityContainer, activityAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={RECENT_ACTIVITIES}
          renderItem={renderActivity}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.activityList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          removeClippedSubviews={true}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
        />
      </Animated.View>
      
      {/* Quick Actions */}
      <Animated.View style={[styles.quickActionsContainer, quickActionsAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionButton
              key={action.id}
              item={action}
              onPress={() => handleQuickAction(action.route)}
            />
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 14,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsScroll: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
  },
  statCard: {
    width: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 14,
    marginTop: 4,
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  activityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  quickActionContainer: {
    width: '48%',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  quickAction: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
