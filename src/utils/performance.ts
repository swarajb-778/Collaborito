import { Platform } from 'react-native';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';

// Cache for preloaded images
const imageCache: Record<string, boolean> = {};

// Preload images to improve loading performance
export const preloadImages = async (imageUrls: string[]) => {
  const promises = imageUrls.map(async (url) => {
    if (imageCache[url]) return; // Skip if already cached
    
    try {
      await Image.prefetch(url);
      imageCache[url] = true;
    } catch (error) {
      console.error('Error preloading image:', error);
    }
  });
  
  return Promise.all(promises);
};

// Cache images locally for faster loading
export const cacheImages = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return imageUrl;
  
  try {
    // Define the cached file name (hash of the URL)
    const fileName = imageUrl.split('/').pop() || 'image';
    const cacheFilePath = `${FileSystem.cacheDirectory}${fileName}`;
    
    // Check if image is already cached
    const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
    
    if (fileInfo.exists) {
      return `file://${cacheFilePath}`;
    }
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(
      imageUrl, 
      cacheFilePath
    );
    
    if (downloadResult.status === 200) {
      return `file://${cacheFilePath}`;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error caching image:', error);
    return imageUrl;
  }
};

// Optimize animations by reducing their duration
export const getOptimizedAnimationDuration = (defaultDuration: number) => {
  return Math.round(defaultDuration * 0.6); // Reduce animation time by 40%
};

// Optimize images for display
export const optimizeImage = async (imageUri: string, width = 300, quality = 0.7) => {
  try {
    if (!imageUri) return imageUri;
    
    // Skip optimization for already optimized or file:// URIs
    if (imageUri.startsWith('file://') || imageUri.includes('_optimized')) {
      return imageUri;
    }
    
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width } }],
      { compress: quality }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return imageUri;
  }
};

// Get a faster easing configuration for animations
export const getFastEasing = () => {
  return {
    duration: 300,  // Shorter duration
    useNativeDriver: true  // Use native driver for better performance
  };
};

// Debounce function to prevent excessive function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Optimize rendering by reducing unnecessary work
export const optimizeRendering = {
  // Use this for list items to optimize rendering
  shouldComponentUpdate: (prevProps: any, nextProps: any) => {
    return JSON.stringify(prevProps) !== JSON.stringify(nextProps);
  },
  
  // Use this to skip initial animations on first render
  skipAnimationsOnFirstRender: (isFirstRender: boolean, duration = 500) => {
    return isFirstRender ? 0 : duration;
  }
}; 