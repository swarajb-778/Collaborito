import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// List of project skills
const PROJECT_SKILLS = [
  { id: 1, name: 'Accounting' },
  { id: 2, name: 'Artificial Intelligence & Machine Learning' },
  { id: 3, name: 'Biotechnology' },
  { id: 4, name: 'Business' },
  { id: 5, name: 'Content Creation (e.g. video, copywriting)' },
  { id: 6, name: 'Counseling & Therapy' },
  { id: 7, name: 'Data Analysis' },
  { id: 8, name: 'DevOps' },
  { id: 9, name: 'Finance' },
  { id: 10, name: 'Fundraising' },
  { id: 11, name: 'Graphic Design' },
  { id: 12, name: 'Legal' },
  { id: 13, name: 'Manufacturing' },
  { id: 14, name: 'Marketing' },
  { id: 15, name: 'Policy' },
  { id: 16, name: 'Product Management' },
  { id: 17, name: 'Project Management' },
  { id: 18, name: 'Public Relations' },
  { id: 19, name: 'Research' },
  { id: 20, name: 'Sales' },
  { id: 21, name: 'Software Development (Backend)' },
  { id: 22, name: 'Software Development (Frontend)' },
  { id: 23, name: 'UI/UX Design' },
  { id: 24, name: 'Other' },
];

export default function ProjectSkillsScreen() {
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Log only once when component mounts
    console.log('Rendering ProjectSkillsScreen');
    
    // Animate logo and form on screen load
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleSkill = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedSkills(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(itemId => itemId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedSkills.length === 0) {
      Alert.alert('Skills Required', 'Please select at least one skill to continue.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Selected skills:', selectedSkills.map(id => PROJECT_SKILLS.find(item => item.id === id)?.name));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to main app
      router.replace('/(tabs)' as any);
      
    } catch (error) {
      console.error('Error saving project skills:', error);
      Alert.alert('Error', 'There was a problem saving your project skills. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)' as any);
  };

  // Render skill item
  const renderSkillItem = ({ item }: { item: { id: number; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.skillItem,
        selectedSkills.includes(item.id) && styles.skillItemSelected
      ]}
      onPress={() => toggleSkill(item.id)}
      activeOpacity={0.7}
    >
      {selectedSkills.includes(item.id) && (
        <MaterialIcons name="check" size={18} color="#FFF" style={styles.checkIcon} />
      )}
      <Text 
        style={[
          styles.skillText,
          selectedSkills.includes(item.id) && styles.skillTextSelected
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo container */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <Image 
                source={require('../../assets/images/welcome/collaborito-dark-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/images/welcome/collaborito-text-logo.png')} 
                style={styles.textLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Content container */}
            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <Text style={styles.title}>What skills are you looking for?</Text>
              <Text style={styles.subtitle}>
                Select the skills you'd like your co-founder to have.
              </Text>
              
              {/* Skills grid */}
              <View style={styles.skillsContainer}>
                <FlatList
                  data={PROJECT_SKILLS}
                  renderItem={renderSkillItem}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  scrollEnabled={false} // The parent ScrollView handles scrolling
                  contentContainerStyle={styles.skillsList}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, (!selectedSkills.length || isSubmitting) && styles.disabledButton]}
                onPress={handleContinue}
                disabled={!selectedSkills.length || isSubmitting}
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

              {/* Skip Link */}
              <TouchableOpacity onPress={handleSkip} style={styles.skipLinkContainer} disabled={isSubmitting}>
                <Text style={styles.skipLinkText}>
                  I'll select skills later
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
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
    transform: [{ rotate: '-30deg' }],
  },
  shapeThree: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.3,
    right: -width * 0.3,
    transform: [{ rotate: '20deg' }],
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  textLogo: {
    width: 180,
    height: 25,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 24,
  },
  skillsContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  skillsList: {
    width: '100%',
  },
  skillItem: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  skillItemSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  skillText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  skillTextSelected: {
    color: '#FFFFFF',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  skipLinkContainer: {
    alignItems: 'center',
    padding: 12,
  },
  skipLinkText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '500',
  },
}); 