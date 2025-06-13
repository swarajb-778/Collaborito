const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable clear cache on start
config.resetCache = true;

// Ensure proper platform resolution
config.resolver.platforms = ['ios', 'android', 'web'];

// Add polyfill support
config.resolver.alias = {
  crypto: 'react-native-crypto-js',
  stream: 'stream-browserify',
  buffer: '@craftzdog/react-native-buffer',
};

module.exports = config;