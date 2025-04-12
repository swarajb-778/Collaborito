import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  StatusBar,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Animated } from 'react-native';
import { MotiView, MotiImage, MotiText } from 'moti';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { APP_NAME } from '../../src/constants/AppConfig';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('WelcomeScreen');
const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Animation states
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    logger.debug('Welcome screen mounted');
    
    // Sequence of animations
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-navigate after 3 seconds if user doesn't press anything
    const timer = setTimeout(() => {
      handleContinue();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleContinue = () => {
    logger.debug('Navigating to welcome details');
    router.replace('/welcome/details');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1E2747', '#0B1121']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 1500,
          }}
          style={styles.contentContainer}
        >
          {/* Logo */}
          <Animated.View style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] }
          ]}>
            <FontAwesome name="connectdevelop" size={80} color="#6C63FF" />
          </Animated.View>
          
          {/* App Name */}
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500, duration: 1000 }}
            style={styles.title}
          >
            {APP_NAME}
          </MotiText>
          
          {/* Tagline */}
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 800, duration: 1000 }}
            style={styles.tagline}
          >
            Collaborate. Create. Succeed.
          </MotiText>
          
          {/* Continue Button */}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1200, duration: 800 }}
            style={styles.buttonContainer}
          >
            <TouchableOpacity 
              style={styles.button}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <FontAwesome name="arrow-right" size={16} color="#FFFFFF" style={styles.buttonIcon} />
            </TouchableOpacity>
          </MotiView>
        </MotiView>
        
        {/* Decorative elements */}
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ delay: 1000, duration: 1200 }}
          style={styles.decorativeShape1}
        />
        
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ delay: 1300, duration: 1200 }}
          style={styles.decorativeShape2}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  decorativeShape1: {
    position: 'absolute',
    top: height * 0.1,
    right: width * 0.1,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: height * 0.15,
    left: width * 0.1,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
}); 