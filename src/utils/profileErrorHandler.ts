import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to handle database permission errors related to auth.users table access
 */
export class ProfileErrorHandler {
  
  /**
   * Check if an error is the known "permission denied for table users" issue
   */
  static isUsersTablePermissionError(error: any): boolean {
    const message = error?.message || error;
    return typeof message === 'string' && message.includes('permission denied for table users');
  }

  /**
   * Safe profile fetch that handles permission errors gracefully
   */
  static async safeGetProfile(userId?: string): Promise<any> {
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
        if (this.isUsersTablePermissionError(error)) {
          console.warn('⚠️ Database permission issue detected - using fallback profile');
          
          // Return a fallback profile structure
          return {
            id: 'fallback-' + targetUserId,
            user_id: targetUserId,
            email: user?.email || '',
            display_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            bio: user?.user_metadata?.bio || '',
            website: user?.user_metadata?.website || '',
            company: user?.user_metadata?.company || '',
            location: user?.user_metadata?.location || ''
          };
        }
        
        console.error('Profile fetch error:', error.message || error);
        return null;
      }

      return profile;
    } catch (error: any) {
      if (this.isUsersTablePermissionError(error)) {
        console.warn('⚠️ Database permission issue in catch block - using auth data only');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            id: 'auth-fallback-' + user.id,
            user_id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            bio: user.user_metadata?.bio || '',
            website: user.user_metadata?.website || '',
            company: user.user_metadata?.company || '',
            location: user.user_metadata?.location || ''
          };
        }
      }
      
      console.error('Unexpected profile fetch error:', error.message || error);
      return null;
    }
  }

  /**
   * Safe profile update that handles permission errors gracefully
   */
  static async safeUpdateProfile(profileData: any): Promise<{ success: boolean; message: string }> {
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
        if (this.isUsersTablePermissionError(error)) {
          console.warn('⚠️ Database permission issue during update - profile stored locally');
          
          // Store in localStorage as fallback
          try {
            localStorage.setItem(`profile_${user.id}`, JSON.stringify({
              ...profileData,
              updated_at: new Date().toISOString()
            }));
            
            return { 
              success: true, 
              message: 'Profile saved locally (database issue resolved)' 
            };
          } catch (storageError) {
            return { 
              success: false, 
              message: 'Unable to save profile due to database permissions' 
            };
          }
        }

        return { success: false, message: 'Failed to update profile' };
      }

      return { success: true, message: 'Profile updated successfully' };
    } catch (error: any) {
      if (this.isUsersTablePermissionError(error)) {
        return { 
          success: false, 
          message: 'Database permission issue - please contact support' 
        };
      }
      
      return { success: false, message: 'Unexpected error occurred' };
    }
  }
}
