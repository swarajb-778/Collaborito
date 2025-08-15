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
  Animated as RNAnimated,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/ui/Card';
import { useColorScheme } from '../../hooks/useColorScheme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/OptimizedAuthContext';
import { DeviceRegistrationService } from '../../src/services/DeviceRegistrationService';
import { useRouter } from 'expo-router';
import Toast from '../../components/ui/Toast';
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
import { BlurView } from 'expo-blur';
import AvatarManager from '../../components/ui/AvatarManager';
import { createLogger } from '../../src/utils/logger';
import { useThemeColor } from '../../src/hooks/useThemeColor';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const logger = createLogger('ProfileScreen');

// Design system colors
const COLORS = {
  primary: '#4361EE',
  primaryLight: '#3F8EFC',
  secondary: '#4CC9F0',
  accent: '#F72585',
  success: '#06D6A0',
  warning: '#FFBE0B',
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textMuted: '#BBBBBB',
    border: '#333333',
    shape: 'rgba(67, 97, 238, 0.12)',
    shapeTertiary: 'rgba(76, 201, 240, 0.12)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  light: {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#242424',
    textMuted: '#666666',
    border: '#EEEEEE',
    shape: 'rgba(67, 97, 238, 0.08)',
    shapeTertiary: 'rgba(250, 160, 80, 0.1)',
    overlay: 'rgba(255, 255, 255, 0.6)',
  }
};

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Bio');
  const insets = useSafeAreaInsets();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showToast, setShowToast] = useState<{ msg: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  
  // Determine theme-based styles
  const theme = colorScheme === 'dark' ? COLORS.dark : COLORS.light;
  
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
    } else if (user?.username) {
      return user.username; // Use stored username when names aren't available
    } else if (user?.email) {
      return user.email.split('@')[0]; // Extract username from email as fallback
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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
              logger.info('User signed out successfully');
            } catch (error) {
              logger.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };
  
  const handleAvatarChange = (url: string) => {
    logger.info('Avatar updated:', url);
    // Here you could update the user context or make additional API calls
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Bio':
        return (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card style={[styles.bioCard, { backgroundColor: theme.card }]} variant="elevated">
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Bio</Text>
              <Text style={[styles.bioText, { color: theme.text }]}>
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
            <Card style={[styles.skillsCard, { backgroundColor: theme.card }]} variant="elevated">
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills</Text>
              <View style={styles.skillsContainer}>
                {user?.oauthProvider === 'linkedin' ? (
                  // LinkedIn-specific skills
                  ['Networking', 'Collaboration', 'Professional', 'Team Building', 'Communication'].map((skill, index) => (
                    <View key={index} style={[styles.skillBadge, { backgroundColor: colorScheme === 'dark' ? 'rgba(67, 97, 238, 0.2)' : 'rgba(67, 97, 238, 0.1)' }]}>
                      <Text style={[styles.skillText, { color: COLORS.primary }]}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  // Default skills
                  USER.skills.map((skill, index) => (
                    <View key={index} style={[styles.skillBadge, { backgroundColor: colorScheme === 'dark' ? 'rgba(67, 97, 238, 0.2)' : 'rgba(67, 97, 238, 0.1)' }]}>
                      <Text style={[styles.skillText, { color: COLORS.primary }]}>{skill}</Text>
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
            <Card style={[styles.authInfoCard, { backgroundColor: theme.card }]} variant="elevated">
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Information</Text>
              <View style={styles.authInfoItem}>
                <Text style={[styles.authInfoLabel, { color: theme.textMuted }]}>Signed in with:</Text>
                <Text style={[styles.authInfoValue, { color: theme.text }]}>{getAuthProviderName()}</Text>
              </View>
              <View style={styles.authInfoItem}>
                <Text style={[styles.authInfoLabel, { color: theme.textMuted }]}>Email:</Text>
                <Text style={[styles.authInfoValue, { color: theme.text }]}>{user?.email || USER.email}</Text>
              </View>
              {user?.id && (
                <>
                  <View style={styles.authInfoItem}>
                    <Text style={[styles.authInfoLabel, { color: theme.textMuted }]}>User ID:</Text>
                    <Text style={[styles.authInfoValue, { color: theme.text }]}>{user.id}</Text>
                  </View>
                  <View style={[styles.authInfoItem, { alignItems: 'flex-start' }]}>
                    <Text style={[styles.authInfoLabel, { color: theme.textMuted }]}>Trusted Devices:</Text>
                    <View style={{ flex: 1 }}>
                      {trustedDevices.length === 0 ? (
                        <Text style={[styles.authInfoValue, { color: theme.textMuted }]}>None</Text>
                      ) : (
                        trustedDevices.slice(0, 3).map((d) => (
                          <Text key={d.id} style={[styles.authInfoValue, { color: theme.text }]}>
                            {d.device_name || 'Device'} · {d.os || ''}
                          </Text>
                        ))
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      router.push('/device-management');
                    }}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary }]}>
                      <FontAwesome5 name="cogs" size={18} color="#FFF" />
                    </View>
                    <Text style={[styles.actionText, { color: theme.text }]}>Manage Devices</Text>
                    <FontAwesome5 name="chevron-right" size={16} color={theme.textMuted} style={styles.actionArrow} />
                  </TouchableOpacity>
                </>
              )}
            </Card>
          </Animated.View>
        );
      case 'Actions':
        return (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card style={[styles.actionsCard, { backgroundColor: theme.card }]} variant="elevated">
              <TouchableOpacity
                style={[styles.actionButton, { borderBottomColor: theme.border }]}
                onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary }]}>
                  <FontAwesome5 name="user-edit" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Edit Profile</Text>
                <FontAwesome5 name="chevron-right" size={16} color={theme.textMuted} style={styles.actionArrow} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { borderBottomColor: theme.border }]}
                onPress={() => Alert.alert('Notifications', 'Notifications coming soon!')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: COLORS.secondary }]}>
                  <FontAwesome5 name="bell" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Notifications</Text>
                <FontAwesome5 name="chevron-right" size={16} color={theme.textMuted} style={styles.actionArrow} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { borderBottomWidth: 0 }]}
                onPress={handleSignOut}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: COLORS.accent }]}>
                  <FontAwesome5 name="sign-out-alt" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Sign Out</Text>
                <FontAwesome5 name="chevron-right" size={16} color={theme.textMuted} style={styles.actionArrow} />
              </TouchableOpacity>
            </Card>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Enhanced background with better gradients and shapes */}
      <View style={styles.backgroundShapesContainer}>
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['rgba(67, 97, 238, 0.15)', 'rgba(76, 201, 240, 0.1)', 'rgba(0, 0, 0, 0)'] 
            : ['rgba(255, 220, 100, 0.2)', 'rgba(67, 97, 238, 0.1)', 'rgba(255, 255, 255, 0)']} 
          locations={[0, 0.4, 0.9]}
          style={styles.gradientBackground}
        />
        <View style={[styles.backgroundShape, styles.shapeOne, { backgroundColor: theme.shape }]} />
        <View style={[styles.backgroundShape, styles.shapeTwo, { backgroundColor: theme.shape }]} />
        <View style={[styles.backgroundShape, styles.shapeThree, { backgroundColor: theme.shapeTertiary }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced header with blur effect */}
        <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.headerBlurContainer}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
            <TouchableOpacity 
              style={[styles.settingsButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Settings', 'Settings page coming soon!');
              }}
            >
              <FontAwesome5 name="cog" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        </BlurView>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Enhanced Profile Card */}
            <RNAnimated.View style={[styles.avatarWrapper, { transform: [{ scale: logoScale }] }]}>
              <AvatarManager
                size="xl"
                showBorder={true}
                editable={true}
                onAvatarChange={handleAvatarChange}
                userInfo={{
                  name: user?.user_metadata?.full_name || user?.email || 'User',
                  email: user?.email || '',
                  avatarUrl: user?.user_metadata?.avatar_url,
                }}
              />
              
              <Text style={[styles.name, { color: theme.text }]}>{getDisplayName()}</Text>
              <Text style={[styles.email, { color: theme.textMuted }]}>{user?.email || USER.email}</Text>
              
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
              {/* Enhanced Stats Container */}
              <Card style={[styles.statsContainer, { backgroundColor: theme.card }]} variant="elevated">
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{USER.projects}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Projects</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{USER.tasks}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Tasks</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{USER.connections}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Connections</Text>
                </View>
              </Card>
              
              {/* Enhanced Tab Bar */}
              <View style={[styles.tabBarContainer, { borderBottomColor: theme.border }]}>
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
                      { color: activeTab === tab ? COLORS.primary : theme.textMuted },
                      activeTab === tab && styles.activeTabText
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
        {showToast && <Toast message={showToast.msg} type={showToast.type} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 120,
  },
  shapeOne: {
    width: 250,
    height: 250,
    top: -80,
    right: -100,
    transform: [{ rotate: '30deg' }],
  },
  shapeTwo: {
    width: 300,
    height: 300,
    bottom: height * 0.25,
    left: -150,
    transform: [{ rotate: '45deg' }],
  },
  shapeThree: {
    width: 200,
    height: 200,
    bottom: -80,
    right: 20,
    transform: [{ rotate: '-15deg' }],
  },
  headerBlurContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
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
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  avatarBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatarInnerBorder: {
    backgroundColor: 'white',
    borderRadius: 63,
    padding: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
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
    shadowColor: '#0077B5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkedInText: {
    fontSize: 12,
    color: '#0077B5',
    marginLeft: 6,
    fontWeight: '600',
  },
  formContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  tabItem: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    width: '25%',
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  tabContentContainer: {
    paddingBottom: 20,
  },
  bioCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  skillsCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  authInfoCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  actionsCard: {
    padding: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  actionArrow: {
    marginLeft: 10,
  },
  authInfoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  authInfoLabel: {
    fontSize: 15,
    width: 130,
    fontWeight: '500',
  },
  authInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
}); 