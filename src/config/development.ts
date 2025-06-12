import Constants from 'expo-constants';

/**
 * Development configuration and utilities
 */
export class DevConfig {
  /**
   * Check if we're running in development mode
   */
  static get isDevelopment(): boolean {
    return __DEV__ || process.env.NODE_ENV === 'development';
  }

  /**
   * Check if we're running in production mode
   */
  static get isProduction(): boolean {
    return !this.isDevelopment;
  }

  /**
   * Get environment variable with fallback
   */
  static getEnvVar(key: string, fallback?: string): string | undefined {
    const value = Constants.expoConfig?.extra?.[key] || process.env[key];
    return value || fallback;
  }

  /**
   * Validate that all required environment variables are set
   */
  static validateEnvironment(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];
    
    const optionalVars = [
      'CLAUDE_API_KEY',
      'EXPO_PUBLIC_LINKEDIN_CLIENT_ID',
      'EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET'
    ];
    
    // Check required variables
    for (const varName of requiredVars) {
      const value = this.getEnvVar(varName);
      if (!value) {
        issues.push(`Missing required environment variable: ${varName}`);
      } else if (value === 'development-placeholder') {
        issues.push(`Environment variable ${varName} is still set to placeholder value`);
      }
    }
    
    // Check optional variables (warn but don't fail)
    for (const varName of optionalVars) {
      const value = this.getEnvVar(varName);
      if (!value && this.isProduction) {
        console.warn(`Optional environment variable not set: ${varName}`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Get Supabase configuration with validation
   */
  static getSupabaseConfig(): { url: string; anonKey: string; isValid: boolean } {
    const url = this.getEnvVar('SUPABASE_URL', '');
    const anonKey = this.getEnvVar('SUPABASE_ANON_KEY', '');
    
    const isValid = !!(url && anonKey && 
      url !== 'development-placeholder' && 
      anonKey !== 'development-placeholder' &&
      url.startsWith('https://') &&
      url.includes('.supabase.co'));
    
    return {
      url: isValid ? url : 'https://mock.supabase.co',
      anonKey: isValid ? anonKey : 'mock-anon-key',
      isValid
    };
  }

  /**
   * Log development information
   */
  static logDevInfo(): void {
    if (!this.isDevelopment) return;
    
    console.log('🔧 Development Mode Active');
    
    const validation = this.validateEnvironment();
    if (!validation.isValid) {
      console.warn('⚠️ Environment Issues:', validation.issues);
    } else {
      console.log('✅ Environment configured correctly');
    }
    
    const supabaseConfig = this.getSupabaseConfig();
    if (!supabaseConfig.isValid) {
      console.warn('⚠️ Using mock Supabase configuration');
    } else {
      console.log('✅ Supabase configured correctly');
    }
  }

  /**
   * Get mock data for development
   */
  static getMockUser() {
    return {
      id: 'dev-user-123',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      profileImage: null,
      oauthProvider: 'development'
    };
  }

  /**
   * Check if feature flags are enabled
   */
  static isFeatureEnabled(feature: string): boolean {
    if (this.isDevelopment) {
      // In development, all features are enabled by default
      return true;
    }
    
    // In production, check environment variables
    return this.getEnvVar(`FEATURE_${feature.toUpperCase()}`) === 'true';
  }

  /**
   * Get API endpoints with environment awareness
   */
  static getApiEndpoints() {
    const supabase = this.getSupabaseConfig();
    
    return {
      supabase: {
        url: supabase.url,
        anonKey: supabase.anonKey,
        isValid: supabase.isValid
      },
      claude: {
        apiKey: this.getEnvVar('CLAUDE_API_KEY'),
        isConfigured: !!this.getEnvVar('CLAUDE_API_KEY') && 
          this.getEnvVar('CLAUDE_API_KEY') !== 'development-placeholder'
      },
      linkedin: {
        clientId: this.getEnvVar('EXPO_PUBLIC_LINKEDIN_CLIENT_ID'),
        clientSecret: this.getEnvVar('EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET'),
        isConfigured: !!this.getEnvVar('EXPO_PUBLIC_LINKEDIN_CLIENT_ID') && 
          this.getEnvVar('EXPO_PUBLIC_LINKEDIN_CLIENT_ID') !== 'development-placeholder'
      }
    };
  }
} 