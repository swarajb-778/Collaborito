import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  cacheHit?: boolean;
}

class PerformanceService {
  private cache = new Map<string, CacheItem<any>>();
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;
  private defaultCacheTime = 5 * 60 * 1000; // 5 minutes
  private preloadQueue: Set<string> = new Set();

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache from storage
   */
  private async initializeCache() {
    try {
      const cacheData = await AsyncStorage.getItem('performance_cache');
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        
        // Restore cache items that haven't expired
        for (const [key, item] of Object.entries(parsedCache)) {
          const cacheItem = item as CacheItem<any>;
          if (Date.now() < cacheItem.expiryTime) {
            this.cache.set(key, cacheItem);
          }
        }
        
        console.log(`📚 Restored ${this.cache.size} cache items`);
      }
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }

  /**
   * Get data from cache or fetch if not available
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheTime = this.defaultCacheTime
  ): Promise<T> {
    const startTime = Date.now();
    let cacheHit = false;

    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() < cached.expiryTime) {
        cacheHit = true;
        this.recordMetric(key, startTime, Date.now(), true, cacheHit);
        console.log(`⚡ Cache hit for ${key}`);
        return cached.data;
      }

      // Fetch fresh data
      console.log(`🔄 Fetching fresh data for ${key}`);
      const data = await fetcher();

      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiryTime: Date.now() + cacheTime
      });

      // Save to persistent storage
      this.saveCache();

      this.recordMetric(key, startTime, Date.now(), true, cacheHit);
      return data;

    } catch (error) {
      this.recordMetric(key, startTime, Date.now(), false, cacheHit);
      throw error;
    }
  }

  /**
   * Preload data for better performance
   */
  async preloadData(userId: string) {
    const preloadTasks = [
      this.preloadInterests(),
      this.preloadSkills(),
      this.preloadUserProfile(userId),
    ];

    try {
      await Promise.allSettled(preloadTasks);
      console.log('✅ Preload completed');
    } catch (error) {
      console.error('Preload error:', error);
    }
  }

  /**
   * Preload interests data
   */
  private async preloadInterests() {
    if (this.preloadQueue.has('interests')) return;
    this.preloadQueue.add('interests');

    try {
      await this.getOrFetch(
        'interests',
        async () => {
          const { data, error } = await supabase
            .from('interests')
            .select('*')
            .order('name');
          
          if (error) {
            // Return fallback data if table doesn't exist
            return [
              { id: '1', name: 'Technology', category: 'Technology' },
              { id: '2', name: 'Business', category: 'Business' },
              { id: '3', name: 'Creative', category: 'Creative' },
              // Add more fallback interests
            ];
          }
          
          return data || [];
        },
        10 * 60 * 1000 // Cache for 10 minutes
      );
    } finally {
      this.preloadQueue.delete('interests');
    }
  }

  /**
   * Preload skills data
   */
  private async preloadSkills() {
    if (this.preloadQueue.has('skills')) return;
    this.preloadQueue.add('skills');

    try {
      await this.getOrFetch(
        'skills',
        async () => {
          const { data, error } = await supabase
            .from('skills')
            .select('*')
            .order('name');
          
          if (error) {
            // Return fallback data if table doesn't exist
            return [
              { id: '1', name: 'Software Development', category: 'Technology' },
              { id: '2', name: 'Marketing', category: 'Business' },
              { id: '3', name: 'Design', category: 'Creative' },
              // Add more fallback skills
            ];
          }
          
          return data || [];
        },
        10 * 60 * 1000 // Cache for 10 minutes
      );
    } finally {
      this.preloadQueue.delete('skills');
    }
  }

