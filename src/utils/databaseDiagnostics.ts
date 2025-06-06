import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

export interface DatabaseDiagnostics {
  tablesExist: boolean;
  hasInitialData: boolean;
  connectionStatus: 'connected' | 'error' | 'unknown';
  missingTables: string[];
  errorMessage?: string;
  recommendations: string[];
}

const REQUIRED_TABLES = ['interests', 'skills', 'user_interests', 'user_skills', 'user_goals'];

export async function performDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  const diagnostics: DatabaseDiagnostics = {
    tablesExist: false,
    hasInitialData: false,
    connectionStatus: 'unknown',
    missingTables: [],
    recommendations: []
  };

  try {
    console.log('🔍 Performing database diagnostics...');

    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      diagnostics.connectionStatus = 'error';
      diagnostics.errorMessage = testError.message;
      
      if (testError.message.includes('Invalid API key')) {
        diagnostics.recommendations.push(
          'Your Supabase API keys may be incorrect or expired. Please check your .env file.',
          'Make sure your Supabase project is active and not paused.',
          'Verify that EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.'
        );
      } else if (testError.message.includes('relation') && testError.message.includes('does not exist')) {
        diagnostics.recommendations.push(
          'Database tables are missing. You need to set up the database schema.',
          'Please follow the instructions in scripts/database-setup-guide.md',
          'Or run the SQL script from scripts/setup-database.sql in your Supabase dashboard.'
        );
      }
      
      return diagnostics;
    }

    diagnostics.connectionStatus = 'connected';

    // Check if required tables exist
    const tableChecks = await Promise.allSettled(
      REQUIRED_TABLES.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        return { table, exists: !error, error };
      })
    );

    const missingTables: string[] = [];
    let allTablesExist = true;

    tableChecks.forEach((result, index) => {
      const tableName = REQUIRED_TABLES[index];
      
      if (result.status === 'fulfilled' && result.value.exists) {
        console.log(`✅ Table '${tableName}': accessible`);
      } else {
        console.log(`❌ Table '${tableName}': missing or inaccessible`);
        missingTables.push(tableName);
        allTablesExist = false;
      }
    });

    diagnostics.tablesExist = allTablesExist;
    diagnostics.missingTables = missingTables;

    if (!allTablesExist) {
      diagnostics.recommendations.push(
        'Some required database tables are missing.',
        'Follow the setup guide in scripts/database-setup-guide.md',
        'Execute the SQL script from scripts/setup-database.sql in your Supabase dashboard.'
      );
    }

    // Check if initial data exists (only if tables exist)
    if (allTablesExist) {
      const [interestsResult, skillsResult] = await Promise.allSettled([
        supabase.from('interests').select('count', { count: 'exact', head: true }),
        supabase.from('skills').select('count', { count: 'exact', head: true })
      ]);

      const interestsCount = interestsResult.status === 'fulfilled' ? 
        interestsResult.value.count || 0 : 0;
      const skillsCount = skillsResult.status === 'fulfilled' ? 
        skillsResult.value.count || 0 : 0;

      console.log(`📊 Interests in database: ${interestsCount}`);
      console.log(`🛠️  Skills in database: ${skillsCount}`);

      if (interestsCount === 0 || skillsCount === 0) {
        diagnostics.recommendations.push(
          'Database tables exist but are missing initial data.',
          'Run the SQL script to populate interests and skills tables.',
          'You can find sample data in scripts/setup-database.sql'
        );
      } else {
        diagnostics.hasInitialData = true;
        diagnostics.recommendations.push('Database is properly configured! 🎉');
      }
    }

  } catch (error) {
    console.error('Diagnostics failed:', error);
    diagnostics.connectionStatus = 'error';
    diagnostics.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    diagnostics.recommendations.push(
      'Unable to perform database diagnostics.',
      'Check your internet connection and Supabase configuration.',
      'Refer to scripts/database-setup-guide.md for setup instructions.'
    );
  }

  return diagnostics;
}

