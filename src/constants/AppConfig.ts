/**
 * Application Configuration
 * 
 * This file contains global application configuration settings.
 * It serves as a central location for app-wide constants and settings.
 */

import { Platform } from 'react-native';

// App identification
export const APP_NAME = 'Collaborito';
export const APP_VERSION = '1.0.0';
export const APP_BUILD = '1';
export const APP_SCHEME = 'collaborito';

// API and service URLs
export const API_BASE_URL = process.env.SUPABASE_URL || 'https://ekydublgvsoaaepdhtzc.supabase.co';
export const API_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Authentication settings
export const AUTH = {
  LINKEDIN: {
    CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
    REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'collaborito://auth/linkedin-callback',
  },
  SESSIONS: {
    REFRESH_INTERVAL: 3600 * 1000, // 1 hour in milliseconds
    STORAGE_KEY: 'collaborito_auth_session',
  },
};

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_PUSH_NOTIFICATIONS: Platform.OS !== 'web',
  ENABLE_DEEP_LINKING: true,
  ENABLE_LINKEDIN_AUTH: true,
  ENABLE_EMAIL_AUTH: true,
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300, // ms
  DEFAULT_PADDING: 16,
  DEFAULT_RADIUS: 8,
  HEADER_HEIGHT: 60,
  BOTTOM_TAB_HEIGHT: 60,
};

// Default settings
export const DEFAULT_SETTINGS = {
  THEME: 'system', // 'light', 'dark', 'system'
  LANGUAGE: 'en',
  NOTIFICATIONS_ENABLED: true,
};

// Development and debugging
export const DEBUG = {
  ENABLED: __DEV__,
  LOG_LEVEL: __DEV__ ? 'debug' : 'error',
  SHOW_NETWORK_ACTIVITY: __DEV__,
};

// Export all configuration
export default {
  APP_NAME,
  APP_VERSION,
  APP_BUILD,
  APP_SCHEME,
  API_BASE_URL,
  API_ANON_KEY,
  AUTH,
  FEATURES,
  UI_CONFIG,
  DEFAULT_SETTINGS,
  DEBUG,
}; 