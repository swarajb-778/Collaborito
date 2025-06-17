import Constants from 'expo-constants';

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isValid: boolean;
  isDevelopment: boolean;
}

export class EnvironmentConfig {
  private static config: EnvConfig | null = null;

  static getConfig(): EnvConfig {
    if (!EnvironmentConfig.config) {
      EnvironmentConfig.config = EnvironmentConfig.initializeConfig();
    }
    return EnvironmentConfig.config;
  }

  private static initializeConfig(): EnvConfig {
    console.log('🔧 Initializing environment configuration...');

    // Try different environment variable sources
    const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL || 
                        Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                        process.env.EXPO_PUBLIC_SUPABASE_URL || 
                        'https://ekydublgvsoaaepdhtzc.supabase.co';

    const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || 
                            Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                            process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTA0NTUsImV4cCI6MjA1OTA4NjQ1NX0.CSN4WGqUDaOeTB-Mz9SEJvKM6_wx_ReH3lZIQRkGAzA';

    const isValid = !!(supabaseUrl && supabaseAnonKey && 
      supabaseUrl.startsWith('https://') && 
      supabaseUrl.includes('.supabase.co') &&
      supabaseAnonKey.length > 100);

    const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

    const config: EnvConfig = {
      supabaseUrl,
      supabaseAnonKey,
      isValid,
      isDevelopment
    };

    console.log('🔧 Environment config:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlValid: supabaseUrl.startsWith('https://'),
      keyValid: supabaseAnonKey.length > 100,
      isValid,
      isDevelopment
    });

    return config;
  }

  static logEnvironmentStatus(): void {
    const config = EnvironmentConfig.getConfig();
    
    console.log('🌍 Environment Status:');
    console.log('- Mode:', config.isDevelopment ? 'Development' : 'Production');
    console.log('- Supabase URL:', config.supabaseUrl ? 'Configured' : 'Missing');
    console.log('- Supabase Key:', config.supabaseAnonKey ? 'Configured' : 'Missing');
    console.log('- Configuration Valid:', config.isValid ? '✅' : '❌');

    if (!config.isValid) {
      console.warn('⚠️ Environment configuration issues detected');
      console.warn('- Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
      console.warn('- Check your .env file and app.config.ts');
    }
  }
} 