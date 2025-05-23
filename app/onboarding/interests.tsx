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
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// List of available interest topics
const INTERESTS = [
  { id: 1, name: 'Art' },
  { id: 2, name: 'Artificial Intelligence & Machine Learning' },
  { id: 3, name: 'Biotechnology' },
  { id: 4, name: 'Business' },
  { id: 5, name: 'Books' },
  { id: 6, name: 'Climate Change' },
  { id: 7, name: 'Civic Engagement' },
  { id: 8, name: 'Dancing' },
  { id: 9, name: 'Data Science' },
  { id: 10, name: 'Education' },
  { id: 11, name: 'Entrepreneurship' },
  { id: 12, name: 'Fashion' },
  { id: 13, name: 'Fitness' },
  { id: 14, name: 'Food' },
  { id: 15, name: 'Gaming' },
  { id: 16, name: 'Health & Wellness' },
  { id: 17, name: 'Investing & Finance' },
  { id: 18, name: 'Marketing' },
  { id: 19, name: 'Movies' },
  { id: 20, name: 'Music' },
  { id: 21, name: 'Parenting' },
  { id: 22, name: 'Pets' },
  { id: 23, name: 'Product Design' },
  { id: 24, name: 'Reading' },
  { id: 25, name: 'Real Estate' },
  { id: 26, name: 'Robotics' },
  { id: 27, name: 'Science & Tech' },
  { id: 28, name: 'Social Impact' },
  { id: 29, name: 'Sports' },
  { id: 30, name: 'Travel' },
  { id: 31, name: 'Writing' },
  { id: 32, name: 'Other' },
];

export default function OnboardingInterestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Log only once when component mounts
    console.log('Rendering OnboardingInterestsScreen');
    
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
  }, []);

  const toggleInterest = (id: number) => {
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
    if (selectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // In a real app, this would save the selected interests to the user's profile
      console.log('Selected interests:', selectedInterests.map(id => INTERESTS.find(item => item.id === id)?.name));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to the goals screen instead of tabs
      router.replace('/onboarding/goals' as any);
      
    } catch (error) {
      console.error('Error saving interests:', error);
      Alert.alert('Error', 'There was a problem saving your interests. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/onboarding/goals' as any);
  };

  // Render interest item
  const renderInterestItem = ({ item }: { item: { id: number; name: string } }) => (
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
                source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
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
                  data={INTERESTS}
                  renderItem={renderInterestItem}
                  keyExtractor={(item) => item.id.toString()}
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
}); 