import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../services/supabase';
import AvatarAnalyticsService from '../../services/AvatarAnalyticsService';
import AvatarPreloadingService from '../../services/AvatarPreloadingService';
import AvatarAccessibilityService from '../../utils/avatarAccessibility';
import { Avatar } from '../../../components/ui/Avatar';
import { AvatarManager } from '../../../components/ui/AvatarManager';
import { AvatarPickerModal } from '../../../components/ui/AvatarPickerModal';
import { AvatarUploadProgress } from '../../../components/ui/AvatarUploadProgress';
import { AvatarList } from '../../../components/ui/AvatarList';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AvatarIntegrationTests');

// Mock external dependencies
jest.mock('../../services/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      update: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
    })),
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-file-system', () => ({
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
  NotificationFeedbackType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('Avatar Integration Tests', () => {
  let mockAnalyticsService: jest.Mocked<AvatarAnalyticsService>;
  let mockPreloadingService: jest.Mocked<AvatarPreloadingService>;
  let mockAccessibilityService: jest.Mocked<AvatarAccessibilityService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    // Mock services
    mockAnalyticsService = {
      trackAvatarUploadStarted: jest.fn(),
      trackAvatarUploadCompleted: jest.fn(),
      trackAvatarUploadFailed: jest.fn(),
      trackAvatarView: jest.fn(),
      trackAvatarCacheHit: jest.fn(),
      trackAvatarCacheMiss: jest.fn(),
      trackAvatarError: jest.fn(),
      getAnalytics: jest.fn(),
      getMetrics: jest.fn(),
      clearAnalytics: jest.fn(),
    } as any;

    mockPreloadingService = {
      preloadAvatar: jest.fn(),
      preloadAvatarList: jest.fn(),
      preloadTeamAvatars: jest.fn(),
      preloadFrequentlyViewedAvatars: jest.fn(),
      preloadBasedOnContext: jest.fn(),
      getPreloadStats: jest.fn(),
      isPreloaded: jest.fn(),
      clearPreloadCache: jest.fn(),
    } as any;

    mockAccessibilityService = {
      generateAvatarAccessibilityProps: jest.fn(),
      generateUploadAccessibilityProps: jest.fn(),
      announceToScreenReader: jest.fn(),
      announceUploadStarted: jest.fn(),
      announceUploadSuccess: jest.fn(),
      announceUploadError: jest.fn(),
      getAccessibilityState: jest.fn(),
      isScreenReaderActive: jest.fn(),
      shouldReduceAnimations: jest.fn(),
      getHighContrastColors: jest.fn(),
    } as any;
  });

  describe('Avatar Component Integration', () => {
    test('renders with user data and handles loading states', async () => {
      const props = {
        userId: 'test-user-1',
        userName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        size: 'md' as const,
        onPress: jest.fn(),
      };

      const { getByTestId, getByText, queryByText } = render(
        <Avatar {...props} />
      );

      // Check initial render
      expect(getByTestId('avatar-container')).toBeTruthy();
      
      // Check accessibility
      expect(mockAccessibilityService.generateAvatarAccessibilityProps).toHaveBeenCalledWith(
        'John Doe',
        undefined,
        undefined,
        true,
        true
      );

      // Check analytics tracking
      await waitFor(() => {
        expect(mockAnalyticsService.trackAvatarView).toHaveBeenCalledWith(
          'test-user-1',
          'https://example.com/avatar.jpg',
          expect.any(Number)
        );
      });
    });

    test('handles fallback to initials when image fails', async () => {
      const props = {
        userId: 'test-user-2',
        userName: 'Jane Smith',
        avatarUrl: 'https://invalid-url.com/avatar.jpg',
        size: 'lg' as const,
      };

      const { getByText, queryByTestId } = render(
        <Avatar {...props} />
      );

      // Wait for image to fail and fallback to initials
      await waitFor(() => {
        expect(getByText('JS')).toBeTruthy();
      });

      // Check error tracking
      expect(mockAnalyticsService.trackAvatarError).toHaveBeenCalledWith(
        'test-user-2',
        'Image load failed',
        'Avatar'
      );
    });

    test('handles preloading and caching correctly', async () => {
      const props = {
        userId: 'test-user-3',
        userName: 'Bob Johnson',
        avatarUrl: 'https://example.com/cached-avatar.jpg',
        size: 'sm' as const,
      };

      // Mock preloading service to return true for preloaded
      mockPreloadingService.isPreloaded.mockReturnValue(true);

      const { getByTestId } = render(
        <Avatar {...props} />
      );

      // Check cache hit tracking
      await waitFor(() => {
        expect(mockAnalyticsService.trackAvatarCacheHit).toHaveBeenCalledWith(
          'test-user-3',
          'https://example.com/cached-avatar.jpg',
          expect.any(Number)
        );
      });
    });
  });

  describe('Avatar Manager Integration', () => {
    test('complete upload workflow with progress tracking', async () => {
      const props = {
        userId: 'test-user-4',
        userName: 'Alice Brown',
        currentAvatarUrl: null,
        onAvatarChange: jest.fn(),
      };

      // Mock successful image picker result
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          width: 1000,
          height: 1000,
          type: 'image',
        }],
      });

      // Mock file system operations
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000, // 1MB
      });

      // Mock successful supabase upload
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'avatars/test-user-4/avatar.jpg' },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.com/test-avatar.jpg' },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const { getByTestId, getByText } = render(
        <AvatarManager {...props} />
      );

      // Click upload button
      fireEvent.press(getByTestId('avatar-upload-button'));

      // Wait for upload to start
      await waitFor(() => {
        expect(mockAnalyticsService.trackAvatarUploadStarted).toHaveBeenCalledWith(
          'test-user-4',
          expect.any(Number)
        );
      });

      // Wait for upload to complete
      await waitFor(() => {
        expect(mockAnalyticsService.trackAvatarUploadCompleted).toHaveBeenCalledWith(
          'test-user-4',
          expect.objectContaining({
            uploadDuration: expect.any(Number),
            fileSize: expect.any(Number),
            compressionRatio: expect.any(Number),
          })
        );
      });

      // Check final callback
      expect(props.onAvatarChange).toHaveBeenCalledWith(
        'https://storage.supabase.com/test-avatar.jpg'
      );
    });

    test('handles upload errors gracefully', async () => {
      const props = {
        userId: 'test-user-5',
        userName: 'Charlie Davis',
        currentAvatarUrl: null,
        onAvatarChange: jest.fn(),
      };

      // Mock image picker success but upload failure
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          width: 1000,
          height: 1000,
          type: 'image',
        }],
      });

      // Mock upload failure
      const mockUpload = jest.fn().mockRejectedValue(new Error('Upload failed'));
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      });

      const { getByTestId, getByText } = render(
        <AvatarManager {...props} />
      );

      // Click upload button
      fireEvent.press(getByTestId('avatar-upload-button'));

      // Wait for error to be tracked
      await waitFor(() => {
        expect(mockAnalyticsService.trackAvatarUploadFailed).toHaveBeenCalledWith(
          'test-user-5',
          'Upload failed',
          0
        );
      });

      // Check error announcement
      expect(mockAccessibilityService.announceUploadError).toHaveBeenCalledWith(
        'Upload failed'
      );
    });
  });

  describe('Avatar Picker Modal Integration', () => {
    test('handles camera permission flow', async () => {
      // Mock permission request
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const props = {
        visible: true,
        onClose: jest.fn(),
        onImageSelected: jest.fn(),
      };

      const { getByTestId } = render(
        <AvatarPickerModal {...props} />
      );

      // Click camera option
      fireEvent.press(getByTestId('camera-option'));

      // Wait for permission check
      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    test('handles permission denied gracefully', async () => {
      // Mock permission denied
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const props = {
        visible: true,
        onClose: jest.fn(),
        onImageSelected: jest.fn(),
      };

      const { getByTestId, getByText } = render(
        <AvatarPickerModal {...props} />
      );

      // Click camera option
      fireEvent.press(getByTestId('camera-option'));

      // Wait for permission denied message
      await waitFor(() => {
        expect(getByText(/camera permission/i)).toBeTruthy();
      });
    });
  });

  describe('Avatar List Integration', () => {
    test('renders team avatars with preloading', async () => {
      const teamMembers = [
        { userId: 'user-1', userName: 'John Doe', avatarUrl: 'https://example.com/1.jpg' },
        { userId: 'user-2', userName: 'Jane Smith', avatarUrl: 'https://example.com/2.jpg' },
        { userId: 'user-3', userName: 'Bob Johnson', avatarUrl: 'https://example.com/3.jpg' },
      ];

      const props = {
        users: teamMembers,
        size: 'sm' as const,
        maxVisible: 3,
        onUserPress: jest.fn(),
      };

      const { getByTestId, getAllByTestId } = render(
        <AvatarList {...props} />
      );

      // Check preloading was triggered
      expect(mockPreloadingService.preloadAvatarList).toHaveBeenCalledWith(
        teamMembers.map(member => ({
          userId: member.userId,
          avatarUrl: member.avatarUrl,
        })),
        'medium',
        'list'
      );

      // Check all avatars are rendered
      const avatarElements = getAllByTestId(/avatar-container/);
      expect(avatarElements).toHaveLength(3);
    });

    test('handles overflow with "+N more" indicator', async () => {
      const manyMembers = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${i}`,
        userName: `User ${i}`,
        avatarUrl: `https://example.com/${i}.jpg`,
      }));

      const props = {
        users: manyMembers,
        size: 'sm' as const,
        maxVisible: 5,
        onUserPress: jest.fn(),
      };

      const { getByTestId, getByText } = render(
        <AvatarList {...props} />
      );

      // Check overflow indicator
      expect(getByText('+5 more')).toBeTruthy();
    });
  });

  describe('Avatar Analytics Integration', () => {
    test('tracks complete user journey', async () => {
      const userId = 'test-user-journey';
      const userName = 'Journey User';

      // Simulate avatar view
      mockAnalyticsService.trackAvatarView(userId, 'initial-avatar.jpg', 150);

      // Simulate upload start
      mockAnalyticsService.trackAvatarUploadStarted(userId, 2048000);

      // Simulate upload completion
      mockAnalyticsService.trackAvatarUploadCompleted(userId, {
        uploadStartTime: Date.now() - 5000,
        uploadEndTime: Date.now(),
        fileSize: 2048000,
        compressionRatio: 0.7,
        uploadDuration: 5000,
        errorCount: 0,
        retryCount: 0,
        compressionTime: 1000,
        uploadSpeed: 409600,
      });

      // Verify analytics calls
      expect(mockAnalyticsService.trackAvatarView).toHaveBeenCalledWith(
        userId,
        'initial-avatar.jpg',
        150
      );

      expect(mockAnalyticsService.trackAvatarUploadStarted).toHaveBeenCalledWith(
        userId,
        2048000
      );

      expect(mockAnalyticsService.trackAvatarUploadCompleted).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          uploadDuration: 5000,
          fileSize: 2048000,
          compressionRatio: 0.7,
        })
      );
    });

    test('tracks performance metrics', async () => {
      const performanceMetrics = {
        componentRenderTime: 45,
        imageLoadTime: 120,
        cacheRetrievalTime: 5,
        compressionPerformance: 0.8,
        memoryUsage: 15728640,
        networkLatency: 250,
      };

      mockAnalyticsService.trackPerformanceMetrics(performanceMetrics);

      expect(mockAnalyticsService.trackPerformanceMetrics).toHaveBeenCalledWith(
        performanceMetrics
      );
    });
  });

  describe('Avatar Accessibility Integration', () => {
    test('provides comprehensive accessibility support', async () => {
      const props = {
        userId: 'accessibility-user',
        userName: 'Accessible User',
        avatarUrl: 'https://example.com/accessible.jpg',
        size: 'md' as const,
        onPress: jest.fn(),
      };

      // Mock accessibility service responses
      mockAccessibilityService.generateAvatarAccessibilityProps.mockReturnValue({
        accessible: true,
        accessibilityLabel: 'Profile picture of Accessible User',
        accessibilityHint: 'Double tap to view profile details',
        accessibilityRole: 'imagebutton',
        accessibilityState: { disabled: false },
        importantForAccessibility: 'yes',
      });

      mockAccessibilityService.isScreenReaderActive.mockReturnValue(true);
      mockAccessibilityService.shouldReduceAnimations.mockReturnValue(true);

      const { getByTestId } = render(
        <Avatar {...props} />
      );

      // Check accessibility props generation
      expect(mockAccessibilityService.generateAvatarAccessibilityProps).toHaveBeenCalledWith(
        'Accessible User',
        undefined,
        undefined,
        true,
        true
      );

      // Check screen reader detection
      expect(mockAccessibilityService.isScreenReaderActive).toHaveBeenCalled();

      // Check reduce motion detection
      expect(mockAccessibilityService.shouldReduceAnimations).toHaveBeenCalled();
    });

    test('announces upload progress to screen reader', async () => {
      const userId = 'sr-user';
      const userName = 'Screen Reader User';

      // Mock screen reader announcements
      await mockAccessibilityService.announceUploadStarted(userName);
      await mockAccessibilityService.announceUploadSuccess(userName);

      expect(mockAccessibilityService.announceUploadStarted).toHaveBeenCalledWith(userName);
      expect(mockAccessibilityService.announceUploadSuccess).toHaveBeenCalledWith(userName);
    });
  });

  describe('Avatar Preloading Integration', () => {
    test('preloads team avatars based on context', async () => {
      const teamId = 'test-team';
      const userId = 'team-member';

      // Mock preloading service calls
      await mockPreloadingService.preloadTeamAvatars(teamId);
      await mockPreloadingService.preloadBasedOnContext(userId, 'team_screen');

      expect(mockPreloadingService.preloadTeamAvatars).toHaveBeenCalledWith(teamId);
      expect(mockPreloadingService.preloadBasedOnContext).toHaveBeenCalledWith(
        userId,
        'team_screen'
      );
    });

    test('manages preload queue efficiently', async () => {
      const userAvatars = [
        { userId: 'user-1', avatarUrl: 'https://example.com/1.jpg' },
        { userId: 'user-2', avatarUrl: 'https://example.com/2.jpg' },
        { userId: 'user-3', avatarUrl: 'https://example.com/3.jpg' },
      ];

      await mockPreloadingService.preloadAvatarList(userAvatars, 'high', 'team');

      expect(mockPreloadingService.preloadAvatarList).toHaveBeenCalledWith(
        userAvatars,
        'high',
        'team'
      );
    });
  });

  describe('End-to-End Workflow Integration', () => {
    test('complete avatar management workflow', async () => {
      const userId = 'e2e-user';
      const userName = 'End-to-End User';

      // Step 1: Initial avatar load
      const { rerender } = render(
        <Avatar
          userId={userId}
          userName={userName}
          avatarUrl={null}
          size="lg"
          onPress={jest.fn()}
        />
      );

      // Step 2: Upload new avatar
      const uploadProps = {
        userId,
        userName,
        currentAvatarUrl: null,
        onAvatarChange: jest.fn(),
      };

      rerender(<AvatarManager {...uploadProps} />);

      // Step 3: Verify analytics tracking
      expect(mockAnalyticsService.trackAvatarView).toHaveBeenCalled();

      // Step 4: Verify accessibility support
      expect(mockAccessibilityService.generateAvatarAccessibilityProps).toHaveBeenCalled();

      // Step 5: Verify preloading
      expect(mockPreloadingService.preloadAvatar).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('handles network failures gracefully', async () => {
      // Mock network failure
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockRejectedValue(new Error('Network error')),
      });

      const props = {
        userId: 'network-error-user',
        userName: 'Network Error User',
        currentAvatarUrl: null,
        onAvatarChange: jest.fn(),
      };

      const { getByTestId } = render(
        <AvatarManager {...props} />
      );

      // Trigger upload
      fireEvent.press(getByTestId('avatar-upload-button'));

      // Wait for error handling
      await waitFor(() => {
        expect(mockAnalyticsService.trackAvatarUploadFailed).toHaveBeenCalledWith(
          'network-error-user',
          'Network error',
          0
        );
      });
    });

    test('handles permission failures gracefully', async () => {
      // Mock permission failure
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const props = {
        visible: true,
        onClose: jest.fn(),
        onImageSelected: jest.fn(),
      };

      const { getByTestId } = render(
        <AvatarPickerModal {...props} />
      );

      // Trigger permission request
      fireEvent.press(getByTestId('gallery-option'));

      // Wait for permission handling
      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Integration', () => {
    test('maintains performance standards', async () => {
      const startTime = Date.now();

      const props = {
        userId: 'perf-user',
        userName: 'Performance User',
        avatarUrl: 'https://example.com/perf.jpg',
        size: 'md' as const,
      };

      const { getByTestId } = render(
        <Avatar {...props} />
      );

      const renderTime = Date.now() - startTime;

      // Check render time is reasonable (< 100ms)
      expect(renderTime).toBeLessThan(100);

      // Check performance tracking
      expect(mockAnalyticsService.trackAvatarComponentRender).toHaveBeenCalledWith(
        'perf-user',
        'Avatar',
        expect.any(Number)
      );
    });
  });
});

// Test utilities
export const createMockUser = (id: string, name: string, avatarUrl?: string) => ({
  userId: id,
  userName: name,
  avatarUrl: avatarUrl || null,
});

export const createMockTeam = (id: string, memberCount: number) => ({
  teamId: id,
  members: Array.from({ length: memberCount }, (_, i) => 
    createMockUser(`user-${i}`, `User ${i}`, `https://example.com/${i}.jpg`)
  ),
});

export const waitForAsyncOperations = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const mockImagePickerSuccess = (uri: string) => {
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
    canceled: false,
    assets: [{
      uri,
      width: 1000,
      height: 1000,
      type: 'image',
    }],
  });
};

export const mockImagePickerCancel = () => {
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
    canceled: true,
  });
};

export const mockSupabaseUploadSuccess = (path: string, publicUrl: string) => {
  (supabase.storage.from as jest.Mock).mockReturnValue({
    upload: jest.fn().mockResolvedValue({
      data: { path },
      error: null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl },
    }),
  });
};

export const mockSupabaseUploadFailure = (error: string) => {
  (supabase.storage.from as jest.Mock).mockReturnValue({
    upload: jest.fn().mockRejectedValue(new Error(error)),
  });
}; 