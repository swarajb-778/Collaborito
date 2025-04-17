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
import { LinearGradient } from 'expo-linear-gradient';

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
  
  return (
    <View style={styles.galleryContainer}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(255,214,99,0.3)', 'rgba(244,141,59,0.2)']}
        locations={[0.2, 0.8]}
        style={styles.gradientBackground}
      />
      
      {/* Grid of images */}
      <View style={styles.galleryGrid}>
        <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim1 }]}>
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-1.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-2.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-3.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim2 }]}>
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-4.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-5.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-6.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View style={[styles.galleryColumn, { opacity: fadeAnim3 }]}>
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-7.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-8.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
          <Image 
            source={require('../../assets/images/welcome/gallery/gallery-9.png')} 
            style={styles.galleryImage} 
            resizeMode="cover"
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default function WelcomeScreen() {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
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
      <StatusBar barStyle="dark-content" />
      
      {/* Background gallery */}
      <Gallery />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
        <Animated.Image 
          source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
          style={[styles.textLogo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </View>
      
      {/* Main content card */}
      <Animated.View 
        style={[styles.card, { opacity: contentOpacity }]}
      >
        <Text style={styles.title}>
          Discover like-minded individuals to collaborate on projects together
        </Text>
        <Text style={styles.subtitle}>
          Let our AI-powered community platform introduce you to your next co-founder, advisor, or collaborator.
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  galleryContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  galleryGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 9,
  },
  galleryColumn: {
    flex: 1,
    gap: 9,
  },
  galleryImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textLogo: {
    width: 200,
    height: 40,
    marginTop: 20,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#242428',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito',
  },
  subtitle: {
    fontSize: 14,
    color: '#575757',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Nunito',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    width: 335,
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
}); 