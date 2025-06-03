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