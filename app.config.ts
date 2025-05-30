import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Development fallback values
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    ...config,
    name: 'Collaborito',
    slug: 'collaborito',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.collaborito.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.collaborito.app',
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    scheme: 'collaborito',
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-web-browser',
      'expo-auth-session',
      'expo-linking',
      'expo-status-bar',
      'expo-linear-gradient',
      'expo-haptics',
      ['expo-font', {
        fonts: ['./assets/fonts/Nunito-Regular.ttf']
      }]
    ],
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || (isDev ? 'https://ekydublgvsoaaepdhtzc.supabase.co' : ''),
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (isDev ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5OTc1NjYsImV4cCI6MjA0OTU3MzU2Nn0.KTPW_e4z0NpnHa5KJDbKhZC4-2w4lFb3kLX3fKfMOe8' : ''),
      LINKEDIN_CLIENT_ID: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || (isDev ? '77dpxmsrs0t56d' : ''),
      LINKEDIN_CLIENT_SECRET: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET || (isDev ? '' : ''),
      LINKEDIN_REDIRECT_URI: process.env.EXPO_PUBLIC_LINKEDIN_REDIRECT_URI || (isDev ? 'https://collaborito-auth.ngrok.io/callback' : ''),
    },
  };
}; 