import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function FindCofounderScreen() {
  const insets = useSafeAreaInsets();
  const [lookingFor, setLookingFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_CHARS = 280;
  
  // Animation values
  const headerAnimation = useSharedValue(0);
  const inputAnimation = useSharedValue(0);
  const buttonsAnimation = useSharedValue(0);

  useEffect(() => {
    // Animate elements in sequence
    headerAnimation.value = withTiming(1, { duration: 600 });
    
    setTimeout(() => {
      inputAnimation.value = withTiming(1, { duration: 600 });
    }, 200);
    
    setTimeout(() => {
      buttonsAnimation.value = withTiming(1, { duration: 600 });
    }, 400);
  }, []);

  // Create animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      headerAnimation.value,
      [0, 1],
      [-20, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: headerAnimation.value,
      transform: [{ translateY }],
    };
  });

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      inputAnimation.value,
      [0, 1],
      [20, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: inputAnimation.value,
      transform: [{ translateY }],
    };
  });

  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      buttonsAnimation.value,
      [0, 1],
      [40, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: buttonsAnimation.value,
      transform: [{ translateY }],
    };
  });

  const handleContinue = async () => {
    if (lookingFor.trim().length === 0) {
      // Trigger error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Trigger selection haptic feedback
    Haptics.selectionAsync();
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Navigate to the next screen
      router.push('/onboarding/matching-cofounders' as any);
    } catch (error) {
      console.error('Error in cofounder search:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        {/* Background Gradient */}
        <LinearGradient 
          colors={['#F9FAFB', '#F3F4F6']} 
          style={styles.gradientBackground}
        />
        
        {/* Background Decorative Shapes */}
        <View style={styles.backgroundShapesContainer}>
          <View style={[styles.backgroundShape, styles.shapeOne]} />
          <View style={[styles.backgroundShape, styles.shapeTwo]} />
          <View style={[styles.backgroundShape, styles.shapeThree]} />
        </View>
        
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        
        {/* Header */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={styles.title}>What are you looking for?</Text>
          <Text style={styles.subtitle}>Describe the kind of co-founder you're seeking in 1-2 sentences</Text>
        </Animated.View>
        
        {/* Input Container */}
        <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
          <TextInput
            style={styles.textInput}
            placeholder="I'm looking for..."
            placeholderTextColor="#A0AEC0"
            value={lookingFor}
            onChangeText={setLookingFor}
            multiline
            maxLength={MAX_CHARS}
            autoFocus={false}
          />
          <Text style={styles.characterCount}>
            {lookingFor.length}/{MAX_CHARS}
          </Text>
        </Animated.View>
        
        {/* Bottom Actions Container */}
        <Animated.View 
          style={[
            styles.bottomContainer, 
            { paddingBottom: Math.max(insets.bottom, 16) }, 
            buttonsAnimatedStyle
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.button,
              styles.continueButton,
              (lookingFor.trim().length === 0 || isSubmitting) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={lookingFor.trim().length === 0 || isSubmitting}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 70 : 50,
    paddingBottom: 20,
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
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    padding: 16,
    fontSize: 16,
    color: '#1A202C',
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  characterCount: {
    alignSelf: 'flex-end',
    marginTop: 8,
    fontSize: 12,
    color: '#718096',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: 'transparent',
    zIndex: 1,
    marginTop: 'auto',
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButton: {
    marginBottom: 12,
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
}); 