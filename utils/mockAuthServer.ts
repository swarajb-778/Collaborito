/**
 * This is a mock server utility to handle LinkedIn OAuth redirects during development
 * In a production app, you would use a real backend server to handle OAuth
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Start a mock server to handle LinkedIn OAuth redirects
 * In development, we can't use a real server, so this simulates the redirect
 * process by listening for when our ngrok URL is accessed
 */
export const startServer = () => {
  // This is only for development demo purposes
  console.log('Setting up mock auth server for development');
  
  // We can't actually start a server in the client, but we can simulate one
  // by providing instructions for testing
  
  console.log(`
    LinkedIn OAuth Flow (Development):
    
    1. When you click "Sign in with LinkedIn" we'll open LinkedIn's auth page
    2. After you authorize, LinkedIn will redirect to your ngrok URL
    3. For development, you'll need to manually click a button on the ngrok page
       to complete the flow and return to the app
    
    In production, you would set up a real server at your redirect URL that
    would automatically redirect back to your app.
  `);
  
  return {
    // Cleanup function
    stop: () => {
      console.log('Mock auth server stopped');
    }
  };
};

/**
 * Handle a manual redirect from the ngrok server back to the app
 * This simulates what a real server would do automatically
 */
export const handleManualRedirect = (code: string, state: string) => {
  const appRedirectUrl = `collaborito://auth?code=${code}&state=${state}`;
  
  if (Platform.OS === 'web') {
    window.location.href = appRedirectUrl;
  } else {
    Linking.openURL(appRedirectUrl);
  }
}; 