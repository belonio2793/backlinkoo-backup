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
  const [isLoading, setIsLoading] = useState(false); // Start with false for instant auth
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  // Optimized function to check premium status - runs async without blocking auth
  const checkPremiumStatusAsync = async (authUser: User) => {
    try {
      console.log('🔍 Async premium check for:', authUser.email);

      // Check profile for subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, role')
        .eq('user_id', authUser.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile query error (non-blocking):', profileError.message);
        return;
      }

      // Check if user has premium tier
      const hasPremiumTier = profile?.subscription_tier === 'premium' ||
                            profile?.subscription_tier === 'monthly';

      if (hasPremiumTier) {
        console.log('✅ Premium status updated:', profile.subscription_tier);
        setIsPremium(true);
        setSubscriptionTier(profile.subscription_tier);
        return;
      }

      // Optional: Check premium_subscriptions table (async, non-blocking)
      try {
        const { data: subsData, error: subError } = await supabase
          .from('premium_subscriptions')
          .select('status, plan_type, current_period_end')
          .eq('user_id', authUser.id)
          .eq('status', 'active')
          .gte('current_period_end', new Date().toISOString());

        if (!subError && subsData && subsData.length > 0) {
          setIsPremium(true);
          setSubscriptionTier(profile?.subscription_tier || 'premium');
        }
      } catch (error: any) {
        console.warn('⚠️ Premium subscription check skipped:', error.message);
      }

    } catch (error: any) {
      console.error('❌ Async premium check failed (non-critical):', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Instant session check - no loading state
    const getInstantSession = async () => {
      try {
        // Use existing session if available, no loading
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error && !NetworkErrorHandler.isThirdPartyInterference(error)) {
          console.warn('Auth error (continuing):', error.message);
        }

        if (isMounted) {
          const user = session?.user || null;
          setUser(user);

          // Start premium check async (non-blocking)
          if (user) {
            checkPremiumStatusAsync(user);
          } else {
            setIsPremium(false);
            setSubscriptionTier(null);
          }
        }
      } catch (error: any) {
        console.warn('Session check failed:', error.message);
        if (isMounted) {
          setUser(null);
          setIsPremium(false);
          setSubscriptionTier(null);
        }
      }
    };

    getInstantSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (isMounted) {
            const user = session?.user || null;
            setUser(user);

            // Start async premium check if user signed in
            if (user && event === 'SIGNED_IN') {
              console.log('🔄 User signed in - async premium check for:', user.email);
              checkPremiumStatusAsync(user);
            } else if (!user) {
              setIsPremium(false);
              setSubscriptionTier(null);
            }
          }
        } catch (error: any) {
          console.warn('Auth state change error:', error.message);
          if (isMounted) {
            setUser(session?.user || null);
            if (!session?.user) {
              setIsPremium(false);
              setSubscriptionTier(null);
            }
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
    isLoading, // Always false now for instant auth
    isAuthenticated: !!user,
    isPremium,
    subscriptionTier
  };
}

// Optimized helper hook for authentication checks
export function useAuthStatus() {
  const { user, isLoading, isAuthenticated, isPremium, subscriptionTier } = useAuth();

  return {
    currentUser: user,
    isCheckingAuth: false, // Never checking for instant experience
    isLoggedIn: isAuthenticated,
    isGuest: !isAuthenticated,
    authChecked: true, // Always checked for instant experience
    isPremium,
    subscriptionTier,
    userPlan: isPremium ? 'Premium Plan' : 'Free Plan'
  };
}

// Hook for instant auth decisions
export function useInstantAuth() {
  const { user, isAuthenticated, isPremium, subscriptionTier } = useAuth();
  
  return {
    user,
    isAuthenticated,
    isGuest: !isAuthenticated,
    isPremium,
    subscriptionTier,
    isAdmin: user?.email === 'support@backlinkoo.com',
    needsSignIn: !isAuthenticated,
    ready: true // Always ready for instant experience
  };
}
