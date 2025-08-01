import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Auth error (continuing without user):', error.message);
        }
        if (isMounted) {
          setUser(user);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.warn('Auth fetch failed (possibly due to network/third-party interference):', error.message);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
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
