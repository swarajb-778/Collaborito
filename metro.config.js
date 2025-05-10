// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add all node_modules to entries that should be bundled at app start and not on demand
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  // Add performance-sensitive modules here
  'react': path.resolve(__dirname, 'node_modules/react'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
  '@react-navigation/native': path.resolve(__dirname, 'node_modules/@react-navigation/native'),
  'expo-router': path.resolve(__dirname, 'node_modules/expo-router'),
};

// Enable Ram bundle for better performance
config.serializer.createModuleIdFactory = () => {
  const cache = new Map();
  let index = 0;
  return (path) => {
    if (cache.has(path)) {
      return cache.get(path);
    }
    const id = index++;
    cache.set(path, id);
    return id;
  };
};

// Optimize the asset loading
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Enable additional optimizations
config.transformer.minifierConfig = {
  compress: {
    drop_console: false, // Only set to true in production
    drop_debugger: true,
  },
};

// Enable code splitting for faster screen loads
config.transformer.asyncRequireModulePath = require.resolve('metro-runtime/src/modules/asyncRequire');

// Added for faster startup time - minimizes unnecessary traversal
config.resolver.disableHierarchicalLookup = true;

module.exports = config;