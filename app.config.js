import 'dotenv/config';

export default {
  expo: {
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
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourcompany.collaborito',
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.yourcompany.collaborito'
    },
    web: {
      bundler: 'metro',
      favicon: './assets/images/favicon.png'
    },
    extra: {
      // Load environment variables here with fallback values for development
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      // Use placeholder values for LinkedIn and Claude API keys during development
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || 'development-placeholder',
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'collaborito://auth/callback',
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || 'development-placeholder',
      eas: {
        projectId: 'your-eas-project-id'
      }
    },
    plugins: [
      'expo-router',
      [
        'expo-auth-session',
        {
          providers: ['linkedin']
        }
      ]
    ]
  }
}; 