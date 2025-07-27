import { useEffect, useCallback } from 'react';

interface GuestTrackingData {
  sessionStart: number;
  interactions: number;
  pageViews: number;
  lastActivity: number;
  features: string[];
}

export function useGuestTracking() {
  // Initialize guest session tracking
  useEffect(() => {
    const initializeTracking = () => {
      const currentTime = new Date().getTime();
      
      // Initialize session start if not exists
      if (!localStorage.getItem('guest_session_start')) {
        localStorage.setItem('guest_session_start', currentTime.toString());
      }
      
      // Initialize interaction count
      if (!localStorage.getItem('guest_interactions')) {
        localStorage.setItem('guest_interactions', '0');
      }
      
      // Initialize page views
      if (!localStorage.getItem('guest_page_views')) {
        localStorage.setItem('guest_page_views', '0');
      }
      
      // Track page view
      const pageViews = parseInt(localStorage.getItem('guest_page_views') || '0');
      localStorage.setItem('guest_page_views', (pageViews + 1).toString());
      
      // Update last activity
      localStorage.setItem('guest_last_activity', currentTime.toString());
    };

    initializeTracking();
  }, []);

  const trackInteraction = useCallback((feature?: string) => {
    const currentTime = new Date().getTime();
    
    // Increment interaction count
    const interactions = parseInt(localStorage.getItem('guest_interactions') || '0');
    localStorage.setItem('guest_interactions', (interactions + 1).toString());
    
    // Update last activity
    localStorage.setItem('guest_last_activity', currentTime.toString());
    
    // Track feature usage
    if (feature) {
      const usedFeatures = JSON.parse(localStorage.getItem('guest_features_used') || '[]');
      if (!usedFeatures.includes(feature)) {
        usedFeatures.push(feature);
        localStorage.setItem('guest_features_used', JSON.stringify(usedFeatures));
      }
    }
  }, []);

  const trackPageView = useCallback((page?: string) => {
    const pageViews = parseInt(localStorage.getItem('guest_page_views') || '0');
    localStorage.setItem('guest_page_views', (pageViews + 1).toString());
    
    if (page) {
      const visitedPages = JSON.parse(localStorage.getItem('guest_pages_visited') || '[]');
      if (!visitedPages.includes(page)) {
        visitedPages.push(page);
        localStorage.setItem('guest_pages_visited', JSON.stringify(visitedPages));
      }
    }
    
    trackInteraction('page_view');
  }, [trackInteraction]);

  const getGuestData = useCallback((): GuestTrackingData => {
    const sessionStart = parseInt(localStorage.getItem('guest_session_start') || '0');
    const interactions = parseInt(localStorage.getItem('guest_interactions') || '0');
    const pageViews = parseInt(localStorage.getItem('guest_page_views') || '0');
    const lastActivity = parseInt(localStorage.getItem('guest_last_activity') || '0');
    const features = JSON.parse(localStorage.getItem('guest_features_used') || '[]');
    
    return {
      sessionStart,
      interactions,
      pageViews,
      lastActivity,
      features
    };
  }, []);

  const getSessionDuration = useCallback((): number => {
    const sessionStart = parseInt(localStorage.getItem('guest_session_start') || '0');
    if (!sessionStart) return 0;
    return Math.floor((new Date().getTime() - sessionStart) / 1000 / 60); // minutes
  }, []);

  const shouldShowConversionPrompt = useCallback((): boolean => {
    const data = getGuestData();
    const duration = getSessionDuration();
    
    // Don't show if dismissed recently
    const lastDismissed = localStorage.getItem('guest_reminder_dismissed');
    if (lastDismissed) {
      const dismissTime = parseInt(lastDismissed);
      const timeSinceDismiss = (new Date().getTime() - dismissTime) / 1000 / 60; // minutes
      if (timeSinceDismiss < 10) return false; // Wait 10 minutes after dismissal
    }
    
    // Show based on engagement criteria
    return (
      (duration >= 2 && data.interactions >= 3) || // 2+ minutes and 3+ interactions
      (duration >= 5) || // 5+ minutes regardless
      (data.interactions >= 8) || // 8+ interactions regardless
      (data.pageViews >= 4) || // 4+ page views
      (data.features.length >= 2) // Used 2+ features
    );
  }, [getGuestData, getSessionDuration]);

  const clearGuestData = useCallback(() => {
    const keysToRemove = [
      'guest_session_start',
      'guest_interactions',
      'guest_page_views',
      'guest_last_activity',
      'guest_features_used',
      'guest_pages_visited',
      'guest_reminder_dismissed'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  return {
    trackInteraction,
    trackPageView,
    getGuestData,
    getSessionDuration,
    shouldShowConversionPrompt,
    clearGuestData
  };
}

// Specific tracking functions for common interactions
export const trackBlogGeneration = () => {
  const interactions = parseInt(localStorage.getItem('guest_interactions') || '0');
  localStorage.setItem('guest_interactions', (interactions + 1).toString());
  
  const features = JSON.parse(localStorage.getItem('guest_features_used') || '[]');
  if (!features.includes('blog_generation')) {
    features.push('blog_generation');
    localStorage.setItem('guest_features_used', JSON.stringify(features));
  }
};

export const trackTrialPost = () => {
  const interactions = parseInt(localStorage.getItem('guest_interactions') || '0');
  localStorage.setItem('guest_interactions', (interactions + 2).toString()); // Worth 2 interactions
  
  const features = JSON.parse(localStorage.getItem('guest_features_used') || '[]');
  if (!features.includes('trial_post_creation')) {
    features.push('trial_post_creation');
    localStorage.setItem('guest_features_used', JSON.stringify(features));
  }
};

export const trackFeatureExploration = (feature: string) => {
  const interactions = parseInt(localStorage.getItem('guest_interactions') || '0');
  localStorage.setItem('guest_interactions', (interactions + 1).toString());
  
  const features = JSON.parse(localStorage.getItem('guest_features_used') || '[]');
  if (!features.includes(feature)) {
    features.push(feature);
    localStorage.setItem('guest_features_used', JSON.stringify(features));
  }
};
