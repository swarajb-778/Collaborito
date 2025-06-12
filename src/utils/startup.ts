import { DevConfig } from '@/src/config/development';
import { Alert } from 'react-native';

/**
 * App startup utilities and initialization
 */
export class AppStartup {
  /**
   * Initialize the app with comprehensive checks
   */
  static async initialize(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check environment configuration
      const envCheck = this.checkEnvironment();
      if (!envCheck.success) {
        issues.push(...envCheck.issues);
      }
      
      // Check required dependencies
      const depsCheck = await this.checkDependencies();
      if (!depsCheck.success) {
        issues.push(...depsCheck.issues);
      }
      
      // Initialize services
      const servicesCheck = await this.initializeServices();
      if (!servicesCheck.success) {
        issues.push(...servicesCheck.issues);
      }
      
      if (issues.length > 0) {
        this.handleStartupIssues(issues);
      }
      
      return { success: issues.length === 0, issues };
    } catch (error) {
      console.error('Critical startup error:', error);
      issues.push('Critical initialization failure');
      return { success: false, issues };
    }
  }
  
  /**
   * Check environment configuration
   */
  private static checkEnvironment(): { success: boolean; issues: string[] } {
    const validation = DevConfig.validateEnvironment();
    
    if (!validation.isValid) {
      console.warn('Environment validation failed:', validation.issues);
      
      if (DevConfig.isDevelopment) {
        console.log('Running in development mode - some issues may be acceptable');
        return { success: true, issues: [] }; // Don't fail in dev mode
      }
    }
    
    return { success: validation.isValid, issues: validation.issues };
  }
  
  /**
   * Check required dependencies and APIs
   */
  private static async checkDependencies(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check AsyncStorage availability
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.getItem('__test__');
      
      // Check SecureStore availability (might not be available on all platforms)
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.isAvailableAsync();
      } catch (error) {
        if (!DevConfig.isDevelopment) {
          issues.push('SecureStore not available');
        }
      }
      
      // Check network connectivity
      const connectivityCheck = await this.checkConnectivity();
      if (!connectivityCheck) {
        issues.push('Network connectivity issues detected');
      }
      
      return { success: issues.length === 0, issues };
    } catch (error) {
      console.error('Dependency check failed:', error);
      return { success: false, issues: ['Dependency validation failed'] };
    }
  }
  
  /**
   * Initialize required services
   */
  private static async initializeServices(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Test Supabase connection (don't fail if it doesn't work in dev mode)
      const supabaseTest = await this.testSupabaseConnection();
      if (!supabaseTest && !DevConfig.isDevelopment) {
        issues.push('Supabase connection failed');
      }
      
      return { success: issues.length === 0, issues };
    } catch (error) {
      console.error('Service initialization failed:', error);
      return { success: false, issues: ['Service initialization failed'] };
    }
  }
  
  /**
   * Test network connectivity
   */
  private static async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      return false;
    }
  }
  
  /**
   * Test Supabase connection
   */
  private static async testSupabaseConnection(): Promise<boolean> {
    try {
      const { supabase } = require('@/src/services/supabase');
      
      // Try a simple query that should work even without authentication
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      // If we get a permissions error, that's actually good - it means Supabase is working
      return !error || error.message.includes('permission');
    } catch (error) {
      console.warn('Supabase test failed:', error);
      return false;
    }
  }
  
  /**
   * Handle startup issues
   */
  private static handleStartupIssues(issues: string[]): void {
    console.warn('App startup issues detected:', issues);
    
    if (DevConfig.isDevelopment) {
      // In development, just log the issues
      console.log('Development mode - continuing despite issues');
      return;
    }
    
    // In production, show user-friendly error
    const criticalIssues = issues.filter(issue => 
      issue.includes('Critical') || 
      issue.includes('network') ||
      issue.includes('Service initialization')
    );
    
    if (criticalIssues.length > 0) {
      Alert.alert(
        'Startup Error',
        'The app encountered issues during startup. Please check your internet connection and try restarting the app.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  }
  
  /**
   * Get startup status information
   */
  static getStartupInfo(): {
    isDevelopment: boolean;
    environment: string;
    apis: { [key: string]: boolean };
  } {
    const endpoints = DevConfig.getApiEndpoints();
    
    return {
      isDevelopment: DevConfig.isDevelopment,
      environment: DevConfig.isDevelopment ? 'development' : 'production',
      apis: {
        supabase: endpoints.supabase.isValid,
        claude: endpoints.claude.isConfigured,
        linkedin: endpoints.linkedin.isConfigured
      }
    };
  }
} 