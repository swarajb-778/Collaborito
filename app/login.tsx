import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLinkedInSignIn = async () => {
    try {
      setLoading(true);
      await signIn('linkedin');
      // Note: Navigation is handled by the auth state change in AuthContext
    } catch (error) {
      console.error('Error signing in with LinkedIn:', error);
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4C66AB', '#3B5998', '#192F6A']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Collaborito</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.tagline}>
          Connect. Collaborate. Create.
        </Text>
        <Text style={styles.description}>
          An AI-powered community platform that helps entrepreneurs match with collaborators
          - unlike inefficient networking communities.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.linkedinButton}
          onPress={handleLinkedInSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="linkedin-square" size={24} color="#fff" style={styles.linkedinIcon} />
              <Text style={styles.linkedinButtonText}>Sign in with LinkedIn</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  linkedinButton: {
    flexDirection: 'row',
    backgroundColor: '#0077B5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  linkedinIcon: {
    marginRight: 12,
  },
  linkedinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 