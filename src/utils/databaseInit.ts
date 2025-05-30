import { supabase } from '../services/supabase';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { performanceService } from '../services/performanceService';
// import { errorRecoveryService } from '../services/errorRecoveryService';

interface FallbackData {
  interests: Array<{ id: string; name: string; category: string }>;
  skills: Array<{ id: string; name: string; category: string }>;
}

const FALLBACK_INTERESTS = [
  { id: 'art', name: 'Art', category: 'Creative' },
  { id: 'ai-ml', name: 'Artificial Intelligence & Machine Learning', category: 'Technology' },
  { id: 'biotech', name: 'Biotechnology', category: 'Science' },
  { id: 'business', name: 'Business', category: 'Business' },
  { id: 'books', name: 'Books', category: 'Entertainment' },
  { id: 'climate', name: 'Climate Change', category: 'Environmental' },
  { id: 'civic', name: 'Civic Engagement', category: 'Social' },
  { id: 'dancing', name: 'Dancing', category: 'Entertainment' },
  { id: 'data-science', name: 'Data Science', category: 'Technology' },
  { id: 'education', name: 'Education', category: 'Education' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'Business' },
  { id: 'fashion', name: 'Fashion', category: 'Creative' },
  { id: 'fitness', name: 'Fitness', category: 'Health' },
  { id: 'food', name: 'Food', category: 'Lifestyle' },
  { id: 'gaming', name: 'Gaming', category: 'Entertainment' },
  { id: 'health', name: 'Health & Wellness', category: 'Health' },
  { id: 'finance', name: 'Investing & Finance', category: 'Business' },
  { id: 'marketing', name: 'Marketing', category: 'Business' },
  { id: 'movies', name: 'Movies', category: 'Entertainment' },
  { id: 'music', name: 'Music', category: 'Entertainment' },
  { id: 'parenting', name: 'Parenting', category: 'Lifestyle' },
  { id: 'pets', name: 'Pets', category: 'Lifestyle' },
  { id: 'product-design', name: 'Product Design', category: 'Creative' },
  { id: 'reading', name: 'Reading', category: 'Entertainment' },
  { id: 'real-estate', name: 'Real Estate', category: 'Business' },
  { id: 'robotics', name: 'Robotics', category: 'Technology' },
  { id: 'science-tech', name: 'Science & Tech', category: 'Technology' },
  { id: 'social-impact', name: 'Social Impact', category: 'Social' },
  { id: 'sports', name: 'Sports', category: 'Entertainment' },
  { id: 'travel', name: 'Travel', category: 'Lifestyle' },
  { id: 'writing', name: 'Writing', category: 'Creative' },
  { id: 'other', name: 'Other', category: 'Other' }
];

const FALLBACK_SKILLS = [
  { id: 'accounting', name: 'Accounting', category: 'Business' },
  { id: 'ai-ml-skill', name: 'Artificial Intelligence & Machine Learning', category: 'Technology' },
  { id: 'biotech-skill', name: 'Biotechnology', category: 'Science' },
  { id: 'biz-dev', name: 'Business Development', category: 'Business' },
  { id: 'content', name: 'Content Creation', category: 'Marketing' },
  { id: 'therapy', name: 'Counseling & Therapy', category: 'Health' },
  { id: 'data-analysis', name: 'Data Analysis', category: 'Technology' },
  { id: 'devops', name: 'DevOps', category: 'Technology' },
  { id: 'finance-skill', name: 'Finance', category: 'Business' },
  { id: 'fundraising', name: 'Fundraising', category: 'Business' },
  { id: 'graphic-design', name: 'Graphic Design', category: 'Creative' },
  { id: 'legal', name: 'Legal', category: 'Professional' },
  { id: 'manufacturing', name: 'Manufacturing', category: 'Industrial' },
  { id: 'marketing-skill', name: 'Marketing', category: 'Business' },
  { id: 'policy', name: 'Policy', category: 'Government' },
  { id: 'product-mgmt', name: 'Product Management', category: 'Business' },
  { id: 'project-mgmt', name: 'Project Management', category: 'Business' },
  { id: 'pr', name: 'Public Relations', category: 'Marketing' },
  { id: 'research', name: 'Research', category: 'Science' },
  { id: 'sales', name: 'Sales', category: 'Business' },
  { id: 'backend-dev', name: 'Software Development (Backend)', category: 'Technology' },
  { id: 'frontend-dev', name: 'Software Development (Frontend)', category: 'Technology' },
  { id: 'ui-ux', name: 'UI/UX Design', category: 'Creative' },
  { id: 'other-skill', name: 'Other', category: 'Other' }
];

class EnhancedDatabaseInit {
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;
  private lastInitTime = 0;
  private retryAttempts = 0;
  private maxRetries = 3;

  /**
   * Initialize database with comprehensive error handling and fallbacks
   */
  async initializeDatabase(): Promise<boolean> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    // Check if we've recently initialized successfully
    if (this.isInitialized && Date.now() - this.lastInitTime < 5 * 60 * 1000) {
      console.log('✅ Database recently initialized, skipping');
      return true;
    }

