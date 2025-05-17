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
  withSequence,
  FadeInDown
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
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#f8f9fa',
    textColor: colorScheme === 'dark' ? '#fff' : '#000',
    cardBackground: colorScheme === 'dark' ? '#1E1E1E' : '#fff',
    mutedTextColor: colorScheme === 'dark' ? '#BBBBBB' : '#666666',
    borderColor: colorScheme === 'dark' ? '#333' : '#eee',
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
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card style={styles.bioCard} variant="elevated">
              <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>Bio</Text>
              <Text style={[styles.bioText, { color: themeStyles.textColor }]}>
                {user?.oauthProvider === 'linkedin'
                  ? `Professional LinkedIn user with expertise in collaboration and networking. Connect with me to explore opportunities in the Collaborito platform.`
                  : USER.bio}
              </Text>
            </Card>
          </Animated.View>
        );
      case 'Skills':
        return (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card style={styles.skillsCard} variant="elevated">
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
          </Animated.View>
        );
      case 'Account':
        return (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card style={styles.authInfoCard} variant="elevated">
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
          </Animated.View>
        );
      case 'Actions':
        return (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card style={styles.actionsCard} variant="elevated">
              <TouchableOpacity
                style={[styles.actionButton, { borderBottomColor: themeStyles.borderColor }]}
                onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
              >
                <View style={styles.actionIconContainer}>
                  <FontAwesome5 name="user-edit" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionText, { color: themeStyles.textColor }]}>Edit Profile</Text>
                <FontAwesome5 name="chevron-right" size={16} color={themeStyles.mutedTextColor} style={styles.actionArrow} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { borderBottomColor: themeStyles.borderColor }]}
                onPress={() => Alert.alert('Notifications', 'Notifications coming soon!')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: '#4CC9F0' }]}>
                  <FontAwesome5 name="bell" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionText, { color: themeStyles.textColor }]}>Notifications</Text>
                <FontAwesome5 name="chevron-right" size={16} color={themeStyles.mutedTextColor} style={styles.actionArrow} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { borderBottomWidth: 0 }]}
                onPress={signOut}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: '#F72585' }]}>
                  <FontAwesome5 name="sign-out-alt" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionText, { color: themeStyles.textColor }]}>Sign Out</Text>
                <FontAwesome5 name="chevron-right" size={16} color={themeStyles.mutedTextColor} style={styles.actionArrow} />
              </TouchableOpacity>
            </Card>
          </Animated.View>
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
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard} variant="elevated">
          {/* Profile */}
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarWrapper}>
              <Animated.View style={[styles.avatarContainer, animatedStyles]}>
                <LinearGradient
                  colors={['#4361EE', '#4CC9F0']}
                  style={styles.avatarBorder}
                >
                  <Image 
                    source={{ uri: getProfileImage() }} 
                    style={styles.avatar} 
                  />
                </LinearGradient>
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
          <View style={[styles.statsContainer, { borderColor: themeStyles.borderColor }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeStyles.textColor }]}>{USER.projects}</Text>
              <Text style={[styles.statLabel, { color: themeStyles.mutedTextColor }]}>Projects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeStyles.textColor }]}>{USER.tasks}</Text>
              <Text style={[styles.statLabel, { color: themeStyles.mutedTextColor }]}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeStyles.textColor }]}>{USER.connections}</Text>
              <Text style={[styles.statLabel, { color: themeStyles.mutedTextColor }]}>Connections</Text>
            </View>
          </View>
        </Card>
        
        {/* Tab Bar */}
        <View style={[styles.tabBarContainer, { borderColor: themeStyles.borderColor }]}>
          {['Bio', 'Skills', 'Account', 'Actions'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && styles.activeTabItem,
                { borderBottomColor: activeTab === tab ? '#4361EE' : 'transparent' }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#4361EE' : themeStyles.mutedTextColor }
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
    paddingTop: 20,
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    padding: 5,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatar: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 3,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginHorizontal: 0,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tabItem: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    width: '25%',
    alignItems: 'center',
  },
  activeTabItem: {
    // Active styling handled inline
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabContentContainer: {
    paddingBottom: 40,
  },
  bioCard: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  skillsCard: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  authInfoCard: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  actionsCard: {
    marginHorizontal: 20,
    padding: 8,
    marginBottom: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  skillText: {
    fontSize: 13,
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
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionText: {
    fontSize: 16,
    flex: 1,
  },
  actionArrow: {
    marginLeft: 10,
  },
  authInfoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  authInfoLabel: {
    fontSize: 15,
    width: 130,
  },
  authInfoValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
}); 