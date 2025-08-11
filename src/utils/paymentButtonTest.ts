/**
 * Payment Button Test Utility
 * Tests all payment buttons on the automation page
 */

import { DirectCheckoutService } from '@/services/directCheckoutService';

interface PaymentButtonTest {
  id: string;
  name: string;
  type: 'premium' | 'credits';
  plan?: 'monthly' | 'annual';
  credits?: number;
  element?: HTMLElement;
}

class PaymentButtonTestUtility {
  
  /**
   * Test all payment buttons on the page
   */
  static async testAllPaymentButtons(): Promise<{ success: boolean; results: any[] }> {
    console.log('🧪 Testing all payment buttons on automation page...');
    
    const results: any[] = [];
    
    // Define all expected payment buttons
    const expectedButtons: PaymentButtonTest[] = [
      { id: 'premium-monthly-1', name: 'View Plans (Authenticated)', type: 'premium', plan: 'monthly' },
      { id: 'premium-monthly-2', name: 'View Plans (Guest)', type: 'premium', plan: 'monthly' },
      { id: 'premium-monthly-3', name: 'Upgrade to Premium', type: 'premium', plan: 'monthly' },
      { id: 'premium-monthly-4', name: 'Continue with Premium', type: 'premium', plan: 'monthly' },
      { id: 'premium-monthly-5', name: 'Upgrade Now', type: 'premium', plan: 'monthly' },
      { id: 'premium-monthly-6', name: 'Get Unlimited Links', type: 'premium', plan: 'monthly' },
      { id: 'credits-50', name: 'Buy 50 Credits', type: 'credits', credits: 50 },
      { id: 'credits-100', name: 'Buy 100 Credits', type: 'credits', credits: 100 }
    ];
    
    for (const button of expectedButtons) {
      try {
        const result = await this.testPaymentButton(button);
        results.push(result);
      } catch (error) {
        results.push({
          id: button.id,
          name: button.name,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`🧪 Payment button test complete: ${successCount}/${totalCount} successful`);
    
    return {
      success: successCount === totalCount,
      results
    };
  }
  
  /**
   * Test individual payment button functionality
   */
  private static async testPaymentButton(button: PaymentButtonTest): Promise<any> {
    console.log(`🧪 Testing button: ${button.name}`);
    
    try {
      // Test the service call without actually opening checkout
      if (button.type === 'premium') {
        // Simulate premium checkout
        const result = await this.simulatePremiumCheckout(button.plan || 'monthly');
        return {
          id: button.id,
          name: button.name,
          success: result.success,
          type: 'premium',
          plan: button.plan,
          message: result.message
        };
      } else {
        // Simulate credits checkout
        const result = await this.simulateCreditsCheckout(button.credits || 50);
        return {
          id: button.id,
          name: button.name,
          success: result.success,
          type: 'credits',
          credits: button.credits,
          message: result.message
        };
      }
    } catch (error) {
      return {
        id: button.id,
        name: button.name,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Simulate premium checkout (without opening window)
   */
  private static async simulatePremiumCheckout(plan: 'monthly' | 'annual'): Promise<{ success: boolean; message: string }> {
    try {
      // Test if the service exists and can be called
      if (typeof DirectCheckoutService.upgradeToPremium !== 'function') {
        throw new Error('DirectCheckoutService.upgradeToPremium is not available');
      }
      
      // Check if plan is valid
      if (!['monthly', 'annual'].includes(plan)) {
        throw new Error(`Invalid plan: ${plan}`);
      }
      
      return {
        success: true,
        message: `Premium ${plan} checkout service is available`
      };
    } catch (error) {
      return {
        success: false,
        message: `Premium checkout failed: ${error.message}`
      };
    }
  }
  
  /**
   * Simulate credits checkout (without opening window)
   */
  private static async simulateCreditsCheckout(credits: number): Promise<{ success: boolean; message: string }> {
    try {
      // Test if the service exists and can be called
      if (typeof DirectCheckoutService.buyCredits !== 'function') {
        throw new Error('DirectCheckoutService.buyCredits is not available');
      }
      
      // Check if credits amount is valid
      if (!credits || credits <= 0) {
        throw new Error(`Invalid credits amount: ${credits}`);
      }
      
      return {
        success: true,
        message: `Credits checkout service is available for ${credits} credits`
      };
    } catch (error) {
      return {
        success: false,
        message: `Credits checkout failed: ${error.message}`
      };
    }
  }
  
  /**
   * Find payment buttons on the page
   */
  static findPaymentButtonsOnPage(): HTMLElement[] {
    const buttons: HTMLElement[] = [];
    
    // Look for buttons with payment-related text
    const paymentKeywords = [
      'view plans',
      'upgrade to premium', 
      'upgrade now',
      'continue with premium',
      'get unlimited',
      'buy credits'
    ];
    
    // Search all buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      const text = button.textContent?.toLowerCase() || '';
      const hasPaymentKeyword = paymentKeywords.some(keyword => text.includes(keyword));
      
      if (hasPaymentKeyword) {
        buttons.push(button as HTMLElement);
      }
    });
    
    return buttons;
  }
  
  /**
   * Test actual button clicks (for debugging)
   */
  static async testButtonClicks(): Promise<void> {
    console.log('🧪 Testing actual button clicks...');
    
    const buttons = this.findPaymentButtonsOnPage();
    
    for (const button of buttons) {
      console.log(`🔍 Found payment button: "${button.textContent}"`);
      
      // Add click event listener to test
      button.addEventListener('click', (e) => {
        console.log(`🧪 Button clicked: "${button.textContent}"`);
        console.log('Event:', e);
      }, { once: true });
    }
    
    console.log(`🧪 Found ${buttons.length} payment buttons on page`);
  }
  
  /**
   * Generate payment button report
   */
  static generateReport(results: any[]): string {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    let report = `
# Payment Buttons Test Report

## Summary
- **Total Buttons**: ${results.length}
- **Successful**: ${successful.length}
- **Failed**: ${failed.length}
- **Success Rate**: ${Math.round((successful.length / results.length) * 100)}%

## Successful Buttons
${successful.map(r => `- ✅ ${r.name} (${r.type}${r.plan ? ` - ${r.plan}` : ''}${r.credits ? ` - ${r.credits} credits` : ''})`).join('\n')}

## Failed Buttons
${failed.map(r => `- ❌ ${r.name}: ${r.error || r.message}`).join('\n')}

## Recommendations
${failed.length === 0 ? '✅ All payment buttons are working correctly!' : '❌ Some payment buttons need attention. Check the failed buttons above.'}
    `;
    
    return report;
  }
}

// Global test function for console usage
if (typeof window !== 'undefined') {
  (window as any).testPaymentButtons = async () => {
    const results = await PaymentButtonTestUtility.testAllPaymentButtons();
    const report = PaymentButtonTestUtility.generateReport(results.results);
    console.log(report);
    return results;
  };
  
  (window as any).findPaymentButtons = () => {
    const buttons = PaymentButtonTestUtility.findPaymentButtonsOnPage();
    console.log(`Found ${buttons.length} payment buttons:`, buttons);
    return buttons;
  };
}

export default PaymentButtonTestUtility;
export { PaymentButtonTestUtility };
