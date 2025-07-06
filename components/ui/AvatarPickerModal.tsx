import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ImagePickerService, ImagePickerResult } from '../../src/services/ImagePickerService';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('AvatarPickerModal');

export interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (result: ImagePickerResult) => void;
  title?: string;
  subtitle?: string;
  cameraButtonText?: string;
  galleryButtonText?: string;
  cancelButtonText?: string;
  showPermissionAlert?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  onImageSelected,
  title = 'Choose Profile Picture',
  subtitle = 'Select a new profile picture from your camera or photo library',
  cameraButtonText = 'Take Photo',
  galleryButtonText = 'Choose from Gallery',
  cancelButtonText = 'Cancel',
  showPermissionAlert = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<'camera' | 'gallery' | null>(null);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  
  const handleCameraPress = async () => {
    try {
      setIsLoading(true);
      setCurrentAction('camera');
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      logger.info('Camera option selected');
      
      const result = await ImagePickerService.openCamera({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (result.success && result.uri) {
        logger.info('Camera photo taken successfully');
        onImageSelected(result);
        onClose();
      } else if (result.error) {
        logger.error('Camera photo failed:', result.error);
        if (showPermissionAlert) {
          Alert.alert(
            'Camera Error',
            result.error,
            [
              { text: 'OK', style: 'default' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } catch (error) {
      logger.error('Error taking camera photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };
  
  const handleGalleryPress = async () => {
    try {
      setIsLoading(true);
      setCurrentAction('gallery');
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      logger.info('Gallery option selected');
      
      const result = await ImagePickerService.openPhotoLibrary({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (result.success && result.uri) {
        logger.info('Gallery photo selected successfully');
        onImageSelected(result);
        onClose();
      } else if (result.error) {
        logger.error('Gallery photo failed:', result.error);
        if (showPermissionAlert) {
          Alert.alert(
            'Gallery Error',
            result.error,
            [
              { text: 'OK', style: 'default' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } catch (error) {
      logger.error('Error picking gallery photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };
  
  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };
  
  const handleBackdropPress = () => {
    if (!isLoading) {
      handleCancel();
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleCancel}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.5)" translucent />
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          accessible={false}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
                  {subtitle}
                </Text>
              )}
            </View>
            
            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Camera Option */}
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  { borderColor },
                  pressed && styles.optionButtonPressed,
                  isLoading && currentAction === 'camera' && styles.optionButtonLoading,
                ]}
                onPress={handleCameraPress}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={cameraButtonText}
                accessibilityHint="Take a new photo with your camera"
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2'] as any}
                  style={styles.optionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.optionIcon}>
                    <Text style={styles.optionIconText}>📷</Text>
                  </View>
                  <Text style={[styles.optionText, { color: 'white' }]}>
                    {cameraButtonText}
                  </Text>
                  {isLoading && currentAction === 'camera' && (
                    <View style={styles.loadingIndicator}>
                      <View style={styles.loadingDot} />
                      <View style={styles.loadingDot} />
                      <View style={styles.loadingDot} />
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
              
              {/* Gallery Option */}
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  { borderColor },
                  pressed && styles.optionButtonPressed,
                  isLoading && currentAction === 'gallery' && styles.optionButtonLoading,
                ]}
                onPress={handleGalleryPress}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={galleryButtonText}
                accessibilityHint="Choose a photo from your gallery"
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe'] as any}
                  style={styles.optionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.optionIcon}>
                    <Text style={styles.optionIconText}>🖼️</Text>
                  </View>
                  <Text style={[styles.optionText, { color: 'white' }]}>
                    {galleryButtonText}
                  </Text>
                  {isLoading && currentAction === 'gallery' && (
                    <View style={styles.loadingIndicator}>
                      <View style={styles.loadingDot} />
                      <View style={styles.loadingDot} />
                      <View style={styles.loadingDot} />
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
            
            {/* Cancel Button */}
            <View style={styles.cancelContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  { borderColor },
                  pressed && styles.cancelButtonPressed,
                ]}
                onPress={handleCancel}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={cancelButtonText}
                accessibilityHint="Cancel and close this dialog"
              >
                <Text style={[styles.cancelText, { color: textColor }]}>
                  {cancelButtonText}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    maxHeight: screenHeight * 0.6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionButtonLoading: {
    opacity: 0.7,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 18,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  cancelContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AvatarPickerModal; 