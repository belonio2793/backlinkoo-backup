import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface FormData {
  keywords: string;
  anchor_texts: string;
  target_url: string;
}

interface UserFlowContextType {
  // Form state preservation
  savedFormData: FormData | null;
  saveFormData: (data: FormData) => void;
  clearSavedFormData: () => void;
  
  // Authentication flow
  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
  
  // User flow helpers
  showSignInModal: boolean;
  setShowSignInModal: (show: boolean) => void;
  defaultAuthTab: 'login' | 'signup';
  setDefaultAuthTab: (tab: 'login' | 'signup') => void;
  
  // Progress restoration
  restoreFormData: () => FormData | null;
  shouldRestoreProgress: boolean;
}

const UserFlowContext = createContext<UserFlowContextType | undefined>(undefined);

const STORAGE_KEY = 'backlink_user_flow';

interface UserFlowProviderProps {
  children: ReactNode;
}

export const UserFlowProvider: React.FC<UserFlowProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [defaultAuthTab, setDefaultAuthTab] = useState<'login' | 'signup'>('login');
  const [shouldRestoreProgress, setShouldRestoreProgress] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSavedFormData(parsed.formData || null);
        setPendingAction(parsed.pendingAction || null);
        setShouldRestoreProgress(true);
      } catch (error) {
        console.warn('Failed to parse saved user flow data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save form data to both state and localStorage
  const saveFormData = (data: FormData) => {
    setSavedFormData(data);
    
    const saveData = {
      formData: data,
      pendingAction,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  };

  // Clear saved data
  const clearSavedFormData = () => {
    setSavedFormData(null);
    setPendingAction(null);
    setShouldRestoreProgress(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Restore form data and clear it from storage
  const restoreFormData = () => {
    const data = savedFormData;
    if (data) {
      // Don't clear immediately - let the component decide when to clear
      setShouldRestoreProgress(false);
      return data;
    }
    return null;
  };

  // Clear saved data when user successfully authenticates
  useEffect(() => {
    if (isAuthenticated && savedFormData) {
      // Wait a bit to ensure the form has been restored
      const timeout = setTimeout(() => {
        console.log('🎯 UserFlow: User authenticated, clearing saved progress');
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, savedFormData]);

  const value: UserFlowContextType = {
    savedFormData,
    saveFormData,
    clearSavedFormData,
    pendingAction,
    setPendingAction,
    showSignInModal,
    setShowSignInModal,
    defaultAuthTab,
    setDefaultAuthTab,
    restoreFormData,
    shouldRestoreProgress
  };

  return (
    <UserFlowContext.Provider value={value}>
      {children}
    </UserFlowContext.Provider>
  );
};

export const useUserFlow = (): UserFlowContextType => {
  const context = useContext(UserFlowContext);
  if (context === undefined) {
    throw new Error('useUserFlow must be used within a UserFlowProvider');
  }
  return context;
};

// Helper hook for authentication with progress preservation
export const useAuthWithProgress = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    saveFormData, 
    setPendingAction, 
    setShowSignInModal, 
    setDefaultAuthTab,
    restoreFormData,
    shouldRestoreProgress
  } = useUserFlow();

  const requireAuth = (action: string, formData?: FormData, preferSignup = false) => {
    if (!isAuthenticated) {
      console.log('🎯 RequireAuth: Saving progress and showing auth modal', { action, formData });
      
      if (formData) {
        saveFormData(formData);
      }
      
      setPendingAction(action);
      setDefaultAuthTab(preferSignup ? 'signup' : 'login');
      setShowSignInModal(true);
      return false;
    }
    return true;
  };

  return {
    user,
    isAuthenticated,
    requireAuth,
    restoreFormData,
    shouldRestoreProgress
  };
};
