import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial auth state
    const getInitialAuth = async () => {
      try {
        const { data: { user: initialUser } } = await supabase.auth.getUser();
        setUser(initialUser);
        setIsAuthenticated(!!initialUser);
      } catch (error) {
        console.error('Error getting initial auth state:', error);
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
