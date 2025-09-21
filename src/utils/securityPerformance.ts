/**
 * Security Performance Optimization Utilities
 * Helpers for optimizing security-related operations and caching
 */

import { createLogger } from './logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = createLogger('SecurityPerformance');

// Cache keys
const CACHE_KEYS = {
  DEVICE_FINGERPRINT: 'security_device_fingerprint',
  SECURITY_METRICS: 'security_metrics_cache',
  LOGIN_ATTEMPTS: 'login_attempts_cache',
  SECURITY_CONFIG: 'security_config_cache',
  DEVICE_LIST: 'device_list_cache',
  NOTIFICATIONS: 'notifications_cache'
};

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  DEVICE_FINGERPRINT: 7 * 24 * 60 * 60 * 1000, // 7 days
  SECURITY_METRICS: 5 * 60 * 1000, // 5 minutes
  LOGIN_ATTEMPTS: 2 * 60 * 1000, // 2 minutes
  SECURITY_CONFIG: 10 * 60 * 1000, // 10 minutes
  DEVICE_LIST: 30 * 1000, // 30 seconds
  NOTIFICATIONS: 60 * 1000 // 1 minute
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Generic cache utility with expiration
 */
export class SecurityCache {
  private static instance: SecurityCache;
  private memoryCache = new Map<string, CacheEntry<any>>();

  static getInstance(): SecurityCache {
    if (!this.instance) {
      this.instance = new SecurityCache();
    }
    return this.instance;
  }

  /**
   * Get cached data if it exists and is not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && Date.now() < memoryEntry.expiry) {
        return memoryEntry.data;
      }

      // Check persistent storage
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() < entry.expiry) {
          // Cache in memory for faster access
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Remove expired entry
          await AsyncStorage.removeItem(key);
          this.memoryCache.delete(key);
        }
      }

      return null;
    } catch (error) {
      logger.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with expiration
   */
  async set<T>(key: string, data: T, duration?: number): Promise<void> {
    try {
      const expiry = Date.now() + (duration || CACHE_DURATIONS.SECURITY_METRICS);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry
      };

      // Store in memory cache
      this.memoryCache.set(key, entry);

      // Store persistently
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      logger.warn('Cache set error:', error);
    }
  }

  /**
   * Remove cached data
   */
  async remove(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.warn('Cache remove error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      const keys = Object.values(CACHE_KEYS);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    } catch (error) {
      logger.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memoryKeys: number; totalSize: number } {
    const memoryKeys = this.memoryCache.size;
    const totalSize = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + JSON.stringify(entry).length, 0);
    
    return { memoryKeys, totalSize };
  }
}

/**
 * Debounced function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Throttled function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      func.apply(null, args);
    }
  };
}

/**
 * Batch processing utility for security operations
 */
export class SecurityBatchProcessor {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private batchSize = 5;
  private delay = 100; // ms between batches

  constructor(batchSize = 5, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
  }

  /**
   * Add operation to batch queue
   */
  enqueue(operation: () => Promise<any>): void {
    this.queue.push(operation);
    this.processQueue();
  }

  /**
   * Process queued operations in batches
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.batchSize);
        await Promise.allSettled(batch.map(op => op()));
        
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }
    } catch (error) {
      logger.error('Batch processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.length = 0;
  }

  /**
   * Get queue status
   */
  getStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing
    };
  }
}

/**
 * Security-specific cached operations
 */
export class SecurityCacheManager {
  private cache = SecurityCache.getInstance();
  private batchProcessor = new SecurityBatchProcessor();

  /**
   * Get cached device fingerprint or generate new one
   */
  async getDeviceFingerprint(): Promise<string> {
    const cached = await this.cache.get<string>(CACHE_KEYS.DEVICE_FINGERPRINT);
    if (cached) {
      return cached;
    }

    // Generate new fingerprint
    const fingerprint = this.generateDeviceFingerprint();
    await this.cache.set(CACHE_KEYS.DEVICE_FINGERPRINT, fingerprint, CACHE_DURATIONS.DEVICE_FINGERPRINT);
    
    return fingerprint;
  }

