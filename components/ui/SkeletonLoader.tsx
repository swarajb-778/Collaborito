import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Animation configuration
const ANIMATION_CONFIG = {
  duration: 1200,
  shimmerWidth: 1.5, // Width of the shimmer effect relative to component
  colors: {
    light: ['#f0f0f0', '#e0e0e0', '#f0f0f0'],
    dark: ['#2a2a2a', '#3a3a3a', '#2a2a2a'],
  }
};

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  animate?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Basic Skeleton Loader Component
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
  animate = true,
  theme = 'light'
}) => {
  const shimmerPosition = useSharedValue(-1);
  
  useEffect(() => {
    if (animate) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: ANIMATION_CONFIG.duration }),
        -1,
        false
      );
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-100, 100]
    );

    return {
      transform: [{ translateX: `${translateX}%` }],
    };
  });

  const shimmerColors = ANIMATION_CONFIG.colors[theme];

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: shimmerColors[0],
        },
        style,
      ]}
    >
      {animate && (
        <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
          <LinearGradient
            colors={shimmerColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}
      {children}
    </View>
  );
};

/**
 * Text Skeleton Component
 */
interface TextSkeletonProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: DimensionValue;
  spacing?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 3,
  lineHeight = 16,
  lastLineWidth = '60%',
  spacing = 8,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.textSkeletonContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          borderRadius={lineHeight / 2}
          animate={animate}
          theme={theme}
          style={index > 0 ? { marginTop: spacing } : undefined}
        />
      ))}
    </View>
  );
};

/**
 * Circle Skeleton Component (for avatars, profile pictures)
 */
interface CircleSkeletonProps {
  size?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const CircleSkeleton: React.FC<CircleSkeletonProps> = ({
  size = 40,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
      animate={animate}
      theme={theme}
      style={style}
    />
  );
};

/**
 * Card Skeleton Component
 */
interface CardSkeletonProps {
  showImage?: boolean;
  imageHeight?: number;
  showAvatar?: boolean;
  avatarSize?: number;
  titleLines?: number;
  descriptionLines?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showImage = true,
  imageHeight = 120,
  showAvatar = true,
  avatarSize = 32,
  titleLines = 1,
  descriptionLines = 2,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.cardSkeleton, style]}>
      {/* Image skeleton */}
      {showImage && (
        <SkeletonLoader
          height={imageHeight}
          borderRadius={8}
          animate={animate}
          theme={theme}
          style={styles.cardImage}
        />
      )}
      
      {/* Content container */}
      <View style={styles.cardContent}>
        {/* Header with avatar and title */}
        <View style={styles.cardHeader}>
          {showAvatar && (
            <CircleSkeleton
              size={avatarSize}
              animate={animate}
              theme={theme}
              style={styles.cardAvatar}
            />
          )}
          
          <View style={styles.cardHeaderText}>
            <TextSkeleton
              lines={titleLines}
              lineHeight={16}
              spacing={4}
              animate={animate}
              theme={theme}
            />
          </View>
        </View>
        
        {/* Description */}
        {descriptionLines > 0 && (
          <TextSkeleton
            lines={descriptionLines}
            lineHeight={14}
            lastLineWidth="70%"
            spacing={6}
            animate={animate}
            theme={theme}
            style={styles.cardDescription}
          />
        )}
      </View>
    </View>
  );
};

/**
 * List Item Skeleton Component
 */
interface ListItemSkeletonProps {
  showAvatar?: boolean;
  avatarSize?: number;
  showAction?: boolean;
  titleWidth?: string;
  subtitleWidth?: string;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const ListItemSkeleton: React.FC<ListItemSkeletonProps> = ({
  showAvatar = true,
  avatarSize = 40,
  showAction = true,
  titleWidth = '60%',
  subtitleWidth = '40%',
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.listItemSkeleton, style]}>
      {/* Avatar */}
      {showAvatar && (
        <CircleSkeleton
          size={avatarSize}
          animate={animate}
          theme={theme}
          style={styles.listItemAvatar}
        />
      )}
      
      {/* Content */}
      <View style={styles.listItemContent}>
        <SkeletonLoader
          width={titleWidth}
          height={16}
          borderRadius={8}
          animate={animate}
          theme={theme}
          style={styles.listItemTitle}
        />
        <SkeletonLoader
          width={subtitleWidth}
          height={12}
          borderRadius={6}
          animate={animate}
          theme={theme}
          style={styles.listItemSubtitle}
        />
      </View>
      
      {/* Action */}
      {showAction && (
        <SkeletonLoader
          width={60}
          height={32}
          borderRadius={16}
          animate={animate}
          theme={theme}
        />
      )}
    </View>
  );
};

