import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UsePremiumPopupOptions {
  defaultEmail?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function usePremiumPopup(options: UsePremiumPopupOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isPremium } = useAuth();

  const openPopup = useCallback((email?: string) => {
    // Don't open if user is already premium
    if (isPremium) {
      console.log('User is already premium, not opening popup');
      return;
    }
    
    setIsOpen(true);
  }, [isPremium]);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  const handleSuccess = useCallback(() => {
    setIsOpen(false);
    options.onSuccess?.();
  }, [options]);

  return {
    isOpen,
    openPopup,
    closePopup,
    handleSuccess,
    isPremium
  };
}

export default usePremiumPopup;
