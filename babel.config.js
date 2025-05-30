module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Add this to ensure expo-auth-session is transpiled
    overrides: [{
      test: './node_modules/expo-auth-session',
      presets: ['babel-preset-expo']
    }]
  };
}; 