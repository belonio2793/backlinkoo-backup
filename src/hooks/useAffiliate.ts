import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { affiliateService, type AffiliateStats, type ReferralData, type CreditTransaction } from '@/services/affiliateService';
import { useToast } from './use-toast';

export const useAffiliate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AffiliateStats>({
    totalCredits: 0,
    totalReferrals: 0,
    totalEarnings: 0,
    conversionRate: 0,
    thisMonthCredits: 0,
    thisMonthReferrals: 0
  });
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);

  // Load affiliate data when user changes
  useEffect(() => {
    if (user?.id) {
      loadAffiliateData();
    }
  }, [user?.id]);

  const loadAffiliateData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [statsData, referralsData, historyData] = await Promise.all([
        affiliateService.getAffiliateStats(user.id),
        affiliateService.getUserReferrals(user.id),
        affiliateService.getCreditHistory(user.id)
      ]);

      setStats(statsData);
      setReferrals(referralsData);
      setCreditHistory(historyData);

      // Check for milestone rewards
      await affiliateService.checkMilestoneRewards(user.id);
    } catch (error) {
      console.error('Error loading affiliate data:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      toast({
        title: "Error Loading Data",
        description: "Failed to load affiliate information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralLink = () => {
    if (!user?.id) return '';
    return affiliateService.generateReferralLink(user.id);
  };

  const trackPurchase = async (amount: number, type: 'credits' | 'dollars' = 'dollars') => {
    if (!user?.id) return;

    try {
      await affiliateService.trackReferralPurchase(user.id, amount, type);
      // Reload data to reflect changes
      await loadAffiliateData();
    } catch (error) {
      console.error('Error tracking purchase:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
    }
  };

  const spendCredits = async (amount: number, description: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await affiliateService.spendCredits(user.id, amount, description);
      if (success) {
        await loadAffiliateData(); // Reload to reflect changes
        toast({
          title: "Credits Spent",
          description: `Successfully spent ${amount} credits: ${description}`,
        });
      } else {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough credits for this action.",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      console.error('Error spending credits:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      toast({
        title: "Error",
        description: "Failed to spend credits. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshData = async () => {
    await loadAffiliateData();
    toast({
      title: "Data Refreshed",
      description: "Affiliate data has been updated.",
    });
  };

  return {
    isLoading,
    stats,
    referrals,
    creditHistory,
    generateReferralLink,
    trackPurchase,
    spendCredits,
    refreshData,
    loadAffiliateData
  };
};

// Hook for handling referral tracking on signup
export const useReferralTracking = () => {
  const trackSignup = async (referrerId: string, newUserId: string, newUserEmail: string) => {
    try {
      const success = await affiliateService.trackReferralSignup(referrerId, newUserId, newUserEmail);
      return success;
    } catch (error) {
      console.error('Error tracking referral signup:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      return false;
    }
  };

  const extractReferralCode = (url?: string): string | null => {
    if (!url) url = window.location.href;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  };

  return {
    trackSignup,
    extractReferralCode
  };
};
