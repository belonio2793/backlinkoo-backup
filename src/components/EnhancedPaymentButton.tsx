/**
 * Enhanced Payment Button Component
 * Reliable payment buttons with proper error handling and user feedback
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { DirectCheckoutService } from '@/services/directCheckoutService';
import { FallbackPaymentService } from '@/services/fallbackPaymentService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPaymentButtonProps {
  type: 'premium' | 'credits';
  plan?: 'monthly' | 'annual';
  credits?: 50 | 100 | 250 | 500;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function EnhancedPaymentButton({
  type,
  plan = 'monthly',
  credits = 50,
  variant = 'default',
  size = 'default',
  className = '',
  children,
  showIcon = true,
  disabled = false,
  onSuccess
}: EnhancedPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getDefaultContent = () => {
    if (children) return children;
    
    if (type === 'premium') {
      return (
        <>
          {showIcon && <Crown className="h-4 w-4 mr-2" />}
          Upgrade to Premium ({plan})
        </>
      );
    } else {
      const price = getCreditsPrice(credits);
      return (
        <>
          {showIcon && <CreditCard className="h-4 w-4 mr-2" />}
          Buy {credits} Credits (${price})
        </>
      );
    }
  };

  const getCreditsPrice = (creditsAmount: number): number => {
    if (creditsAmount <= 50) return 19;
    if (creditsAmount <= 100) return 29;
    if (creditsAmount <= 250) return 49;
    if (creditsAmount <= 500) return 79;
    return 99;
  };

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      console.log(`🎯 Payment button clicked: ${type}`, { plan, credits });

      if (type === 'premium') {
        // Premium checkout
        const result = await DirectCheckoutService.upgradeToPremium(plan);
        
        if (result.success) {
          console.log('✅ Premium checkout initiated successfully');
          onSuccess?.();
        } else {
          throw new Error(result.error || 'Premium checkout failed');
        }
      } else {
        // Credits checkout
        const result = await DirectCheckoutService.buyCredits(credits);
        
        if (result.success) {
          console.log('✅ Credits checkout initiated successfully');
          onSuccess?.();
        } else {
          throw new Error(result.error || 'Credits checkout failed');
        }
      }

    } catch (error: any) {
      console.error('❌ Payment button error:', error);

      // Try fallback payment service
      try {
        console.log('🔄 Trying fallback payment service...');
        
        await FallbackPaymentService.openPayment({
          type,
          plan,
          credits
        });
        
        toast({
          title: "Alternative Payment Method",
          description: "Primary payment system unavailable. Using alternative checkout.",
          variant: "default"
        });

      } catch (fallbackError) {
        console.error('❌ Fallback payment also failed:', fallbackError);
        
        // Show user-friendly error
        toast({
          title: "Payment Temporarily Unavailable",
          description: "Please try again in a moment or contact support if the issue persists.",
          variant: "destructive",
          action: (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('mailto:support@backlinkoo.com', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Contact Support
            </Button>
          )
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Opening Checkout...
        </>
      ) : (
        getDefaultContent()
      )}
    </Button>
  );
}

// Convenience components for common use cases

/**
 * Premium Upgrade Button
 */
export function PremiumUpgradeButton({
  plan = 'monthly',
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess
}: {
  plan?: 'monthly' | 'annual';
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <EnhancedPaymentButton
      type="premium"
      plan={plan}
      variant={variant}
      size={size}
      className={className}
      onSuccess={onSuccess}
    />
  );
}

/**
 * Credits Purchase Button
 */
export function CreditsPurchaseButton({
  credits = 50,
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess
}: {
  credits?: 50 | 100 | 250 | 500;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <EnhancedPaymentButton
      type="credits"
      credits={credits}
      variant={variant}
      size={size}
      className={className}
      onSuccess={onSuccess}
    />
  );
}

/**
 * Premium Plans Selection
 */
export function PremiumPlansSelection({
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess
}: {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <EnhancedPaymentButton
        type="premium"
        plan="monthly"
        variant={variant}
        size={size}
        onSuccess={onSuccess}
      >
        <Crown className="h-4 w-4 mr-2" />
        Monthly ($29)
      </EnhancedPaymentButton>
      
      <EnhancedPaymentButton
        type="premium"
        plan="annual"
        variant="outline"
        size={size}
        onSuccess={onSuccess}
      >
        <Crown className="h-4 w-4 mr-2" />
        Annual ($290)
      </EnhancedPaymentButton>
    </div>
  );
}

/**
 * Credits Options Selection
 */
export function CreditsOptionsSelection({
  variant = 'outline',
  size = 'default',
  className = '',
  onSuccess
}: {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      <EnhancedPaymentButton
        type="credits"
        credits={50}
        variant={variant}
        size={size}
        onSuccess={onSuccess}
      />
      <EnhancedPaymentButton
        type="credits"
        credits={100}
        variant={variant}
        size={size}
        onSuccess={onSuccess}
      />
      <EnhancedPaymentButton
        type="credits"
        credits={250}
        variant={variant}
        size={size}
        onSuccess={onSuccess}
      />
      <EnhancedPaymentButton
        type="credits"
        credits={500}
        variant={variant}
        size={size}
        onSuccess={onSuccess}
      />
    </div>
  );
}

export default EnhancedPaymentButton;
