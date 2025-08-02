import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { databaseConnectionService } from './databaseConnectionService';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Subscriber = Database['public']['Tables']['subscribers']['Row'];

export interface RealUserDetails extends Profile {
  subscription?: Subscriber | null;
  campaignCount: number;
  totalCreditsUsed: number;
  totalRevenue: number;
  lastActivity: string | null;
  isPremium: boolean;
  isGifted: boolean;
}

export interface UserUpdatePayload {
  display_name?: string;
  email?: string;
  role?: 'admin' | 'user';
  isPremium?: boolean;
  isGifted?: boolean;
  subscriptionTier?: string;
  subscriptionEnd?: string;
}

export interface UserListFilters {
  search?: string;
  role?: 'admin' | 'user' | 'all';
  premiumStatus?: 'premium' | 'free' | 'gifted' | 'all';
  sortBy?: 'created_at' | 'email' | 'last_activity' | 'revenue';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class RealAdminUserService {
  
  /**
   * Test database connection using enhanced service
   */
  async testConnection(): Promise<{
    success: boolean;
    profileCount: number;
    error?: string;
  }> {
    try {
      const result = await databaseConnectionService.testConnection();
      return {
        success: result.success,
        profileCount: result.profileCount,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        profileCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Check if current user has admin access
   */
  async checkAdminAccess(): Promise<boolean> {
    try {
      const result = await databaseConnectionService.checkAdminAccess();
      return result.isAdmin;
    } catch (error) {
      console.error('❌ Admin access check failed:', error);
      return false;
    }
  }

  /**
   * Get all user profiles with proper error handling
   */
  async getAllProfiles(): Promise<Profile[]> {
    try {
      console.log('📋 Fetching all profiles...');
      
      // First check if we have admin access
      const isAdmin = await this.checkAdminAccess();
      if (!isAdmin) {
        throw new Error('Admin access required. Please ensure you are signed in as an admin user.');
      }
      
      // Try multiple methods to get profiles
      const methods = [
        {
          name: 'RPC Admin Bypass',
          execute: async () => {
            const { data, error } = await supabase.rpc('get_profiles_admin_bypass');
            if (error) throw error;
            return data;
          }
        },
        {
          name: 'Direct Query',
          execute: async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
          }
        }
      ];
      
      let lastError = null;
      for (const method of methods) {
        try {
          console.log(`🧪 Trying ${method.name}...`);
          const result = await method.execute();
          if (result && result.length >= 0) {
            console.log(`��� ${method.name} successful - got ${result.length} profiles`);
            return result;
          }
        } catch (error: any) {
          console.warn(`❌ ${method.name} failed:`, error.message);
          lastError = error;
        }
      }
      
      throw lastError || new Error('All profile fetch methods failed');
      
    } catch (error: any) {
      console.error('❌ Failed to fetch profiles:', error);
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
  }

  /**
   * Get paginated and filtered users with enhanced error handling
   */
  async getUsers(filters: UserListFilters = {}): Promise<{
    users: RealUserDetails[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const {
        search = '',
        role = 'all',
        premiumStatus = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc',
        limit = 50,
        offset = 0
      } = filters;

      console.log('📋 Fetching real users with filters:', filters);
      
      // Check connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Database connection failed');
      }
      
      // Get all profiles
      const allProfiles = await this.getAllProfiles();
      
      // Apply filters
      let filteredProfiles = [...allProfiles];
      
      // Role filter
      if (role !== 'all') {
        filteredProfiles = filteredProfiles.filter(p => p.role === role);
      }
      
      // Search filter
      if (search && search.trim() !== '') {
        const searchLower = search.toLowerCase();
        filteredProfiles = filteredProfiles.filter(p =>
          p.email?.toLowerCase().includes(searchLower) ||
          (p.display_name && p.display_name.toLowerCase().includes(searchLower))
        );
      }
      
      // Get enhanced data for filtered profiles (limit to improve performance)
      const profilesToEnhance = filteredProfiles.slice(offset, offset + limit);
      const enhancedUsers = await Promise.all(
        profilesToEnhance.map(profile => this.enhanceUserProfile(profile))
      );
      
      // Apply premium status filter after enhancement
      let finalUsers = enhancedUsers;
      if (premiumStatus !== 'all') {
        finalUsers = enhancedUsers.filter(user => {
          switch (premiumStatus) {
            case 'premium':
              return user.isPremium && !user.isGifted;
            case 'gifted':
              return user.isGifted;
            case 'free':
              return !user.isPremium;
            default:
              return true;
          }
        });
      }
      
      // Apply sorting
      finalUsers.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortBy) {
          case 'email':
            aVal = a.email || '';
            bVal = b.email || '';
            break;
          case 'last_activity':
            aVal = a.lastActivity || '';
            bVal = b.lastActivity || '';
            break;
          case 'revenue':
            aVal = a.totalRevenue;
            bVal = b.totalRevenue;
            break;
          case 'created_at':
          default:
            aVal = a.created_at || '';
            bVal = b.created_at || '';
            break;
        }

        if (sortOrder === 'asc') {
          return aVal < bVal ? -1 : 1;
        } else {
          return aVal > bVal ? -1 : 1;
        }
      });
      
      const totalCount = filteredProfiles.length;
      const hasMore = (offset + limit) < totalCount;
      
      console.log(`✅ Retrieved ${finalUsers.length} users (${totalCount} total, hasMore: ${hasMore})`);
      
      return {
        users: finalUsers,
        totalCount,
        hasMore
      };
      
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Enhance user profile with additional data (with error handling)
   */
  private async enhanceUserProfile(profile: Profile): Promise<RealUserDetails> {
    try {
      // Get subscription data
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      // Get campaign statistics (with error handling)
      let campaignCount = 0;
      let lastActivity = null;
      try {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('created_at, credits_used')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false });
        
        campaignCount = campaigns?.length || 0;
        lastActivity = campaigns?.[0]?.created_at || null;
      } catch (error) {
        console.warn(`⚠️ Could not fetch campaigns for ${profile.user_id}:`, error);
      }

      // Get credit statistics (with error handling)
      let totalCreditsUsed = 0;
      try {
        const { data: credits } = await supabase
          .from('credits')
          .select('total_used')
          .eq('user_id', profile.user_id)
          .single();
        
        totalCreditsUsed = credits?.total_used || 0;
      } catch (error) {
        console.warn(`⚠️ Could not fetch credits for ${profile.user_id}:`, error);
      }

      // Get revenue from orders (with error handling)
      let totalRevenue = 0;
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('amount')
          .eq('user_id', profile.user_id)
          .eq('status', 'completed');
        
        totalRevenue = orders?.reduce((sum, order) => sum + order.amount, 0) || 0;
      } catch (error) {
        console.warn(`⚠️ Could not fetch orders for ${profile.user_id}:`, error);
      }
      
      // Determine premium status
      const isPremium = subscription?.subscribed === true;
      const isGifted = isPremium && !subscription?.stripe_subscription_id;

      return {
        ...profile,
        subscription,
        campaignCount,
        totalCreditsUsed,
        totalRevenue,
        lastActivity,
        isPremium,
        isGifted
      };
      
    } catch (error) {
      console.warn(`⚠️ Error enhancing profile for ${profile.user_id}:`, error);
      
      // Return basic profile with default values on error
      return {
        ...profile,
        subscription: null,
        campaignCount: 0,
        totalCreditsUsed: 0,
        totalRevenue: 0,
        lastActivity: null,
        isPremium: false,
        isGifted: false
      };
    }
  }

  /**
   * Get individual user by ID with enhanced error handling
   */
  async getUserById(userId: string): Promise<RealUserDetails | null> {
    try {
      console.log('🔍 Fetching user by ID:', userId);
      
      // Check admin access first
      const isAdmin = await this.checkAdminAccess();
      if (!isAdmin) {
        throw new Error('Admin access required');
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 User not found:', userId);
          return null;
        }
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      if (!profile) {
        return null;
      }

      // Enhance profile with additional data
      const enhancedUser = await this.enhanceUserProfile(profile);
      
      console.log('✅ User fetched and enhanced successfully');
      return enhancedUser;
      
    } catch (error: any) {
      console.error('❌ Error fetching user by ID:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Update user profile with enhanced error handling
   */
  async updateUser(userId: string, updates: UserUpdatePayload): Promise<RealUserDetails> {
    try {
      console.log('✏️ Updating user:', userId, updates);
      
      // Check admin access first
      const isAdmin = await this.checkAdminAccess();
      if (!isAdmin) {
        throw new Error('Admin access required to update users');
      }
      
      // Handle premium/subscription updates first
      if (updates.isPremium !== undefined || updates.isGifted !== undefined) {
        await this.updateUserPremiumStatus(userId, updates);
      }
      
      // Prepare profile updates
      const profileUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.display_name !== undefined) profileUpdates.display_name = updates.display_name;
      if (updates.email !== undefined) profileUpdates.email = updates.email;
      if (updates.role !== undefined) profileUpdates.role = updates.role;
      
      // Update profile if there are changes
      if (Object.keys(profileUpdates).length > 1) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', userId);

        if (profileError) {
          throw new Error(`Profile update failed: ${profileError.message}`);
        }
        
        console.log('✅ Profile updated successfully');
      }
      
      // Return updated user
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }
      
      return updatedUser;
      
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Update user premium/subscription status with enhanced error handling
   */
  private async updateUserPremiumStatus(userId: string, updates: UserUpdatePayload): Promise<void> {
    try {
      console.log('💎 Updating premium status for:', userId);
      
      // Get current subscription
      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('⚠️ Error fetching subscription:', fetchError);
      }

      if (updates.isPremium) {
        // Grant premium access
        const subscriptionData = {
          user_id: userId,
          email: updates.email || '',
          subscribed: true,
          subscription_tier: updates.isGifted ? 'premium_gifted' : 'premium',
          subscription_end: updates.subscriptionEnd || null,
          stripe_subscription_id: updates.isGifted ? null : existingSubscription?.stripe_subscription_id || null,
          payment_method: updates.isGifted ? 'gifted' : existingSubscription?.payment_method || 'stripe',
          guest_checkout: false,
          updated_at: new Date().toISOString()
        };

        if (existingSubscription) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('subscribers')
            .update(subscriptionData)
            .eq('user_id', userId);
          
          if (updateError) {
            throw new Error(`Subscription update failed: ${updateError.message}`);
          }
        } else {
          // Create new subscription
          const { error: insertError } = await supabase
            .from('subscribers')
            .insert({
              ...subscriptionData,
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            throw new Error(`Subscription creation failed: ${insertError.message}`);
          }
        }
        
        console.log('✅ Premium status granted');
        
      } else {
        // Remove premium access
        if (existingSubscription) {
          if (existingSubscription.stripe_subscription_id) {
            console.warn('⚠️ User has paid subscription - consider manual cancellation');
          }
          
          const { error: removeError } = await supabase
            .from('subscribers')
            .update({
              subscribed: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          
          if (removeError) {
            throw new Error(`Premium removal failed: ${removeError.message}`);
          }
          
          console.log('✅ Premium status removed');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error updating premium status:', error);
      throw error;
    }
  }

  /**
   * Soft delete user (deactivate) with enhanced error handling
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deactivating user:', userId);
      
      // Check admin access first
      const isAdmin = await this.checkAdminAccess();
      if (!isAdmin) {
        throw new Error('Admin access required to deactivate users');
      }
      
      // Deactivate profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'user',
          display_name: `[DEACTIVATED] ${Date.now()}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) {
        throw new Error(`Profile deactivation failed: ${profileError.message}`);
      }

      // Cancel subscription
      const { error: subscriptionError } = await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (subscriptionError) {
        console.warn('⚠️ Failed to cancel subscription:', subscriptionError);
        // Don't throw as profile deactivation succeeded
      }

      console.log('✅ User deactivated successfully');
      
    } catch (error: any) {
      console.error('❌ Error deactivating user:', error);
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    premiumUsers: number;
    giftedUsers: number;
    totalRevenue: number;
    recentSignups: number;
  }> {
    try {
      console.log('📊 Fetching user statistics...');
      
      // Check admin access first
      const isAdmin = await this.checkAdminAccess();
      if (!isAdmin) {
        throw new Error('Admin access required to view statistics');
      }
      
      const allUsers = await this.getUsers({ limit: 1000 }); // Get a large batch for stats
      const users = allUsers.users;
      
      const stats = {
        totalUsers: users.length,
        premiumUsers: users.filter(u => u.isPremium && !u.isGifted).length,
        giftedUsers: users.filter(u => u.isGifted).length,
        totalRevenue: users.reduce((sum, u) => sum + u.totalRevenue, 0),
        recentSignups: users.filter(u => {
          const signupDate = new Date(u.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return signupDate > weekAgo;
        }).length
      };
      
      console.log('✅ User statistics calculated:', stats);
      return stats;
      
    } catch (error: any) {
      console.error('❌ Error fetching user stats:', error);
      throw new Error(`Failed to fetch user statistics: ${error.message}`);
    }
  }
}

export const realAdminUserService = new RealAdminUserService();
