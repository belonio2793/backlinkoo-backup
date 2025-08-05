import { userService } from './userService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fallback subscription service for when Stripe integration is not available
 * This should only be used in development or as a backup
 */
export class FallbackSubscriptionService {
  /**
   * Create a "fake" subscription for testing purposes
   */
  static async createTestSubscription(userEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Creating test subscription (fallback mode)...');

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('⚠️ No authenticated user, prompting for login...');
        return {
          success: false,
          error: 'Please sign in first, then try upgrading to premium.'
        };
      }

      console.log('👤 User authenticated:', user.email);

      // Simulate the upgrade process
      console.log('🔄 Calling userService.upgradeToPremium()...');
      const result = await userService.upgradeToPremium();

      console.log('📊 Upgrade result:', result);

      if (result.success) {
        console.log('✅ Test subscription created successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to create test subscription:', result.message);
        return {
          success: false,
          error: `Failed to upgrade account: ${result.message}`
        };
      }
    } catch (error: any) {
      console.error('❌ Exception in test subscription:', error);
      return { success: false, error: error.message || 'Failed to create test subscription' };
    }
  }

  /**
   * Check if we should use fallback mode
   */
  static shouldUseFallback(): boolean {
    // Use fallback in development or if environment variable is set
    return import.meta.env.DEV || import.meta.env.VITE_USE_SUBSCRIPTION_FALLBACK === 'true';
  }

  /**
   * Show fallback subscription modal
   */
  static async showFallbackModal(): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        '🧪 Development Mode: Subscription Fallback\n\n' +
        'The Stripe integration is not available. Would you like to:\n\n' +
        '✅ Upgrade to Premium immediately (for testing)\n' +
        '❌ Cancel and configure Stripe integration\n\n' +
        'This will upgrade your account to Premium role without payment.'
      );
      
      resolve(confirmed);
    });
  }
}

// Helper function to handle subscription with fallback
export async function createSubscriptionWithFallback(
  user: any, 
  isGuest: boolean = false, 
  guestEmail?: string
): Promise<{ success: boolean; url?: string; error?: string; usedFallback?: boolean }> {
  
  // First try the real subscription service
  const { SubscriptionService } = await import('./subscriptionService');
  
  try {
    const result = await SubscriptionService.createSubscription(user, isGuest, guestEmail);
    
    // If successful, return the result
    if (result.success) {
      return result;
    }
    
    // If failed and we're in development, offer fallback
    if (FallbackSubscriptionService.shouldUseFallback()) {
      console.warn('🔄 Subscription failed, offering fallback option...');
      
      const useFallback = await FallbackSubscriptionService.showFallbackModal();
      
      if (useFallback) {
        const fallbackResult = await FallbackSubscriptionService.createTestSubscription(
          user?.email || guestEmail
        );
        
        if (fallbackResult.success) {
          return { 
            success: true, 
            usedFallback: true,
            url: window.location.origin + '/dashboard' // Redirect to dashboard
          };
        } else {
          return { 
            success: false, 
            error: `Fallback failed: ${fallbackResult.error}`,
            usedFallback: true
          };
        }
      }
    }
    
    // Return original error if no fallback
    return result;
    
  } catch (error: any) {
    console.error('❌ Subscription creation error:', error);
    
    // If we're in development and there's an error, offer fallback
    if (FallbackSubscriptionService.shouldUseFallback()) {
      const useFallback = await FallbackSubscriptionService.showFallbackModal();
      
      if (useFallback) {
        const fallbackResult = await FallbackSubscriptionService.createTestSubscription(
          user?.email || guestEmail
        );
        
        return { 
          success: fallbackResult.success,
          error: fallbackResult.error,
          usedFallback: true,
          url: fallbackResult.success ? window.location.origin + '/dashboard' : undefined
        };
      }
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to create subscription' 
    };
  }
}
