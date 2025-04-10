import React, { useEffect } from 'react';
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

  return (
    <View style={styles.container}>
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
          
          <Text style={styles.name}>{getDisplayName()}</Text>
          <Text style={styles.email}>{user?.email || USER.email}</Text>
          {user?.oauthProvider === 'linkedin' && (
            <View style={styles.linkedInBadge}>
              <FontAwesome5 name="linkedin" size={14} color="#0077B5" />
              <Text style={styles.linkedInText}>LinkedIn Member</Text>
            </View>
          )}
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{USER.projects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{USER.tasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{USER.connections}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>
        
        {/* Bio */}
        <Card style={styles.bioCard}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>
            {user?.oauthProvider === 'linkedin' 
              ? `Professional LinkedIn user with expertise in collaboration and networking. Connect with me to explore opportunities in the Collaborito platform.` 
              : USER.bio}
          </Text>
        </Card>
        
        {/* Skills */}
        <Card style={styles.skillsCard}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {user?.oauthProvider === 'linkedin' ? (
              // LinkedIn-specific skills
              ['Networking', 'Collaboration', 'Professional', 'Team Building', 'Communication'].map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : (
              // Default skills
              USER.skills.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            )}
          </View>
        </Card>
        
        {/* Authentication Info */}
        <Card style={styles.authInfoCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.authInfoItem}>
            <Text style={styles.authInfoLabel}>Signed in with:</Text>
            <Text style={styles.authInfoValue}>{getAuthProviderName()}</Text>
          </View>
          <View style={styles.authInfoItem}>
            <Text style={styles.authInfoLabel}>Email:</Text>
            <Text style={styles.authInfoValue}>{user?.email || USER.email}</Text>
          </View>
          {user?.id && (
            <View style={styles.authInfoItem}>
              <Text style={styles.authInfoLabel}>User ID:</Text>
              <Text style={styles.authInfoValue}>{user.id}</Text>
            </View>
          )}
        </Card>
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
          >
            <FontAwesome5 name="user-edit" size={20} color="#000" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Notifications', 'Notifications coming soon!')}
          >
            <FontAwesome5 name="bell" size={20} color="#000" />
            <Text style={styles.actionText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={signOut}
          >
            <FontAwesome5 name="sign-out-alt" size={20} color="#000" />
            <Text style={styles.actionText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  bioCard: {
    margin: 20,
    marginTop: 0,
    padding: 15,
  },
  skillsCard: {
    margin: 20,
    marginTop: 0,
    padding: 15,
  },
  authInfoCard: {
    margin: 20,
    marginTop: 0,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
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
    margin: 20,
    marginTop: 0,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#666',
    width: 120,
  },
  authInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
}); 