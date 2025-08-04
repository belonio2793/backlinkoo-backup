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
      setLoading(true);
      
      // Load user profile and status
      const [profile, premiumStatus, adminStatus, limits] = await Promise.all([
        userService.getCurrentUserProfile(),
        userService.isPremiumUser(),
        userService.isAdminUser(),
        userService.getUserLimits()
      ]);

      setUserProfile(profile);
      setIsPremium(premiumStatus);
      setIsAdmin(adminStatus);
      setUserLimits(limits);
    } catch (error) {
      console.error('Error loading user status:', error);
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
