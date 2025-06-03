const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Supabase/ws module compatibility with React Native 0.79
// This prevents the 'stream' module import error
config.resolver.unstable_enablePackageExports = false;

// Add polyfill resolver to handle Node.js modules
config.resolver.alias = {
  ...config.resolver.alias,
  'stream': path.resolve(__dirname, 'polyfills/stream-polyfill.js'),
  'crypto': 'expo-crypto',
  'url': 'react-native-url-polyfill'
};

// Add resolver for WebSocket compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;