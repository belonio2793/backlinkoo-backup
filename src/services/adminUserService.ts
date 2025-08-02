import { supabase } from '@/integrations/supabase/client';

// Admin service for user management that handles RLS limitations
export class AdminUserService {
  
  /**
   * Get all users with their premium status (admin function)
   * Uses RPC function to bypass RLS if needed
   */
  static async getAllUsersWithPremiumStatus() {
    try {
      // First try to get users from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Failed to fetch users: ${authError.message}`);
      }

      // Try to get premium subscriptions with current user context
      const { data: subscriptions, error: subError } = await supabase
        .from('premium_subscriptions')
        .select('*');

      // If RLS blocks this, we'll work around it
      let premiumData: any[] = [];
      if (!subError && subscriptions) {
        premiumData = subscriptions;
      } else {
        console.warn('Could not fetch premium subscriptions directly, RLS may be blocking:', subError);
        
        // Try using RPC function if available
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('admin_get_all_premium_subscriptions');
        
        if (!rpcError && rpcData) {
          premiumData = rpcData;
        }
      }

      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) {
        console.warn('Could not fetch profiles:', profileError);
      }

      // Combine all data
      const enrichedUsers = authUsers.users.map(user => {
        const profile = profiles?.find(p => p.user_id === user.id);
        const subscription = premiumData?.find(s => 
          s.user_id === user.id && 
          s.status === 'active' && 
          new Date(s.current_period_end) > new Date()
        );

        return {
          ...user,
          profile: profile || null,
          subscription: subscription || null,
          isPremium: !!subscription
        };
      });

      return enrichedUsers;
    } catch (error: any) {
      console.error('AdminUserService.getAllUsersWithPremiumStatus error:', error);
      throw error;
    }
  }

  /**
   * Grant premium access to a user
   */
  static async grantPremiumAccess(userId: string, planType: string = 'premium') {
    try {
      const currentDate = new Date();
      const periodEnd = new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year

      const subscriptionData = {
        user_id: userId,
        plan_type: planType,
        status: 'active' as const,
        current_period_start: currentDate.toISOString(),
        current_period_end: periodEnd.toISOString()
      };

      // Try direct insert first
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        // If RLS blocks this, try using RPC function
        console.warn('Direct premium grant failed, trying RPC:', error);
        
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('admin_grant_premium_access', {
            target_user_id: userId,
            plan_type: planType
          });

        if (rpcError) {
          throw new Error(`Failed to grant premium access: ${rpcError.message}`);
        }

        return rpcData;
      }

      return data;
    } catch (error: any) {
      console.error('AdminUserService.grantPremiumAccess error:', error);
      throw error;
    }
  }

  /**
   * Revoke premium access from a user
   */
  static async revokePremiumAccess(userId: string) {
    try {
      // Try direct delete first
      const { error } = await supabase
        .from('premium_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        // If RLS blocks this, try using RPC function
        console.warn('Direct premium revoke failed, trying RPC:', error);
        
        const { error: rpcError } = await supabase
          .rpc('admin_revoke_premium_access', {
            target_user_id: userId
          });

        if (rpcError) {
          throw new Error(`Failed to revoke premium access: ${rpcError.message}`);
        }
      }

      return true;
    } catch (error: any) {
      console.error('AdminUserService.revokePremiumAccess error:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          role: role,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user role: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('AdminUserService.updateUserRole error:', error);
      throw error;
    }
  }

  /**
   * Get premium subscription analytics
   */
  static async getPremiumAnalytics() {
    try {
      // Try to get analytics data
      const { data, error } = await supabase
        .rpc('get_premium_analytics');

      if (error) {
        console.warn('Could not fetch premium analytics:', error);
        return {
          totalPremiumUsers: 0,
          monthlyRevenue: 0,
          churnRate: 0,
          averageSubscriptionLength: 0
        };
      }

      return data;
    } catch (error: any) {
      console.error('AdminUserService.getPremiumAnalytics error:', error);
      return {
        totalPremiumUsers: 0,
        monthlyRevenue: 0,
        churnRate: 0,
        averageSubscriptionLength: 0
      };
    }
  }

  /**
   * Check if current user has admin privileges
   */
  static async checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      // Check if user has admin role in metadata
      if (user.user_metadata?.role === 'admin') {
        return true;
      }

      // Check profile table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.warn('Could not check admin access:', error);
        return false;
      }

      return profile?.role === 'admin';
    } catch (error) {
      console.error('AdminUserService.checkAdminAccess error:', error);
      return false;
    }
  }
}
