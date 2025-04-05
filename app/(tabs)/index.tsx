import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { useAuth } from '@/src/contexts/AuthContext';

// Placeholder data for recent activity
const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'message',
    project: 'Mobile App Development',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff',
    },
    content: 'added new wireframes to the project',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'task',
    project: 'Website Redesign',
    user: {
      name: 'Alex Chen',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=6366F1&color=fff',
    },
    content: 'completed task "Update color palette"',
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    type: 'invite',
    project: 'Marketing Campaign',
    user: {
      name: 'Marketing Team',
      avatar: 'https://ui-avatars.com/api/?name=Marketing+Team&background=10B981&color=fff',
    },
    content: 'invited you to join the project',
    timestamp: 'Yesterday',
  },
];

// Placeholder stats
const STATS = [
  { id: '1', label: 'Projects', value: 8, icon: 'project-diagram', color: '#4361EE' },
  { id: '2', label: 'Tasks', value: 17, icon: 'tasks', color: '#F59E0B' },
  { id: '3', label: 'Messages', value: 24, icon: 'comment-dots', color: '#10B981' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  // Animation values
  const scrollY = useSharedValue(0);
  
  const handleScroll = (event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };
  
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      { extrapolateRight: 'clamp' }
    );
    
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      { extrapolateRight: 'clamp' }
    );
    
    return {
      transform: [
        { scale },
        { translateY },
      ],
    };
  });

  const renderActivityItem = (item: typeof RECENT_ACTIVITY[0]) => {
    let iconName = '';
    let iconColor = '';
    
    switch (item.type) {
      case 'message':
        iconName = 'comment-dots';
        iconColor = colors.secondary;
        break;
      case 'task':
        iconName = 'check-circle';
        iconColor = colors.success;
        break;
      case 'invite':
        iconName = 'user-plus';
        iconColor = colors.tertiary;
        break;
    }
    
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.activityItem, { borderBottomColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => console.log(`Navigate to ${item.type} ${item.id}`)}
      >
        <View style={[styles.activityIconContainer, { backgroundColor: `${iconColor}20` }]}>
          <FontAwesome5 name={iconName} size={16} color={iconColor} />
        </View>
        
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Image source={{ uri: item.user.avatar }} style={styles.activityAvatar} />
            <Text style={[styles.activityUserName, { color: colors.text }]}>{item.user.name}</Text>
          </View>
          
          <Text style={[styles.activityText, { color: colors.text }]}>
            {item.content}
          </Text>
          
          <View style={styles.activityFooter}>
            <Text style={[styles.activityProject, { color: colors.primary }]}>
              {item.project}
            </Text>
            <Text style={[styles.activityTimestamp, { color: colors.muted }]}>
              {item.timestamp}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.primary, colorScheme === 'dark' ? colors.background : colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || 'User'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => console.log('Navigate to profile')}
            >
              <Image 
                source={{ 
                  uri: user?.user_metadata?.avatar_url || 
                    'https://ui-avatars.com/api/?name=User&background=3F83F8&color=fff'
                }}
                style={styles.userAvatar}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.statsContainer}>
          {STATS.map(stat => (
            <Card key={stat.id} style={styles.statCard} variant="elevated">
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <FontAwesome5 name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.activityCard}>
          {RECENT_ACTIVITY.map(renderActivityItem)}
          
          {RECENT_ACTIVITY.length === 0 && (
            <View style={styles.emptyActivity}>
              <FontAwesome5 name="history" size={40} color={colors.muted} />
              <Text style={[styles.emptyActivityText, { color: colors.muted }]}>
                No recent activity
              </Text>
            </View>
          )}
        </Card>
        
        <Card style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <View style={styles.aiIconContainer}>
              <FontAwesome5 name="robot" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.aiCardTitle, { color: colors.text }]}>AI Assistant</Text>
          </View>
          
          <Text style={[styles.aiCardDescription, { color: colors.muted }]}>
            Use Claude AI to generate tasks, summarize discussions, or get help with your projects.
          </Text>
          
          <Button
            onPress={() => console.log('Open AI Assistant')}
            style={styles.aiCardButton}
            variant="primary"
            rightIcon={<FontAwesome5 name="arrow-right" size={14} color="#FFFFFF" />}
          >
            Open Assistant
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
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
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 140,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  activityUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityText: {
    fontSize: 14,
    marginBottom: 8,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityProject: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityTimestamp: {
    fontSize: 12,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 40,
  },
  emptyActivityText: {
    marginTop: 12,
    fontSize: 16,
  },
  aiCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F0F5FF', // Light blue background for AI card
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiCardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  aiCardButton: {
    alignSelf: 'flex-end',
  },
});
