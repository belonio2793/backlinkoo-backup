import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StreamlinedPremiumCheckout } from './StreamlinedPremiumCheckout';

interface StreamlinedPremiumContextType {
  isOpen: boolean;
  openPremiumCheckout: (redirectAfterSuccess?: string) => void;
  closePremiumCheckout: () => void;
}

const StreamlinedPremiumContext = createContext<StreamlinedPremiumContextType | undefined>(undefined);

interface StreamlinedPremiumProviderProps {
  children: ReactNode;
}

export function StreamlinedPremiumProvider({ children }: StreamlinedPremiumProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectAfterSuccess, setRedirectAfterSuccess] = useState('/dashboard');

  const openPremiumCheckout = (redirectUrl = '/dashboard') => {
    setRedirectAfterSuccess(redirectUrl);
    setIsOpen(true);
  };

  const closePremiumCheckout = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    // Additional success handling can be added here
  };

  return (
    <StreamlinedPremiumContext.Provider
      value={{
        isOpen,
        openPremiumCheckout,
        closePremiumCheckout
      }}
    >
      {children}
      <StreamlinedPremiumCheckout
        isOpen={isOpen}
        onClose={closePremiumCheckout}
        onSuccess={handleSuccess}
        redirectAfterSuccess={redirectAfterSuccess}
      />
    </StreamlinedPremiumContext.Provider>
  );
}

export function useStreamlinedPremium() {
  const context = useContext(StreamlinedPremiumContext);
  if (context === undefined) {
    throw new Error('useStreamlinedPremium must be used within a StreamlinedPremiumProvider');
  }
  return context;
}

// Utility hook for premium upgrade triggers
export function usePremiumUpgrade() {
  const { openPremiumCheckout } = useStreamlinedPremium();

  const triggerUpgrade = (context?: string, redirectAfterSuccess?: string) => {
    console.log(`🚀 Triggering premium upgrade from: ${context || 'unknown'}`);
    openPremiumCheckout(redirectAfterSuccess);
  };

  return { triggerUpgrade };
}

export default StreamlinedPremiumProvider;
