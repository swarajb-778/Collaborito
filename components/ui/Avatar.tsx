import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Pressable, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createLogger } from '../../src/utils/logger';
import { useThemeColor } from '../../src/hooks/useThemeColor';

const logger = createLogger('Avatar');

export interface AvatarProps {
  // Image source
  uri?: string;
  fallbackUri?: string;
  
  // User info for fallback
  name?: string;
  email?: string;
  
  // Size configuration
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  
  // Styling
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  
  // Behavior
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  
  // Loading and error states
  showLoadingIndicator?: boolean;
  loadingColor?: string;
  
  // Fallback configuration
  fallbackType?: 'initials' | 'icon' | 'gradient';
  gradientColors?: string[];
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  fallbackUri,
  name,
  email,
  size = 'md',
  style,
  imageStyle,
  textStyle,
  onPress,
  showBorder = false,
  borderColor,
  borderWidth = 2,
  showLoadingIndicator = true,
  loadingColor,
  fallbackType = 'initials',
  gradientColors,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const [imageLoadState, setImageLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [fallbackLoadState, setFallbackLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentUri, setCurrentUri] = useState<string | undefined>(uri);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColorTheme = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  
  // Determine avatar size
  const avatarSize = typeof size === 'number' ? size : AVATAR_SIZES[size];
  
  // Reset states when URI changes
  useEffect(() => {
    if (uri !== currentUri) {
      setCurrentUri(uri);
      setImageLoadState('loading');
      setFallbackLoadState('loading');
    }
  }, [uri, currentUri]);
  
  // Handle main image load
  const handleImageLoad = () => {
    logger.debug('Avatar image loaded successfully');
    setImageLoadState('loaded');
  };
  
  const handleImageError = () => {
    logger.debug('Avatar image failed to load, trying fallback');
    setImageLoadState('error');
    if (fallbackUri) {
      setCurrentUri(fallbackUri);
    }
  };
  
  // Handle fallback image load
  const handleFallbackLoad = () => {
    logger.debug('Avatar fallback image loaded successfully');
    setFallbackLoadState('loaded');
  };
  
  const handleFallbackError = () => {
    logger.debug('Avatar fallback image failed to load');
    setFallbackLoadState('error');
  };
  
  // Generate initials from name or email
  const generateInitials = (name?: string, email?: string): string => {
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
  };
  
  // Generate gradient colors based on name/email
  const generateGradientColors = (name?: string, email?: string): string[] => {
    if (gradientColors) {
      return gradientColors;
    }
    
    const seed = name || email || 'default';
    const colors = [
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
    ];
    
    // Simple hash function to pick colors
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Container styles
  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: 'hidden',
    backgroundColor: backgroundColor,
    borderWidth: showBorder ? borderWidth : 0,
    borderColor: borderColor || borderColorTheme,
    ...style,
  };
  
  // Image styles
  const imageStyleFinal: ImageStyle = {
    width: '100%',
    height: '100%',
    ...imageStyle,
  };
  
  // Text styles for initials
  const textStyleFinal: TextStyle = {
    fontSize: avatarSize * 0.4,
    fontWeight: 'bold',
    color: textColor,
    ...textStyle,
  };
  
  // Render loading indicator
  const renderLoadingIndicator = () => {
    if (!showLoadingIndicator) return null;
    
    return (
      <View style={[styles.loadingContainer, { backgroundColor: backgroundColor }]}>
        <View style={[styles.loadingDot, { backgroundColor: loadingColor || tintColor }]} />
        <View style={[styles.loadingDot, { backgroundColor: loadingColor || tintColor }]} />
        <View style={[styles.loadingDot, { backgroundColor: loadingColor || tintColor }]} />
      </View>
    );
  };
  
  // Render fallback based on type
  const renderFallback = () => {
    switch (fallbackType) {
      case 'gradient':
        const colors = generateGradientColors(name, email);
        return (
                     <LinearGradient
             colors={colors as any}
             style={styles.fallbackContainer}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
           >
            <Text style={[textStyleFinal, { color: 'white' }]}>
              {generateInitials(name, email)}
            </Text>
          </LinearGradient>
        );
      
      case 'icon':
        return (
          <View style={[styles.fallbackContainer, { backgroundColor: backgroundColor }]}>
            <Text style={[textStyleFinal, { fontSize: avatarSize * 0.5 }]}>
              👤
            </Text>
          </View>
        );
      
      case 'initials':
      default:
        return (
          <View style={[styles.fallbackContainer, { backgroundColor: backgroundColor }]}>
            <Text style={textStyleFinal}>
              {generateInitials(name, email)}
            </Text>
          </View>
        );
    }
  };
  
  // Render main content
  const renderContent = () => {
    // If we have a URI and it's loading or loaded successfully
    if (currentUri && imageLoadState !== 'error') {
      if (imageLoadState === 'loading') {
        return (
          <>
            <Image
              source={{ uri: currentUri }}
              style={imageStyleFinal}
              onLoad={handleImageLoad}
              onError={handleImageError}
              accessibilityLabel={accessibilityLabel || `Avatar for ${name || email || 'user'}`}
            />
            {renderLoadingIndicator()}
          </>
        );
      } else {
        return (
          <Image
            source={{ uri: currentUri }}
            style={imageStyleFinal}
            onLoad={handleImageLoad}
            onError={handleImageError}
            accessibilityLabel={accessibilityLabel || `Avatar for ${name || email || 'user'}`}
          />
        );
      }
    }
    
    // If we have a fallback URI and main image failed
    if (fallbackUri && currentUri === fallbackUri && fallbackLoadState !== 'error') {
      if (fallbackLoadState === 'loading') {
        return (
          <>
            <Image
              source={{ uri: fallbackUri }}
              style={imageStyleFinal}
              onLoad={handleFallbackLoad}
              onError={handleFallbackError}
              accessibilityLabel={accessibilityLabel || `Avatar for ${name || email || 'user'}`}
            />
            {renderLoadingIndicator()}
          </>
        );
      } else {
        return (
          <Image
            source={{ uri: fallbackUri }}
            style={imageStyleFinal}
            onLoad={handleFallbackLoad}
            onError={handleFallbackError}
            accessibilityLabel={accessibilityLabel || `Avatar for ${name || email || 'user'}`}
          />
        );
      }
    }
    
    // Show fallback
    return renderFallback();
  };
  
  // Render component
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `Avatar for ${name || email || 'user'}`}
        accessibilityHint={accessibilityHint || 'Tap to view profile'}
        testID={testID}
      >
        {renderContent()}
      </Pressable>
    );
  }
  
  return (
    <View
      style={containerStyle}
      accessibilityLabel={accessibilityLabel || `Avatar for ${name || email || 'user'}`}
      testID={testID}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

export default Avatar; 