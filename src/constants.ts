/**
 * Application constants and configuration values
 */

export const constants = {
  // App configuration
  appName: 'Collaborito',
  appScheme: 'collaborito://',
  
  // Authentication
  auth: {
    // LinkedIn OAuth configuration
    linkedin: {
      clientId: '77dpxmsrs0t56d',
      clientSecret: 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==',
      redirectUri: 'https://f429-134-154-76-158.ngrok-free.app/auth/linkedin-callback',
      scopes: ['openid', 'profile', 'email'],
    },
    
    // Storage keys
    storageKeys: {
      user: 'user',
      session: 'userSession',
      oauthState: 'oauth_state',
    },
  },
  
  // API endpoints
  api: {
    baseUrl: 'https://api.example.com',
    auth: {
      signIn: '/auth/signin',
      signUp: '/auth/signup',
      signOut: '/auth/signout',
    },
  },
}; 