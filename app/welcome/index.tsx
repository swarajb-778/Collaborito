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
  StatusBar,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Gallery component to display grid of images
const Gallery = () => {
  // Animation values for staggered entrance
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Create staggered animation for columns
    Animated.stagger(200, [
      Animated.timing(fadeAnim1, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Calculate responsive image height based on screen dimensions
  const imageHeight = Math.min(height * 0.20, 140); // Adjusted height for better visibility
  
  return (
    <View style={styles.galleryGrid}>
      <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim1 }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-1.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-2.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-3.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim2 }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-4.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-5.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-6.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim3 }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-7.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-8.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image 
          source={require('../../assets/images/welcome/gallery/gallery-9.png')} 
          style={[styles.galleryImage, { height: imageHeight }]} 
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  
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
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
    router.push('/welcome/signin');
    });
  };
  
  // Calculate card height as a percentage of screen height
  const cardHeight = height * 0.35;
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(255,214,99,0.25)', 'rgba(244,141,59,0.15)']}
        locations={[0.2, 0.8]}
        style={styles.gradientBackground}
      />
      
      <SafeAreaView style={styles.mainContent}>
        {/* Logo at the top */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
          <Image 
          source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
            style={styles.logo}
          resizeMode="contain"
        />
          {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
          <Image 
          source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
            style={styles.textLogo}
          resizeMode="contain"
        />
        </Animated.View>
        
        {/* Gallery below the logo */}
        <Animated.View style={{ opacity: contentOpacity, width: '100%' }}>
          <Gallery />
        </Animated.View>
      </SafeAreaView>
      
      {/* Main content card */}
      <Animated.View 
        style={[
          styles.card, 
          { 
            opacity: contentOpacity,
            height: cardHeight,
            paddingBottom: Math.max(insets.bottom + 16, 40), // Adjust for safe area
          }
        ]}
      >
        <View style={styles.cardContent}>
        <Text style={styles.title}>
          Discover like-minded individuals to collaborate on projects together
        </Text>
        <Text style={styles.subtitle}>
          Let our AI-powered community platform introduce you to your next co-founder, advisor, or collaborator.
        </Text>
        
          <Animated.View style={[
            styles.buttonContainer, 
            { transform: [{ scale: buttonScale }] }
          ]}>
            <TouchableOpacity
              activeOpacity={0.85}
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          >
              <LinearGradient
                colors={['#000000', '#333333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  galleryGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 15,
  },
  galleryColumn: {
    flex: 1,
    gap: 9,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  galleryImage: {
    width: '100%',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  textLogo: {
    width: 180,
    height: 30,
    marginTop: 8,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    padding: 28,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#242428',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Nunito',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#575757',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Nunito',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
  },
  getStartedButton: {
    width: '90%',
    overflow: 'hidden',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito',
  }
}); 