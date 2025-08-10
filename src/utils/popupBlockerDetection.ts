/**
 * Popup Blocker Detection Utility
 * Provides reliable popup blocker detection and fallback strategies for checkout flows
 */

export interface PopupTestResult {
  isBlocked: boolean;
  canUsePopups: boolean;
  detectionMethod: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PopupFallbackOptions {
  useCurrentWindow?: boolean;
  showNotification?: boolean;
  retryAttempts?: number;
  onFallback?: (reason: string) => void;
}

export class PopupBlockerDetection {
  private static testResults: PopupTestResult | null = null;
  private static lastTestTime = 0;
  private static readonly TEST_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Test if popups are blocked by the browser
   */
  static async testPopupBlocking(): Promise<PopupTestResult> {
    const now = Date.now();
    
    // Return cached result if recent
    if (this.testResults && (now - this.lastTestTime) < this.TEST_CACHE_DURATION) {
      return this.testResults;
    }

    let result: PopupTestResult = {
      isBlocked: false,
      canUsePopups: true,
      detectionMethod: 'unknown',
      confidence: 'low'
    };

    try {
      // Method 1: Try to open a blank popup
      const testWindow = window.open('', 'popup-test', 'width=1,height=1');
      
      if (!testWindow) {
        result = {
          isBlocked: true,
          canUsePopups: false,
          detectionMethod: 'window.open returned null',
          confidence: 'high'
        };
      } else if (testWindow.closed) {
        result = {
          isBlocked: true,
          canUsePopups: false,
          detectionMethod: 'window immediately closed',
          confidence: 'high'
        };
      } else {
        // Test if we can access the window properties
        try {
          const hasLocation = testWindow.location !== undefined;
          testWindow.close();
          
          result = {
            isBlocked: false,
            canUsePopups: true,
            detectionMethod: 'window.open successful',
            confidence: hasLocation ? 'high' : 'medium'
          };
        } catch (accessError) {
          testWindow.close();
          result = {
            isBlocked: true,
            canUsePopups: false,
            detectionMethod: 'window access denied',
            confidence: 'medium'
          };
        }
      }
    } catch (error) {
      result = {
        isBlocked: true,
        canUsePopups: false,
        detectionMethod: 'window.open threw error',
        confidence: 'high'
      };
    }

    // Additional detection methods for better confidence
    if (!result.isBlocked) {
      // Check for common popup blocker indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const hasStrictPopupPolicy = userAgent.includes('chrome') && 
        (userAgent.includes('headless') || document.visibilityState === 'hidden');
      
      if (hasStrictPopupPolicy) {
        result.confidence = 'medium';
      }
    }

    this.testResults = result;
    this.lastTestTime = now;
    
    console.log('Popup blocker detection result:', result);
    return result;
  }

  /**
   * Open a URL with automatic popup blocker detection and fallback
   */
  static async openWithFallback(
    url: string,
    windowName: string = 'popup-window',
    windowFeatures: string = 'width=800,height=600,scrollbars=yes,resizable=yes',
    fallbackOptions: PopupFallbackOptions = {}
  ): Promise<{ success: boolean; method: string; window?: Window | null }> {
    const {
      useCurrentWindow = true,
      showNotification = false,
      retryAttempts = 1,
      onFallback
    } = fallbackOptions;

    // First, test if popups are likely to be blocked
    const popupTest = await this.testPopupBlocking();
    
    if (popupTest.isBlocked && popupTest.confidence === 'high') {
      // Skip popup attempt if we're confident it will be blocked
      if (useCurrentWindow) {
        onFallback?.('Popup blocker detected - using current window');
        window.location.href = url;
        return { success: true, method: 'current-window-preemptive' };
      } else {
        onFallback?.('Popup blocker detected - cannot open window');
        return { success: false, method: 'blocked-preemptive' };
      }
    }

    // Try to open popup
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        const popupWindow = window.open(url, windowName, windowFeatures);
        
        if (!popupWindow) {
          console.warn(`Popup attempt ${attempt + 1} failed: window.open returned null`);
          
          if (attempt === retryAttempts - 1) {
            // Final attempt failed
            if (useCurrentWindow) {
              onFallback?.('Popup blocked - redirecting current window');
              window.location.href = url;
              return { success: true, method: 'current-window-fallback' };
            } else {
              onFallback?.('Popup blocked - no fallback available');
              return { success: false, method: 'blocked-no-fallback' };
            }
          }
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Check if popup was immediately closed (another indication of blocking)
        setTimeout(() => {
          if (popupWindow.closed) {
            console.warn('Popup was immediately closed by browser');
            if (useCurrentWindow && attempt === retryAttempts - 1) {
              onFallback?.('Popup closed immediately - redirecting current window');
              window.location.href = url;
            }
          }
        }, 100);

        return { success: true, method: 'popup-success', window: popupWindow };
        
      } catch (error) {
        console.error(`Popup attempt ${attempt + 1} error:`, error);
        
        if (attempt === retryAttempts - 1) {
          // Final attempt failed with error
          if (useCurrentWindow) {
            onFallback?.('Popup error - redirecting current window');
            window.location.href = url;
            return { success: true, method: 'current-window-error-fallback' };
          } else {
            onFallback?.('Popup error - no fallback available');
            return { success: false, method: 'error-no-fallback' };
          }
        }
      }
    }

    return { success: false, method: 'unknown-failure' };
  }

  /**
   * Check if the browser/environment is likely to block popups
   */
  static isLikelyToBlockPopups(): boolean {
    // Check for common indicators
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Mobile browsers often block popups more aggressively
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Headless browsers
    const isHeadless = userAgent.includes('headless');
    
    // Document not visible (background tab)
    const isBackground = document.visibilityState === 'hidden';
    
    // Safari has stricter popup policies
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    
    return isMobile || isHeadless || isBackground || isSafari;
  }

  /**
   * Get recommended strategy for opening checkout URLs
   */
  static getRecommendedStrategy(): 'popup' | 'current-window' | 'new-tab' {
    const isLikelyBlocked = this.isLikelyToBlockPopups();
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (isLikelyBlocked) {
      return 'current-window';
    }
    
    // Desktop browsers generally handle popups well
    if (!userAgent.includes('mobile')) {
      return 'popup';
    }
    
    // Mobile browsers - prefer new tab
    return 'new-tab';
  }

  /**
   * Clear cached test results (useful for testing)
   */
  static clearCache(): void {
    this.testResults = null;
    this.lastTestTime = 0;
  }
}
