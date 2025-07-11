import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Animation configuration
const SHIMMER_DURATION = 1200;
const SHIMMER_COLORS = {
  light: ['#f0f0f0', '#e8e8e8', '#f0f0f0'],
  dark: ['#2a2a2a', '#3a3a3a', '#2a2a2a'],
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animate?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Basic Skeleton Component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animate = true,
  theme = 'light'
}) => {
  const shimmerTranslate = useSharedValue(-1);
  
  useEffect(() => {
    if (animate) {
      shimmerTranslate.value = withRepeat(
        withTiming(1, { 
          duration: SHIMMER_DURATION,
          easing: Easing.linear 
        }),
        -1,
        false
      );
    }
  }, [animate, shimmerTranslate]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerTranslate.value,
          [-1, 1],
          [-300, 300]
        )
      }
    ],
  }));

  const colors = SHIMMER_COLORS[theme];
  const baseColor = colors[0];

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      {animate && (
        <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Text Lines Skeleton
 */
interface TextLinesProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: string;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const TextLines: React.FC<TextLinesProps> = ({
  lines = 3,
  lineHeight = 16,
  spacing = 8,
  lastLineWidth = '60%',
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
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
 * Circle Skeleton (for avatars)
 */
interface CircleProps {
  size?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const Circle: React.FC<CircleProps> = ({
  size = 40,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <Skeleton
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
 * Card Skeleton Layout
 */
interface CardProps {
  imageHeight?: number;
  showAvatar?: boolean;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  imageHeight = 120,
  showAvatar = true,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Image skeleton */}
      <Skeleton
        height={imageHeight}
        borderRadius={8}
        animate={animate}
        theme={theme}
        style={styles.cardImage}
      />
      
      {/* Content */}
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          {showAvatar && (
            <Circle
              size={32}
              animate={animate}
              theme={theme}
              style={styles.cardAvatar}
            />
          )}
          <View style={styles.cardTitle}>
            <Skeleton
              height={16}
              width="80%"
              animate={animate}
              theme={theme}
            />
          </View>
        </View>
        
        {/* Description */}
        <TextLines
          lines={2}
          lineHeight={14}
          spacing={6}
          lastLineWidth="70%"
          animate={animate}
          theme={theme}
          style={styles.cardText}
        />
      </View>
    </View>
  );
};

/**
 * List Item Skeleton
 */
interface ListItemProps {
  showAvatar?: boolean;
  showAction?: boolean;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  showAvatar = true,
  showAction = true,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.listItem, style]}>
      {/* Avatar */}
      {showAvatar && (
        <Circle
          size={40}
          animate={animate}
          theme={theme}
          style={styles.listAvatar}
        />
      )}
      
      {/* Content */}
      <View style={styles.listContent}>
        <Skeleton
          height={16}
          width="60%"
          animate={animate}
          theme={theme}
          style={styles.listTitle}
        />
        <Skeleton
          height={12}
          width="40%"
          animate={animate}
          theme={theme}
          style={styles.listSubtitle}
        />
      </View>
      
      {/* Action */}
      {showAction && (
        <Skeleton
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
 * Button Skeleton
 */
interface ButtonProps {
  width?: number | string;
  height?: number;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  width = 120,
  height = 44,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={height / 2}
      animate={animate}
      theme={theme}
      style={style}
    />
  );
};

/**
 * Form Field Skeleton
 */
interface FormFieldProps {
  showLabel?: boolean;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  showLabel = true,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={style}>
      {showLabel && (
        <Skeleton
          width="30%"
          height={16}
          animate={animate}
          theme={theme}
          style={styles.fieldLabel}
        />
      )}
      <Skeleton
        height={48}
        borderRadius={8}
        animate={animate}
        theme={theme}
      />
    </View>
  );
};

/**
 * Profile Header Skeleton
 */
interface ProfileProps {
  showCover?: boolean;
  animate?: boolean;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const Profile: React.FC<ProfileProps> = ({
  showCover = true,
  animate = true,
  theme = 'light',
  style
}) => {
  return (
    <View style={[styles.profile, style]}>
      {/* Cover */}
      {showCover && (
        <Skeleton
          height={120}
          borderRadius={0}
          animate={animate}
          theme={theme}
        />
      )}
      
      {/* Content */}
      <View style={styles.profileContent}>
        {/* Avatar */}
        <Circle
          size={80}
          animate={animate}
          theme={theme}
          style={[
            styles.profileAvatar,
            showCover && styles.profileAvatarOverlay
          ]}
        />
        
        {/* Info */}
        <View style={styles.profileInfo}>
          <Skeleton
            width="50%"
            height={24}
            animate={animate}
            theme={theme}
            style={styles.profileName}
          />
          <Skeleton
            width="40%"
            height={16}
            animate={animate}
            theme={theme}
            style={styles.profileTitle}
          />
          <TextLines
            lines={2}
            lineHeight={14}
            spacing={4}
            lastLineWidth="70%"
            animate={animate}
            theme={theme}
            style={styles.profileBio}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '200%',
  },
  shimmer: {
    flex: 1,
  },
  // Card styles
  card: {
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
  cardTitle: {
    flex: 1,
  },
  cardText: {
    marginTop: 8,
  },
  // List item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listAvatar: {
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    marginBottom: 4,
  },
  listSubtitle: {
    // No additional styling needed
  },
  // Form field styles
  fieldLabel: {
    marginBottom: 8,
  },
  // Profile styles
  profile: {
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
  profileAvatarOverlay: {
    marginTop: -40,
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
});

// Main export with all components
const SkeletonLoader = {
  Skeleton,
  TextLines,
  Circle,
  Card,
  ListItem,
  Button,
  FormField,
  Profile,
};

export default SkeletonLoader; 