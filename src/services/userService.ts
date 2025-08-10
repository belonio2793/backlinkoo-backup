import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { formatErrorForLogging, formatErrorForUI } from '@/utils/errorUtils';

export interface UserProfile {
  user_id: string;
  role: 'user' | 'premium' | 'admin';
  created_at: string;
  updated_at: string;
  subscription_status?: 'active' | 'inactive' | 'cancelled';
  subscription_tier?: 'basic' | 'premium' | 'enterprise';
}

class UserService {
  /**
   * Get current user profile with role information
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      console.log('🔄 userService: Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ userService: No authenticated user');
        return null;
      }

      console.log('🔄 userService: Fetching profile for user:', user.email);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        const errorMessage = formatErrorForUI(error);

        // Handle permission denied errors or table not found (silently for these common issues)
        if (errorMessage && (
          errorMessage.includes('permission denied') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('JWT expired') ||
          errorMessage.includes('row-level security')
        )) {
          console.log('ℹ️ Database access limited - using fallback profile for:', user.email);
          return {
            id: user.id,
            user_id: user.id,
            email: user.email || '',
            role: 'user' as const,
            subscription_tier: 'free' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // Only log unexpected errors with proper formatting
        console.error('❌ userService: Unexpected error fetching user profile:', formatErrorForLogging(error, 'getCurrentUserProfile'));

        // Handle infinite recursion in RLS policies
        if (errorMessage && errorMessage.includes('infinite recursion detected in policy')) {
          console.warn('⚠️ Infinite recursion detected in RLS policy - returning minimal profile');
          return {
            id: user.id,
            user_id: user.id,
            email: user.email || '',
            role: 'user' as const,
            subscription_tier: 'free' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // Handle specific permission denied errors
        if (errorMessage && errorMessage.includes('permission denied for table users')) {
          console.warn('⚠️ Permission denied for "users" table - this indicates a database configuration issue');
          console.warn('The application should only access the "profiles" table, not "users"');
          console.warn('This may be caused by a database trigger or RLS policy trying to access a non-existent table');
        }

        return null;
      }

      console.log('✅ userService: Profile loaded successfully:', profile);
      return profile;
    } catch (error: any) {
      const errorMessage = formatErrorForUI(error);
      console.error('❌ userService: Error getting current user profile:', formatErrorForLogging(error, 'getCurrentUserProfile'));

      // Handle infinite recursion gracefully
      if (errorMessage && errorMessage.includes('infinite recursion detected in policy')) {
        console.warn('⚠️ Infinite recursion detected in RLS policy - returning null profile');
      }

      return null;
    }
  }

  /**
   * Check if current user has premium role
   */
  async isPremiumUser(): Promise<boolean> {
    try {
      console.log('🔄 userService: Checking premium status...');
      const profile = await this.getCurrentUserProfile();

      if (!profile) {
        console.log('❌ userService: No profile found for premium check');
        return false;
      }

      // Check subscription_tier instead of role for premium status
      const isPremium = profile?.subscription_tier === 'premium' ||
                       profile?.subscription_tier === 'monthly' ||
                       profile?.role === 'admin'; // Admin also gets premium access

      console.log('✅ userService: Premium check result:', {
        subscription_tier: profile.subscription_tier,
        role: profile.role,
        isPremium
      });

      return isPremium;
    } catch (error: any) {
      console.error('❌ userService: Error checking premium status:', error.message || error);
      return false;
    }
  }

  /**
   * Check if current user has admin role
   */
  async isAdminUser(): Promise<boolean> {
    try {
      const profile = await this.getCurrentUserProfile();
      return profile?.role === 'admin';
    } catch (error: any) {
      console.error('Error checking admin status:', error.message || error);
      return false;
    }
  }

  /**
   * Upgrade user to premium role
   */
  async upgradeToPremium(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // First check if profile exists, create if it doesn't
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { success: false, message: `Database error: ${fetchError.message}` };
      }

      let updateResult;

