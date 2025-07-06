/**
 * Avatar System Configuration
 * Centralized configuration for avatar management
 */

export const AVATAR_CONFIG = {
  // Storage configuration
  STORAGE: {
    BUCKET_NAME: 'avatars',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
    COMPRESSION_QUALITY: 0.8,
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Image sizes
  SIZES: {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
    thumbnail: { width: 100, height: 100 },
    small: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  },

  // Compression settings
  COMPRESSION: {
    DEFAULT_QUALITY: 0.8,
    HIGH_QUALITY: 0.9,
    LOW_QUALITY: 0.6,
    MAX_DIMENSION: 1200,
    THUMBNAIL_DIMENSION: 100,
  },

  // UI settings
  UI: {
    BORDER_WIDTH: 2,
    ANIMATION_DURATION: 300,
    PROGRESS_UPDATE_INTERVAL: 100,
    AUTO_DISMISS_DELAY: 1500,
  },

  // Upload settings
  UPLOAD: {
    GENERATE_MULTIPLE_SIZES: true,
    CLEANUP_TEMP_FILES: true,
    RETRY_ATTEMPTS: 3,
    TIMEOUT: 30000, // 30 seconds
  },

  // Gradient colors for fallbacks
  GRADIENT_COLORS: [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
    ['#ffecd2', '#fcb69f'],
    ['#ff8a80', '#ea6100'],
    ['#667eea', '#764ba2'],
  ],

  // Error messages
  ERRORS: {
    PERMISSION_DENIED: 'Camera or photo library permission denied',
    UPLOAD_FAILED: 'Failed to upload avatar',
    FILE_TOO_LARGE: 'Image file is too large',
    INVALID_FORMAT: 'Invalid image format',
    NETWORK_ERROR: 'Network error occurred',
    STORAGE_ERROR: 'Storage error occurred',
    COMPRESSION_FAILED: 'Failed to compress image',
  },

  // Success messages
  MESSAGES: {
    UPLOAD_SUCCESS: 'Profile picture updated successfully!',
    UPLOAD_STARTED: 'Uploading profile picture...',
    COMPRESSION_STARTED: 'Optimizing image...',
    CACHE_CLEARED: 'Avatar cache cleared',
  },
} as const;

export type AvatarConfigType = typeof AVATAR_CONFIG; 