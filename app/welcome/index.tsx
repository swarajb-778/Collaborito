import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Gallery component to display images
const Gallery = () => {
  // Animation values for image opacity
  const opacity1 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;

  // Set up animation sequence
  useEffect(() => {
    const startAnimation = () => {
      // Sequence to fade between images
      Animated.sequence([
        // Show image 1
        Animated.timing(opacity1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        // Fade to image 2
        Animated.parallel([
          Animated.timing(opacity1, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        // Fade to image 3
        Animated.parallel([
          Animated.timing(opacity2, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity3, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        // Fade back to image 1
        Animated.parallel([
          Animated.timing(opacity3, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity1, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Restart animation
        startAnimation();
      });
    };

    startAnimation();
    
    // Clean up animations on unmount
    return () => {
      opacity1.stopAnimation();
      opacity2.stopAnimation();
      opacity3.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.galleryContainer}>
      <Animated.View 
        style={[styles.galleryImage, { opacity: opacity1, backgroundColor: '#3B82F6' }]}
      />
      <Animated.View 
        style={[styles.galleryImage, { opacity: opacity2, backgroundColor: '#1E3A8A' }]}
      />
      <Animated.View 
        style={[styles.galleryImage, { opacity: opacity3, backgroundColor: '#60A5FA' }]}
      />
    </View>
  );
};

export default function WelcomeScreen() {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Animate logo and content on screen load
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/welcome/signin');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background gallery */}
      <Gallery />
      
      {/* Overlay gradient */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Logo */}
        <Animated.Image 
          source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
        
        {/* Main content card */}
        <Animated.View 
          style={[styles.card, { opacity: contentOpacity }]}
        >
          <Text style={styles.title}>
            Collaborate on projects seamlessly
          </Text>
          <Text style={styles.subtitle}>
            Join a community of professionals and find the perfect project match for your skills
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button 
              onPress={handleGetStarted}
              variant="primary"
              size="lg"
              style={styles.getStartedButton}
            >
              Get Started
            </Button>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  galleryImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#242428',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Nunito',
  },
  subtitle: {
    fontSize: 14,
    color: '#575757',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Nunito',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
}); 