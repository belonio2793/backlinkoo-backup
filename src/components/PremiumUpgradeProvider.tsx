import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PremiumPlanModal } from '@/components/PremiumPlanModal';

interface PremiumUpgradeContextType {
  openUpgradeModal: (source?: string) => void;
  closeUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
}

const PremiumUpgradeContext = createContext<PremiumUpgradeContextType | undefined>(undefined);

interface PremiumUpgradeProviderProps {
  children: ReactNode;
}

export function PremiumUpgradeProvider({ children }: PremiumUpgradeProviderProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [triggerSource, setTriggerSource] = useState<'navigation' | 'settings' | 'manual' | 'upgrade_button'>('manual');

  const openUpgradeModal = (source: string = 'manual') => {
    setTriggerSource(source as any);
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  const handleModalSuccess = () => {
    closeUpgradeModal();
  };

  return (
    <PremiumUpgradeContext.Provider
      value={{
        openUpgradeModal,
        closeUpgradeModal,
        isUpgradeModalOpen
      }}
    >
      {children}
      
      <PremiumPlanModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        onSuccess={handleModalSuccess}
        triggerSource={triggerSource}
      />
    </PremiumUpgradeContext.Provider>
  );
}

export function usePremiumUpgrade() {
  const context = useContext(PremiumUpgradeContext);
  if (context === undefined) {
    throw new Error('usePremiumUpgrade must be used within a PremiumUpgradeProvider');
  }
  return context;
}

// Quick utility function for programmatic access
export function openPremiumUpgradeModal(source?: string) {
  // This is a global function that can be called from anywhere
  // It dispatches a custom event that the provider can listen to
  window.dispatchEvent(new CustomEvent('openPremiumUpgrade', { 
    detail: { source: source || 'manual' } 
  }));
}

export default PremiumUpgradeProvider;
