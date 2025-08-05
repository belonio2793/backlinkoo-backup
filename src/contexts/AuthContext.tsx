import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@supabase/supabase-js';

// Legacy context for backward compatibility - use InstantAuth for new code

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  subscriptionTier: string | null;
  userPlan: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated, isPremium, subscriptionTier } = useAuth();

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isPremium,
    subscriptionTier,
    userPlan: isPremium ? 'Premium Plan' : 'Free Plan'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Export individual hooks for convenience
export const usePremiumStatus = () => {
  const { isPremium, subscriptionTier, userPlan } = useAuthContext();
  return { isPremium, subscriptionTier, userPlan };
};

export const useUserPlan = () => {
  const { userPlan } = useAuthContext();
  return userPlan;
};
