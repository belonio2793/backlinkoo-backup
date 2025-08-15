import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { useCampaignFormPersistence } from '@/hooks/useCampaignFormPersistence';
import { useToast } from '@/hooks/use-toast';

interface CampaignFormData {
  targetUrl: string;
  keyword: string;
  anchorText: string;
}

interface SmartCampaignFlowState {
  isProcessing: boolean;
  shouldShowAuth: boolean;
  lastInteraction: Date | null;
  userIntent: 'create_campaign' | 'continue_campaign' | 'explore' | null;
  formValidationState: {
    isValid: boolean;
    missingFields: string[];
    hasUnsavedChanges: boolean;
  };
}

export const useSmartCampaignFlow = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthState();
  const { savedFormData, saveFormData, clearFormData, hasValidSavedData } = useCampaignFormPersistence();
  const { toast } = useToast();

  const [flowState, setFlowState] = useState<SmartCampaignFlowState>({
    isProcessing: false,
    shouldShowAuth: false,
    lastInteraction: null,
    userIntent: null,
    formValidationState: {
      isValid: false,
      missingFields: [],
      hasUnsavedChanges: false
    }
  });

  // Auto-save form data when user types (debounced)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const analyzeFormData = useCallback((formData: CampaignFormData) => {
    const missingFields: string[] = [];
    
    if (!formData.targetUrl?.trim()) missingFields.push('Target URL');
    if (!formData.keyword?.trim()) missingFields.push('Keyword');
    if (!formData.anchorText?.trim()) missingFields.push('Anchor Text');

    // Validate URL format
    let isValidUrl = true;
    if (formData.targetUrl?.trim()) {
      try {
        new URL(formData.targetUrl);
      } catch {
        isValidUrl = false;
        missingFields.push('Valid Target URL');
      }
    }

    return {
      isValid: missingFields.length === 0 && isValidUrl,
      missingFields,
      hasUnsavedChanges: hasValidSavedData(savedFormData) && 
        JSON.stringify(formData) !== JSON.stringify(savedFormData)
    };
  }, [savedFormData, hasValidSavedData]);

  const determineUserIntent = useCallback((formData: CampaignFormData) => {
    // If user has saved data and current form matches, they want to continue
    if (hasValidSavedData(savedFormData) && 
        JSON.stringify(formData) === JSON.stringify(savedFormData)) {
      return 'continue_campaign';
    }
    
    // If form is complete and valid, they want to create a campaign
    if (analyzeFormData(formData).isValid) {
      return 'create_campaign';
    }
    
    // If form is partially filled, they're still exploring
    if (formData.targetUrl || formData.keyword || formData.anchorText) {
      return 'explore';
    }
    
    return null;
  }, [savedFormData, hasValidSavedData, analyzeFormData]);

  const debouncedSaveFormData = useCallback((formData: CampaignFormData) => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      if (formData.targetUrl || formData.keyword || formData.anchorText) {
        saveFormData(formData);
        console.log('🔄 Auto-saved form data');
      }
    }, 2000); // Save after 2 seconds of inactivity

    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, saveFormData]);

  const updateFlowState = useCallback((formData: CampaignFormData) => {
    const validationState = analyzeFormData(formData);
    const userIntent = determineUserIntent(formData);

    setFlowState(prev => ({
      ...prev,
      lastInteraction: new Date(),
      userIntent,
      formValidationState: validationState
    }));

    // Auto-save if there are changes
    if (validationState.hasUnsavedChanges || 
        (formData.targetUrl || formData.keyword || formData.anchorText)) {
      debouncedSaveFormData(formData);
    }
  }, [analyzeFormData, determineUserIntent, debouncedSaveFormData]);

  const getButtonState = useCallback((formData: CampaignFormData) => {
    const intent = determineUserIntent(formData);
    const validation = analyzeFormData(formData);

    if (authLoading) {
      return {
        text: 'Loading...',
        disabled: true,
        variant: 'secondary' as const,
        icon: 'loader' as const,
        description: 'Checking authentication status'
      };
    }

    if (flowState.isProcessing) {
      return {
        text: 'Creating Campaign...',
        disabled: true,
        variant: 'default' as const,
        icon: 'loader' as const,
        description: 'Your campaign is being set up'
      };
    }

    if (!validation.isValid) {
      const nextField = validation.missingFields[0];
      return {
        text: `Enter ${nextField || 'Required Information'}`,
        disabled: true,
        variant: 'secondary' as const,
        icon: 'target' as const,
        description: `Please fill in: ${validation.missingFields.join(', ')}`
      };
    }

    if (isAuthenticated) {
      return {
        text: intent === 'continue_campaign' ? 'Continue Saved Campaign' : 'Start Link Building Campaign',
        disabled: false,
        variant: 'default' as const,
        icon: 'target' as const,
        description: 'Ready to create your campaign'
      };
    }

    return {
      text: intent === 'continue_campaign' ? 'Sign In to Continue' : 'Continue with Campaign',
      disabled: false,
      variant: 'default' as const,
      icon: 'target' as const,
      description: 'Sign in or create account to start your campaign'
    };
  }, [isAuthenticated, authLoading, flowState.isProcessing, determineUserIntent, analyzeFormData]);

  const getContextualMessages = useCallback((formData: CampaignFormData) => {
    const messages: Array<{type: 'info' | 'success' | 'warning', message: string}> = [];
    const intent = determineUserIntent(formData);

    // Show restoration message
    if (hasValidSavedData(savedFormData) && intent === 'continue_campaign') {
      messages.push({
        type: 'info',
        message: `Your campaign for "${savedFormData.keyword}" is ready to continue.`
      });
    }

    // Show validation guidance
    if (!isAuthenticated && analyzeFormData(formData).isValid) {
      messages.push({
        type: 'info',
        message: 'Your form data will be saved automatically. Sign in to start your campaign.'
      });
    }

    // Show progress updates
    if (flowState.formValidationState.hasUnsavedChanges) {
      messages.push({
        type: 'success',
        message: 'Changes saved automatically.'
      });
    }

    return messages;
  }, [savedFormData, hasValidSavedData, isAuthenticated, analyzeFormData, determineUserIntent, flowState.formValidationState.hasUnsavedChanges]);

  const handleCampaignAction = useCallback(async (
    formData: CampaignFormData,
    onCreateCampaign: () => Promise<void>,
    onShowAuth: () => void
  ) => {
    setFlowState(prev => ({ ...prev, isProcessing: true }));

    try {
      const validation = analyzeFormData(formData);
      
      if (!validation.isValid) {
        toast({
          title: "Form Incomplete",
          description: `Please fill in: ${validation.missingFields.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // Save form data before proceeding
      saveFormData(formData);

      if (!isAuthenticated) {
        // Show auth modal with saved data context
        onShowAuth();
        toast({
          title: "Authentication Required",
          description: "Your form data has been saved. Sign in to continue with your campaign.",
        });
        return;
      }

      // User is authenticated, create campaign
      await onCreateCampaign();
      
      toast({
        title: "Campaign Started!",
        description: "Your link building campaign is now being processed.",
      });

    } catch (error) {
      console.error('Campaign action error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setFlowState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, analyzeFormData, saveFormData, toast]);

  const handleSuccessfulAuth = useCallback(async (onCreateCampaign: () => Promise<void>) => {
    setFlowState(prev => ({ ...prev, shouldShowAuth: false }));
    
    // After successful auth, automatically create campaign if we have saved data
    if (hasValidSavedData(savedFormData)) {
      toast({
        title: "Welcome back!",
        description: "Starting your saved campaign...",
      });
      
      // Small delay to let the user see the welcome message
      setTimeout(async () => {
        await onCreateCampaign();
      }, 1000);
    }
  }, [savedFormData, hasValidSavedData, toast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  return {
    flowState,
    updateFlowState,
    getButtonState,
    getContextualMessages,
    handleCampaignAction,
    handleSuccessfulAuth,
    analyzeFormData,
    determineUserIntent,
    // Expose some computed properties for convenience
    isReady: !authLoading && !flowState.isProcessing,
    hasValidForm: (formData: CampaignFormData) => analyzeFormData(formData).isValid,
    needsAuth: !isAuthenticated,
    canProceed: isAuthenticated && !authLoading && !flowState.isProcessing
  };
};