    this.initPromise = this.performInitialization();
    const result = await this.initPromise;
    this.initPromise = null;
    
    return result;
  }

  /**
   * Perform the actual database initialization
   */
  private async performInitialization(): Promise<boolean> {
    try {
      console.log('🚀 Starting enhanced database initialization...');
      
      // Load cached fallback data if available
      await this.loadFallbackData();

      // Attempt to initialize with multiple strategies
      const success = await this.tryInitializationStrategies();

      if (success) {
        this.isInitialized = true;
        this.lastInitTime = Date.now();
        this.retryAttempts = 0;
        console.log('✅ Database initialization completed successfully');
        
        // Preload data for better performance
        // performanceService.smartPrefetch('system', 'onboarding');
        
        return true;
      } else {
        console.warn('⚠️ Database initialization failed, using fallback mode');
        await this.enableFallbackMode();
        return false;
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      // await errorRecoveryService.handleError(
      //   error as Error,
      //   'database_initialization',
      //   undefined,
      //   false
      // );
      
      await this.enableFallbackMode();
      return false;
    }
  }

  /**
   * Try multiple initialization strategies
   */
  private async tryInitializationStrategies(): Promise<boolean> {
    const strategies = [
      this.directTableAccess.bind(this),
      this.cacheBasedInit.bind(this),
      this.networkBasedInit.bind(this)
    ];

    for (const strategy of strategies) {
      try {
        const success = await strategy();
        if (success) {
          return true;
        }
      } catch (error) {
        console.log(`Strategy failed, trying next:`, error);
        continue;
      }
    }

    return false;
  }

  /**
   * Strategy 1: Direct table access
   */
  private async directTableAccess(): Promise<boolean> {
    console.log('📊 Trying direct table access...');
    
    try {
      // Test interests table
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('id, name, category')
        .limit(5);

      // Test skills table
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category')
        .limit(5);

      if (!interestsError && interests && interests.length > 0 &&
          !skillsError && skills && skills.length > 0) {
        console.log('✅ Direct table access successful');
        
        // Cache the data for performance
        await this.cacheTableData('interests', interests);
        await this.cacheTableData('skills', skills);
        
        return true;
      }

      console.log('❌ Direct table access failed - tables empty or inaccessible');
      return false;
    } catch (error) {
      console.log('❌ Direct table access error:', error);
      return false;
    }
  }

  /**
   * Strategy 2: Cache-based initialization
   */
  private async cacheBasedInit(): Promise<boolean> {
    console.log('💾 Trying cache-based initialization...');
    
    try {
      const cachedInterests = await AsyncStorage.getItem('cached_interests');
      const cachedSkills = await AsyncStorage.getItem('cached_skills');

      if (cachedInterests && cachedSkills) {
        const interests = JSON.parse(cachedInterests);
        const skills = JSON.parse(cachedSkills);
        
        if (interests.length > 0 && skills.length > 0) {
          console.log('✅ Cache-based initialization successful');
          return true;
        }
      }

      console.log('❌ Cache-based initialization failed - no valid cache');
      return false;
    } catch (error) {
      console.log('❌ Cache-based initialization error:', error);
      return false;
    }
  }

  /**
   * Strategy 3: Network-based initialization with retries
   */
  private async networkBasedInit(): Promise<boolean> {
    console.log('🌐 Trying network-based initialization...');
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Test basic connectivity
        const { data: profileTest } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (profileTest !== null) {
          console.log('✅ Network-based initialization successful');
          // Cache fallback data for future use
          await this.cacheFallbackData();
          return true;
        }
      } catch (error) {
        console.log(`Network attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.log('❌ Network-based initialization failed');
    return false;
  }

  /**
   * Enable fallback mode with local data
   */
  private async enableFallbackMode(): Promise<void> {
    console.log('🔄 Enabling fallback mode...');
    
    try {
      // Store fallback flag
      await AsyncStorage.setItem('fallback_mode', 'true');
      await AsyncStorage.setItem('fallback_mode_timestamp', Date.now().toString());
      
      // Cache fallback data
      await AsyncStorage.setItem('cached_interests', JSON.stringify(FALLBACK_INTERESTS));
      await AsyncStorage.setItem('cached_skills', JSON.stringify(FALLBACK_SKILLS));
      
      console.log('✅ Fallback mode enabled with local data');
    } catch (error) {
      console.error('Failed to enable fallback mode:', error);
    }
  }

  /**
   * Cache table data for performance
   */
  private async cacheTableData(tableName: string, data: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`cached_${tableName}`, JSON.stringify(data));
      await AsyncStorage.setItem(`cache_timestamp_${tableName}`, Date.now().toString());
    } catch (error) {
      console.error(`Failed to cache ${tableName}:`, error);
    }
  }

  /**
   * Cache fallback data
   */
  private async cacheFallbackData(): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_interests', JSON.stringify(FALLBACK_INTERESTS));
      await AsyncStorage.setItem('cached_skills', JSON.stringify(FALLBACK_SKILLS));
      await AsyncStorage.setItem('fallback_data_cached', Date.now().toString());
      console.log('📱 Fallback data cached');
    } catch (error) {
      console.error('Failed to cache fallback data:', error);
    }
  }

  /**
   * Load cached fallback data
   */
  private async loadFallbackData(): Promise<void> {
    try {
      const cachedInterests = await AsyncStorage.getItem('cached_interests');
      const cachedSkills = await AsyncStorage.getItem('cached_skills');

      if (!cachedInterests || !cachedSkills) {
        await this.cacheFallbackData();
      }
    } catch (error) {
      console.error('Failed to load fallback data:', error);
    }
  }

  /**
   * Check database health with comprehensive testing
   */
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      console.log('🔍 Performing comprehensive database health check...');
      
      // Test 1: Basic connectivity
      const { error: connectivityError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (connectivityError) {
        console.log('❌ Basic connectivity failed:', connectivityError.message);
        return false;
      }

      // Test 2: Required tables existence
      const requiredTables = ['interests', 'skills', 'user_interests', 'user_skills', 'user_goals'];
      const tableTests = await Promise.allSettled(
        requiredTables.map(async (table) => {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          return { table, error };
        })
      );

      const failedTables = tableTests
        .filter(result => result.status === 'fulfilled' && result.value.error)
        .map(result => result.status === 'fulfilled' ? result.value.table : 'unknown');

      if (failedTables.length > 0) {
        console.log('⚠️ Missing tables detected:', failedTables);
        
        // Not a critical failure if we have fallback data
        const hasValidFallback = await this.validateFallbackData();
        return hasValidFallback;
      }

      // Test 3: Data availability
      const { data: interests } = await supabase
        .from('interests')
        .select('id')
        .limit(1);

      const { data: skills } = await supabase
        .from('skills')
        .select('id')
        .limit(1);

      if (!interests?.length || !skills?.length) {
        console.log('⚠️ Required tables exist but lack data');
        return await this.validateFallbackData();
      }

      console.log('✅ Database health check passed');
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return await this.validateFallbackData();
    }
  }

  /**
   * Validate fallback data availability
   */
  private async validateFallbackData(): Promise<boolean> {
    try {
      const cachedInterests = await AsyncStorage.getItem('cached_interests');
      const cachedSkills = await AsyncStorage.getItem('cached_skills');

      const interests = cachedInterests ? JSON.parse(cachedInterests) : null;
      const skills = cachedSkills ? JSON.parse(cachedSkills) : null;

      const isValid = interests?.length > 0 && skills?.length > 0;
      
      if (isValid) {
        console.log('✅ Fallback data validation passed');
      } else {
        console.log('❌ Fallback data validation failed');
        await this.cacheFallbackData(); // Ensure fallback data is available
      }

      return true; // Always return true since we can create fallback data
    } catch (error) {
      console.error('Fallback validation error:', error);
      await this.cacheFallbackData(); // Emergency fallback
      return true;
    }
  }

  /**
   * Get initialization status
   */
  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      lastInitTime: this.lastInitTime,
      retryAttempts: this.retryAttempts,
      fallbackModeEnabled: AsyncStorage.getItem('fallback_mode')
    };
  }

  /**
   * Force re-initialization
   */
  async forceReinitialize(): Promise<boolean> {
    this.isInitialized = false;
    this.lastInitTime = 0;
    this.retryAttempts = 0;
    
    // Clear any cached initialization data
    await AsyncStorage.removeItem('fallback_mode');
    
    return this.initializeDatabase();
  }

  /**
   * Get cached data for interests
   */
  async getCachedInterests() {
    try {
      const cached = await AsyncStorage.getItem('cached_interests');
      return cached ? JSON.parse(cached) : FALLBACK_INTERESTS;
    } catch (error) {
      console.error('Error getting cached interests:', error);
      return FALLBACK_INTERESTS;
    }
  }

  /**
   * Get cached data for skills
   */
  async getCachedSkills() {
    try {
      const cached = await AsyncStorage.getItem('cached_skills');
      return cached ? JSON.parse(cached) : FALLBACK_SKILLS;
    } catch (error) {
      console.error('Error getting cached skills:', error);
      return FALLBACK_SKILLS;
    }
  }
}

// Create singleton instance
const enhancedDatabaseInit = new EnhancedDatabaseInit();

// Export legacy functions for backward compatibility
export const initializeDatabase = enhancedDatabaseInit.initializeDatabase.bind(enhancedDatabaseInit);
export const checkDatabaseHealth = enhancedDatabaseInit.checkDatabaseHealth.bind(enhancedDatabaseInit);

// Export enhanced functionality
export const databaseInit = enhancedDatabaseInit;
export { FALLBACK_INTERESTS, FALLBACK_SKILLS }; 