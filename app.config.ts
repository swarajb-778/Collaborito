import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Collaborito',
  slug: 'collaborito',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'collaborito',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.collaborito.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.collaborito.app'
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-web-browser',
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you share them with your team.',
        cameraPermission: 'The app accesses your camera to let you add images to your projects.'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Use actual environment variables
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    EXPO_PUBLIC_LINKEDIN_CLIENT_ID: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID,
    EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET,
    eas: {
      projectId: 'your-eas-project-id'
    }
  }
}); 