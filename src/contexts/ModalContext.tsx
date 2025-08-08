import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 
  | 'login' 
  | 'signup' 
  | 'premium' 
  | 'savePost' 
  | 'pricing' 
  | 'claim'
  | null;

interface ModalState {
  type: ModalType;
  props?: any;
  defaultTab?: 'login' | 'signup';
}

interface ModalContextType {
  currentModal: ModalState;
  openModal: (type: ModalType, props?: any, defaultTab?: 'login' | 'signup') => void;
  closeModal: () => void;
  isModalOpen: (type: ModalType) => boolean;
  hasActiveModal: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [currentModal, setCurrentModal] = useState<ModalState>({ type: null });

  const openModal = (type: ModalType, props?: any, defaultTab?: 'login' | 'signup') => {
    console.log('🎭 Opening modal:', type, 'Previous modal:', currentModal.type);
    
    // Close any existing modal first
    if (currentModal.type) {
      console.log('🎭 Closing previous modal:', currentModal.type);
    }
    
    setCurrentModal({ type, props, defaultTab });
  };

  const closeModal = () => {
    console.log('🎭 Closing modal:', currentModal.type);
    setCurrentModal({ type: null });
  };

  const isModalOpen = (type: ModalType) => {
    return currentModal.type === type;
  };

  const hasActiveModal = currentModal.type !== null;

  const value: ModalContextType = {
    currentModal,
    openModal,
    closeModal,
    isModalOpen,
    hasActiveModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Convenience hooks for specific modals
export function useAuthModal() {
  const { openModal, closeModal, isModalOpen, hasActiveModal } = useModal();
  
  return {
    openLoginModal: (props?: any) => openModal('login', props, 'login'),
    openSignupModal: (props?: any) => openModal('signup', props, 'signup'),
    closeAuthModal: closeModal,
    isLoginOpen: isModalOpen('login'),
    isSignupOpen: isModalOpen('signup'),
    hasActiveModal
  };
}

export function usePremiumModal() {
  const { openModal, closeModal, isModalOpen, hasActiveModal } = useModal();
  
  return {
    openPremiumModal: (props?: any) => openModal('premium', props),
    closePremiumModal: closeModal,
    isPremiumOpen: isModalOpen('premium'),
    hasActiveModal
  };
}

export function useSavePostModal() {
  const { openModal, closeModal, isModalOpen, hasActiveModal } = useModal();
  
  return {
    openSavePostModal: (props?: any) => openModal('savePost', props),
    closeSavePostModal: closeModal,
    isSavePostOpen: isModalOpen('savePost'),
    hasActiveModal
  };
}
