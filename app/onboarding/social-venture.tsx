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
  ActivityIndicator,
  ScrollView
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

export default function SocialVentureScreen() {
  const [ventureDescription, setVentureDescription] = useState('');
  const [socialImpact, setSocialImpact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const [impactError, setImpactError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animated values
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('SocialVentureScreen mounted');
    
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
    // Reset error states
    setDescriptionError('');
    setImpactError('');
    
    let isValid = true;
    
    // Validate venture description
    if (!ventureDescription.trim()) {
      setDescriptionError('Please describe your social venture');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      isValid = false;
    } else if (ventureDescription.trim().length < 10) {
      setDescriptionError('Please provide a more detailed description');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      isValid = false;
    }
    
    // Validate social impact
    if (!socialImpact.trim()) {
      setImpactError('Please describe the social or environmental impact');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      isValid = false;
    } else if (socialImpact.trim().length < 10) {
      setImpactError('Please provide a more detailed impact description');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      isValid = false;
    }
    
    return isValid;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Log the venture and impact descriptions
      console.log('Venture description:', ventureDescription);
      console.log('Social impact:', socialImpact);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to tabs route
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error saving social venture details:', error);
      Alert.alert('Error', 'There was a problem saving your venture details. Please try again.');
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
          colors={['rgba(182, 244, 146, 0.3)', 'rgba(51, 139, 147, 0.15)', 'rgba(255, 255, 255, 0.7)']} 
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
        <ScrollView 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.headerContainer, logoAnimatedStyle]}>
            <Text style={styles.title}>Your Social Venture</Text>
            <Text style={styles.subtitle}>Tell us about the social or environmental impact you want to create.</Text>
          </Animated.View>
          
          <Animated.View
            style={[styles.formContainer, formAnimatedStyle]}
            entering={FadeInDown.duration(600).delay(300)}
          >
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Venture Description</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Describe your social venture or idea"
                  placeholderTextColor="#A0AEC0"
                  value={ventureDescription}
                  onChangeText={(text) => {
                    setVentureDescription(text);
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
                  {ventureDescription.length}/500
                </Text>
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Social/Environmental Impact</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Describe the impact you hope to create"
                  placeholderTextColor="#A0AEC0"
                  value={socialImpact}
                  onChangeText={(text) => {
                    setSocialImpact(text);
                    if (impactError) setImpactError('');
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                {impactError ? (
                  <Text style={styles.errorText}>{impactError}</Text>
                ) : null}
                <Text style={styles.characterCount}>
                  {socialImpact.length}/500
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
        
        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
        </View>
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
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
    backgroundColor: '#4CAF50', // Green for social ventures
    opacity: 0.1,
  },
  shapeTwo: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.05,
    right: -width * 0.2,
    backgroundColor: '#2196F3', // Blue for water/environment
    opacity: 0.12,
  },
  shapeThree: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    right: -width * 0.1,
    backgroundColor: '#CDDC39', // Lime for growth
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
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    paddingLeft: 4,
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
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