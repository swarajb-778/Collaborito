import React from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Placeholder user data
const USER = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3F83F8&color=fff',
  role: 'Product Manager',
  company: 'Acme Inc.',
  location: 'San Francisco, CA',
  bio: 'Passionate about building products that solve real-world problems. Currently focused on collaboration tools and AI integration.',
  skills: ['Product Management', 'UX/UI Design', 'Agile Methodology', 'Team Leadership'],
  connections: 142,
  projects: 8,
  tasks: 17,
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signOut } = useAuth();
  
  // Animation values
  const avatarScale = useSharedValue(1);
  
  const animatedAvatarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: avatarScale.value }],
    };
  });
  
  const handlePressAvatar = () => {
    avatarScale.value = withSpring(1.1, { damping: 10 }, () => {
      avatarScale.value = withSpring(1);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colorScheme === 'dark' ? colors.background : colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => console.log('Navigate to settings')}
          >
            <FontAwesome5 name="cog" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePressAvatar} activeOpacity={0.8}>
            <Animated.View style={[styles.avatarContainer, animatedAvatarStyle]}>
              <Image source={{ uri: USER.avatar }} style={styles.avatar} />
              <View style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}>
                <FontAwesome5 name="camera" size={12} color="#FFFFFF" />
              </View>
            </Animated.View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: colors.text }]}>{USER.name}</Text>
          <Text style={[styles.userRole, { color: colors.muted }]}>{USER.role} • {USER.company}</Text>
          
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{USER.projects}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Projects</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{USER.tasks}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Tasks</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{USER.connections}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Connections</Text>
            </View>
          </View>
        </View>
        
        <Card style={styles.bioCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.bioText, { color: colors.text }]}>{USER.bio}</Text>
        </Card>
        
        <Card style={styles.skillsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills</Text>
          <View style={styles.skillsContainer}>
            {USER.skills.map((skill, index) => (
              <View 
                key={index} 
                style={[styles.skillBadge, { backgroundColor: colorScheme === 'dark' ? colors.card : colors.lightGray }]}
              >
                <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </Card>
        
        <Card style={styles.actionsCard}>
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.border }]}
            onPress={() => console.log('Navigate to edit profile')}
          >
            <FontAwesome5 name="user-edit" size={18} color={colors.primary} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: colors.text }]}>Edit Profile</Text>
            <FontAwesome5 name="chevron-right" size={14} color={colors.muted} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.border }]}
            onPress={() => console.log('Navigate to notifications')}
          >
            <FontAwesome5 name="bell" size={18} color={colors.primary} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: colors.text }]}>Notifications</Text>
            <FontAwesome5 name="chevron-right" size={14} color={colors.muted} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => signOut()}
          >
            <FontAwesome5 name="sign-out-alt" size={18} color={colors.error} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: colors.error }]}>Sign Out</Text>
            <FontAwesome5 name="chevron-right" size={14} color={colors.muted} />
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    marginBottom: 16,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  bioCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  skillsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
  },
}); 