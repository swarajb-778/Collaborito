import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/ui/Card';
import { useColorScheme } from '../../hooks/useColorScheme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  FadeInDown
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  
  // Determine theme-based styles
  const themeStyles = {
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#f8f9fa',
    textColor: colorScheme === 'dark' ? '#fff' : '#000',
    cardBackground: colorScheme === 'dark' ? '#1E1E1E' : '#fff',
    mutedTextColor: colorScheme === 'dark' ? '#BBBBBB' : '#666666',
    borderColor: colorScheme === 'dark' ? '#333' : '#eee',
  };
  
  // Animation values
  const logoScale = useRef(new RNAnimated.Value(0.8)).current;
  const formOpacity = useRef(new RNAnimated.Value(0)).current;
  const scale = useSharedValue(1);
  
  useEffect(() => {
    // Log the user info to verify what data we have
    console.log('Current user data:', user);
    
    // Animate elements on screen load
    RNAnimated.parallel([
      RNAnimated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);
  
  // Avatar animation
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background shapes like in onboarding screen */}
      <View style={styles.backgroundShapesContainer}>
        <LinearGradient
          colors={['rgba(255, 220, 100, 0.3)', 'rgba(250, 160, 80, 0.15)', 'rgba(255, 255, 255, 0.7)']} 
          locations={[0, 0.4, 0.8]}
          style={styles.gradientBackground}
        />
        <View style={[styles.backgroundShape, styles.shapeOne]} />
        <View style={[styles.backgroundShape, styles.shapeTwo]} />
        <View style={[styles.backgroundShape, styles.shapeThree]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Settings', 'Settings page coming soon!');
            }}
          >
            <FontAwesome5 name="cog" size={22} color="#333" />
          </TouchableOpacity>
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Profile Card */}
            <RNAnimated.View style={[styles.avatarWrapper, { transform: [{ scale: logoScale }] }]}>
              <TouchableOpacity onPress={handleAvatarPress}>
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
              
              <Text style={styles.name}>{getDisplayName()}</Text>
              <Text style={styles.email}>{user?.email || USER.email}</Text>
              
              {user?.oauthProvider === 'linkedin' && (
                <View style={styles.linkedInBadge}>
                  <FontAwesome5 name="linkedin" size={14} color="#0077B5" />
                  <Text style={styles.linkedInText}>LinkedIn Member</Text>
                </View>
              )}
            </RNAnimated.View>
            
            <RNAnimated.View 
              style={[styles.formContainer, { opacity: formOpacity }]}
            >
              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{USER.projects}</Text>
                  <Text style={styles.statLabel}>Projects</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{USER.tasks}</Text>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{USER.connections}</Text>
                  <Text style={styles.statLabel}>Connections</Text>
                </View>
              </View>
              
              {/* Tab Bar */}
              <View style={styles.tabBarContainer}>
                {['Bio', 'Skills', 'Account', 'Actions'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabItem,
                      activeTab === tab && styles.activeTabItem
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(tab);
                    }}
                  >
                    <Text style={[
                      styles.tabText,
                      { color: activeTab === tab ? '#4361EE' : '#666666' }
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
            </RNAnimated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  backgroundShapesContainer: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: -1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  backgroundShape: {
    position: 'absolute',
    backgroundColor: 'rgba(67, 97, 238, 0.15)',
    borderRadius: 120,
  },
  shapeOne: {
    width: 220,
    height: 220,
    top: -50,
    right: -80,
    transform: [{ rotate: '30deg' }],
  },
  shapeTwo: {
    width: 280,
    height: 280,
    bottom: height * 0.25,
    left: -120,
    transform: [{ rotate: '45deg' }],
  },
  shapeThree: {
    width: 180,
    height: 180,
    bottom: -50,
    right: 20,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: 'rgba(250, 160, 80, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  email: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
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
  formContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    borderBottomColor: '#4361EE',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabContentContainer: {
    paddingBottom: 20,
  },
  bioCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  skillsCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  authInfoCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  actionsCard: {
    padding: 8,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
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
    backgroundColor: '#E0E7FF',
  },
  skillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4361EE',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#333',
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
    color: '#666',
  },
  authInfoValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
}); 