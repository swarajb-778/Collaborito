/**
 * Avatar System Type Definitions
 * Comprehensive types for avatar management functionality
 */

export interface AvatarSize {
  width: number;
  height: number;
}

export interface AvatarUser {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  thumbnailUrl?: string;
  lastUpdated?: string;
}

export interface AvatarUploadOptions {
  userId: string;
  compress?: boolean;
  generateMultipleSizes?: boolean;
  quality?: number;
  maxSize?: number;
  format?: 'jpeg' | 'png' | 'webp';
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
    medium?: string;
    large?: string;
  };
}

export interface AvatarUploadProgress {
  stage: 'compressing' | 'uploading' | 'updating_profile' | 'cleaning_up' | 'completed';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
  bytesUploaded?: number;
  totalBytes?: number;
}

export interface AvatarCache {
  url: string;
  thumbnailUrl?: string;
  lastUpdated: number;
  expiresAt: number;
  size?: number;
}

export interface AvatarPermissions {
  camera: boolean;
  photoLibrary: boolean;
  error?: string;
}

export interface AvatarValidation {
  valid: boolean;
  issues: string[];
  recommendations: string[];
  fileSize?: number;
  dimensions?: AvatarSize;
}

export interface AvatarStorageConfig {
  bucketName: string;
  maxFileSize: number;
  allowedFormats: string[];
  compressionQuality: number;
  generateSizes: string[];
}

export interface AvatarComponentProps {
  uri?: string;
  fallbackUri?: string;
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  onPress?: () => void;
  fallbackType?: 'initials' | 'icon' | 'gradient';
  gradientColors?: string[];
  style?: any;
  testID?: string;
}

export interface AvatarListProps {
  users: AvatarUser[];
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  onUserPress?: (user: AvatarUser) => void;
  onShowMore?: () => void;
  showBorder?: boolean;
  spacing?: number;
  style?: any;
}

export interface AvatarManagerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showBorder?: boolean;
  editable?: boolean;
  onAvatarChange?: (url: string) => void;
  userInfo?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (result: any) => void;
  title?: string;
  subtitle?: string;
  cameraButtonText?: string;
  galleryButtonText?: string;
  cancelButtonText?: string;
  showPermissionAlert?: boolean;
}

export interface AvatarUploadProgressModalProps {
  visible: boolean;
  progress: AvatarUploadProgress;
  onComplete?: () => void;
}

export type AvatarEventHandler = (user: AvatarUser) => void;
export type AvatarUploadProgressHandler = (progress: AvatarUploadProgress) => void;
export type AvatarChangeHandler = (url: string) => void;

export interface AvatarServiceError extends Error {
  code?: string;
  details?: any;
}

export interface AvatarMetadata {
  originalName?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  mimeType: string;
  dimensions: AvatarSize;
  checksum?: string;
}

export interface AvatarBatch {
  id: string;
  userId: string;
  avatars: {
    original: string;
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  };
  metadata: AvatarMetadata;
  createdAt: string;
} 