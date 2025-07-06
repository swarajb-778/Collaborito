import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';
import { createLogger } from '../utils/logger';

const logger = createLogger('ImagePickerService');

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
  allowsMultipleSelection?: boolean;
}

export interface ImagePickerResult {
  success: boolean;
  uri?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  fileName?: string;
  error?: string;
  cancelled?: boolean;
}

export interface PermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
  error?: string;
}

export class ImagePickerService {
  private static readonly DEFAULT_OPTIONS: ImagePickerOptions = {
    allowsEditing: true,
    aspect: [1, 1], // Square for avatars
    quality: 0.8,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
  };

  /**
   * Check and request necessary permissions
   */
  static async checkPermissions(): Promise<PermissionStatus> {
    try {
      logger.info('Checking image picker permissions...');

      // Check camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Check media library permission
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      const result: PermissionStatus = {
        camera: cameraPermission.status === ImagePicker.PermissionStatus.GRANTED,
        mediaLibrary: mediaLibraryPermission.status === ImagePicker.PermissionStatus.GRANTED,
      };

      logger.info('Permission status:', result);

      // Show user-friendly message if permissions are denied
      if (!result.camera && !result.mediaLibrary) {
        return {
          ...result,
          error: 'Camera and photo permissions are required to set a profile picture. Please enable them in Settings.',
        };
      } else if (!result.camera) {
        return {
          ...result,
          error: 'Camera permission is required to take photos. You can still select from photo library.',
        };
      } else if (!result.mediaLibrary) {
        return {
          ...result,
          error: 'Photo library permission is required to select images. You can still take photos with camera.',
        };
      }

      return result;
    } catch (error) {
      logger.error('Error checking permissions:', error);
      return {
        camera: false,
        mediaLibrary: false,
        error: 'Failed to check permissions. Please try again.',
      };
    }
  }

  /**
   * Open camera to take a photo
   */
  static async openCamera(options?: Partial<ImagePickerOptions>): Promise<ImagePickerResult> {
    try {
      // Haptic feedback for better UX
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      logger.info('Opening camera for photo capture...');

      // Check camera permission
      const permissions = await this.checkPermissions();
      if (!permissions.camera) {
        return {
          success: false,
          error: permissions.error || 'Camera permission denied',
        };
      }

      // Merge with default options
      const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: finalOptions.allowsEditing,
        aspect: finalOptions.aspect,
        quality: finalOptions.quality,
        mediaTypes: finalOptions.mediaTypes,
      });

      if (result.canceled) {
        logger.info('Camera capture cancelled by user');
        return {
          success: false,
          cancelled: true,
        };
      }

      if (!result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'No image captured from camera',
        };
      }

      const asset = result.assets[0];
      
      logger.info('Camera capture successful:', {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      });

      return {
        success: true,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        fileName: asset.fileName || `camera_${Date.now()}.jpg`,
      };

    } catch (error) {
      logger.error('Error opening camera:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown camera error',
      };
    }
  }

  /**
   * Open photo library to select an image
   */
  static async openPhotoLibrary(options?: Partial<ImagePickerOptions>): Promise<ImagePickerResult> {
    try {
      // Haptic feedback for better UX
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      logger.info('Opening photo library for image selection...');

      // Check photo library permission
      const permissions = await this.checkPermissions();
      if (!permissions.mediaLibrary) {
        return {
          success: false,
          error: permissions.error || 'Photo library permission denied',
        };
      }

      // Merge with default options
      const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: finalOptions.allowsEditing,
        aspect: finalOptions.aspect,
        quality: finalOptions.quality,
        mediaTypes: finalOptions.mediaTypes,
        allowsMultipleSelection: finalOptions.allowsMultipleSelection,
      });

      if (result.canceled) {
        logger.info('Photo library selection cancelled by user');
        return {
          success: false,
          cancelled: true,
        };
      }

      if (!result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'No image selected from photo library',
        };
      }

      const asset = result.assets[0];
      
      logger.info('Photo library selection successful:', {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      });

      return {
        success: true,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      };

    } catch (error) {
      logger.error('Error opening photo library:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown photo library error',
      };
    }
  }

  /**
   * Show action sheet to choose between camera and photo library
   */
  static async showImagePickerActionSheet(options?: Partial<ImagePickerOptions>): Promise<ImagePickerResult> {
    try {
      logger.info('Showing image picker action sheet...');

      // Check permissions first
      const permissions = await this.checkPermissions();

      return new Promise((resolve) => {
        const buttons: any[] = [];

        // Add camera option if permission is granted
        if (permissions.camera) {
          buttons.push({
            text: 'Take Photo',
            onPress: async () => {
              const result = await this.openCamera(options);
              resolve(result);
            },
          });
        }

        // Add photo library option if permission is granted
        if (permissions.mediaLibrary) {
          buttons.push({
            text: 'Choose from Library',
            onPress: async () => {
              const result = await this.openPhotoLibrary(options);
              resolve(result);
            },
          });
        }

        // Add cancel button
        buttons.push({
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            resolve({
              success: false,
              cancelled: true,
            });
          },
        });

        // Show alert with options
        Alert.alert(
          'Select Profile Picture',
          'Choose how you would like to add your profile picture',
          buttons,
          { cancelable: true }
        );
      });

    } catch (error) {
      logger.error('Error showing image picker action sheet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate image file before processing
   */
  static validateImage(result: ImagePickerResult): { valid: boolean; error?: string } {
    if (!result.success || !result.uri) {
      return { valid: false, error: 'Invalid image result' };
    }

    // Check file size (max 10MB for avatars)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (result.fileSize && result.fileSize > maxSizeBytes) {
      return { 
        valid: false, 
        error: `Image is too large (${Math.round(result.fileSize / 1024 / 1024)}MB). Maximum size is 10MB.` 
      };
    }

    // Check dimensions (minimum 100x100, maximum 4000x4000)
    if (result.width && result.height) {
      if (result.width < 100 || result.height < 100) {
        return { 
          valid: false, 
          error: 'Image is too small. Minimum size is 100x100 pixels.' 
        };
      }
      
      if (result.width > 4000 || result.height > 4000) {
        return { 
          valid: false, 
          error: 'Image is too large. Maximum size is 4000x4000 pixels.' 
        };
      }
    }

    // Check mime type
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (result.mimeType && !supportedTypes.includes(result.mimeType)) {
      return { 
        valid: false, 
        error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' 
      };
    }

    return { valid: true };
  }

  /**
   * Get the display name for the image source type
   */
  static getImageSourceDisplayName(uri: string): string {
    if (uri.includes('camera')) {
      return 'Camera';
    } else if (uri.includes('photo')) {
      return 'Photo Library';
    } else if (uri.includes('ImagePicker')) {
      return 'Selected Image';
    } else {
      return 'Unknown Source';
    }
  }
} 