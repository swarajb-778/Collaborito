import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions, 
  Alert,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Image,
  Animated,
  FlatList 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/OptimizedAuthContext';
import { optimizedOnboardingService } from '../../src/services/OptimizedOnboardingService';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('OnboardingInterests');

// Import image assets
const CollaboritoLogo = require('../../assets/images/welcome/collaborito-dark-logo.png');
const CollaboritoTextLogo = require('../../assets/images/welcome/collaborito-text-logo.png');

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Interest interface
interface Interest {
  id: string;
  name: string;
  category?: string;
}

export default function OnboardingInterestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    logger.info('OnboardingInterests mounted');
    
    // Animate logo and form on screen load
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Load available interests from backend
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      logger.info('Loading interests from backend...');
              const result = await optimizedOnboardingService.getAvailableInterests();
      
      if (result.success && result.data) {
        setAvailableInterests(result.data);
        logger.info('Interests loaded successfully:', result.data.length);
      } else {
        // Fallback to hardcoded interests if backend fails
        logger.warn('Backend interests failed, using fallback:', result.error);
        setAvailableInterests([
          { id: 'art', name: 'Art' },
          { id: 'ai_ml', name: 'Artificial Intelligence & Machine Learning' },
          { id: 'biotech', name: 'Biotechnology' },
          { id: 'business', name: 'Business' },
          { id: 'books', name: 'Books' },
          { id: 'climate', name: 'Climate Change' },
          { id: 'civic', name: 'Civic Engagement' },
          { id: 'dancing', name: 'Dancing' },
          { id: 'data_science', name: 'Data Science' },
          { id: 'education', name: 'Education' },
          { id: 'entrepreneurship', name: 'Entrepreneurship' },
          { id: 'fashion', name: 'Fashion' },
          { id: 'fitness', name: 'Fitness' },
          { id: 'food', name: 'Food' },
          { id: 'gaming', name: 'Gaming' },
          { id: 'health', name: 'Health & Wellness' },
          { id: 'finance', name: 'Investing & Finance' },
          { id: 'marketing', name: 'Marketing' },
          { id: 'movies', name: 'Movies' },
          { id: 'music', name: 'Music' },
          { id: 'parenting', name: 'Parenting' },
          { id: 'pets', name: 'Pets' },
          { id: 'product_design', name: 'Product Design' },
          { id: 'reading', name: 'Reading' },
          { id: 'real_estate', name: 'Real Estate' },
          { id: 'robotics', name: 'Robotics' },
          { id: 'science_tech', name: 'Science & Tech' },
          { id: 'social_impact', name: 'Social Impact' },
          { id: 'sports', name: 'Sports' },
          { id: 'travel', name: 'Travel' },
          { id: 'writing', name: 'Writing' },
          { id: 'other', name: 'Other' }
        ]);
      }
    } catch (error) {
      logger.error('Error loading interests:', error);
      Alert.alert('Error', 'Failed to load interests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedInterests(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(itemId => itemId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Error', 'User session not available. Please sign in again.');
      return;
    }

    if (selectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      logger.info('Saving interests to database...', selectedInterests);
      
      // Save interests using OnboardingService
              const result = await optimizedOnboardingService.saveInterests(user.id, selectedInterests);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save interests');
      }
      
      logger.info('Interests saved successfully, navigating to goals');
      
      // Navigate to the goals screen
      router.replace('/onboarding/goals');
      
    } catch (error) {
      logger.error('Error saving interests:', error);
      Alert.alert('Error', 'There was a problem saving your interests. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logger.info('Skipping interests, navigating to goals');
    router.replace('/onboarding/goals');
  };

  // Show loading spinner while loading interests
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading interests...</Text>
      </View>
    );
  }

  // Render interest item
  const renderInterestItem = ({ item }: { item: Interest }) => (
    <TouchableOpacity
      style={[
        styles.interestItem,
        selectedInterests.includes(item.id) && styles.interestItemSelected
      ]}
      onPress={() => toggleInterest(item.id)}
      activeOpacity={0.7}
    >
      {selectedInterests.includes(item.id) && (
        <MaterialIcons name="check" size={18} color="#FFF" style={styles.checkIcon} />
      )}
      <Text 
        style={[
          styles.interestText,
          selectedInterests.includes(item.id) && styles.interestTextSelected
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background elements */}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo container */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <Image 
                source={CollaboritoLogo} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Image 
                source={CollaboritoTextLogo} 
                style={styles.textLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Content container */}
            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <Text style={styles.title}>Your Interests</Text>
              <Text style={styles.subtitle}>
                I'm interested in the following topics. Select a few to make it easier to find people and projects you might find interesting.
              </Text>
              
              {/* Interests grid */}
              <View style={styles.interestsContainer}>
                <FlatList
                  data={availableInterests}
                  renderItem={renderInterestItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false} // The parent ScrollView handles scrolling
                  contentContainerStyle={styles.interestsList}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={handleContinue}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#000000', '#333333']} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" /> 
                  ) : (
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Skip Link */}
              <TouchableOpacity onPress={handleSkip} style={styles.skipLinkContainer} disabled={isSubmitting}>
                <Text style={styles.skipLinkText}>
                  I'll select my interests later
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', 
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6, 
  },
  backgroundShapesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', 
  },
  backgroundShape: {
    position: 'absolute',
    borderRadius: (width * 0.8) / 2, 
    opacity: 0.15, 
  },
  shapeOne: {
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.15,
    left: -width * 0.25,
    backgroundColor: '#FFD529', 
    opacity: 0.1,
  },
  shapeTwo: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.05,
    right: -width * 0.2,
    backgroundColor: '#FFA07A', 
    opacity: 0.12,
  },
  shapeThree: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    right: -width * 0.1,
    backgroundColor: '#ADD8E6', 
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',  // Changed to flex-start for better scrolling with long list
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40, 
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.04, 
    marginBottom: height * 0.02, // Reduced for more content space
  },
  logo: {
    width: width * 0.15, // Slightly smaller logo for this screen
    height: width * 0.15, 
    maxWidth: 60, 
    maxHeight: 60,
  },
  textLogo: {
    width: width * 0.35, 
    height: (width * 0.35) / 6, 
    maxWidth: 150,
    maxHeight: 25,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24, 
    fontWeight: '700',
    color: '#1A202C', 
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito', 
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4A5568', 
    fontFamily: 'Nunito',
    paddingHorizontal: 10,
  },
  interestsContainer: {
    width: '100%',
    marginBottom: 10,
  },
  interestsList: {
    paddingVertical: 5,
  },
  interestItem: {
    flex: 1,
    margin: 5,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  interestItemSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  interestText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    color: '#555',
    fontFamily: 'Nunito',
  },
  interestTextSelected: {
    color: '#FFF',
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButton: {
    overflow: 'hidden', 
  },
  buttonGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito', 
  },
  primaryButtonText: {
    color: '#FFFFFF', 
  },
  skipLinkContainer: {
    marginTop: 20, 
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 15,
    color: '#575757', 
    fontFamily: 'Nunito',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
  },
}); 