import React, { useEffect } from 'react';
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
import { useAuth } from '../../src/contexts/OptimizedAuthContext';
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
  
  useEffect(() => {
    // Animate header
    headerOpacity.value = withTiming(1, { duration: 800 });
    
    // Animate stats
    statsScale.value = withDelay(400, withTiming(1, { duration: 800 }));
    
    // Animate activity section
    activityOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    
    // Animate quick actions
    quickActionsTranslateY.value = withDelay(800, withTiming(0, { duration: 800 }));
    
    // Animate stat numbers
    animatedStats.forEach((stat, index) => {
      stat.animatedValue.value = withDelay(
        500 + index * 100,
        withTiming(stat.value, { duration: 1500, easing: Easing.out(Easing.cubic) })
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
  
  // Handle button press with haptic feedback
  const handleQuickAction = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };
  
  // Component for the activity item
  const ActivityItem = ({ item }: { item: typeof RECENT_ACTIVITIES[0] }) => {
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
      <Animated.View entering={SlideInRight.delay(300).springify()} style={animatedStyle}>
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
  };
  
  // Component for the stat card
  const StatCard = ({ item }: { item: typeof animatedStats[0] }) => {
    const animatedValueStyle = useAnimatedStyle(() => {
      return {
        fontSize: 24,
        fontWeight: 'bold',
        color: item.color,
      };
    });
    
    const animatedTextValue = useAnimatedStyle(() => {
      return {
        fontSize: 24,
        fontWeight: 'bold',
        color: item.color,
      };
    });
    
    return (
      <Card
        style={[
          styles.statCard,
          { backgroundColor: colors.card, borderColor: colors.border }
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
        <Text style={[styles.statTitle, { color: colors.muted }]}>{item.title}</Text>
      </Card>
    );
  };
  
  // Component for the quick action button
  const QuickActionButton = ({ item }: { item: typeof QUICK_ACTIONS[0] }) => {
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
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleQuickAction(item.route)}
          style={styles.quickActionButton}
        >
          <LinearGradient
            colors={[item.color, item.color + 'AA']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name={item.icon} size={22} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.quickActionTitle, { color: colors.text }]}>{item.title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
            </View>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>C</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Section */}
      <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
        <FlatList
          data={animatedStats}
          renderItem={({ item }) => <StatCard item={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContent}
        />
      </Animated.View>

      {/* Recent Activity Section */}
      <Animated.View style={[styles.sectionContainer, activityAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activitiesContainer}>
          {RECENT_ACTIVITIES.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </View>
      </Animated.View>

      {/* Quick Actions Section */}
      <Animated.View style={[styles.sectionContainer, quickActionsAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((item) => (
            <QuickActionButton key={item.id} item={item} />
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerContainer: {
    width: '100%',
    height: 180,
    marginBottom: 16,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statIconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  activitiesContainer: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  activityContent: {
    marginLeft: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionContainer: {
    width: '48%',
    marginBottom: 16,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
