import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInUp,
  FadeInDown
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function OnboardCoFounderProjectScreen() {
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    if (projectDescription.trim().length === 0) {
      Alert.alert('Project Description Required', 'Please describe your project/idea.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    // Basic validation for sentence count (approximate)
    const sentenceCount = (projectDescription.match(/[.!?]+/g) || []).length + 1; 
    if (sentenceCount > 2 && projectDescription.trim().length > 50) { // Allow short descriptions even if > 2 sentences
        Alert.alert('Keep it Concise', 'Please describe your project in 1-2 sentences.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
    }


    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Project Description:', projectDescription);
      
      // Simulate API call to save the description
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      // Navigate to the next step (e.g., main app or another onboarding step)
      router.push('/(tabs)'); // TODO: Update this to navigate to the next relevant screen, maybe skills?
      
    } catch (error) {
      console.error('Error saving project description:', error);
      Alert.alert('Error', 'There was a problem saving your description. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -100} // Adjust offset if needed
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            
            {/* Background shapes (copied from goals screen) */}
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
            
            <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.contentContainer}>
              <Text style={styles.title}>Describe Your Vision</Text>
              <Text style={styles.subtitle}>
                What project or idea are you looking for a co-founder for? 
                Please describe it briefly (1-2 sentences).
              </Text>
              
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="e.g., Building a platform to connect local artists..."
                placeholderTextColor="#A0AEC0"
                value={projectDescription}
                onChangeText={setProjectDescription}
                maxLength={200} // Limit length
                returnKeyType="done" // Change return key
                blurOnSubmit={true} // Dismiss keyboard on submit
              />
              <Text style={styles.charCount}>{projectDescription.length}/200</Text>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.duration(600).delay(300)} 
              style={[
                styles.bottomContainer, 
                { paddingBottom: Math.max(insets.bottom, 16) }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.button, 
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
              {/* Optional: Add a skip or back button if needed */}
              {/* <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity> */}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Reuse styles from goals screen and adapt
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between', // Push content up and button down
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
  contentContainer: {
    flex: 1, // Take available space
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? height * 0.1 : height * 0.12, // Adjust top padding
    alignItems: 'center',
    zIndex: 1,
    justifyContent: 'flex-start', // Align content to the top part
  },
  title: {
    fontSize: 26, 
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System', 
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30, // Space before the input
    paddingHorizontal: 10,
    fontFamily: 'System',
    lineHeight: 22, // Improve readability
  },
  textInput: {
    width: '100%',
    minHeight: 100, // Make text input larger
    maxHeight: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16, // Add padding top for multiline
    paddingBottom: 16,
    fontSize: 16,
    color: '#1A202C',
    textAlignVertical: 'top', // Align text to top for multiline
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    marginBottom: 10, // Space before char count
    fontFamily: 'System',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
   charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#718096',
    marginRight: 5, // Position it slightly inset from the right edge
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: 'transparent',
    zIndex: 1,
    borderTopWidth: 0, // Remove border if previously existed
  },
  button: {
    width: '100%',
    height: 56, 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12, // Add margin if needed for skip/back button
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
  // Optional Back button styles
  // backButton: {
  //   alignItems: 'center',
  //   paddingVertical: 12,
  // },
  // backButtonText: {
  //   color: '#4A5568',
  //   fontSize: 15,
  //   fontWeight: '500',
  //   fontFamily: 'System',
  // },
}); 