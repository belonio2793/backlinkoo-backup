import { useState, useEffect } from 'react';
import { supabase, resilientAuthOperations, SupabaseConnectionFixer } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial auth state with enhanced error handling
    const getInitialAuth = async () => {
      try {
        console.log('🔐 Getting initial auth state...');

        // Use resilient auth operations
        const { data: { user: initialUser }, error } = await resilientAuthOperations.getUser();

        if (error) {
          throw error;
        }

        setUser(initialUser);
        setIsAuthenticated(!!initialUser);
        setConnectionError(null);

        if (initialUser) {
          console.log('✅ User authenticated:', initialUser.email);
        } else {
          console.log('👤 No authenticated user');
        }

      } catch (error: any) {
        console.error('❌ Auth state error:', error);

        // Handle network errors gracefully
        if (SupabaseConnectionFixer.isSupabaseNetworkError(error)) {
          console.warn('⚠️ Network error during auth check, working offline mode');
          setConnectionError('Connection issues detected. Some features may be limited.');

          // Don't show toast immediately - wait to see if connection recovers
          setTimeout(() => {
            if (connectionError) {
              toast.warning('Connection issues detected. Retrying...', {
                duration: 3000
              });
            }
          }, 2000);

        } else {
          console.error('Error getting initial auth state:', error);
          setConnectionError('Authentication error occurred.');

          toast.error('Authentication error. Please refresh and try again.', {
            duration: 5000
          });
        }

        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
        setIsLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      setUser(refreshedUser);
      setIsAuthenticated(!!refreshedUser);
      return refreshedUser;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signOut,
    refreshAuth
  };
};