  /**
   * Cache security metrics
   */
  async cacheSecurityMetrics(metrics: any): Promise<void> {
    await this.cache.set(CACHE_KEYS.SECURITY_METRICS, metrics, CACHE_DURATIONS.SECURITY_METRICS);
  }

  /**
   * Get cached security metrics
   */
  async getCachedSecurityMetrics(): Promise<any | null> {
    return this.cache.get(CACHE_KEYS.SECURITY_METRICS);
  }

  /**
   * Cache login attempts
   */
  async cacheLoginAttempts(attempts: any[]): Promise<void> {
    await this.cache.set(CACHE_KEYS.LOGIN_ATTEMPTS, attempts, CACHE_DURATIONS.LOGIN_ATTEMPTS);
  }

  /**
   * Get cached login attempts
   */
  async getCachedLoginAttempts(): Promise<any[] | null> {
    return this.cache.get(CACHE_KEYS.LOGIN_ATTEMPTS);
  }

  /**
   * Cache device list
   */
  async cacheDeviceList(devices: any[]): Promise<void> {
    await this.cache.set(CACHE_KEYS.DEVICE_LIST, devices, CACHE_DURATIONS.DEVICE_LIST);
  }

  /**
   * Get cached device list
   */
  async getCachedDeviceList(): Promise<any[] | null> {
    return this.cache.get(CACHE_KEYS.DEVICE_LIST);
  }

  /**
   * Batch cache multiple items
   */
  batchCache(items: Array<{ key: string; data: any; duration?: number }>): void {
    items.forEach(item => {
      this.batchProcessor.enqueue(async () => {
        await this.cache.set(item.key, item.data, item.duration);
      });
    });
  }

  /**
   * Clear all security caches
   */
  async clearAllCaches(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Generate a device fingerprint
   */
  private generateDeviceFingerprint(): string {
    const components = [
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
      new Date().getTimezoneOffset().toString(),
      Date.now().toString()
    ];

    // Simple hash function
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }
}

/**
 * Performance monitoring for security operations
 */
export class SecurityPerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  /**
   * Time a security operation
   */
  async timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      this.recordMetric(name, performance.now() - startTime);
      return result;
    } catch (error) {
      this.recordMetric(name, performance.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, time: number, isError = false): void {
    const existing = this.metrics.get(name) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count++;
    existing.totalTime += time;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.metrics.set(name, existing);
    
    // Log slow operations
    if (time > 1000) {
      logger.warn(`Slow security operation: ${name} took ${time.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const result: Record<string, { count: number; totalTime: number; avgTime: number }> = {};
    this.metrics.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit = 5): Array<{ name: string; avgTime: number }> {
    return Array.from(this.metrics.entries())
      .map(([name, metrics]) => ({ name, avgTime: metrics.avgTime }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }
}

// Singleton instances
export const securityCache = new SecurityCacheManager();
export const securityPerformanceMonitor = new SecurityPerformanceMonitor();

// Debounced security operations
export const debouncedSecurityCheck = debounce(async (userId: string) => {
  // Perform security check
  logger.info('Performing debounced security check for user:', userId);
}, 5000);

export const throttledLoginAttemptLog = throttle(async (attempt: any) => {
  // Log login attempt
  logger.info('Logging login attempt:', attempt.email);
}, 1000);

/**
 * Optimize security component rendering
 */
export function optimizeSecurityComponent<T extends Record<string, any>>(
  component: T,
  dependencies: string[]
): T {
  // Create memoized version of component methods
  const optimized = { ...component };
  
  // Add performance tracking to key methods
  if (optimized.loadSecurityData) {
    const originalLoad = optimized.loadSecurityData;
    optimized.loadSecurityData = async (...args: any[]) => {
      return securityPerformanceMonitor.timeOperation('loadSecurityData', () => 
        originalLoad.apply(optimized, args)
      );
    };
  }
  
  return optimized;
}

