import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing 
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function CofounderProjectScreen() {
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animated values
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('CofounderProjectScreen mounted');
    
    // Animate logo and form on screen load
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
    };
  });

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [
        { translateY: withTiming(formOpacity.value * 1, { duration: 600 }) }
      ]
    };
  });

  const validateForm = () => {
    // Reset error state
    setDescriptionError('');
    
    // Validate project description
    if (!projectDescription.trim()) {
      setDescriptionError('Please provide a brief description of your project or idea');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    
    // Check if description is too short (less than 10 characters)
    if (projectDescription.trim().length < 10) {
      setDescriptionError('Please provide a more detailed description');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Log the project description
      console.log('Project description:', projectDescription);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to tabs route
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error saving project description:', error);
      Alert.alert('Error', 'There was a problem saving your project details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <Animated.View style={[styles.headerContainer, logoAnimatedStyle]}>
          <Text style={styles.title}>Describe Your Project</Text>
          <Text style={styles.subtitle}>Tell potential co-founders about your project or idea in 1-2 sentences.</Text>
        </Animated.View>
        
        <Animated.View
          style={[styles.formContainer, formAnimatedStyle]}
          entering={FadeInDown.duration(600).delay(300)}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E.g., A mobile app that helps people find local events based on their interests"
              placeholderTextColor="#A0AEC0"
              value={projectDescription}
              onChangeText={(text) => {
                setProjectDescription(text);
                if (descriptionError) setDescriptionError('');
              }}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            {descriptionError ? (
              <Text style={styles.errorText}>{descriptionError}</Text>
            ) : null}
            <Text style={styles.characterCount}>
              {projectDescription.length}/500
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.button,
              styles.continueButton,
              (isSubmitting) && styles.disabledButton
            ]}
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
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
            disabled={isSubmitting}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingContainer: {
    flex: 1,
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
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 26, 
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System', 
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 10,
    fontFamily: 'System',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
    zIndex: 1,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  input: {
    height: 150,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A202C',
    fontFamily: 'System',
  },
  characterCount: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
    paddingRight: 16,
    paddingBottom: 8,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  continueButton: {
    marginTop: 'auto',
  },
  buttonGradient: {
    flexDirection: 'row',
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#4A5568',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
}); 