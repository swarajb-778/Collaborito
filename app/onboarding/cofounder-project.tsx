import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  ScrollView,
  TextInput,
  Platform,
  SafeAreaView,
  ActivityIndicator,
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

export default function OnboardingCofounderProjectScreen() {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Reanimated shared values for animations
  const headerOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('Rendering OnboardingCofounderProjectScreen');
    
    // Staggered fade-in animations using Reanimated
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    formOpacity.value = withDelay(250, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    buttonsOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
    };
  });

  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonsOpacity.value,
    };
  });

  const handleContinue = async () => {
    if (!projectName.trim()) {
      Alert.alert('Project Name Required', 'Please enter a name for your project to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!projectDescription.trim()) {
      Alert.alert('Project Description Required', 'Please describe your project to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Project details:', { projectName, projectDescription });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to main app
      router.replace('/(tabs)' as any);
      
    } catch (error) {
      console.error('Error saving project details:', error);
      Alert.alert('Error', 'There was a problem saving your project details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      {/* Background elements from other onboarding screens */}
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
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
            <Text style={styles.title}>Tell us about your project</Text>
            <Text style={styles.subtitle}>Share details about the project you're seeking a co-founder for.</Text>
          </Animated.View>
          
          {/* Form Fields */}
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Project Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Give your project a name"
                placeholderTextColor="#999"
                value={projectName}
                onChangeText={setProjectName}
                maxLength={50}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Project Description</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe your project, goals, and what kind of co-founder you're looking for"
                placeholderTextColor="#999"
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{projectDescription.length}/500</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
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
            ((!projectName.trim() || !projectDescription.trim()) || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={(!projectName.trim() || !projectDescription.trim()) || isSubmitting}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundShapesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundShape: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 200, 50, 0.15)',
  },
  shapeOne: {
    width: width * 0.7,
    height: width * 0.7,
    top: -width * 0.3,
    right: -width * 0.2,
    transform: [{ rotate: '45deg' }],
  },
  shapeTwo: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: height * 0.1,
    left: -width * 0.4,
    backgroundColor: 'rgba(250, 160, 80, 0.1)',
    transform: [{ rotate: '30deg' }],
  },
  shapeThree: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.3,
    right: -width * 0.3,
    backgroundColor: 'rgba(255, 220, 100, 0.15)',
    transform: [{ rotate: '60deg' }],
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100, // Space for the bottom buttons
  },
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textAreaInput: {
    minHeight: 150,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
}); 