import { supabase } from '@/integrations/supabase/client';

export interface PremiumSubscription {
  id: string;
  user_id: string;
  plan_type: 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  module_id: string;
  completed: boolean;
  completed_at?: string;
  time_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  module_id: string;
  certificate_url: string;
  issued_at: string;
  created_at: string;
}

export class PremiumService {
  /**
   * Check if user has active premium subscription
   */
  static async checkPremiumStatus(userId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking premium status for user:', userId);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('Premium status check timeout');
        controller.abort();
      }, 3000); // 3 second timeout

      // First, check the profiles table for subscription_tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .single();

      // Check if user has premium tier in profile
      const hasPremiumTier = profile?.subscription_tier === 'premium' ||
                            profile?.subscription_tier === 'monthly';

      if (hasPremiumTier) {
        console.log('✅ User has premium tier in profile:', profile.subscription_tier);
        clearTimeout(timeoutId);
        return true;
      }

      // If no premium tier in profile, check premium_subscriptions table
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - check if profile had error too
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('❌ Error checking profile tier:', profileError.message);
          }
          console.log('✅ User is not premium (no active subscription found)');
          return false;
        }
        console.warn('❌ Error checking premium status:', error.message, error.code);
        return false;
      }

      const isPremium = !!data;
      console.log('✅ Premium status check result:', isPremium);

      // If user has active subscription but no premium tier in profile, sync it
      if (isPremium && !hasPremiumTier) {
        console.log('🔧 Syncing premium tier to profile...');
        this.syncPremiumTierToProfile(userId);
      }

      return isPremium;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⏰ Premium status check timed out');
      } else {
        console.error('❌ Premium status check failed:', error);
      }
      return false;
    }
  }

  /**
   * Get user's premium subscription details
   */
  static async getSubscription(userId: string): Promise<PremiumSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('Error fetching subscription:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Subscription fetch failed:', error);
      return null;
    }
  }

  /**
   * Create premium subscription
   */
  static async createSubscription(
    userId: string, 
    periodStart: string, 
    periodEnd: string
  ): Promise<PremiumSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'premium',
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return null;
    }
  }

  /**
   * Cancel premium subscription
   */
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('premium_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId);

      if (error) {
        console.error('Error cancelling subscription:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return false;
    }
  }

  /**
   * Get user's course progress
   */
  static async getUserProgress(userId: string): Promise<{ [key: string]: boolean }> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error fetching user progress:', error.message);
        return {};
      }

      const progress: { [key: string]: boolean } = {};
      data?.forEach(item => {
        progress[item.lesson_id] = item.completed;
      });

      return progress;
    } catch (error) {
      console.error('Progress fetch failed:', error);
      return {};
    }
  }

  /**
   * Update lesson progress
   */
  static async updateLessonProgress(
    userId: string,
    lessonId: string,
    moduleId: string,
    completed: boolean,
    timeSpent?: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          module_id: moduleId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          time_spent: timeSpent,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Progress update failed:', error);
      return false;
    }
  }

  /**
   * Get user's certificates
   */
  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    try {
      const { data, error } = await supabase
        .from('user_certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });

      if (error) {
        console.warn('Error fetching certificates:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Certificates fetch failed:', error);
      return [];
    }
  }

  /**
   * Issue certificate for completed module
   */
  static async issueCertificate(
    userId: string,
    moduleId: string
  ): Promise<Certificate | null> {
    try {
      // Generate certificate URL (in real implementation, this would generate a PDF)
      const certificateUrl = `/api/certificates/${userId}/${moduleId}`;

      const { data, error } = await supabase
        .from('user_certificates')
        .insert({
          user_id: userId,
          module_id: moduleId,
          certificate_url: certificateUrl,
          issued_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error issuing certificate:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Certificate issuance failed:', error);
      return null;
    }
  }

  /**
   * Check if user can access premium features
   */
  static async canAccessPremiumFeatures(userId: string): Promise<boolean> {
    return await this.checkPremiumStatus(userId);
  }

  /**
   * Get subscription analytics
   */
  static async getSubscriptionAnalytics() {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('status, created_at, current_period_end')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching subscription analytics:', error.message);
        return {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          monthlyRevenue: 0,
          churnRate: 0
        };
      }

      const now = new Date().toISOString();
      const activeSubscriptions = data?.filter(sub => 
        sub.status === 'active' && sub.current_period_end > now
      ).length || 0;

      return {
        totalSubscriptions: data?.length || 0,
        activeSubscriptions,
        monthlyRevenue: activeSubscriptions * 29, // $29 per month
        churnRate: 0 // Calculate based on cancellations
      };
    } catch (error) {
      console.error('Analytics fetch failed:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        churnRate: 0
      };
    }
  }
}