      if (!existingProfile) {
        // Create new profile
        updateResult = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            role: 'premium',
            subscription_status: 'active',
            subscription_tier: 'premium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } else {
        // Update existing profile
        updateResult = await supabase
          .from('profiles')
          .update({
            role: 'premium',
            subscription_status: 'active',
            subscription_tier: 'premium',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      if (updateResult.error) {
        return {
          success: false,
          message: `Failed to upgrade account: ${updateResult.error.message}`
        };
      }

      // Log the upgrade for audit purposes (don't fail upgrade if logging fails)
      try {
        await this.logUserAction(user.id, 'upgrade_to_premium', 'User upgraded to premium role');
      } catch (logError: any) {
        // Logging failure shouldn't prevent upgrade success
      }

      return { success: true, message: 'Successfully upgraded to premium' };
    } catch (error: any) {
      console.error('Exception in upgradeToPremium:', error.message || error);
      return { success: false, message: `Unexpected error during upgrade: ${error.message}` };
    }
  }

  /**
   * Downgrade user from premium to regular user
   */
  async downgradeFromPremium(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Update user profile to regular user role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'user',
          subscription_status: 'inactive',
          subscription_tier: 'basic',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error downgrading from premium:', updateError);
        return { success: false, message: 'Failed to downgrade account' };
      }

      // Log the downgrade for audit purposes
      await this.logUserAction(user.id, 'downgrade_from_premium', 'User downgraded from premium role');

      return { success: true, message: 'Successfully downgraded from premium' };
    } catch (error: any) {
      console.error('Error in downgradeFromPremium:', error.message || error);
      return { success: false, message: 'Unexpected error during downgrade' };
    }
  }

  /**
   * Get user's subscription limits and permissions
   */
  async getUserLimits(): Promise<{
    maxClaimedPosts: number;
    hasUnlimitedClaims: boolean;
    hasAdvancedSEO: boolean;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
    canAccessPremiumContent: boolean;
  }> {
    try {
      const profile = await this.getCurrentUserProfile();
      // Check subscription_tier instead of role for premium status
      const isPremium = profile?.subscription_tier === 'premium' ||
                       profile?.subscription_tier === 'monthly' ||
                       profile?.role === 'admin'; // Admin also gets premium access

      return {
        maxClaimedPosts: isPremium ? -1 : 3, // -1 means unlimited
        hasUnlimitedClaims: isPremium,
        hasAdvancedSEO: isPremium,
        hasAdvancedAnalytics: isPremium,
        hasPrioritySupport: isPremium,
        canAccessPremiumContent: isPremium
      };
    } catch (error: any) {
      console.error('Error getting user limits:', error.message || error);
      // Return default (free) limits on error
      return {
        maxClaimedPosts: 3,
        hasUnlimitedClaims: false,
        hasAdvancedSEO: false,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        canAccessPremiumContent: false
      };
    }
  }

  /**
   * Log user actions for audit trail
   */
  private async logUserAction(userId: string, action: string, description: string): Promise<void> {
    try {
      await supabase
        .from('user_audit_log')
        .insert({
          user_id: userId,
          action,
          description,
          timestamp: new Date().toISOString()
        });
    } catch (error: any) {
      // Don't throw error for logging failures, just log it
      console.warn('Failed to log user action:', error.message || error);
    }
  }

  /**
   * Initialize premium features for a user (called after successful upgrade)
   */
  async initializePremiumFeatures(userId: string): Promise<void> {
    try {
      // You can add any premium-specific initialization here
      // For example: create premium-only database entries, send welcome email, etc.
      
      console.log('Premium features initialized for user:', userId);
      await this.logUserAction(userId, 'premium_features_initialized', 'Premium features have been initialized');
    } catch (error: any) {
      console.error('Error initializing premium features:', error.message || error);
    }
  }

  /**
   * Check if user can claim more posts based on their role
   */
  async canClaimMorePosts(currentClaimedCount: number): Promise<boolean> {
    try {
      const limits = await this.getUserLimits();
      
      // If unlimited claims (premium/admin), always return true
      if (limits.hasUnlimitedClaims) {
        return true;
      }
      
      // For regular users, check against limit
      return currentClaimedCount < limits.maxClaimedPosts;
    } catch (error: any) {
      console.error('Error checking claim eligibility:', error.message || error);
      return false;
    }
  }
}

export const userService = new UserService();
