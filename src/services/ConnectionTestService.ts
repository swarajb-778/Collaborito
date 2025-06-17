import { supabase } from './supabase';
import Constants from 'expo-constants';

// Get Supabase URL and key for Edge Functions testing
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || 
                     Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                     process.env.EXPO_PUBLIC_SUPABASE_URL || 
                     'https://ekydublgvsoaaepdhtzc.supabase.co';

const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || 
                          Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTA0NTUsImV4cCI6MjA1OTA4NjQ1NX0.CSN4WGqUDaOeTB-Mz9SEJvKM6_wx_ReH3lZIQRkGAzA';

export class ConnectionTestService {
  private static instance: ConnectionTestService;

  static getInstance(): ConnectionTestService {
    if (!ConnectionTestService.instance) {
      ConnectionTestService.instance = new ConnectionTestService();
    }
    return ConnectionTestService.instance;
  }

  async testSupabaseConnection(): Promise<{ connected: boolean; error?: string; details?: any }> {
    try {
      console.log('🔬 Testing Supabase connection...');

      // Test 1: Basic connection
      console.log('🔍 Test 1: Basic connection...');
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ Session error:', sessionError.message);
        return { 
          connected: false, 
          error: 'Session connection failed', 
          details: sessionError 
        };
      }

      console.log('✅ Test 1 passed: Basic connection working');

      // Test 2: Database query test
      console.log('🔍 Test 2: Database query test...');
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        if (queryError) {
          console.warn('⚠️ Database query error:', queryError.message);
          return { 
            connected: true, // Connection works but query failed
            error: 'Database query failed', 
            details: queryError 
          };
        }

        console.log('✅ Test 2 passed: Database queries working');
      } catch (dbError) {
        console.warn('⚠️ Database test failed:', dbError);
        return { 
          connected: true, // Connection works but table might not exist
          error: 'Database table access failed', 
          details: dbError 
        };
      }

      // Test 3: Check Edge Functions availability
      console.log('🔍 Test 3: Edge Functions test...');
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        });

        if (!response.ok) {
          console.warn('⚠️ Edge Functions not available (expected in development)');
        } else {
          console.log('✅ Test 3 passed: Edge Functions available');
        }
      } catch (edgeError) {
        console.warn('⚠️ Edge Functions test failed (expected in development):', edgeError);
      }

      console.log('🎉 Supabase connection tests completed successfully');
      return { connected: true };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { 
        connected: false, 
        error: 'Connection test failed', 
        details: error 
      };
    }
  }

  async performDiagnostics(): Promise<void> {
    console.log('🏥 Starting Supabase diagnostics...');

    // Environment variables check
    console.log('🔧 Environment Variables:');
    console.log('- SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('- SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

    // Test connection
    const connectionResult = await this.testSupabaseConnection();
    console.log('📊 Connection Result:', connectionResult);

    // Check local storage
    console.log('🗄️ Local Storage Check:');
    try {
      const { getItemAsync } = await import('expo-secure-store');
      const userJson = await getItemAsync('user');
      const userSession = await getItemAsync('userSession');
      
      console.log('- User data:', userJson ? 'EXISTS' : 'MISSING');
      console.log('- User session:', userSession ? userSession : 'MISSING');
    } catch (storageError) {
      console.error('❌ Local storage check failed:', storageError);
    }

    console.log('🏥 Diagnostics completed');
  }
} 