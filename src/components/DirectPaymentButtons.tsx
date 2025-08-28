/**
 * Direct Payment Buttons
 * Simple buttons that open Stripe checkout directly in new window
 * No modals, loading states, or notifications
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Zap, Star } from 'lucide-react';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

interface DirectPaymentButtonProps {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

/**
 * Direct Buy Credits Button - opens checkout immediately
 */
export function DirectBuyCreditsButton({
  credits = 50,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false
}: DirectPaymentButtonProps & { credits?: 50 | 100 | 250 | 500 }) {
  const { user, isLoading: authLoading } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (authLoading) {
      toast('Please wait while we verify your account...', { duration: 2000 });
      return;
    }

    if (!user) {
      toast('Please sign in to purchase credits', { duration: 3000 });
      return;
    }

    setIsLoading(true);

    try {
      // User is authenticated, proceed with purchase
      await stripeCheckout.quickBuyCredits(credits);
    } catch (error) {
      console.error('Purchase error:', error);
      toast('Purchase failed. Please try again.', {
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPrice = () => {
    if (credits <= 50) return '$19';
    if (credits <= 100) return '$29';
    if (credits <= 250) return '$49';
    if (credits <= 500) return '$79';
    return '$99';
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading || authLoading}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Buy {`${credits} Credits`} - {getPrice()}
        </>
      )}
    </Button>
  );
}

/**
 * Direct Upgrade to Premium Button - opens checkout immediately
 */
export function DirectUpgradeToPremiumButton({
  plan = 'monthly',
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false
}: DirectPaymentButtonProps & { plan?: 'monthly' | 'annual' }) {
  const { user, isLoading: authLoading } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (authLoading) {
      toast('Please wait while we verify your account...', { duration: 2000 });
      return;
    }

    setIsLoading(true);

    try {
      if (user) {
        // User is authenticated, proceed with normal flow
        await stripeCheckout.upgradeToPremium(plan);
      } else {
        // User is not authenticated, collect email for guest checkout
        const email = window.prompt('Please enter your email address to upgrade to Premium:');

        if (!email || !email.includes('@')) {
          toast('A valid email address is required to upgrade to Premium', {
            duration: 3000
          });
          return;
        }

        // Use guest premium upgrade with email
        await stripeCheckout.guestPremiumUpgrade({
          plan,
          email
        });
      }
    } catch (error) {
      console.error('Premium upgrade error:', error);
      toast('Premium upgrade failed. Please try again.', {
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPrice = () => {
    return plan === 'monthly' ? '$29/month' : '$290/year';
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading || authLoading}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          Processing...
        </>
      ) : (
        <>
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium - {getPrice()}
        </>
      )}
    </Button>
  );
}

/**
 * Simple Credits Options - Quick buy buttons for common amounts
 */
export function DirectCreditsOptions({
  variant = 'outline',
  size = 'default',
  className = ''
}: DirectPaymentButtonProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      <DirectBuyCreditsButton 
        credits={50} 
        variant={variant} 
        size={size}
      />
      <DirectBuyCreditsButton 
        credits={100} 
        variant={variant} 
        size={size}
      />
      <DirectBuyCreditsButton 
        credits={250} 
        variant={variant} 
        size={size}
      />
      <DirectBuyCreditsButton 
        credits={500} 
        variant={variant} 
        size={size}
      />
    </div>
  );
}

/**
 * Simple Premium Options - Monthly and Annual plans
 */
export function DirectPremiumOptions({
  variant = 'default',
  size = 'default',
  className = ''
}: DirectPaymentButtonProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      <DirectUpgradeToPremiumButton 
        plan="monthly" 
        variant={variant} 
        size={size}
      />
      <DirectUpgradeToPremiumButton 
        plan="annual" 
        variant="outline" 
        size={size}
      />
    </div>
  );
}

/**
 * Universal Direct Payment Button - handles both credits and premium
 */
export function DirectPaymentButton({
  type,
  credits,
  plan,
  text,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false
}: DirectPaymentButtonProps & {
  type: 'credits' | 'premium';
  credits?: 50 | 100 | 250 | 500;
  plan?: 'monthly' | 'annual';
  text?: string;
}) {
  const { user, isLoading: authLoading } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (authLoading) {
      toast('Please wait while we verify your account...', { duration: 2000 });
      return;
    }

    setIsLoading(true);

    try {
      if (user) {
        // User is authenticated, proceed with normal flow
        if (type === 'credits') {
          await stripeCheckout.quickBuyCredits(credits || 50);
        } else {
          await stripeCheckout.upgradeToPremium(plan || 'monthly');
        }
      } else {
        // User is not authenticated, collect email for guest checkout
        const email = window.prompt(
          type === 'credits'
            ? 'Please enter your email address to purchase credits:'
            : 'Please enter your email address to upgrade to Premium:'
        );

        if (!email || !email.includes('@')) {
          toast('A valid email address is required to complete your purchase', {
            duration: 3000
          });
          return;
        }

        if (type === 'credits') {
          const creditAmount = credits || 50;
          const pricing = {
            50: 70,
            100: 140,
            250: 350,
            500: 700
          };
          const amount = pricing[creditAmount as keyof typeof pricing] || creditAmount * 1.40;

          await stripeCheckout.guestQuickBuy({
            credits: creditAmount,
            amount,
            email
          });
        } else {
          await stripeCheckout.guestPremiumUpgrade({
            plan: plan || 'monthly',
            email
          });
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast('Purchase failed. Please try again.', {
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDefaultText = () => {
    if (type === 'credits') {
      const price = credits <= 50 ? '$19' : credits <= 100 ? '$29' : credits <= 250 ? '$49' : credits <= 500 ? '$79' : '$99';
      return `Buy ${credits || 50} Credits - ${price}`;
    } else {
      const price = plan === 'monthly' ? '$29/month' : '$290/year';
      return `Upgrade to Premium - ${price}`;
    }
  };
  
  const getIcon = () => {
    return type === 'credits' ? 
      <CreditCard className="h-4 w-4 mr-2" /> : 
      <Crown className="h-4 w-4 mr-2" />;
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading || authLoading}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          Processing...
        </>
      ) : (
        <>
          {getIcon()}
          {text || getDefaultText()}
        </>
      )}
    </Button>
  );
}

/**
 * Quick Action Payment Buttons - for common use cases
 */
export function QuickPaymentActions({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="font-semibold mb-2">Buy Credits</h4>
        <DirectCreditsOptions />
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Upgrade to Premium</h4>
        <DirectPremiumOptions />
      </div>
    </div>
  );
}

export default DirectPaymentButton;
