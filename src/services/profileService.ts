import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfileData {
  display_name?: string;
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
}

export interface UserSettings {
  email_notifications?: boolean;
  marketing_emails?: boolean;
  weekly_reports?: boolean;
  security_alerts?: boolean;
}

export interface ExtendedUserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name?: string;
  role: 'user' | 'premium' | 'admin';
  created_at: string;
  updated_at: string;
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
  settings?: UserSettings;
}

class ProfileService {
  /**
   * Get user profile from database
   */
  async getUserProfile(userId?: string): Promise<ExtendedUserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message || error);

        // Handle specific permission denied errors
        if (error.message && error.message.includes('permission denied for table users')) {
          console.warn('⚠️ Permission denied for "users" table - this indicates a database configuration issue');
          console.warn('The application should only access the "profiles" table, not "users"');
          return null;
        }

        return null;
      }

      return profile;
    } catch (error: any) {
      console.error('Error getting user profile:', error.message || error);
      return null;
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(profileData: UserProfileData): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error.message || error);
        return { success: false, message: 'Failed to update profile' };
      }

      return { success: true, message: 'Profile updated successfully' };
    } catch (error: any) {
      console.error('Error in updateProfile:', error.message || error);
      return { success: false, message: 'Unexpected error occurred' };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: UserSettings): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // For now, we'll store settings in the user_metadata
      // In a more complete implementation, you might want a separate settings table
      const { error } = await supabase.auth.updateUser({
        data: {
          settings: settings
        }
      });

      if (error) {
        console.error('Error updating settings:', error.message || error);
        return { success: false, message: 'Failed to update settings' };
      }

      return { success: true, message: 'Settings updated successfully' };
    } catch (error: any) {
      console.error('Error in updateSettings:', error.message || error);
      return { success: false, message: 'Unexpected error occurred' };
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return this.getDefaultSettings();
      }

      // Get settings from user metadata
      const settings = user.user_metadata?.settings;
      
      return {
        ...this.getDefaultSettings(),
        ...settings
      };
    } catch (error: any) {
      console.error('Error getting user settings:', error.message || error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): UserSettings {
    return {
      email_notifications: true,
      marketing_emails: false,
      weekly_reports: true,
      security_alerts: true
    };
  }

  /**
   * Update user email (requires email confirmation)
   */
  async updateEmail(newEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        console.error('Error updating email:', error.message || error);
        return { success: false, message: 'Failed to update email' };
      }

      return { 
        success: true, 
        message: 'Confirmation email sent to new address. Please check your email to confirm the change.' 
      };
    } catch (error: any) {
      console.error('Error in updateEmail:', error.message || error);
      return { success: false, message: 'Unexpected error occurred' };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error.message || error);
        return { success: false, message: 'Failed to update password' };
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Error in updatePassword:', error.message || error);
      return { success: false, message: 'Unexpected error occurred' };
    }
  }

  /**
   * Create user profile if it doesn't exist
   */
  async ensureProfileExists(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Check if profile already exists
      const existingProfile = await this.getUserProfile();
      if (existingProfile) {
        return { success: true, message: 'Profile already exists' };
      }

      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'user'
        });

      if (error) {
        console.error('Error creating profile:', error.message || error);
        return { success: false, message: 'Failed to create profile' };
      }

      return { success: true, message: 'Profile created successfully' };
    } catch (error: any) {
      console.error('Error in ensureProfileExists:', error.message || error);
      return { success: false, message: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete user account (soft delete - deactivate)
   */
  async deactivateAccount(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Update profile to mark as deactivated
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'deactivated',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deactivating account:', error.message || error);
        return { success: false, message: 'Failed to deactivate account' };
      }

      return { success: true, message: 'Account deactivated successfully' };
    } catch (error: any) {
      console.error('Error in deactivateAccount:', error.message || error);
      return { success: false, message: 'Unexpected error occurred' };
    }
  }
}

export const profileService = new ProfileService();
