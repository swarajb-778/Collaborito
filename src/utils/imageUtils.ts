import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { createLogger } from './logger';

const logger = createLogger('ImageUtils');

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
  maintainAspectRatio?: boolean;
}

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface ProcessedImageResult {
  success: boolean;
  uri?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  originalSize?: number;
  compressionRatio?: number;
  error?: string;
}

export class ImageUtils {
  // Default avatar sizes for different use cases
  static readonly AVATAR_SIZES = {
    thumbnail: { width: 100, height: 100 },
    small: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  };

  // Default compression settings for avatars
  static readonly DEFAULT_AVATAR_OPTIONS: ImageCompressionOptions = {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    format: SaveFormat.JPEG,
    maintainAspectRatio: true,
  };

  /**
   * Compress and resize image for avatar use
   */
  static async compressForAvatar(
    imageUri: string,
    options?: Partial<ImageCompressionOptions>
  ): Promise<ProcessedImageResult> {
    try {
      logger.info('Starting avatar image compression:', { imageUri, options });

      // Get original file size
      const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = originalFileInfo.exists ? originalFileInfo.size || 0 : 0;

      // Merge with default options
      const finalOptions = { ...this.DEFAULT_AVATAR_OPTIONS, ...options };

      // Perform compression and resizing
      const result = await manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: finalOptions.maxWidth,
              height: finalOptions.maxHeight,
            },
          },
        ],
        {
          compress: finalOptions.quality,
          format: finalOptions.format,
        }
      );

      // Get compressed file size
      const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);
      const compressedSize = compressedFileInfo.exists ? compressedFileInfo.size || 0 : 0;

      // Calculate compression ratio
      const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;

      logger.info('Avatar compression completed:', {
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio,
        width: result.width,
        height: result.height,
      });

      return {
        success: true,
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: compressedSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
      };

    } catch (error) {
      logger.error('Error compressing avatar image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compression error',
      };
    }
  }

  /**
   * Create multiple avatar sizes from a single image
   */
  static async createAvatarSizes(
    imageUri: string,
    sizes: Array<keyof typeof ImageUtils.AVATAR_SIZES> = ['thumbnail', 'medium']
  ): Promise<{ [key: string]: ProcessedImageResult }> {
    const results: { [key: string]: ProcessedImageResult } = {};

    try {
      logger.info('Creating multiple avatar sizes:', { imageUri, sizes });

      for (const sizeName of sizes) {
        const sizeConfig = this.AVATAR_SIZES[sizeName];
        
        const result = await this.compressForAvatar(imageUri, {
          maxWidth: sizeConfig.width,
          maxHeight: sizeConfig.height,
        });

        results[sizeName] = result;
      }

      logger.info('Avatar sizes creation completed:', Object.keys(results));
      return results;

    } catch (error) {
      logger.error('Error creating avatar sizes:', error);
      
      // Return error result for all sizes
      const errorResult: ProcessedImageResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating avatar sizes',
      };

      sizes.forEach(size => {
        results[size] = errorResult;
      });

      return results;
    }
  }

  /**
   * Resize image to specific dimensions
   */
  static async resizeImage(
    imageUri: string,
    options: ImageResizeOptions
  ): Promise<ProcessedImageResult> {
    try {
      logger.info('Resizing image:', { imageUri, options });

      if (!options.width && !options.height) {
        throw new Error('Either width or height must be specified');
      }

      const manipulationActions: any[] = [];

      // Add resize action
      const resizeAction: any = { resize: {} };
      
      if (options.width) resizeAction.resize.width = options.width;
      if (options.height) resizeAction.resize.height = options.height;
      
      manipulationActions.push(resizeAction);

      // Perform image manipulation
      const result = await manipulateAsync(
        imageUri,
        manipulationActions,
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      logger.info('Image resize completed:', {
        width: result.width,
        height: result.height,
        fileSize: fileSize,
      });

      return {
        success: true,
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
      };

    } catch (error) {
      logger.error('Error resizing image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown resize error',
      };
    }
  }

  /**
   * Create a square cropped version of an image (perfect for avatars)
   */
  static async createSquareAvatar(
    imageUri: string,
    size: number = 400
  ): Promise<ProcessedImageResult> {
    try {
      logger.info('Creating square avatar:', { imageUri, size });

      // First, get image dimensions to determine crop parameters
      const result = await manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: size,
              height: size,
            },
          },
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      logger.info('Square avatar created:', {
        width: result.width,
        height: result.height,
        fileSize: fileSize,
      });

      return {
        success: true,
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: fileSize,
      };

    } catch (error) {
      logger.error('Error creating square avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown square avatar error',
      };
    }
  }

  /**
   * Optimize image with automatic compression based on file size
   */
  static async optimizeImage(imageUri: string): Promise<ProcessedImageResult> {
    try {
      logger.info('Optimizing image:', imageUri);

      // Get original file info
      const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = originalFileInfo.exists ? originalFileInfo.size || 0 : 0;

      // Determine compression quality based on file size
      let quality = 0.8; // Default quality
      
      if (originalSize > 5 * 1024 * 1024) {
        // Files > 5MB: High compression
        quality = 0.6;
      } else if (originalSize > 2 * 1024 * 1024) {
        // Files > 2MB: Medium compression
        quality = 0.7;
      } else if (originalSize > 1 * 1024 * 1024) {
        // Files > 1MB: Light compression
        quality = 0.8;
      } else {
        // Files < 1MB: Minimal compression
        quality = 0.9;
      }

      // Determine max dimensions based on original size
      let maxDimension = 1200;
      
      if (originalSize > 10 * 1024 * 1024) {
        maxDimension = 800;
      } else if (originalSize > 5 * 1024 * 1024) {
        maxDimension = 1000;
      }

      // Apply optimization
      const result = await manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxDimension,
              height: maxDimension,
            },
          },
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );

      // Get optimized file size
      const optimizedFileInfo = await FileSystem.getInfoAsync(result.uri);
      const optimizedSize = optimizedFileInfo.exists ? optimizedFileInfo.size || 0 : 0;

      // Calculate compression ratio
      const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

      logger.info('Image optimization completed:', {
        originalSize: originalSize,
        optimizedSize: optimizedSize,
        compressionRatio: compressionRatio,
        quality: quality,
        maxDimension: maxDimension,
      });

      return {
        success: true,
        uri: result.uri,
        width: result.width,
        height: result.height,
        fileSize: optimizedSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
      };

    } catch (error) {
      logger.error('Error optimizing image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown optimization error',
      };
    }
  }

  /**
   * Get image information without processing
   */
  static async getImageInfo(imageUri: string): Promise<{ 
    width?: number; 
    height?: number; 
    fileSize?: number; 
    format?: string; 
    error?: string 
  }> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        return { error: 'Image file does not exist' };
      }

      // Get image dimensions using manipulate (without actually manipulating)
      const result = await manipulateAsync(imageUri, [], { format: SaveFormat.JPEG });
      
      return {
        width: result.width,
        height: result.height,
        fileSize: fileInfo.size || 0,
        format: 'jpeg', // Since we're checking with JPEG format
      };

    } catch (error) {
      logger.error('Error getting image info:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error getting image info',
      };
    }
  }

  /**
   * Check if image meets avatar requirements
   */
  static validateAvatarImage(imageInfo: { width?: number; height?: number; fileSize?: number }): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check minimum dimensions
    if (imageInfo.width && imageInfo.width < 100) {
      issues.push('Image width is too small (minimum 100px)');
    }
    if (imageInfo.height && imageInfo.height < 100) {
      issues.push('Image height is too small (minimum 100px)');
    }

    // Check maximum dimensions
    if (imageInfo.width && imageInfo.width > 4000) {
      issues.push('Image width is too large (maximum 4000px)');
      recommendations.push('Image will be automatically resized');
    }
    if (imageInfo.height && imageInfo.height > 4000) {
      issues.push('Image height is too large (maximum 4000px)');
      recommendations.push('Image will be automatically resized');
    }

    // Check file size
    if (imageInfo.fileSize) {
      if (imageInfo.fileSize > 10 * 1024 * 1024) {
        issues.push('Image file is too large (maximum 10MB)');
      } else if (imageInfo.fileSize > 5 * 1024 * 1024) {
        recommendations.push('Large image will be compressed for faster upload');
      }
    }

    // Check aspect ratio recommendations
    if (imageInfo.width && imageInfo.height) {
      const aspectRatio = imageInfo.width / imageInfo.height;
      if (aspectRatio < 0.8 || aspectRatio > 1.2) {
        recommendations.push('Square images work best for profile pictures');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format compression ratio for display
   */
  static formatCompressionRatio(ratio: number): string {
    return `${Math.round(ratio * 100)}% smaller`;
  }
} 