import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  oauth_provider: string;
  created_at?: string;
  updated_at?: string;
}

export class UserProfileService {
  private static instance: UserProfileService;

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  /**
   * Create or update a user profile in Supabase
   */
  async createOrUpdateProfile(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImage?: string | null;
    oauthProvider: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Creating/updating user profile in Supabase:', userData.id);

      const profileData: Partial<UserProfile> = {
        id: userData.id,
        email: userData.email,
        first_name: userData.firstName || undefined,
        last_name: userData.lastName || undefined,
        username: userData.username || undefined,
        avatar_url: userData.profileImage || undefined,
        oauth_provider: userData.oauthProvider,
        updated_at: new Date().toISOString()
      };

      // Use upsert to insert or update the profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create/update profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile created/updated successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in createOrUpdateProfile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user profile from Supabase
   */
  async getProfile(userId: string): Promise<{ profile: UserProfile | null; error?: string }> {
    try {
      console.log('🔄 Fetching user profile:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          console.log('⚠️ No profile found for user:', userId);
          return { profile: null };
        }
        console.error('❌ Failed to fetch profile:', error);
        return { profile: null, error: error.message };
      }

      console.log('✅ Profile fetched successfully:', data);
      return { profile: data };
    } catch (error) {
      console.error('❌ Exception in getProfile:', error);
      return { 
        profile: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update specific profile fields
   */
  async updateProfileFields(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating profile fields:', userId, updates);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to update profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in updateProfileFields:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Deleting user profile:', userId);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to delete profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in deleteProfile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if profile exists
   */
  async profileExists(userId: string): Promise<boolean> {
    try {
      const { profile } = await this.getProfile(userId);
      return profile !== null;
    } catch (error) {
      console.error('❌ Error checking profile existence:', error);
      return false;
    }
  }
} 