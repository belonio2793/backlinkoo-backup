/**
 * Direct Payment Buttons
 * Simple buttons that open Stripe checkout directly in new window
 * No modals, loading states, or notifications
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Zap, Star } from 'lucide-react';
import { DirectCheckoutService } from '@/services/directCheckoutService';

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
  
  const handleClick = async () => {
    await DirectCheckoutService.buyCredits(credits);
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
      disabled={disabled}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      Buy {credits} Credits - {getPrice()}
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
  
  const handleClick = async () => {
    await DirectCheckoutService.upgradeToPremium(plan);
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
      disabled={disabled}
    >
      <Crown className="h-4 w-4 mr-2" />
      Upgrade to Premium - {getPrice()}
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
  
  const handleClick = async () => {
    if (type === 'credits') {
      await DirectCheckoutService.buyCredits(credits);
    } else {
      await DirectCheckoutService.upgradeToPremium(plan);
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
      disabled={disabled}
    >
      {getIcon()}
      {text || getDefaultText()}
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
