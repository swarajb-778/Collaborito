import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from '../components/ui/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useColorScheme();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome, {user?.name}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          You have successfully logged in to Collaborito
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Email:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.email}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.signOutButton, { backgroundColor: colors.primary }]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoValue: {
    marginBottom: 15,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 