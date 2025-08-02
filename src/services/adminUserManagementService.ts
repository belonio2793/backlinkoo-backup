import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Subscriber = Database['public']['Tables']['subscribers']['Row'];

export interface UserDetails extends Profile {
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

class AdminUserManagementService {
  
  /**
   * Get paginated list of users with filtering and sorting
   */
  async getUsers(filters: UserListFilters = {}): Promise<{
    users: UserDetails[];
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

      console.log('📋 Fetching users with filters:', filters);

      // Build base query for profiles
      let profileQuery = supabase
        .from('profiles')
        .select(`
          *,
          subscribers!left (*)
        `, { count: 'exact' });

      // Apply role filter
      if (role !== 'all') {
        profileQuery = profileQuery.eq('role', role);
      }

      // Apply search filter
      if (search) {
        profileQuery = profileQuery.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      // Apply sorting
      profileQuery = profileQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      profileQuery = profileQuery.range(offset, offset + limit - 1);

      const { data: profiles, error: profilesError, count } = await profileQuery;

      if (profilesError) {
        // Handle mock mode gracefully
        if (profilesError.message?.includes('Database not available') || profilesError.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo user data');
          return this.getMockUserData();
        }
        throw profilesError;
      }

      if (!profiles) {
        return { users: [], totalCount: 0, hasMore: false };
      }

      // Enhance profiles with additional data
      const enhancedUsers: UserDetails[] = await Promise.all(
        profiles.map(async (profile) => {
          try {
            // Get campaign count and credit usage
            const [campaignData, creditData] = await Promise.all([
              this.getUserCampaignStats(profile.user_id),
              this.getUserCreditStats(profile.user_id)
            ]);

            // Determine premium status
            const subscription = (profile as any).subscribers?.[0] || null;
            const isPremium = subscription?.subscribed === true;
            
            // Check for gifted status (premium without paid subscription)
            const isGifted = isPremium && !subscription?.stripe_subscription_id;

            return {
              ...profile,
              subscription,
              campaignCount: campaignData.campaignCount,
              totalCreditsUsed: creditData.totalCreditsUsed,
              totalRevenue: creditData.totalRevenue,
              lastActivity: campaignData.lastActivity,
              isPremium,
              isGifted
            };
          } catch (error) {
            console.warn(`Error enhancing user ${profile.user_id}:`, error);
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
        })
      );

      // Apply premium status filter after enhancement
      let filteredUsers = enhancedUsers;
      if (premiumStatus !== 'all') {
        filteredUsers = enhancedUsers.filter(user => {
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

      return {
        users: filteredUsers,
        totalCount: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };

    } catch (error: any) {
      console.error('Error fetching users:', this.formatError(error));
      throw new Error(`Failed to fetch users: ${this.formatError(error)}`);
    }
  }

  /**
   * Get individual user details by ID
   */
  async getUserById(userId: string): Promise<UserDetails | null> {
    try {
      console.log('🔍 Fetching user details for:', userId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscribers!left (*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.message?.includes('Database not available') || error.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo user');
          return this.getMockUserData().users[0] || null;
        }
        throw error;
      }

      if (!profile) return null;

      // Get additional stats
      const [campaignData, creditData] = await Promise.all([
        this.getUserCampaignStats(userId),
        this.getUserCreditStats(userId)
      ]);

      const subscription = (profile as any).subscribers?.[0] || null;
      const isPremium = subscription?.subscribed === true;
      const isGifted = isPremium && !subscription?.stripe_subscription_id;

      return {
        ...profile,
        subscription,
        campaignCount: campaignData.campaignCount,
        totalCreditsUsed: creditData.totalCreditsUsed,
        totalRevenue: creditData.totalRevenue,
        lastActivity: campaignData.lastActivity,
        isPremium,
        isGifted
      };

    } catch (error: any) {
      console.error('Error fetching user by ID:', this.formatError(error));
      throw new Error(`Failed to fetch user: ${this.formatError(error)}`);
    }
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, updates: UserUpdatePayload): Promise<UserDetails> {
    try {
      console.log('✏️ Updating user:', userId, updates);

      // Handle premium/gifted status changes
      if (updates.isPremium !== undefined || updates.isGifted !== undefined) {
        await this.updateUserPremiumStatus(userId, updates);
      }

      // Update profile information
      const profileUpdates: any = {};
      if (updates.display_name !== undefined) profileUpdates.display_name = updates.display_name;
      if (updates.email !== undefined) profileUpdates.email = updates.email;
      if (updates.role !== undefined) profileUpdates.role = updates.role;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', userId);

        if (profileError) {
          if (profileError.message?.includes('Database not available') || profileError.message?.includes('Mock mode')) {
            console.warn('Mock database mode - simulating user update');
            return this.getMockUserData().users[0];
          }
          throw profileError;
        }
      }

      // Return updated user
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;

    } catch (error: any) {
      console.error('Error updating user:', this.formatError(error));
      throw new Error(`Failed to update user: ${this.formatError(error)}`);
    }
  }

  /**
   * Update user premium status with gifted fallback
   */
  private async updateUserPremiumStatus(userId: string, updates: UserUpdatePayload): Promise<void> {
    try {
      // Check if user has existing subscription
      const { data: existingSubscription } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (updates.isPremium) {
        if (updates.isGifted || !existingSubscription?.stripe_subscription_id) {
          // Create or update as gifted premium
          const subscriptionData = {
            user_id: userId,
            email: updates.email || '',
            subscribed: true,
            subscription_tier: updates.subscriptionTier || 'premium_gifted',
            subscription_end: updates.subscriptionEnd || null,
            stripe_subscription_id: null, // No Stripe ID for gifted
            payment_method: 'gifted',
            guest_checkout: false
          };

          if (existingSubscription) {
            await supabase
              .from('subscribers')
              .update(subscriptionData)
              .eq('user_id', userId);
          } else {
            await supabase
              .from('subscribers')
              .insert(subscriptionData);
          }
        }
      } else {
        // Remove premium status
        if (existingSubscription) {
          if (existingSubscription.stripe_subscription_id) {
            // Has paid subscription - don't automatically cancel
            console.warn('User has paid subscription - manual cancellation required');
          } else {
            // Gifted subscription - can be removed
            await supabase
              .from('subscribers')
              .update({ subscribed: false })
              .eq('user_id', userId);
          }
        }
      }
    } catch (error) {
      console.error('Error updating premium status:', error);
      // Don't throw - allow profile updates to continue
    }
  }

  /**
   * Get user campaign statistics
   */
  private async getUserCampaignStats(userId: string): Promise<{
    campaignCount: number;
    lastActivity: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        campaignCount: data?.length || 0,
        lastActivity: data?.[0]?.created_at || null
      };
    } catch (error) {
      return { campaignCount: 0, lastActivity: null };
    }
  }

  /**
   * Get user credit statistics
   */
  private async getUserCreditStats(userId: string): Promise<{
    totalCreditsUsed: number;
    totalRevenue: number;
  }> {
    try {
      const [creditResult, orderResult] = await Promise.all([
        supabase
          .from('credits')
          .select('total_used')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('orders')
          .select('amount')
          .eq('user_id', userId)
          .eq('status', 'completed')
      ]);

      const totalCreditsUsed = creditResult.data?.total_used || 0;
      const totalRevenue = orderResult.data?.reduce((sum, order) => sum + order.amount, 0) || 0;

      return { totalCreditsUsed, totalRevenue };
    } catch (error) {
      return { totalCreditsUsed: 0, totalRevenue: 0 };
    }
  }

  /**
   * Delete user (soft delete - deactivate)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deactivating user:', userId);

      // Instead of hard delete, deactivate the user
      await supabase
        .from('profiles')
        .update({ 
          role: 'user',
          display_name: '[DEACTIVATED] ' + Date.now()
        })
        .eq('user_id', userId);

      // Cancel any active subscriptions
      await supabase
        .from('subscribers')
        .update({ subscribed: false })
        .eq('user_id', userId);

    } catch (error: any) {
      console.error('Error deactivating user:', this.formatError(error));
      throw new Error(`Failed to deactivate user: ${this.formatError(error)}`);
    }
  }

  /**
   * Get mock data for demonstration when database is unavailable
   */
  private getMockUserData(): {
    users: UserDetails[];
    totalCount: number;
    hasMore: boolean;
  } {
    const mockUsers: UserDetails[] = [
      {
        id: 'mock-1',
        user_id: 'mock-user-1',
        email: 'john.doe@example.com',
        display_name: 'John Doe',
        role: 'user',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        subscription: {
          id: 'sub-1',
          user_id: 'mock-user-1',
          email: 'john.doe@example.com',
          subscribed: true,
          subscription_tier: 'premium',
          payment_method: 'stripe',
          stripe_subscription_id: 'sub_123',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          guest_checkout: false,
          stripe_customer_id: 'cus_123',
          subscription_end: null
        },
        campaignCount: 5,
        totalCreditsUsed: 150,
        totalRevenue: 299.99,
        lastActivity: '2024-01-20T15:30:00Z',
        isPremium: true,
        isGifted: false
      },
      {
        id: 'mock-2',
        user_id: 'mock-user-2',
        email: 'jane.smith@example.com',
        display_name: 'Jane Smith',
        role: 'user',
        created_at: '2024-01-18T14:30:00Z',
        updated_at: '2024-01-18T14:30:00Z',
        subscription: {
          id: 'sub-2',
          user_id: 'mock-user-2',
          email: 'jane.smith@example.com',
          subscribed: true,
          subscription_tier: 'premium_gifted',
          payment_method: 'gifted',
          stripe_subscription_id: null,
          created_at: '2024-01-18T14:30:00Z',
          updated_at: '2024-01-18T14:30:00Z',
          guest_checkout: false,
          stripe_customer_id: null,
          subscription_end: null
        },
        campaignCount: 2,
        totalCreditsUsed: 50,
        totalRevenue: 0,
        lastActivity: '2024-01-19T09:15:00Z',
        isPremium: true,
        isGifted: true
      },
      {
        id: 'mock-3',
        user_id: 'mock-user-3',
        email: 'bob.wilson@example.com',
        display_name: 'Bob Wilson',
        role: 'admin',
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-10T08:00:00Z',
        subscription: null,
        campaignCount: 0,
        totalCreditsUsed: 0,
        totalRevenue: 0,
        lastActivity: null,
        isPremium: false,
        isGifted: false
      }
    ];

    return {
      users: mockUsers,
      totalCount: mockUsers.length,
      hasMore: false
    };
  }

  /**
   * Format error object for better logging
   */
  private formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error) {
      return this.formatError(error.error);
    }

    if (error?.details) {
      return error.details;
    }

    // Try to extract meaningful information from the error object
    try {
      return JSON.stringify(error, null, 2);
    } catch (jsonError) {
      return 'Unknown error occurred';
    }
  }
}

export const adminUserManagementService = new AdminUserManagementService();