/**
 * Profile Skeleton Component
 */
interface ProfileSkeletonProps {
  showCover?: boolean;
  coverHeight?: number;
  avatarSize?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({
  showCover = true,
  coverHeight = 120,
  avatarSize = 80,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.profileSkeleton, style]}>
      {/* Cover photo */}
      {showCover && (
        <SkeletonLoader
          height={coverHeight}
          borderRadius={0}
          animate={animate}
          theme={theme}
        />
      )}
      
      {/* Profile content */}
      <View style={styles.profileContent}>
        {/* Avatar */}
        <CircleSkeleton
          size={avatarSize}
          animate={animate}
          theme={theme}
          style={[
            styles.profileAvatar,
            { marginTop: showCover ? -avatarSize / 2 : 0 }
          ]}
        />
        
        {/* Name and info */}
        <View style={styles.profileInfo}>
          <SkeletonLoader
            width="50%"
            height={24}
            borderRadius={12}
            animate={animate}
            theme={theme}
            style={styles.profileName}
          />
          <SkeletonLoader
            width="40%"
            height={16}
            borderRadius={8}
            animate={animate}
            theme={theme}
            style={styles.profileTitle}
          />
          <TextSkeleton
            lines={2}
            lineHeight={14}
            lastLineWidth="70%"
            spacing={4}
            animate={animate}
            theme={theme}
            style={styles.profileBio}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Button Skeleton Component
 */
interface ButtonSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const ButtonSkeleton: React.FC<ButtonSkeletonProps> = ({
  width = 120,
  height = 44,
  borderRadius = 22,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <SkeletonLoader
      width={width}
      height={height}
      borderRadius={borderRadius}
      animate={animate}
      theme={theme}
      style={style}
    />
  );
};

/**
 * Grid Skeleton Component
 */
interface GridSkeletonProps {
  columns?: number;
  rows?: number;
  itemHeight?: number;
  spacing?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  columns = 2,
  rows = 3,
  itemHeight = 120,
  spacing = 12,
  animate = true,
  theme = 'light',
  style
}) => {
  const itemWidth = `${(100 - (columns - 1) * (spacing / 2)) / columns}%`;
  
  return (
    <View style={[styles.gridSkeleton, style]}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader
              key={colIndex}
              width={itemWidth}
              height={itemHeight}
              borderRadius={8}
              animate={animate}
              theme={theme}
              style={colIndex > 0 ? { marginLeft: spacing } : undefined}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

/**
 * Form Skeleton Component
 */
interface FormSkeletonProps {
  fields?: number;
  fieldHeight?: number;
  showLabels?: boolean;
  labelHeight?: number;
  showButton?: boolean;
  buttonHeight?: number;
  spacing?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  fieldHeight = 48,
  showLabels = true,
  labelHeight = 16,
  showButton = true,
  buttonHeight = 48,
  spacing = 16,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.formSkeleton, style]}>
      {Array.from({ length: fields }).map((_, index) => (
        <View key={index} style={index > 0 ? { marginTop: spacing } : undefined}>
          {showLabels && (
            <SkeletonLoader
              width="30%"
              height={labelHeight}
              borderRadius={8}
              animate={animate}
              theme={theme}
              style={styles.formLabel}
            />
          )}
          <SkeletonLoader
            height={fieldHeight}
            borderRadius={8}
            animate={animate}
            theme={theme}
          />
        </View>
      ))}
      
      {showButton && (
        <ButtonSkeleton
          width="100%"
          height={buttonHeight}
          borderRadius={8}
          animate={animate}
          theme={theme}
          style={{ marginTop: spacing * 1.5 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    width: '200%',
  },
  shimmer: {
    flex: 1,
  },
  textSkeletonContainer: {
    // Container for multiple text lines
  },
  cardSkeleton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardDescription: {
    // Text skeleton spacing handled by component
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listItemAvatar: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: 4,
  },
  listItemSubtitle: {
    // Handled by SkeletonLoader
  },
  profileSkeleton: {
    backgroundColor: 'transparent',
  },
  profileContent: {
    padding: 16,
    alignItems: 'center',
  },
  profileAvatar: {
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  profileName: {
    marginBottom: 8,
  },
  profileTitle: {
    marginBottom: 12,
  },
  profileBio: {
    alignSelf: 'stretch',
  },
  gridSkeleton: {
    // Container for grid layout
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  formSkeleton: {
    // Container for form elements
  },
  formLabel: {
    marginBottom: 8,
  },
});

export default SkeletonLoader; 