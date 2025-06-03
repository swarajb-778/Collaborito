const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Commented out the workaround to test if the issue is fixed with latest Supabase
// config.resolver.unstable_enablePackageExports = false;

module.exports = config;