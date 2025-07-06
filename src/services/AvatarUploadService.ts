import { supabase } from './supabase';
import { ImageUtils, ProcessedImageResult } from '../utils/imageUtils';
import { ImagePickerResult } from './ImagePickerService';
import { createLogger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';

const logger = createLogger('AvatarUploadService');

export interface AvatarUploadOptions {
  userId: string;
  compress?: boolean;
  generateMultipleSizes?: boolean;
  quality?: number;
  maxSize?: number;
}

export interface AvatarUploadProgress {
  stage: 'compressing' | 'uploading' | 'updating_profile' | 'cleaning_up' | 'completed';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
}

export interface AvatarUploadResult {
  success: boolean;
  avatarUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  uploadedFiles?: {
    main: string;
    thumbnail?: string;
    small?: string;
  };
}

export type ProgressCallback = (progress: AvatarUploadProgress) => void;

export class AvatarUploadService {
  private static readonly BUCKET_NAME = 'avatars';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Upload avatar with progress tracking
   */
  static async uploadAvatar(
    imageResult: ImagePickerResult,
    options: AvatarUploadOptions,
    onProgress?: ProgressCallback
  ): Promise<AvatarUploadResult> {
    try {
      logger.info('Starting avatar upload:', { userId: options.userId, options });

      // Validate input
      if (!imageResult.success || !imageResult.uri) {
        return {
          success: false,
          error: 'Invalid image provided for upload',
        };
      }

      // Validate file format
      if (imageResult.mimeType && !this.SUPPORTED_FORMATS.includes(imageResult.mimeType)) {
        return {
          success: false,
          error: `Unsupported file format: ${imageResult.mimeType}. Please use JPEG, PNG, or WebP.`,
        };
      }

      // Check file size
      if (imageResult.fileSize && imageResult.fileSize > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File is too large (${ImageUtils.formatFileSize(imageResult.fileSize)}). Maximum size is ${ImageUtils.formatFileSize(this.MAX_FILE_SIZE)}.`,
        };
      }

      // Stage 1: Compress image
      onProgress?.({
        stage: 'compressing',
        progress: 10,
        message: 'Optimizing image for upload...',
      });

      let processedImage: ProcessedImageResult;
      
      if (options.compress !== false) {
        processedImage = await ImageUtils.compressForAvatar(imageResult.uri, {
          maxWidth: options.maxSize || 400,
          maxHeight: options.maxSize || 400,
          quality: options.quality || 0.8,
        });

        if (!processedImage.success) {
          return {
            success: false,
            error: processedImage.error || 'Failed to process image',
          };
        }
      } else {
        processedImage = {
          success: true,
          uri: imageResult.uri,
          width: imageResult.width,
          height: imageResult.height,
          fileSize: imageResult.fileSize,
        };
      }

      onProgress?.({
        stage: 'compressing',
        progress: 30,
        message: 'Image optimization completed',
      });

      // Stage 2: Generate multiple sizes if requested
      let thumbnailResult: ProcessedImageResult | undefined;
      
      if (options.generateMultipleSizes) {
        onProgress?.({
          stage: 'compressing',
          progress: 40,
          message: 'Creating thumbnail...',
        });

        thumbnailResult = await ImageUtils.compressForAvatar(processedImage.uri!, {
          maxWidth: 100,
          maxHeight: 100,
          quality: 0.8,
        });
      }

      // Stage 3: Upload main avatar
      onProgress?.({
        stage: 'uploading',
        progress: 50,
        message: 'Uploading profile picture...',
        currentFile: 'main avatar',
      });

      const mainUploadResult = await this.uploadImageToStorage(
        processedImage.uri!,
        options.userId,
        'avatar.jpg'
      );

      if (!mainUploadResult.success) {
        return {
          success: false,
          error: mainUploadResult.error || 'Failed to upload avatar',
        };
      }

      const uploadedFiles: any = {
        main: mainUploadResult.publicUrl!,
      };

      // Stage 4: Upload thumbnail if generated
      if (thumbnailResult?.success && thumbnailResult.uri) {
        onProgress?.({
          stage: 'uploading',
          progress: 70,
          message: 'Uploading thumbnail...',
          currentFile: 'thumbnail',
        });

        const thumbnailUploadResult = await this.uploadImageToStorage(
          thumbnailResult.uri,
          options.userId,
          'avatar_thumbnail.jpg'
        );

        if (thumbnailUploadResult.success) {
          uploadedFiles.thumbnail = thumbnailUploadResult.publicUrl!;
        }
      }

      // Stage 5: Update user profile
      onProgress?.({
        stage: 'updating_profile',
        progress: 85,
        message: 'Updating profile...',
      });

      const profileUpdateResult = await this.updateUserProfile(
        options.userId,
        uploadedFiles.main
      );

      if (!profileUpdateResult.success) {
        // Upload succeeded but profile update failed
        logger.warn('Avatar uploaded but profile update failed:', profileUpdateResult.error);
        // Continue with success since the file is uploaded
      }

      // Stage 6: Cleanup temporary files
      onProgress?.({
        stage: 'cleaning_up',
        progress: 95,
        message: 'Cleaning up...',
      });

      await this.cleanupTemporaryFiles([
        processedImage.uri!,
        thumbnailResult?.uri,
      ].filter(Boolean) as string[]);

      // Stage 7: Complete
      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'Profile picture updated successfully!',
      });

      logger.info('Avatar upload completed successfully:', {
        userId: options.userId,
        mainUrl: uploadedFiles.main,
        thumbnailUrl: uploadedFiles.thumbnail,
      });

      return {
        success: true,
        avatarUrl: uploadedFiles.main,
        thumbnailUrl: uploadedFiles.thumbnail,
        uploadedFiles,
      };

    } catch (error) {
      logger.error('Error uploading avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Upload image file to Supabase Storage
   */
  private static async uploadImageToStorage(
    localUri: string,
    userId: string,
    fileName: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    try {
      logger.info('Uploading image to storage:', { localUri, userId, fileName });

      // Read the file as base64
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as binary
      const file = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const arrayBuffer = Uint8Array.from(atob(file), c => c.charCodeAt(0));
      
      // Create file path: userId/fileName
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // Replace if exists
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      logger.info('Image uploaded successfully:', {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
      });

      return {
        success: true,
        publicUrl: publicUrlData.publicUrl,
      };

    } catch (error) {
      logger.error('Error uploading to storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error',
      };
    }
  }

  /**
   * Update user profile with new avatar URL
   */
  private static async updateUserProfile(
    userId: string,
    avatarUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating user profile with avatar URL:', { userId, avatarUrl });

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }

      logger.info('Profile updated successfully');
      return { success: true };

    } catch (error) {
      logger.error('Error updating profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown profile update error',
      };
    }
  }

  /**
   * Delete old avatar files from storage
   */
  static async deleteOldAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Deleting old avatar files:', userId);

      // List all files for the user
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (listError) {
        throw new Error(`Failed to list files: ${listError.message}`);
      }

      if (!files || files.length === 0) {
        logger.info('No old avatar files to delete');
        return { success: true };
      }

      // Delete all files
      const filePaths = files.map(file => `${userId}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        throw new Error(`Failed to delete files: ${deleteError.message}`);
      }

      logger.info('Old avatar files deleted successfully:', filePaths);
      return { success: true };

    } catch (error) {
      logger.error('Error deleting old avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deletion error',
      };
    }
  }

  /**
   * Clean up temporary files
   */
  private static async cleanupTemporaryFiles(filePaths: string[]): Promise<void> {
    try {
      for (const filePath of filePaths) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath);
            logger.info('Temporary file cleaned up:', filePath);
          }
        } catch (error) {
          logger.warn('Failed to cleanup temporary file:', filePath, error);
        }
      }
    } catch (error) {
      logger.warn('Error during cleanup:', error);
    }
  }

  /**
   * Get avatar URL for a user
   */
  static async getAvatarUrl(userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to get avatar URL: ${error.message}`);
      }

      return {
        success: true,
        url: data?.avatar_url || undefined,
      };

    } catch (error) {
      logger.error('Error getting avatar URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user has an avatar
   */
  static async hasAvatar(userId: string): Promise<boolean> {
    try {
      const result = await this.getAvatarUrl(userId);
      return result.success && !!result.url;
    } catch (error) {
      logger.error('Error checking if user has avatar:', error);
      return false;
    }
  }

  /**
   * Validate upload options
   */
  static validateUploadOptions(options: AvatarUploadOptions): { valid: boolean; error?: string } {
    if (!options.userId) {
      return { valid: false, error: 'User ID is required' };
    }

    if (options.quality && (options.quality < 0 || options.quality > 1)) {
      return { valid: false, error: 'Quality must be between 0 and 1' };
    }

    if (options.maxSize && options.maxSize < 50) {
      return { valid: false, error: 'Maximum size must be at least 50 pixels' };
    }

    if (options.maxSize && options.maxSize > 2000) {
      return { valid: false, error: 'Maximum size cannot exceed 2000 pixels' };
    }

    return { valid: true };
  }
} 