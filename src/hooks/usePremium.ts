import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { userService, UserProfile } from '@/services/userService';

export interface PremiumStatus {
  isPremium: boolean;
  isAdmin: boolean;
  userLimits: {
    maxClaimedPosts: number;
    hasUnlimitedClaims: boolean;
    hasAdvancedSEO: boolean;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
    canAccessPremiumContent: boolean;
  };
  userProfile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function usePremium(): PremiumStatus {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLimits, setUserLimits] = useState({
    maxClaimedPosts: 3,
    hasUnlimitedClaims: false,
    hasAdvancedSEO: false,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    canAccessPremiumContent: false
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserStatus = async () => {
    if (!user) {
      console.log('🔄 usePremium: No user, setting defaults');
      setIsPremium(false);
      setIsAdmin(false);
      setUserProfile(null);
      setUserLimits({
        maxClaimedPosts: 3,
        hasUnlimitedClaims: false,
        hasAdvancedSEO: false,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        canAccessPremiumContent: false
      });
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 usePremium: Loading user status for:', user.email);
      setLoading(true);

      // Load user profile and status with individual error handling
      console.log('🔄 usePremium: Getting profile...');
      const profile = await userService.getCurrentUserProfile();
      console.log('✅ usePremium: Profile loaded:', profile);

      console.log('🔄 usePremium: Checking premium status...');
      const premiumStatus = await userService.isPremiumUser();
      console.log('✅ usePremium: Premium status:', premiumStatus);

      console.log('🔄 usePremium: Checking admin status...');
      const adminStatus = await userService.isAdminUser();
      console.log('✅ usePremium: Admin status:', adminStatus);

      console.log('🔄 usePremium: Getting user limits...');
      const limits = await userService.getUserLimits();
      console.log('✅ usePremium: User limits:', limits);

      setUserProfile(profile);
      setIsPremium(premiumStatus);
      setIsAdmin(adminStatus);
      setUserLimits(limits);

      console.log('✅ usePremium: All data loaded successfully');
    } catch (error) {
      console.error('❌ usePremium: Error loading user status:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      // Set safe defaults on error
      setIsPremium(false);
      setIsAdmin(false);
      setUserProfile(null);
      setUserLimits({
        maxClaimedPosts: 3,
        hasUnlimitedClaims: false,
        hasAdvancedSEO: false,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        canAccessPremiumContent: false
      });
    } finally {
      setLoading(false);
      console.log('🏁 usePremium: Loading complete');
    }
  };

  useEffect(() => {
    loadUserStatus();
  }, [user]);

  return {
    isPremium,
    isAdmin,
    userLimits,
    userProfile,
    loading,
    refresh: loadUserStatus
  };
}

// Helper hook for specific permission checks
export function usePermissions() {
  const { userLimits, isPremium, isAdmin, loading } = usePremium();

  return {
    canClaimUnlimited: userLimits.hasUnlimitedClaims,
    canAccessAdvancedSEO: userLimits.hasAdvancedSEO,
    canAccessAdvancedAnalytics: userLimits.hasAdvancedAnalytics,
    canAccessPremiumContent: userLimits.canAccessPremiumContent,
    hasPrioritySupport: userLimits.hasPrioritySupport,
    maxClaimedPosts: userLimits.maxClaimedPosts,
    isPremium,
    isAdmin,
    loading
  };
}
