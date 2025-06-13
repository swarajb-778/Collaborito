const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Performance optimizations
config.resolver.platforms = ['ios', 'android', 'web'];

// Disable package exports to fix Supabase/ws issue with stream module
config.resolver.unstable_enablePackageExports = false;

// Enhanced resolver configuration
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Better asset resolution
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'lottie',
  'ttf',
  'otf',
  'woff',
  'woff2'
];

// Source extensions for better TypeScript support
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs'
];

// Transform configuration for better performance
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Cache configuration for faster builds
config.cacheStores = [
  {
    name: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.metro-cache'),
  },
];

// Watch folders for better hot reloading
config.watchFolders = [
  path.resolve(__dirname, './'),
];

// Better error handling in development
if (process.env.NODE_ENV === 'development') {
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  config.transformer.unstable_allowRequireContext = true;
}

module.exports = config;