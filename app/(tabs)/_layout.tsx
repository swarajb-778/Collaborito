import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs, useRouter } from 'expo-router';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to welcome screen if not authenticated
      router.replace('/welcome');
    }
  }, [user, loading, router]);
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // Don't render tabs if not authenticated
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { 
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome5 name="briefcase" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome5 name="comment-alt" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome5 name="user" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
