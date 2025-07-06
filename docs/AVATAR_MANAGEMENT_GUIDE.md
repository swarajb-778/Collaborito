# Avatar Management System Guide

## Overview

The Avatar Management System provides a comprehensive solution for handling user profile pictures in the Collaborito app. It includes image picking, compression, upload progress tracking, storage management, and caching.

## Architecture

### Components

1. **Avatar** - Display component with fallback support
2. **AvatarManager** - Complete avatar editing workflow
3. **AvatarPickerModal** - Camera/gallery selection modal
4. **AvatarUploadProgress** - Real-time upload progress
5. **AvatarList** - Display multiple avatars for teams

### Services

1. **ImagePickerService** - Camera and gallery access
2. **AvatarUploadService** - Upload to Supabase Storage
3. **ProfileImageService** - Caching and optimization
4. **ImageUtils** - Compression and resizing

## Usage Examples

### Basic Avatar Display

```tsx
import Avatar from '../components/ui/Avatar';

<Avatar
  uri={user.avatarUrl}
  name={user.name}
  email={user.email}
  size="lg"
  showBorder={true}
  fallbackType="gradient"
/>
```

### Complete Avatar Management

```tsx
import AvatarManager from '../components/ui/AvatarManager';

<AvatarManager
  size="xl"
  editable={true}
  onAvatarChange={(url) => console.log('New avatar:', url)}
  userInfo={{
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }}
/>
```

### Team Avatar List

```tsx
import AvatarList from '../components/ui/AvatarList';

<AvatarList
  users={teamMembers}
  maxVisible={5}
  size="sm"
  onUserPress={(user) => navigateToProfile(user)}
/>
```

## Features

### Image Processing
- Automatic compression and resizing
- Multiple size generation (thumbnail, small, medium, large)
- Format optimization (JPEG, PNG, WebP)
- Quality adjustment based on file size

### Upload Progress
- Real-time progress tracking
- Stage-based visualization
- Automatic retry on failure
- Cleanup of temporary files

### Caching
- 24-hour cache duration
- AsyncStorage for offline access
- Preloading for team members
- Cache invalidation on update

### Security
- Row Level Security (RLS) policies
- User-specific file paths
- Public read access for avatars
- Authenticated upload/delete operations

## Configuration

### Supabase Storage Setup

1. Create avatars bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

2. Set up RLS policies:
```sql
-- Users can upload their own avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

### Environment Variables

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Best Practices

### Image Optimization
- Use square aspect ratios for avatars
- Compress images to reduce file size
- Generate multiple sizes for different use cases
- Implement progressive loading

### User Experience
- Show upload progress for large files
- Provide haptic feedback for interactions
- Handle permission requests gracefully
- Offer multiple input methods (camera/gallery)

### Performance
- Cache images locally for offline access
- Preload team member avatars
- Use appropriate image sizes for context
- Implement lazy loading for lists

## Error Handling

### Common Issues

1. **Permission Denied**
   - Request camera/gallery permissions
   - Guide users to settings if needed
   - Provide alternative input methods

2. **Upload Failures**
   - Retry failed uploads automatically
   - Show clear error messages
   - Offer manual retry options

3. **Storage Limits**
   - Compress images before upload
   - Set maximum file size limits
   - Clean up old avatar files

### Error Recovery

```tsx
try {
  const result = await AvatarUploadService.uploadAvatar(image, options);
  if (!result.success) {
    // Handle upload error
    Alert.alert('Upload Failed', result.error);
  }
} catch (error) {
  // Handle unexpected errors
  Alert.alert('Error', 'An unexpected error occurred');
}
```

## Testing

Run the avatar functionality tests:

```bash
node test-avatar-functionality.js
```

### Test Coverage
- Storage bucket configuration
- Upload/download functionality
- Permission handling
- Component rendering
- Service integration

## Migration Guide

### From Previous System

1. Update existing avatars to new storage structure
2. Migrate user preferences and settings
3. Update database schema for avatar URLs
4. Test all avatar-related functionality

### Schema Updates

```sql
-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;

-- Update existing users with placeholder avatars
UPDATE profiles SET avatar_url = NULL WHERE avatar_url IS NULL;
```

## Troubleshooting

### Common Problems

1. **Images not displaying**
   - Check storage bucket permissions
   - Verify image URLs are accessible
   - Test with different image formats

2. **Upload progress stuck**
   - Check network connectivity
   - Verify Supabase configuration
   - Test with smaller image files

3. **Cache not working**
   - Check AsyncStorage permissions
   - Verify cache expiration logic
   - Clear cache and retry

### Debug Mode

Enable detailed logging:

```tsx
import { createLogger } from '../src/utils/logger';

const logger = createLogger('AvatarDebug');
logger.setLevel('debug');
```

## Future Enhancements

### Planned Features
- Automatic face detection and cropping
- Advanced image filters and effects
- Bulk avatar processing for teams
- Integration with external services (Gravatar, etc.)
- Real-time avatar synchronization

### Performance Improvements
- WebP format support
- Progressive image loading
- Background upload queue
- Intelligent compression algorithms

## Support

For issues and questions:
1. Check this documentation
2. Run the test suite
3. Review error logs
4. Contact development team 