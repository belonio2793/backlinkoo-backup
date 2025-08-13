/**
 * Mobile Payment Handler
 * Handles payment redirects specifically for mobile devices with various fallbacks
 */

interface MobilePaymentOptions {
  url: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  timeout?: number;
}

interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  version: string;
}

export class MobilePaymentHandler {
  private static getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    
    // Extract iOS version for Safari
    let version = '';
    if (isIOS) {
      const match = userAgent.match(/os (\d+)_(\d+)/);
      if (match) {
        version = `${match[1]}.${match[2]}`;
      }
    }
    
    return {
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      version
    };
  }

  private static isUserGestureRequired(deviceInfo: DeviceInfo): boolean {
    // iOS Safari requires user gesture for navigation
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      return true;
    }
    
    // Mobile Chrome also has restrictions
    if (deviceInfo.isMobile && deviceInfo.isChrome) {
      return true;
    }
    
    return deviceInfo.isMobile;
  }

  private static createLoadingIndicator(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'payment-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <div style="font-size: 18px; margin-bottom: 10px;">Redirecting to Payment...</div>
        <div style="font-size: 14px; opacity: 0.8;">Please wait while we redirect you to secure checkout</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    return overlay;
  }

  private static removeLoadingIndicator(): void {
    const overlay = document.getElementById('payment-loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Handle payment redirect with mobile-specific optimizations
   */
  public static async handlePaymentRedirect(options: MobilePaymentOptions): Promise<void> {
    const deviceInfo = this.getDeviceInfo();
    const requiresUserGesture = this.isUserGestureRequired(deviceInfo);
    
    console.log('📱 Mobile payment redirect:', {
      deviceInfo,
      requiresUserGesture,
      url: options.url
    });

    try {
      // Show loading indicator
      const loadingOverlay = this.createLoadingIndicator();
      document.body.appendChild(loadingOverlay);

      // For mobile devices, add a small delay to ensure smooth transition
      if (deviceInfo.isMobile) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // iOS Safari specific handling
      if (deviceInfo.isIOS && deviceInfo.isSafari) {
        // For iOS Safari, we need to be very careful about the redirect
        // Use a form submission approach which works better than location.href
        this.handleIOSSafariRedirect(options.url);
      }
      // Android Chrome specific handling  
      else if (deviceInfo.isAndroid && deviceInfo.isChrome) {
        // Android Chrome works well with location.href but add timeout
        this.handleAndroidChromeRedirect(options.url, options.timeout);
      }
      // General mobile fallback
      else if (deviceInfo.isMobile) {
        this.handleGeneralMobileRedirect(options.url);
      }
      // Desktop fallback
      else {
        window.location.href = options.url;
      }

      // Clean up loading indicator after redirect attempt
      setTimeout(() => {
        this.removeLoadingIndicator();
      }, 3000);

      options.onSuccess?.();

    } catch (error) {
      console.error('❌ Mobile payment redirect failed:', error);
      this.removeLoadingIndicator();
      
      // Fallback to basic redirect
      try {
        window.location.href = options.url;
      } catch (fallbackError) {
        console.error('❌ Fallback redirect also failed:', fallbackError);
        options.onError?.(`Payment redirect failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private static handleIOSSafariRedirect(url: string): void {
    console.log('🍎 Using iOS Safari redirect method');
    
    // Method 1: Try form submission (most reliable for iOS Safari)
    try {
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = url;
      form.style.display = 'none';
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (formError) {
      console.warn('Form submission failed, using location.href:', formError);
      window.location.href = url;
    }
  }

  private static handleAndroidChromeRedirect(url: string, timeout = 5000): void {
    console.log('🤖 Using Android Chrome redirect method');
    
    // Set a timeout to detect if redirect failed
    const redirectTimeout = setTimeout(() => {
      console.warn('Android redirect timeout, trying alternative method');
      // Alternative method: use location.replace
      window.location.replace(url);
    }, timeout);

    try {
      window.location.href = url;
      
      // Clear timeout if redirect succeeded
      setTimeout(() => {
        clearTimeout(redirectTimeout);
      }, 1000);
    } catch (error) {
      clearTimeout(redirectTimeout);
      console.warn('Direct redirect failed, using replace:', error);
      window.location.replace(url);
    }
  }

  private static handleGeneralMobileRedirect(url: string): void {
    console.log('📱 Using general mobile redirect method');
    
    // For other mobile browsers, try multiple methods
    try {
      // Try window.open with immediate fallback
      const popup = window.open(url, '_self');
      if (!popup) {
        throw new Error('Popup blocked');
      }
    } catch (error) {
      console.warn('Popup method failed, using location.href:', error);
      window.location.href = url;
    }
  }

  /**
   * Check if the current environment supports payment redirects
   */
  public static checkPaymentCompatibility(): {
    supported: boolean;
    warnings: string[];
    deviceInfo: DeviceInfo;
  } {
    const deviceInfo = this.getDeviceInfo();
    const warnings: string[] = [];
    let supported = true;

    // Check for known problematic configurations
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      // iOS Safari version checks
      const versionNum = parseFloat(deviceInfo.version);
      if (versionNum < 14) {
        warnings.push('iOS Safari version may have payment redirect issues. Please update iOS.');
      }
    }

    // Check for popup blockers
    try {
      const testPopup = window.open('', 'test', 'width=1,height=1');
      if (testPopup) {
        testPopup.close();
      } else {
        warnings.push('Popup blocker detected - will use current window redirect.');
      }
    } catch (error) {
      warnings.push('Browser security restrictions detected.');
    }

    // Check for third-party cookie restrictions
    if (deviceInfo.isSafari || (deviceInfo.isChrome && deviceInfo.isMobile)) {
      warnings.push('Third-party cookies may be blocked - ensure payment domain is allowed.');
    }

    return {
      supported,
      warnings,
      deviceInfo
    };
  }
}

export default MobilePaymentHandler;
