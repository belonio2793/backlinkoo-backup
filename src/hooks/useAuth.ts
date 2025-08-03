import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  subscriptionTier: string | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  // Function to check premium status during authentication
  const checkPremiumStatus = async (authUser: User) => {
    try {
      console.log('🔍 Checking premium status during auth for:', authUser.email);

      // Check profile for subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, role')
        .eq('user_id', authUser.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile query error during auth:', profileError.message);
        return { isPremium: false, subscriptionTier: null };
      }

      // Check if user has premium tier
      const hasPremiumTier = profile?.subscription_tier === 'premium' ||
                            profile?.subscription_tier === 'monthly';

      if (hasPremiumTier) {
        console.log('✅ User has premium tier in profile:', profile.subscription_tier);
        return { isPremium: true, subscriptionTier: profile.subscription_tier };
      }

      // Also check premium_subscriptions table for active subscriptions
      const { data: premiumSubs, error: subError } = await supabase
        .from('premium_subscriptions')
        .select('status, plan_type, current_period_end')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString());

      if (subError) {
        console.warn('⚠️ Premium subscription query error:', subError.message);
        return { isPremium: hasPremiumTier, subscriptionTier: profile?.subscription_tier || null };
      }

      const hasActiveSubscription = premiumSubs && premiumSubs.length > 0;

      console.log('📊 Premium status result:', {
        profileTier: profile?.subscription_tier,
        hasActiveSubscription,
        isPremium: hasPremiumTier || hasActiveSubscription
      });

      return {
        isPremium: hasPremiumTier || hasActiveSubscription,
        subscriptionTier: profile?.subscription_tier || (hasActiveSubscription ? 'premium' : null)
      };

    } catch (error: any) {
      console.error('❌ Error checking premium status during auth:', error);
      return { isPremium: false, subscriptionTier: null };
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session with robust error handling
    const getInitialSession = async () => {
      const { data: user, error } = await NetworkErrorHandler.wrapSupabaseOperation(
        () => supabase.auth.getUser(),
        null
      );

      if (error && !NetworkErrorHandler.isThirdPartyInterference(error)) {
        console.warn('Auth error (continuing without user):', error.message);
      }

      if (isMounted) {
        setUser(user);

        // Check premium status if user is authenticated
        if (user) {
          checkPremiumStatus(user).then(({ isPremium, subscriptionTier }) => {
            if (isMounted) {
              setIsPremium(isPremium);
              setSubscriptionTier(subscriptionTier);
            }
          });
        } else {
          setIsPremium(false);
          setSubscriptionTier(null);
        }

        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        try {
          if (isMounted) {
            setUser(session?.user || null);
            setIsLoading(false);
          }
        } catch (error: any) {
          console.warn('Auth state change error:', error.message);
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  };
}

// Helper hook for authentication checks with better naming
export function useAuthStatus() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    currentUser: user,
    isCheckingAuth: isLoading,
    isLoggedIn: isAuthenticated,
    isGuest: !isAuthenticated && !isLoading,
    authChecked: !isLoading
  };
}
