import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to the home screen
  // Otherwise, redirect to welcome screen
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/welcome" />;
} 