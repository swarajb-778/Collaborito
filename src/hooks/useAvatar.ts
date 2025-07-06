import { useState, useEffect, useCallback } from 'react';
import { AvatarUploadService } from '../services/AvatarUploadService';
import { ProfileImageService } from '../services/ProfileImageService';
import { ImagePickerResult } from '../services/ImagePickerService';
import { createLogger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

const logger = createLogger('useAvatar');

export interface UseAvatarOptions {
  preloadImage?: boolean;
  cacheEnabled?: boolean;
  autoRefresh?: boolean;
}

export interface UseAvatarReturn {
  avatarUrl: string | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  uploadAvatar: (image: ImagePickerResult) => Promise<boolean>;
  removeAvatar: () => Promise<boolean>;
  refreshAvatar: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export function useAvatar(
  userId?: string,
  options: UseAvatarOptions = {}
): UseAvatarReturn {
  const { user } = useAuth();
  const actualUserId = userId || user?.id;
  
  const {
    preloadImage = true,
    cacheEnabled = true,
    autoRefresh = false,
  } = options;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load avatar
  const loadAvatar = useCallback(async () => {
    if (!actualUserId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let url: string | null = null;

      if (cacheEnabled) {
        url = await ProfileImageService.getProfileImage(actualUserId);
      } else {
        const result = await AvatarUploadService.getAvatarUrl(actualUserId);
        url = result.success ? result.url || null : null;
      }

      setAvatarUrl(url);
      logger.info('Avatar loaded:', { userId: actualUserId, url });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load avatar';
      setError(errorMessage);
      logger.error('Error loading avatar:', err);
    } finally {
      setIsLoading(false);
    }
  }, [actualUserId, cacheEnabled]);

  // Upload avatar
  const uploadAvatar = useCallback(async (image: ImagePickerResult): Promise<boolean> => {
    if (!actualUserId) {
      setError('No user ID provided');
      return false;
    }

    try {
      setIsUploading(true);
      setError(null);
      logger.info('Starting avatar upload');

      const result = await AvatarUploadService.uploadAvatar(
        image,
        {
          userId: actualUserId,
          compress: true,
          generateMultipleSizes: true,
        }
      );

      if (result.success && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
        
        // Clear cache to force refresh
        if (cacheEnabled) {
          await ProfileImageService.clearCache(actualUserId);
        }
        
        logger.info('Avatar upload successful');
        return true;
      } else {
        setError(result.error || 'Upload failed');
        logger.error('Avatar upload failed:', result.error);
        return false;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      logger.error('Error uploading avatar:', err);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [actualUserId, cacheEnabled]);

  // Remove avatar
  const removeAvatar = useCallback(async (): Promise<boolean> => {
    if (!actualUserId) {
      setError('No user ID provided');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      logger.info('Removing avatar');

      const result = await AvatarUploadService.deleteOldAvatar(actualUserId);

      if (result.success) {
        setAvatarUrl(null);
        
        // Clear cache
        if (cacheEnabled) {
          await ProfileImageService.clearCache(actualUserId);
        }
        
        logger.info('Avatar removed successfully');
        return true;
      } else {
        setError(result.error || 'Failed to remove avatar');
        logger.error('Avatar removal failed:', result.error);
        return false;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove avatar';
      setError(errorMessage);
      logger.error('Error removing avatar:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [actualUserId, cacheEnabled]);

  // Refresh avatar
  const refreshAvatar = useCallback(async () => {
    if (cacheEnabled && actualUserId) {
      await ProfileImageService.clearCache(actualUserId);
    }
    await loadAvatar();
  }, [loadAvatar, cacheEnabled, actualUserId]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (cacheEnabled && actualUserId) {
      await ProfileImageService.clearCache(actualUserId);
      logger.info('Avatar cache cleared');
    }
  }, [cacheEnabled, actualUserId]);

  // Load avatar on mount and when userId changes
  useEffect(() => {
    if (preloadImage) {
      loadAvatar();
    }
  }, [loadAvatar, preloadImage]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !actualUserId) return;

    const interval = setInterval(() => {
      refreshAvatar();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, actualUserId, refreshAvatar]);

  return {
    avatarUrl,
    isLoading,
    isUploading,
    error,
    uploadAvatar,
    removeAvatar,
    refreshAvatar,
    clearCache,
  };
} 