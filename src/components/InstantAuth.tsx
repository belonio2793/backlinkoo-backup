import React, { createContext, useContext, ReactNode } from 'react';
import { useInstantAuth } from '@/hooks/useAuth';
import type { User } from '@supabase/supabase-js';

interface InstantAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isPremium: boolean;
  subscriptionTier: string | null;
  userPlan: string;
  isAdmin: boolean;
  needsSignIn: boolean;
  ready: boolean;
}

const InstantAuthContext = createContext<InstantAuthContextType | undefined>(undefined);

interface InstantAuthProviderProps {
  children: ReactNode;
}

export const InstantAuthProvider: React.FC<InstantAuthProviderProps> = ({ children }) => {
  const auth = useInstantAuth();

  const value: InstantAuthContextType = {
    ...auth,
    userPlan: auth.isPremium ? 'Premium Plan' : 'Free Plan'
  };

  return (
    <InstantAuthContext.Provider value={value}>
      {children}
    </InstantAuthContext.Provider>
  );
};

export const useInstantAuthContext = (): InstantAuthContextType => {
  const context = useContext(InstantAuthContext);
  if (context === undefined) {
    throw new Error('useInstantAuthContext must be used within an InstantAuthProvider');
  }
  return context;
};

// Export convenience hooks
export const useInstantPremiumStatus = () => {
  const { isPremium, subscriptionTier, userPlan } = useInstantAuthContext();
  return { isPremium, subscriptionTier, userPlan };
};

export const useInstantUserPlan = () => {
  const { userPlan } = useInstantAuthContext();
  return userPlan;
};

export const useInstantAdminStatus = () => {
  const { isAdmin, user } = useInstantAuthContext();
  return { isAdmin, user };
};

// Higher-order component for instant auth checking
export const withInstantAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requireAuth = false,
  requireAdmin = false
) => {
  return (props: P) => {
    const { isAuthenticated, isAdmin, needsSignIn } = useInstantAuthContext();

    if (requireAuth && needsSignIn) {
      return null; // Will be handled by route guards
    }

    if (requireAdmin && !isAdmin) {
      return null; // Will be handled by admin guards
    }

    return <Component {...props} />;
  };
};

// Instant auth guard component
interface InstantAuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export const InstantAuthGuard: React.FC<InstantAuthGuardProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  fallback = null
}) => {
  const { isAuthenticated, isAdmin, ready } = useInstantAuthContext();

  if (!ready) {
    return null; // Prevent flash while checking auth
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
