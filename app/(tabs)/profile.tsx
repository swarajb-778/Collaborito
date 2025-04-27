import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/ui/Card';
import { useColorScheme } from '../../hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';

// Fallback user data
const USER = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  role: 'Product Designer',
  company: 'Collaborito Inc.',
  location: 'San Francisco, CA',
  bio: 'Passionate product designer with 5+ years of experience in creating user-centered digital products. Specializing in mobile app design and design systems.',
  skills: ['UI Design', 'UX Research', 'Figma', 'Prototyping', 'Design Systems'],
  connections: 234,
  projects: 12,
  tasks: 5
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('Bio');
  
  // Determine theme-based styles
  const themeStyles = {
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
    textColor: colorScheme === 'dark' ? '#fff' : '#000',
    cardBackground: colorScheme === 'dark' ? '#1E1E1E' : '#fff',
    mutedTextColor: colorScheme === 'dark' ? '#BBBBBB' : '#666666',
  };
  
  useEffect(() => {
    // Log the user info to verify what data we have
    console.log('Current user data:', user);
  }, [user]);
  
  // Avatar animation
  const scale = useSharedValue(1);
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleAvatarPress = () => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  // Get the display name from the auth user or fallback
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.email) {
      return user.email.split('@')[0]; // Extract username from email
    }
    return USER.name;
  };

  // Get the profile image from the auth user or fallback
  const getProfileImage = () => {
    return user?.profileImage || USER.avatar;
  };

  // Get the auth provider name for display
  const getAuthProviderName = () => {
    if (!user?.oauthProvider) return 'Email';
    
    switch (user.oauthProvider) {
      case 'email': return 'Email & Password';
      case 'linkedin': return 'LinkedIn';
      case 'linkedin_mock': return 'LinkedIn (Demo)';
      default: return user.oauthProvider;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Bio':
        return (
          <Card style={styles.bioCard}>
            <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Bio</Text>
            <Text style={[styles.bioText, { color: themeStyles.textColor }]}>
              {user?.oauthProvider === 'linkedin'
                ? `Professional LinkedIn user with expertise in collaboration and networking. Connect with me to explore opportunities in the Collaborito platform.`
                : USER.bio}
            </Text>
          </Card>
        );
      case 'Skills':
        return (
          <Card style={styles.skillsCard}>
            <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Skills</Text>
            <View style={styles.skillsContainer}>
              {user?.oauthProvider === 'linkedin' ? (
                // LinkedIn-specific skills
                ['Networking', 'Collaboration', 'Professional', 'Team Building', 'Communication'].map((skill, index) => (
                  <View key={index} style={[styles.skillBadge, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E0E7FF' }]}>
                    <Text style={[styles.skillText, { color: colorScheme === 'dark' ? '#94A3B8' : '#4361EE' }]}>{skill}</Text>
                  </View>
                ))
              ) : (
                // Default skills
                USER.skills.map((skill, index) => (
                  <View key={index} style={[styles.skillBadge, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E0E7FF' }]}>
                    <Text style={[styles.skillText, { color: colorScheme === 'dark' ? '#94A3B8' : '#4361EE' }]}>{skill}</Text>
                  </View>
                ))
              )}
            </View>
          </Card>
        );
      case 'Account':
        return (
          <Card style={styles.authInfoCard}>
            <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Account Information</Text>
            <View style={styles.authInfoItem}>
              <Text style={[styles.authInfoLabel, { color: themeStyles.mutedTextColor }]}>Signed in with:</Text>
              <Text style={[styles.authInfoValue, { color: themeStyles.textColor }]}>{getAuthProviderName()}</Text>
            </View>
            <View style={styles.authInfoItem}>
              <Text style={[styles.authInfoLabel, { color: themeStyles.mutedTextColor }]}>Email:</Text>
              <Text style={[styles.authInfoValue, { color: themeStyles.textColor }]}>{user?.email || USER.email}</Text>
            </View>
            {user?.id && (
              <View style={styles.authInfoItem}>
                <Text style={[styles.authInfoLabel, { color: themeStyles.mutedTextColor }]}>User ID:</Text>
                <Text style={[styles.authInfoValue, { color: themeStyles.textColor }]}>{user.id}</Text>
              </View>
            )}
          </Card>
        );
      case 'Actions':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}
              onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
            >
              <FontAwesome5 name="user-edit" size={20} color={themeStyles.textColor} />
              <Text style={[styles.actionText, { color: themeStyles.textColor }]}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}
              onPress={() => Alert.alert('Notifications', 'Notifications coming soon!')}
            >
              <FontAwesome5 name="bell" size={20} color={themeStyles.textColor} />
              <Text style={[styles.actionText, { color: themeStyles.textColor }]}>Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { borderBottomWidth: 0 }]}
              onPress={signOut}
            >
              <FontAwesome5 name="sign-out-alt" size={20} color={themeStyles.textColor} />
              <Text style={[styles.actionText, { color: themeStyles.textColor }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header */}
      <LinearGradient
        colors={['#4361EE', '#3A0CA3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Settings', 'Settings page coming soon!')}
        >
          <FontAwesome5 name="cog" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView}>
        {/* Profile */}
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <Animated.View style={[styles.avatarContainer, animatedStyles]}>
              <Image 
                source={{ uri: getProfileImage() }} 
                style={styles.avatar} 
              />
            </Animated.View>
          </TouchableOpacity>
          
          <Text style={[styles.name, { color: themeStyles.textColor }]}>{getDisplayName()}</Text>
          <Text style={[styles.email, { color: themeStyles.mutedTextColor }]}>{user?.email || USER.email}</Text>
          {user?.oauthProvider === 'linkedin' && (
            <View style={styles.linkedInBadge}>
              <FontAwesome5 name="linkedin" size={14} color="#0077B5" />
              <Text style={styles.linkedInText}>LinkedIn Member</Text>
            </View>
          )}
        </View>
        
        {/* Stats */}
        <View style={[styles.statsContainer, { borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeStyles.textColor }]}>{USER.projects}</Text>
            <Text style={[styles.statLabel, { color: themeStyles.mutedTextColor }]}>Projects</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeStyles.textColor }]}>{USER.tasks}</Text>
            <Text style={[styles.statLabel, { color: themeStyles.mutedTextColor }]}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeStyles.textColor }]}>{USER.connections}</Text>
            <Text style={[styles.statLabel, { color: themeStyles.mutedTextColor }]}>Connections</Text>
          </View>
        </View>
        
        {/* Tab Bar */}
        <View style={styles.tabBarContainer}>
          {['Bio', 'Skills', 'Account', 'Actions'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && styles.activeTabItem,
                { borderBottomColor: activeTab === tab ? (colorScheme === 'dark' ? '#4361EE' : '#4361EE') : 'transparent' }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? (colorScheme === 'dark' ? '#4361EE' : '#4361EE') : themeStyles.mutedTextColor }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {renderTabContent()}
        </View>
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
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#f0f0f0', // Fallback background
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  linkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3FC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  linkedInText: {
    fontSize: 12,
    color: '#0077B5',
    marginLeft: 6,
    fontWeight: '500',
  },
  role: {
    fontSize: 14,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tabItem: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTabItem: {
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContentContainer: {
  },
  bioCard: {
    marginHorizontal: 20,
    padding: 15,
    marginBottom: 20,
  },
  skillsCard: {
    marginHorizontal: 20,
    padding: 15,
    marginBottom: 20,
  },
  authInfoCard: {
    marginHorizontal: 20,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#4361EE',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  authInfoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  authInfoLabel: {
    fontSize: 14,
    width: 120,
  },
  authInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
}); 