export function showDatabaseSetupAlert(diagnostics: DatabaseDiagnostics) {
  const title = diagnostics.connectionStatus === 'connected' ? 
    'Database Setup Required' : 'Database Connection Error';
  
  const message = [
    diagnostics.errorMessage || 'Some database setup is needed.',
    '',
    'Issues found:',
    ...(diagnostics.missingTables.length > 0 ? 
      [`• Missing tables: ${diagnostics.missingTables.join(', ')}`] : []),
    ...(diagnostics.connectionStatus === 'error' ? 
      ['• Connection error'] : []),
    '',
    'Recommendations:',
    ...diagnostics.recommendations.slice(0, 3).map(r => `• ${r}`)
  ].join('\n');

  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        style: 'default'
      }
    ]
  );
}

export async function quickDatabaseCheck(): Promise<boolean> {
  try {
    // Quick check for essential tables
    const { error: interestsError } = await supabase
      .from('interests')
      .select('count', { count: 'exact', head: true });
    
    const { error: skillsError } = await supabase
      .from('skills')
      .select('count', { count: 'exact', head: true });

    return !interestsError && !skillsError;
  } catch (error) {
    console.warn('Quick database check failed:', error);
    return false;
  }
}

export interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface OnboardingDiagnostics {
  connection: DiagnosticResult;
  userAuth: DiagnosticResult;
  userProfile: DiagnosticResult;
  requiredTables: DiagnosticResult;
  sampleData: DiagnosticResult;
  recommendations: string[];
}

/**
 * Comprehensive diagnostics for onboarding flow issues
 */
export class DatabaseDiagnostics {
  
  static async runFullDiagnostics(userId?: string): Promise<OnboardingDiagnostics> {
    console.log('🔍 Running onboarding diagnostics...');
    
    const results: OnboardingDiagnostics = {
      connection: await this.testConnection(),
      userAuth: await this.testUserAuth(userId),
      userProfile: await this.testUserProfile(userId),
      requiredTables: await this.testRequiredTables(),
      sampleData: await this.testSampleData(),
      recommendations: []
    };
    
    // Generate recommendations based on results
    results.recommendations = this.generateRecommendations(results);
    
    this.printDiagnosticsSummary(results);
    
    return results;
  }
  
  private static async testConnection(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        return {
          status: 'error',
          message: 'Supabase connection failed',
          details: error.message
        };
      }
      
