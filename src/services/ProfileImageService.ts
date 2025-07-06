import { AvatarUploadService } from './AvatarUploadService';
import { ImageUtils } from '../utils/imageUtils';
import { createLogger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = createLogger('ProfileImageService');

export interface ProfileImageCache {
  url: string;
  lastUpdated: number;
  thumbnailUrl?: string;
}

export class ProfileImageService {
  private static readonly CACHE_PREFIX = 'profile_image_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get profile image with caching
   */
  static async getProfileImage(userId: string): Promise<string | null> {
    try {
      // Check cache first
      const cachedImage = await this.getCachedImage(userId);
      if (cachedImage && this.isCacheValid(cachedImage)) {
        logger.info('Using cached profile image:', cachedImage.url);
        return cachedImage.url;
      }

      // Fetch from server
      const result = await AvatarUploadService.getAvatarUrl(userId);
      if (result.success && result.url) {
        // Cache the result
        await this.cacheImage(userId, {
          url: result.url,
          lastUpdated: Date.now(),
        });
        return result.url;
      }

      return null;
    } catch (error) {
      logger.error('Error getting profile image:', error);
      return null;
    }
  }

  /**
   * Cache profile image
   */
  private static async cacheImage(userId: string, cache: ProfileImageCache): Promise<void> {
    try {
      const key = this.CACHE_PREFIX + userId;
      await AsyncStorage.setItem(key, JSON.stringify(cache));
      logger.debug('Profile image cached:', userId);
    } catch (error) {
      logger.error('Error caching profile image:', error);
    }
  }

  /**
   * Get cached profile image
   */
  private static async getCachedImage(userId: string): Promise<ProfileImageCache | null> {
    try {
      const key = this.CACHE_PREFIX + userId;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting cached profile image:', error);
      return null;
    }
  }

  /**
   * Check if cache is valid
   */
  private static isCacheValid(cache: ProfileImageCache): boolean {
    const now = Date.now();
    return now - cache.lastUpdated < this.CACHE_DURATION;
  }

  /**
   * Clear cache for user
   */
  static async clearCache(userId: string): Promise<void> {
    try {
      const key = this.CACHE_PREFIX + userId;
      await AsyncStorage.removeItem(key);
      logger.info('Profile image cache cleared:', userId);
    } catch (error) {
      logger.error('Error clearing profile image cache:', error);
    }
  }

  /**
   * Clear all cached images
   */
  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const profileKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(profileKeys);
      logger.info('All profile image cache cleared');
    } catch (error) {
      logger.error('Error clearing all profile image cache:', error);
    }
  }

  /**
   * Preload profile images for multiple users
   */
  static async preloadImages(userIds: string[]): Promise<void> {
    try {
      logger.info('Preloading profile images for users:', userIds.length);
      
      const promises = userIds.map(userId => this.getProfileImage(userId));
      await Promise.allSettled(promises);
      
      logger.info('Profile images preloaded');
    } catch (error) {
      logger.error('Error preloading profile images:', error);
    }
  }
} 