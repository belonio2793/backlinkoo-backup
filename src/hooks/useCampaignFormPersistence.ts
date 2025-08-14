import { useState, useEffect } from 'react';

interface CampaignFormData {
  targetUrl: string;
  keyword: string;
  anchorText: string;
}

const STORAGE_KEY = 'automation_campaign_form_data';

export const useCampaignFormPersistence = () => {
  const [savedFormData, setSavedFormData] = useState<CampaignFormData | null>(null);

  // Load saved form data on mount
  useEffect(() => {
    const saved = loadFormData();
    if (saved) {
      setSavedFormData(saved);
    }
  }, []);

  const saveFormData = (formData: CampaignFormData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setSavedFormData(formData);
      console.log('Campaign form data saved for later use');
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const loadFormData = (): CampaignFormData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the structure
        if (parsed && typeof parsed === 'object' && 
            typeof parsed.targetUrl === 'string' &&
            typeof parsed.keyword === 'string' &&
            typeof parsed.anchorText === 'string') {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
    return null;
  };

  const clearFormData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedFormData(null);
      console.log('Campaign form data cleared');
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  };

  const hasValidSavedData = (data: CampaignFormData | null): data is CampaignFormData => {
    return !!(data && data.targetUrl && data.keyword && data.anchorText);
  };

  return {
    savedFormData,
    saveFormData,
    loadFormData,
    clearFormData,
    hasValidSavedData
  };
};
