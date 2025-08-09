import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  subscription_tier: 'free' | 'monthly' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  credits: number;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  metadata: any;
  raw_user_meta_data: any;
  user_metadata: any;
}

export interface UserFilters {
  search?: string;
  role?: string;
  subscription?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  bannedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  totalRevenue: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
  subscription_tier: string;
  credits: number;
}

export interface UpdateUserData {
  role?: string;
  subscription_tier?: string;
  subscription_status?: string;
  credits?: number;
  banned_until?: string | null;
  metadata?: any;
}

export class UserManagementService {
  /**
   * Get paginated list of users with filters
   */
  async getUsers(filters: UserFilters = {}): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        search = '',
        role = 'all',
        subscription = 'all',
        status = 'all',
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0
      } = filters;

      // Build the query - simplified to only select from profiles table
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          role,
          subscription_tier,
          credits,
          created_at,
          metadata
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      if (role !== 'all') {
        query = query.eq('role', role);
      }

      if (subscription !== 'all') {
        query = query.eq('subscription_tier', subscription);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      // Transform the data
      const users: UserProfile[] = (data || []).map((profile: any) => ({
        id: profile.user_id,
        email: profile.email,
        role: profile.role,
        subscription_tier: profile.subscription_tier,
        subscription_status: 'active', // Default since column doesn't exist
        credits: profile.credits || 0,
        created_at: profile.created_at,
        last_sign_in_at: null, // This would need to be fetched from auth separately if needed
        email_confirmed_at: profile.email_confirmed_at || null,
        banned_until: null, // This would need to be fetched separately from auth if needed
        metadata: profile.metadata || {},
        raw_user_meta_data: {},
        user_metadata: {}
      }));

      const totalPages = Math.ceil((count || 0) / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        users,
        total: count || 0,
        page: currentPage,
        totalPages
      };

    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get premium users
      const { count: premiumUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('subscription_tier', ['monthly', 'premium', 'enterprise']);

      // Get new users today
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get new users this week
      const { count: newUsersThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get new users this month
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Calculate active users (estimate based on recent activity or creation date)
      // Since we don't have direct access to last_sign_in_at, we'll use a different approach
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()); // Use recent signups as proxy for active users

      // Estimate revenue (this could be enhanced with actual subscription data)
      const estimatedRevenue = (premiumUsers || 0) * 29; // $29 per premium user

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        premiumUsers: premiumUsers || 0,
        bannedUsers: 0, // This would need a separate query
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeUsersToday: Math.floor((activeUsers || 0) * 0.1), // Estimate
        totalRevenue: estimatedRevenue
      };

    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<UserProfile> {
    try {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authUser.user.id,
          email: userData.email,
          role: userData.role,
          subscription_tier: userData.subscription_tier,
          credits: userData.credits
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      return {
        id: authUser.user.id,
        email: userData.email,
        role: userData.role as any,
        subscription_tier: userData.subscription_tier as any,
        subscription_status: 'active',
        credits: userData.credits,
        created_at: authUser.user.created_at,
        last_sign_in_at: null,
        email_confirmed_at: authUser.user.email_confirmed_at,
        banned_until: null,
        metadata: {},
        raw_user_meta_data: authUser.user.raw_user_meta_data,
        user_metadata: authUser.user.user_metadata
      };

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: string, updates: UpdateUserData): Promise<void> {
    try {
      // Update profile
      const profileUpdates: any = {};
      if (updates.role !== undefined) profileUpdates.role = updates.role;
      if (updates.subscription_tier !== undefined) profileUpdates.subscription_tier = updates.subscription_tier;
      if (updates.subscription_status !== undefined) profileUpdates.subscription_status = updates.subscription_status;
      if (updates.credits !== undefined) profileUpdates.credits = updates.credits;
      if (updates.metadata !== undefined) profileUpdates.metadata = updates.metadata;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', userId);

        if (profileError) {
          throw new Error(`Failed to update profile: ${profileError.message}`);
        }
      }

      // Update auth user if needed
      const authUpdates: any = {};
      if (updates.banned_until !== undefined) {
        authUpdates.ban_duration = updates.banned_until ? '24h' : 'none';
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          authUpdates
        );

        if (authError) {
          console.warn('Auth update warning:', authError);
        }
      }

    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('Auth deletion warning:', authError);
      }

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Ban/Unban a user
   */
  async toggleUserBan(userId: string, ban: boolean): Promise<void> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        {
          ban_duration: ban ? '24h' : 'none'
        }
      );

      if (error) {
        throw new Error(`Failed to ${ban ? 'ban' : 'unban'} user: ${error.message}`);
      }

    } catch (error) {
      console.error('Error toggling user ban:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) {
        throw new Error(`Failed to reset password: ${error.message}`);
      }

    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw new Error(`Failed to send reset email: ${error.message}`);
      }

    } catch (error) {
      console.error('Error sending reset email:', error);
      throw error;
    }
  }

  /**
   * Export users to CSV format
   */
  async exportUsers(filters: UserFilters = {}): Promise<string> {
    try {
      // Get all users (remove pagination for export)
      const { users } = await this.getUsers({ ...filters, limit: 10000, offset: 0 });

      const headers = [
        'ID',
        'Email',
        'Role',
        'Subscription Tier',
        'Subscription Status',
        'Credits',
        'Created At',
        'Last Sign In',
        'Email Confirmed',
        'Status'
      ];

      const rows = users.map(user => [
        user.id,
        user.email,
        user.role,
        user.subscription_tier,
        user.subscription_status,
        user.credits.toString(),
        user.created_at,
        user.last_sign_in_at || 'Never',
        user.email_confirmed_at ? 'Yes' : 'No',
        user.banned_until ? 'Banned' : 'Active'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;

    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(userIds: string[], updates: UpdateUserData): Promise<void> {
    try {
      const promises = userIds.map(userId => this.updateUser(userId, updates));
      await Promise.all(promises);

    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs (if available)
   */
  async getUserActivityLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      // This would depend on your logging setup
      // For now, return empty array
      return [];

    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
