const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable clear cache on start
config.resetCache = true;

// Ensure proper platform resolution
config.resolver.platforms = ['ios', 'android', 'web'];

// Configure path aliases to match tsconfig.json
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
};

// Add additional alias configurations for better compatibility
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'react-native-crypto-js',
  stream: 'stream-browserify',
  buffer: '@craftzdog/react-native-buffer',
};

// Ensure proper source map generation
config.transformer.minifierConfig = {
  simplify: false,
};

module.exports = config;