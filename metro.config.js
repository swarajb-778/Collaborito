const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to fix Supabase/ws issue with stream module
config.resolver.unstable_enablePackageExports = false;

module.exports = config;