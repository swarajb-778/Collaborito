import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle } from 'react-native';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import Avatar from './Avatar';

export interface AvatarListUser {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface AvatarListProps {
  users: AvatarListUser[];
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  onUserPress?: (user: AvatarListUser) => void;
  onShowMore?: () => void;
  showBorder?: boolean;
  spacing?: number;
  style?: ViewStyle;
}

export const AvatarList: React.FC<AvatarListProps> = ({
  users,
  maxVisible = 5,
  size = 'sm',
  onUserPress,
  onShowMore,
  showBorder = true,
  spacing = -8,
  style,
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;
  
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {visibleUsers.map((user, index) => (
          <View
            key={user.id}
            style={[
              styles.avatarWrapper,
              { marginLeft: index > 0 ? spacing : 0 },
            ]}
          >
            <Avatar
              uri={user.avatarUrl}
              name={user.name}
              email={user.email}
              size={size}
              showBorder={showBorder}
              onPress={() => onUserPress?.(user)}
              fallbackType="gradient"
            />
          </View>
        ))}
        
        {remainingCount > 0 && (
          <Pressable
            style={[
              styles.moreButton,
              { 
                backgroundColor: backgroundColor,
                marginLeft: spacing,
                width: typeof size === 'number' ? size : getAvatarSize(size),
                height: typeof size === 'number' ? size : getAvatarSize(size),
                borderRadius: (typeof size === 'number' ? size : getAvatarSize(size)) / 2,
              }
            ]}
            onPress={onShowMore}
          >
            <Text style={[styles.moreText, { color: textColor }]}>
              +{remainingCount}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const getAvatarSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number => {
  const sizes = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };
  return sizes[size];
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  avatarWrapper: {
    position: 'relative',
  },
  moreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  moreText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AvatarList; 