import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Platform,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
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

export default function OnboardingCoFounderDescribeProjectScreen() {
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Character limit for project description
  const MAX_CHARS = 200;
  
  // Reanimated shared values for animations
  const headerOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered fade-in animations using Reanimated
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    inputOpacity.value = withDelay(250, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    buttonsOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: inputOpacity.value,
    };
  });

  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonsOpacity.value,
    };
  });

  const handleContinue = async () => {
    if (projectDescription.trim().length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Project description:', projectDescription);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Navigate to next screen or tab based on your app flow
      // For now, going to main tabs
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error saving project description:', error);
      setIsSubmitting(false);
    }
  };
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          disabled={isSubmitting}
        >
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={styles.title}>Describe Your Project</Text>
          <Text style={styles.subtitle}>Please share a brief description of your project or idea in 1-2 sentences.</Text>
        </Animated.View>
        
        <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
          <TextInput
            style={styles.textInput}
            placeholder="I'm building..."
            placeholderTextColor="#A0AEC0"
            value={projectDescription}
            onChangeText={setProjectDescription}
            multiline
            maxLength={MAX_CHARS}
            autoFocus={false}
          />
          <Text style={styles.characterCount}>
            {projectDescription.length}/{MAX_CHARS}
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
              (projectDescription.trim().length === 0 || isSubmitting) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={projectDescription.trim().length === 0 || isSubmitting}
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