      return {
        status: 'success',
        message: 'Supabase connection successful'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private static async testUserAuth(userId?: string): Promise<DiagnosticResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          status: 'error',
          message: 'Authentication session error',
          details: error.message
        };
      }
      
      if (!session) {
        return {
          status: 'warning',
          message: 'No active authentication session',
          details: 'User may need to sign in again'
        };
      }
      
      if (userId && session.user.id !== userId) {
        return {
          status: 'warning',
          message: 'Session user ID mismatch',
          details: `Expected: ${userId}, Got: ${session.user.id}`
        };
      }
      
      return {
        status: 'success',
        message: 'Authentication session valid',
        details: { userId: session.user.id, email: session.user.email }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Authentication test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private static async testUserProfile(userId?: string): Promise<DiagnosticResult> {
    if (!userId) {
      return {
        status: 'warning',
        message: 'No user ID provided for profile test'
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 'warning',
            message: 'User profile does not exist yet',
            details: 'This is normal for new users in onboarding'
          };
        }
        
        return {
          status: 'error',
          message: 'Profile query failed',
          details: error.message
        };
      }
      
      return {
        status: 'success',
        message: 'User profile exists',
        details: {
          onboarding_completed: data.onboarding_completed,
          onboarding_step: data.onboarding_step,
          first_name: data.first_name,
          last_name: data.last_name
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Profile test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private static async testRequiredTables(): Promise<DiagnosticResult> {
    const requiredTables = [
      'profiles',
      'interests',
      'skills',
      'user_interests',
      'user_skills',
      'user_goals'
    ];
    
    const missingTables: string[] = [];
    const tableDetails: Record<string, any> = {};
    
    for (const table of requiredTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          missingTables.push(table);
          tableDetails[table] = { error: error.message };
        } else {
          tableDetails[table] = { count: count || 0 };
        }
      } catch (error) {
        missingTables.push(table);
        tableDetails[table] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    if (missingTables.length > 0) {
      return {
        status: 'error',
        message: `Missing required tables: ${missingTables.join(', ')}`,
        details: tableDetails
      };
    }
    
    return {
      status: 'success',
      message: 'All required tables exist',
      details: tableDetails
    };
  }
  
  private static async testSampleData(): Promise<DiagnosticResult> {
    try {
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('count', { count: 'exact', head: true });
      
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('count', { count: 'exact', head: true });
      
      const hasInterests = !interestsError && (interests?.length || 0) > 0;
      const hasSkills = !skillsError && (skills?.length || 0) > 0;
      
      if (!hasInterests && !hasSkills) {
        return {
          status: 'error',
          message: 'No sample data found in interests and skills tables',
          details: 'Onboarding will fail without sample data'
        };
      }
      
      if (!hasInterests || !hasSkills) {
        return {
          status: 'warning',
          message: `Missing sample data in ${!hasInterests ? 'interests' : 'skills'} table`,
          details: { 
            interests: hasInterests ? 'OK' : 'Missing',
            skills: hasSkills ? 'OK' : 'Missing'
          }
        };
      }
      
      return {
        status: 'success',
        message: 'Sample data available',
        details: {
          interests: 'Available',
          skills: 'Available'
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Sample data test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private static generateRecommendations(diagnostics: OnboardingDiagnostics): string[] {
    const recommendations: string[] = [];
    
    if (diagnostics.connection.status === 'error') {
      recommendations.push('Check internet connection and Supabase credentials');
    }
    
    if (diagnostics.userAuth.status === 'warning' || diagnostics.userAuth.status === 'error') {
      recommendations.push('User should sign in again to refresh authentication');
    }
    
    if (diagnostics.userProfile.status === 'warning') {
      recommendations.push('This is normal for new users - profile will be created during onboarding');
    }
    
    if (diagnostics.requiredTables.status === 'error') {
      recommendations.push('Run database migration scripts to create missing tables');
    }
    
    if (diagnostics.sampleData.status === 'error' || diagnostics.sampleData.status === 'warning') {
      recommendations.push('Run sample data insertion script to populate interests and skills');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System appears healthy - onboarding should work correctly');
    }
    
    return recommendations;
  }
  
  private static printDiagnosticsSummary(diagnostics: OnboardingDiagnostics): void {
    console.log('\n📊 Onboarding Diagnostics Summary');
    console.log('='.repeat(50));
    
    const statusIcon = (status: string) => {
      switch (status) {
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        default: return '❓';
      }
    };
    
    console.log(`${statusIcon(diagnostics.connection.status)} Connection: ${diagnostics.connection.message}`);
    console.log(`${statusIcon(diagnostics.userAuth.status)} User Auth: ${diagnostics.userAuth.message}`);
    console.log(`${statusIcon(diagnostics.userProfile.status)} User Profile: ${diagnostics.userProfile.message}`);
    console.log(`${statusIcon(diagnostics.requiredTables.status)} Required Tables: ${diagnostics.requiredTables.message}`);
    console.log(`${statusIcon(diagnostics.sampleData.status)} Sample Data: ${diagnostics.sampleData.message}`);
    
    console.log('\n💡 Recommendations:');
    diagnostics.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('='.repeat(50));
  }
}

/**
 * Quick diagnostic function for use in components
 */
export async function quickDiagnostic(userId?: string): Promise<boolean> {
  const results = await DatabaseDiagnostics.runFullDiagnostics(userId);
  
  // Return true if no critical errors
  return results.connection.status !== 'error' && 
         results.requiredTables.status !== 'error' &&
         results.userAuth.status !== 'error';
} 