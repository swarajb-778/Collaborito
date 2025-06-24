import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false, // Prevent back swipe during onboarding
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Profile Setup',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="interests" 
        options={{ 
          title: 'Your Interests',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="goals" 
        options={{ 
          title: 'Your Goals',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="project-detail" 
        options={{ 
          title: 'Project Details',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="project-skills" 
        options={{ 
          title: 'Project Skills',
          headerShown: false
        }} 
      />
    </Stack>
  );
} 