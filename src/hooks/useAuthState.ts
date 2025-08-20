import { useState, useEffect } from 'react';
import { supabase, SupabaseConnectionFixer } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { SafeAuth } from '@/utils/safeAuth';

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

        // Use SafeAuth to handle auth session missing errors gracefully
        const result = await SafeAuth.getCurrentUser();

        if (result.errorType === 'no_session') {
          // This is normal - user is not signed in
          console.log('👤 No authenticated user (no session)');
          setUser(null);
          setIsAuthenticated(false);
          setConnectionError(null);
          return;
        }

        if (result.errorType === 'network_error') {
          console.warn('⚠️ Network error during auth check, working offline mode');
          setConnectionError('Connection issues detected. Some features may be limited.');
          setUser(null);
          setIsAuthenticated(false);

          // Don't show toast immediately - wait to see if connection recovers
          setTimeout(() => {
            if (connectionError) {
              toast.warning('Connection issues detected. Retrying...', {
                duration: 3000
              });
            }
          }, 2000);
          return;
        }

        if (result.errorType === 'invalid_token') {
          console.warn('⚠️ Invalid token - clearing session');
          setUser(null);
          setIsAuthenticated(false);
          setConnectionError(null);
          // Clear invalid token
          localStorage.removeItem('supabase.auth.token');
          return;
        }

        if (result.error && result.errorType !== 'no_session') {
          console.error('❌ Auth error:', result.error);
          setConnectionError('Authentication error occurred.');
          setUser(null);
          setIsAuthenticated(false);

          toast.error('Authentication error. Please refresh and try again.', {
            duration: 5000
          });
          return;
        }

        // Successful auth check
        setUser(result.user);
        setIsAuthenticated(!!result.user);
        setConnectionError(null);

        if (result.user) {
          console.log('✅ User authenticated:', result.user.email);
        } else {
          console.log('👤 No authenticated user');
        }

      } catch (error: any) {
        // This shouldn't happen with SafeAuth, but just in case
        console.error('❌ Unexpected auth state error:', error);
        setUser(null);
        setIsAuthenticated(false);
        setConnectionError('Authentication check failed.');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialAuth();

    // Listen for auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('🔄 Auth state changed:', event, session?.user?.email);

          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);
          setIsLoading(false);
          setConnectionError(null); // Clear connection error on successful auth change

          // Handle specific auth events
          if (event === 'SIGNED_IN') {
            console.log('✅ User signed in successfully');
            toast.success('Successfully signed in!', { duration: 2000 });
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            // Clear any stored tokens
            localStorage.removeItem('supabase.auth.token');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Auth token refreshed');
          } else if (event === 'PASSWORD_RECOVERY') {
            console.log('🔑 Password recovery initiated');
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [connectionError]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('🚪 Signing out user...');

      const { error } = await resilientAuthOperations.signOut();

      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }

      // Clear local state immediately
      setUser(null);
      setIsAuthenticated(false);
      setConnectionError(null);

      console.log('✅ Sign out successful');

    } catch (error: any) {
      console.error('❌ Error during sign out:', error);

      // If it's a network error, still clear local state
      if (SupabaseConnectionFixer.isSupabaseNetworkError(error)) {
        console.warn('⚠️ Network error during sign out, clearing local session');
        localStorage.removeItem('supabase.auth.token');
        setUser(null);
        setIsAuthenticated(false);
        setConnectionError(null);
        toast.warning('Signed out locally due to connection issues', { duration: 3000 });
      } else {
        toast.error('Sign out failed. Please try again.', { duration: 3000 });
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing auth state...');

      const { data: { user: refreshedUser }, error } = await resilientAuthOperations.getUser();

      if (error) {
        throw error;
      }

      setUser(refreshedUser);
      setIsAuthenticated(!!refreshedUser);
      setConnectionError(null);

      console.log('✅ Auth refresh successful');
      return refreshedUser;

    } catch (error: any) {
      console.error('❌ Error refreshing auth:', error);

      if (SupabaseConnectionFixer.isSupabaseNetworkError(error)) {
        setConnectionError('Unable to verify authentication due to connection issues');
        console.warn('⚠️ Auth refresh failed due to network issues');
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setConnectionError('Authentication verification failed');
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection and attempt recovery
  const testConnection = async () => {
    try {
      const connectivity = await SupabaseConnectionFixer.testConnectivity();

      if (connectivity.internet && connectivity.supabase) {
        setConnectionError(null);
        toast.success('Connection restored!', { duration: 2000 });

        // Refresh auth state
        await refreshAuth();

        return true;
      } else {
        setConnectionError('Connection issues detected');
        return false;
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setConnectionError('Unable to test connection');
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    connectionError,
    signOut,
    refreshAuth,
    testConnection
  };
};
