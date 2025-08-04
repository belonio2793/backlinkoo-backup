import React, { createContext, useContext, ReactNode } from 'react';
import { usePremiumPopup } from '@/hooks/usePremiumPopup';
import PremiumPlanPopup from './PremiumPlanPopup';

interface PremiumPopupContextType {
  openPremiumPopup: (email?: string) => void;
  closePremiumPopup: () => void;
  isPremiumPopupOpen: boolean;
  isPremium: boolean;
}

const PremiumPopupContext = createContext<PremiumPopupContextType | undefined>(undefined);

interface PremiumPopupProviderProps {
  children: ReactNode;
  onSuccess?: () => void;
}

export function PremiumPopupProvider({ children, onSuccess }: PremiumPopupProviderProps) {
  const {
    isOpen,
    openPopup,
    closePopup,
    handleSuccess,
    isPremium
  } = usePremiumPopup({
    onSuccess
  });

  const contextValue: PremiumPopupContextType = {
    openPremiumPopup: openPopup,
    closePremiumPopup: closePopup,
    isPremiumPopupOpen: isOpen,
    isPremium
  };

  return (
    <PremiumPopupContext.Provider value={contextValue}>
      {children}
      <PremiumPlanPopup
        isOpen={isOpen}
        onClose={closePopup}
        onSuccess={handleSuccess}
      />
    </PremiumPopupContext.Provider>
  );
}

export function usePremiumPopupContext(): PremiumPopupContextType {
  const context = useContext(PremiumPopupContext);
  if (context === undefined) {
    throw new Error('usePremiumPopupContext must be used within a PremiumPopupProvider');
  }
  return context;
}

// Convenience hook for easy usage
export function useOpenPremiumPopup() {
  const { openPremiumPopup, isPremium } = usePremiumPopupContext();
  
  return {
    openPremiumPopup,
    isPremium,
    // Helper function that checks premium status before opening
    tryOpenPremiumPopup: (email?: string) => {
      if (!isPremium) {
        openPremiumPopup(email);
        return true; // Popup was opened
      }
      return false; // User is already premium, popup not opened
    }
  };
}

export default PremiumPopupProvider;
