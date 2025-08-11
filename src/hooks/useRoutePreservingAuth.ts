import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useRoutePreservingAuth() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'login' | 'signup'>('login');
  const location = useLocation();

  const openLogin = () => {
    setDefaultTab('login');
    setShowLoginModal(true);
  };

  const openSignup = () => {
    setDefaultTab('signup');
    setShowLoginModal(true);
  };

  const closeLogin = () => {
    setShowLoginModal(false);
  };

  const closeRegistration = () => {
    setShowRegistrationModal(false);
  };

  // Handle auth success - stay on current route
  const handleAuthSuccess = (user: any) => {
    console.log('🎯 Route-preserving auth success for user:', user?.email);
    console.log('🎯 Staying on current route:', location.pathname);
    
    setShowLoginModal(false);
    setShowRegistrationModal(false);
    
    // Note: We don't navigate anywhere - we stay on the current page
    // This preserves the user's current workflow
  };

  return {
    // State
    showLoginModal,
    showRegistrationModal,
    defaultTab,
    
    // Actions
    openLogin,
    openSignup,
    closeLogin,
    closeRegistration,
    handleAuthSuccess,
    
    // For compatibility with existing components
    setShowLoginModal,
    setShowRegistrationModal,
    setDefaultTab
  };
}
