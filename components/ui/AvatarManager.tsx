import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { createLogger } from '../../src/utils/logger';
import * as Haptics from 'expo-haptics';
import Avatar from './Avatar';
import AvatarPickerModal from './AvatarPickerModal';
import AvatarUploadProgressModal from './AvatarUploadProgress';
import { ImagePickerResult } from '../../src/services/ImagePickerService';
import { AvatarUploadService, AvatarUploadProgress } from '../../src/services/AvatarUploadService';
import { useAuth } from '../../src/contexts/AuthContext';

const logger = createLogger('AvatarManager');

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

export const AvatarManager: React.FC<AvatarManagerProps> = ({
  size = 'lg',
  showBorder = true,
  editable = true,
  onAvatarChange,
  userInfo,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(userInfo?.avatarUrl);
  const [showPicker, setShowPicker] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<AvatarUploadProgress>({
    stage: 'compressing',
    progress: 0,
    message: 'Starting upload...',
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  useEffect(() => {
    if (userInfo?.avatarUrl) {
      setAvatarUrl(userInfo.avatarUrl);
    }
  }, [userInfo?.avatarUrl]);
  
  const handleAvatarPress = async () => {
    if (!editable) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logger.info('Avatar pressed for editing');
    setShowPicker(true);
  };
  
  const handleImageSelected = async (result: ImagePickerResult) => {
    if (!result.success || !result.uri || !user?.id) {
      logger.error('Invalid image selection result');
      return;
    }
    
    try {
      setIsUploading(true);
      setShowProgress(true);
      logger.info('Starting avatar upload process');
      
      const uploadResult = await AvatarUploadService.uploadAvatar(
        result,
        {
          userId: user.id,
          compress: true,
          generateMultipleSizes: true,
          quality: 0.8,
          maxSize: 400,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (uploadResult.success && uploadResult.avatarUrl) {
        logger.info('Avatar upload successful:', uploadResult.avatarUrl);
        setAvatarUrl(uploadResult.avatarUrl);
        onAvatarChange?.(uploadResult.avatarUrl);
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        logger.error('Avatar upload failed:', uploadResult.error);
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload avatar');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
    } catch (error) {
      logger.error('Error during avatar upload:', error);
      Alert.alert('Upload Error', 'An unexpected error occurred during upload');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadComplete = () => {
    setShowProgress(false);
  };
  
  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              logger.info('Removing avatar');
              
              const result = await AvatarUploadService.deleteOldAvatar(user.id);
              if (result.success) {
                setAvatarUrl(undefined);
                onAvatarChange?.('');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                throw new Error(result.error || 'Failed to remove avatar');
              }
            } catch (error) {
              logger.error('Error removing avatar:', error);
              Alert.alert('Error', 'Failed to remove avatar');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Avatar Display */}
      <View style={styles.avatarContainer}>
        <Avatar
          uri={avatarUrl}
          name={userInfo?.name}
          email={userInfo?.email}
          size={size}
          showBorder={showBorder}
          borderColor={tintColor}
          borderWidth={3}
          fallbackType="gradient"
          onPress={editable ? handleAvatarPress : undefined}
          accessibilityLabel={editable ? 'Tap to change profile picture' : 'Profile picture'}
          accessibilityHint={editable ? 'Opens options to take a photo or choose from gallery' : undefined}
        />
        
        {/* Edit Indicator */}
        {editable && (
          <Pressable
            style={[styles.editIndicator, { backgroundColor: tintColor }]}
            onPress={handleAvatarPress}
            accessibilityRole="button"
            accessibilityLabel="Edit profile picture"
          >
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
        )}
      </View>
      
      {/* Remove Button */}
      {editable && avatarUrl && (
        <Pressable
          style={styles.removeButton}
          onPress={handleRemoveAvatar}
          accessibilityRole="button"
          accessibilityLabel="Remove profile picture"
        >
          <Text style={[styles.removeText, { color: textColor }]}>
            Remove Photo
          </Text>
        </Pressable>
      )}
      
      {/* Image Picker Modal */}
      <AvatarPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onImageSelected={handleImageSelected}
      />
      
      {/* Upload Progress Modal */}
      <AvatarUploadProgressModal
        visible={showProgress}
        progress={uploadProgress}
        onComplete={handleUploadComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  editIndicator: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editIcon: {
    fontSize: 14,
  },
  removeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
});

export default AvatarManager; 