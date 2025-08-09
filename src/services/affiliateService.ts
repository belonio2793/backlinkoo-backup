import { supabase } from '@/integrations/supabase/client';

export interface AffiliateStats {
  totalCredits: number;
  totalReferrals: number;
  totalEarnings: number;
  conversionRate: number;
  thisMonthCredits: number;
  thisMonthReferrals: number;
}

export interface ReferralData {
  id: string;
  email: string;
  joinDate: string;
  totalSpent: number;
  creditsGenerated: number;
  status: 'active' | 'inactive';
  lastActivity: string;
  referrerId: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'referral_signup' | 'referral_purchase' | 'bonus' | 'spent';
  amount: number;
  description: string;
  date: string;
  referralId?: string;
  metadata?: any;
}

class AffiliateService {
  /**
   * Generate referral link for user
   */
  generateReferralLink(userId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${userId}`;
  }

  /**
   * Track new referral signup
   */
  async trackReferralSignup(referrerId: string, newUserId: string, newUserEmail: string): Promise<boolean> {
    try {
      // Create referral record
      const { error: referralError } = await supabase
        .from('user_referrals')
        .insert({
          referrer_id: referrerId,
          referred_user_id: newUserId,
          referred_email: newUserEmail,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (referralError) {
        console.error('Error creating referral record:', referralError.message || referralError.toString() || JSON.stringify(referralError));
        return false;
      }

      // Award signup bonus (2 credits)
      await this.awardCredits(referrerId, 2, 'referral_signup', `New referral signup: ${newUserEmail}`, newUserId);

      return true;
    } catch (error) {
      console.error('Error tracking referral signup:', error.message || error.toString() || JSON.stringify(error));
      return false;
    }
  }

  /**
   * Track referral purchase and award credits
   */
  async trackReferralPurchase(userId: string, amount: number, creditsOrDollars: 'credits' | 'dollars'): Promise<void> {
    try {
      // Find referrer for this user
      const { data: referralData, error: findError } = await supabase
        .from('user_referrals')
        .select('referrer_id, referred_email')
        .eq('referred_user_id', userId)
        .eq('status', 'active')
        .single();

      if (findError || !referralData) {
        // User was not referred by anyone
        return;
      }

      let creditsToAward = 0;
      let description = '';

      if (creditsOrDollars === 'credits') {
        // Every 3 credits purchased = 1 credit for referrer
        creditsToAward = Math.floor(amount / 3);
        description = `Referral purchase: ${referralData.referred_email} bought ${amount} credits`;
      } else {
        // Every $3 spent = 1 credit for referrer
        creditsToAward = Math.floor(amount / 3);
        description = `Referral purchase: ${referralData.referred_email} spent $${amount}`;
      }

      if (creditsToAward > 0) {
        await this.awardCredits(
          referralData.referrer_id,
          creditsToAward,
          'referral_purchase',
          description,
          userId
        );

        // Update referral statistics
        await this.updateReferralStats(referralData.referrer_id, userId, amount);
      }
    } catch (error) {
      console.error('Error tracking referral purchase:', error.message || error.toString() || JSON.stringify(error));
    }
  }

  /**
   * Award credits to user
   */
  private async awardCredits(
    userId: string,
    amount: number,
    type: CreditTransaction['type'],
    description: string,
    referralId?: string
  ): Promise<void> {
    try {
      // Add credit transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type,
          amount,
          description,
          referral_id: referralId,
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Error creating credit transaction:', transactionError.message || transactionError.toString() || JSON.stringify(transactionError));
        return;
      }

      // Update user's total credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits: amount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Error updating user credits:', updateError.message || updateError.toString() || JSON.stringify(updateError));
      }
    } catch (error) {
      console.error('Error awarding credits:', error.message || error.toString() || JSON.stringify(error));
    }
  }

  /**
   * Update referral statistics
   */
  private async updateReferralStats(referrerId: string, referredUserId: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_referrals')
        .update({
          total_spent: amount,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('referrer_id', referrerId)
        .eq('referred_user_id', referredUserId);

      if (error) {
        console.error('Error updating referral stats:', error.message || error.toString() || JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error updating referral stats:', error.message || error.toString() || JSON.stringify(error));
    }
  }

  /**
   * Get affiliate statistics for user
   */
  async getAffiliateStats(userId: string): Promise<AffiliateStats> {
    try {
      // Get total credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      // Get total referrals
      const { data: referralsData } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', userId);

      // Get this month's data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const { data: thisMonthCredits } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', thisMonth.toISOString())
        .in('type', ['referral_signup', 'referral_purchase', 'bonus']);

      const { data: thisMonthReferrals } = await supabase
        .from('user_referrals')
        .select('id')
        .eq('referrer_id', userId)
        .gte('created_at', thisMonth.toISOString());

      const totalCredits = creditsData?.credits || 0;
      const totalReferrals = referralsData?.length || 0;
      const totalEarnings = totalCredits * 3.33; // Estimate $3.33 per credit value
      const conversionRate = totalReferrals > 0 ? (totalReferrals * 0.8) : 0; // Simplified calculation
      const thisMonthCreditsTotal = thisMonthCredits?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const thisMonthReferralsTotal = thisMonthReferrals?.length || 0;

      return {
        totalCredits,
        totalReferrals,
        totalEarnings,
        conversionRate,
        thisMonthCredits: thisMonthCreditsTotal,
        thisMonthReferrals: thisMonthReferralsTotal
      };
    } catch (error) {
      console.error('Error getting affiliate stats:', error.message || error.toString() || JSON.stringify(error));
      return {
        totalCredits: 0,
        totalReferrals: 0,
        totalEarnings: 0,
        conversionRate: 0,
        thisMonthCredits: 0,
        thisMonthReferrals: 0
      };
    }
  }

  /**
   * Get user's referrals
   */
  async getUserReferrals(userId: string): Promise<ReferralData[]> {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          *,
          referred_user:users(email)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user referrals:', error.message || error.toString() || JSON.stringify(error));
        return [];
      }

      return data?.map(referral => ({
        id: referral.id,
        email: referral.referred_email || referral.referred_user?.email || 'Unknown',
        joinDate: referral.created_at,
        totalSpent: referral.total_spent || 0,
        creditsGenerated: Math.floor((referral.total_spent || 0) / 3),
        status: referral.status as 'active' | 'inactive',
        lastActivity: referral.last_activity || referral.created_at,
        referrerId: referral.referrer_id
      })) || [];
    } catch (error) {
      console.error('Error getting user referrals:', error.message || error.toString() || JSON.stringify(error));
      return [];
    }
  }

  /**
   * Get credit transaction history
   */
  async getCreditHistory(userId: string): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error getting credit history:', error.message || error.toString() || JSON.stringify(error));
        return [];
      }

      return data?.map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.created_at,
        referralId: transaction.referral_id,
        metadata: transaction.metadata
      })) || [];
    } catch (error) {
      console.error('Error getting credit history:', error.message || error.toString() || JSON.stringify(error));
      return [];
    }
  }

  /**
   * Check for milestone rewards
   */
  async checkMilestoneRewards(userId: string): Promise<void> {
    try {
      const stats = await this.getAffiliateStats(userId);
      const milestones = [
        { referrals: 5, reward: 10 },
        { referrals: 10, reward: 25 },
        { referrals: 25, reward: 75 },
        { referrals: 50, reward: 200 },
        { referrals: 100, reward: 500 },
        { referrals: 250, reward: 1500 }
      ];

      // Check if user has reached any new milestones
      for (const milestone of milestones) {
        if (stats.totalReferrals >= milestone.referrals) {
          // Check if already awarded
          const { data: existingReward } = await supabase
            .from('credit_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'bonus')
            .ilike('description', `%${milestone.referrals} referrals%`)
            .single();

          if (!existingReward) {
            await this.awardCredits(
              userId,
              milestone.reward,
              'bonus',
              `Milestone bonus: ${milestone.referrals} referrals achieved`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking milestone rewards:', error.message || error.toString() || JSON.stringify(error));
    }
  }

  /**
   * Spend credits (deduct from balance)
   */
  async spendCredits(userId: string, amount: number, description: string): Promise<boolean> {
    try {
      // Check current balance
      const stats = await this.getAffiliateStats(userId);
      if (stats.totalCredits < amount) {
        return false; // Insufficient credits
      }

      // Record spending transaction
      await this.awardCredits(userId, -amount, 'spent', description);

      return true;
    } catch (error) {
      console.error('Error spending credits:', error.message || error.toString() || JSON.stringify(error));
      return false;
    }
  }
}

export const affiliateService = new AffiliateService();