  /**
   * Preload user profile data
   */
  private async preloadUserProfile(userId: string) {
    if (this.preloadQueue.has(`profile_${userId}`)) return;
    this.preloadQueue.add(`profile_${userId}`);

    try {
      await this.getOrFetch(
        `profile_${userId}`,
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) throw error;
          return data;
        },
        2 * 60 * 1000 // Cache for 2 minutes (shorter for user data)
      );
    } catch (error) {
      console.log('Profile preload failed, will fetch when needed');
    } finally {
      this.preloadQueue.delete(`profile_${userId}`);
    }
  }

  /**
   * Batch multiple operations for better performance
   */
  async batchOperations<T>(
    operations: Array<() => Promise<T>>
  ): Promise<Array<T | Error>> {
    const startTime = Date.now();
    
    try {
      const results = await Promise.allSettled(operations.map(op => op()));
      
      const values = results.map(result => 
        result.status === 'fulfilled' ? result.value : new Error('Operation failed')
      );

      this.recordMetric(
        'batch_operations',
        startTime,
        Date.now(),
        true
      );

      return values;
    } catch (error) {
      this.recordMetric(
        'batch_operations',
        startTime,
        Date.now(),
        false
      );
      throw error;
    }
  }

  /**
   * Optimize database queries with pagination
   */
  async paginatedFetch<T>(
    tableName: string,
    options: {
      pageSize?: number;
      orderBy?: string;
      filters?: Record<string, any>;
    } = {}
  ): Promise<{ data: T[]; hasMore: boolean }> {
    const { pageSize = 50, orderBy = 'created_at', filters = {} } = options;
    const cacheKey = `paginated_${tableName}_${JSON.stringify(options)}`;

    return this.getOrFetch(
      cacheKey,
      async () => {
        let query = supabase
          .from(tableName)
          .select('*')
          .order(orderBy)
          .limit(pageSize + 1); // Fetch one extra to check if there's more

        // Apply filters
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        const hasMore = data.length > pageSize;
        const results = hasMore ? data.slice(0, pageSize) : data;

        return { data: results, hasMore };
      },
      1 * 60 * 1000 // Cache for 1 minute
    );
  }

  /**
   * Optimize image loading with caching
   */
  async optimizeImageLoading(imageUrl: string): Promise<string> {
    const cacheKey = `image_${imageUrl}`;
    
    return this.getOrFetch(
      cacheKey,
      async () => {
        // In a real app, you might compress or resize images here
        // For now, we'll just return the URL
        return imageUrl;
      },
      30 * 60 * 1000 // Cache images for 30 minutes
    );
  }

  /**
   * Record performance metrics
   */
  private recordMetric(
    operationName: string,
    startTime: number,
    endTime: number,
    success: boolean,
    cacheHit = false
  ) {
    const metric: PerformanceMetrics = {
      operationName,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      cacheHit
    };

    this.metrics.push(metric);

    // Keep only latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`⚠️ Slow operation detected: ${operationName} took ${metric.duration}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.endTime < 60 * 60 * 1000 // Last hour
    );

    const totalOperations = recentMetrics.length;
    const successfulOperations = recentMetrics.filter(m => m.success).length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const averageDuration = totalOperations > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations : 0;

    return {
      totalOperations,
      successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
      cacheHitRate: totalOperations > 0 ? (cacheHits / totalOperations) * 100 : 0,
      averageDuration: Math.round(averageDuration),
      cacheSize: this.cache.size,
      slowOperations: recentMetrics.filter(m => m.duration > 1000).length
    };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.cache.clear();
    await AsyncStorage.removeItem('performance_cache');
    console.log('🗑️ Performance cache cleared');
  }

  /**
   * Clear expired cache items
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expiryTime) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired cache items`);
      this.saveCache();
    }
  }

  /**
   * Save cache to persistent storage
   */
  private async saveCache() {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      await AsyncStorage.setItem('performance_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  /**
   * Prefetch data based on user patterns
   */
  async smartPrefetch(userId: string, context: 'onboarding' | 'browsing' | 'profile') {
    const startTime = Date.now();

    try {
      switch (context) {
        case 'onboarding':
          await Promise.all([
            this.preloadInterests(),
            this.preloadSkills(),
          ]);
          break;

        case 'browsing':
          await Promise.all([
            this.preloadUserProfile(userId),
            this.paginatedFetch('projects', { pageSize: 20 }),
          ]);
          break;

        case 'profile':
          await this.preloadUserProfile(userId);
          break;
      }

      this.recordMetric(
        `smart_prefetch_${context}`,
        startTime,
        Date.now(),
        true
      );

    } catch (error) {
      this.recordMetric(
        `smart_prefetch_${context}`,
        startTime,
        Date.now(),
        false
      );
      console.error('Smart prefetch error:', error);
    }
  }

  /**
   * Monitor app performance
   */
  startPerformanceMonitoring() {
    // Clean up expired cache every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);

    // Log performance stats every 10 minutes
    setInterval(() => {
      const stats = this.getPerformanceStats();
      console.log('📊 Performance Stats:', stats);
    }, 10 * 60 * 1000);
  }
}

export const performanceService = new PerformanceService(); 