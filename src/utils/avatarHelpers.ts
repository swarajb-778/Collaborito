/**
 * Avatar Helper Utilities
 * Common utility functions for avatar operations
 */

export function generateInitials(name?: string, email?: string): string {
  if (name) {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
  }
  
  if (email) {
    return email[0].toUpperCase();
  }
  
  return '?';
}

export function getAvatarFallbackColors(seed?: string): [string, string] {
  const colors: [string, string][] = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
    ['#ffecd2', '#fcb69f'],
    ['#ff8a80', '#ea6100'],
  ];
  
  if (!seed) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidImageFormat(mimeType: string): boolean {
  const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
  return validFormats.includes(mimeType.toLowerCase());
}

export function getImageFormatFromUri(uri: string): string | null {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return null;
  }
}

export function generateAvatarFileName(userId: string, size?: string): string {
  const timestamp = Date.now();
  const sizePrefix = size ? `${size}_` : '';
  return `${sizePrefix}avatar_${timestamp}.jpg`;
}

export function getAvatarCacheKey(userId: string): string {
  return `avatar_${userId}`;
}

export function isAvatarCacheExpired(timestamp: number, duration: number = 24 * 60 * 60 * 1000): boolean {
  return Date.now() - timestamp > duration;
} 