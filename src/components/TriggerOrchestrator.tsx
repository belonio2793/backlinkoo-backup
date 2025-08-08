import { useState, useEffect } from 'react';
import { IrresistibleAccountTrigger } from './IrresistibleAccountTrigger';
import { ExitIntentTrigger, useExitIntent } from './ExitIntentTrigger';
import { ExtremeScarcityTrigger } from './ExtremeScarcityTrigger';
import { FinalDesperationTrigger } from './FinalDesperationTrigger';

interface TriggerOrchestratorProps {
  isGuestUser: boolean;
  blogPostTitle: string;
  targetUrl: string;
  expiresAt?: string;
  onSignUp: () => void;
  onLogin: () => void;
  userName?: string;
  triggerIntensity?: 'mild' | 'aggressive' | 'extreme' | 'nuclear';
}

export function TriggerOrchestrator({
  isGuestUser,
  blogPostTitle,
  targetUrl,
  expiresAt,
  onSignUp,
  onLogin,
  userName = "Friend",
  triggerIntensity = 'extreme'
}: TriggerOrchestratorProps) {
  // State management for all triggers
  const [currentTrigger, setCurrentTrigger] = useState<string | null>(null);
  const [triggerHistory, setTriggerHistory] = useState<string[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [userInteractions, setUserInteractions] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasClickedButtons, setHasClickedButtons] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);

  // Trigger timing configuration
  const triggerTimings = {
    mild: {
      initial: 10000,      // 10 seconds
      secondary: 30000,    // 30 seconds
      tertiary: 60000,     // 1 minute
      final: 90000         // 1.5 minutes
    },
    aggressive: {
      initial: 5000,       // 5 seconds
      secondary: 20000,    // 20 seconds
      tertiary: 45000,     // 45 seconds
      final: 75000         // 1.25 minutes
    },
    extreme: {
      initial: 3000,       // 3 seconds
      secondary: 15000,    // 15 seconds
      tertiary: 30000,     // 30 seconds
      final: 60000         // 1 minute
    },
    nuclear: {
      initial: 1000,       // 1 second
      secondary: 8000,     // 8 seconds
      tertiary: 20000,     // 20 seconds
      final: 40000         // 40 seconds
    }
  };

  const timings = triggerTimings[triggerIntensity];

  // Track user engagement
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
        setUserInteractions(prev => prev + 1);
      }
    };

    const handleClick = () => {
      if (!hasClickedButtons) {
        setHasClickedButtons(true);
        setUserInteractions(prev => prev + 1);
      }
    };

    const timeInterval = setInterval(() => {
      setTimeOnPage(Date.now() - sessionStartTime);
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      clearInterval(timeInterval);
    };
  }, [hasScrolled, hasClickedButtons, sessionStartTime]);

  // Trigger orchestration logic
  useEffect(() => {
    if (!isGuestUser) return;

    const scheduleNextTrigger = () => {
      // Calculate engagement score
      const engagementScore = userInteractions + (hasScrolled ? 2 : 0) + (hasClickedButtons ? 3 : 0);
      const timeScore = Math.floor(timeOnPage / 1000);
      const totalScore = engagementScore + timeScore;

      // Determine next trigger based on history and engagement
      let nextTrigger = null;
      let delay = 0;

      if (triggerHistory.length === 0) {
        // First trigger - start with irresistible
        nextTrigger = 'irresistible';
        delay = timings.initial;
      } else if (triggerHistory.length === 1) {
        // Second trigger - escalate based on engagement
        nextTrigger = totalScore > 10 ? 'extreme-scarcity' : 'irresistible-repeat';
        delay = timings.secondary;
      } else if (triggerHistory.length === 2) {
        // Third trigger - high pressure
        nextTrigger = 'extreme-scarcity';
        delay = timings.tertiary;
      } else if (triggerHistory.length === 3) {
        // Final trigger - desperation
        nextTrigger = 'final-desperation';
        delay = timings.final;
      }

      if (nextTrigger && !triggerHistory.includes(nextTrigger)) {
        setTimeout(() => {
          setCurrentTrigger(nextTrigger);
          setTriggerHistory(prev => [...prev, nextTrigger]);
        }, delay);
      }
    };

    scheduleNextTrigger();
  }, [isGuestUser, userInteractions, hasScrolled, hasClickedButtons, timeOnPage, triggerHistory.length]);

  // Exit intent detection
  useExitIntent(() => {
    if (isGuestUser && !currentTrigger && !triggerHistory.includes('exit-intent')) {
      setCurrentTrigger('exit-intent');
      setTriggerHistory(prev => [...prev, 'exit-intent']);
    }
  });

  // Handle trigger actions
  const handleTriggerAction = (action: 'signup' | 'login' | 'dismiss' | 'stay') => {
    if (action === 'signup') {
      onSignUp();
      setCurrentTrigger(null);
    } else if (action === 'login') {
      onLogin();
      setCurrentTrigger(null);
    } else if (action === 'dismiss') {
      setCurrentTrigger(null);
      // Schedule next trigger if not at max
      if (triggerHistory.length < 4) {
        setTimeout(() => {
          scheduleNextTrigger();
        }, triggerIntensity === 'nuclear' ? 5000 : 10000);
      }
    } else if (action === 'stay') {
      setCurrentTrigger(null);
    }
  };

  const scheduleNextTrigger = () => {
    const nextIndex = triggerHistory.length;
    const triggerSequence = ['irresistible', 'extreme-scarcity', 'final-desperation'];
    
    if (nextIndex < triggerSequence.length) {
      const nextTrigger = triggerSequence[nextIndex];
      const delay = triggerIntensity === 'nuclear' ? 8000 : 15000;
      
      setTimeout(() => {
        if (!currentTrigger) {
          setCurrentTrigger(nextTrigger);
          setTriggerHistory(prev => [...prev, nextTrigger]);
        }
      }, delay);
    }
  };

  // Don't render anything for authenticated users
  if (!isGuestUser) return null;

  // Render current trigger
  switch (currentTrigger) {
    case 'irresistible':
    case 'irresistible-repeat':
      return (
        <IrresistibleAccountTrigger
          blogPostTitle={blogPostTitle}
          targetUrl={targetUrl}
          expiresAt={expiresAt}
          onSignUp={() => handleTriggerAction('signup')}
          onLogin={() => handleTriggerAction('login')}
          onDismiss={() => handleTriggerAction('dismiss')}
        />
      );

    case 'exit-intent':
      return (
        <ExitIntentTrigger
          onSignUp={() => handleTriggerAction('signup')}
          onLogin={() => handleTriggerAction('login')}
          onStay={() => handleTriggerAction('stay')}
          contentTitle={blogPostTitle}
          contentValue="$862"
        />
      );

    case 'extreme-scarcity':
      return (
        <ExtremeScarcityTrigger
          onSignUp={() => handleTriggerAction('signup')}
          onLogin={() => handleTriggerAction('login')}
          onClose={() => handleTriggerAction('dismiss')}
          contentValue="$862"
          timeRemaining={expiresAt ? calculateTimeRemaining(expiresAt) : "23:47:32"}
          postTitle={blogPostTitle}
        />
      );

    case 'final-desperation':
      return (
        <FinalDesperationTrigger
          onSignUp={() => handleTriggerAction('signup')}
          onLogin={() => handleTriggerAction('login')}
          onClose={() => handleTriggerAction('dismiss')}
          userName={userName}
          contentTitle={blogPostTitle}
        />
      );

    default:
      return null;
  }
}

// Helper function to calculate time remaining
function calculateTimeRemaining(expiresAt: string): string {
  const expires = new Date(expiresAt);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return "00:00:00";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Hook for analytics tracking
export function useTriggerAnalytics() {
  const [triggerEvents, setTriggerEvents] = useState<any[]>([]);

  const trackTriggerEvent = (event: {
    type: 'shown' | 'dismissed' | 'converted';
    trigger: string;
    timestamp: number;
    userInfo?: any;
  }) => {
    setTriggerEvents(prev => [...prev, event]);
    
    // Send to analytics service
    console.log('Trigger Analytics:', event);
  };

  return {
    triggerEvents,
    trackTriggerEvent
  };
}
