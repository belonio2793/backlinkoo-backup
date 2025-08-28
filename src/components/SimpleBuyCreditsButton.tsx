import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SimpleBuyCreditsButtonProps {
  trigger?: React.ReactNode;
  defaultCredits?: number;
  onPaymentSuccess?: (sessionId?: string) => void;
  onPaymentCancel?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  guestEmail?: string;
  isGuest?: boolean;
}

export function SimpleBuyCreditsButton({
  trigger,
  defaultCredits = 100,
  onPaymentSuccess,
  onPaymentCancel,
  variant = 'outline',
  size = 'sm',
  className,
  guestEmail,
  isGuest = true
}: SimpleBuyCreditsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Stripe checkout URL for credits
  const CREDITS_CHECKOUT_URL = 'https://buy.stripe.com/9B63cv1tmcYe';

  const createCheckoutUrl = (): string => {
    const url = new URL(CREDITS_CHECKOUT_URL);
    const currentOrigin = window.location.origin;
    
    // Add return URLs
    url.searchParams.set('success_url', `${currentOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
    url.searchParams.set('cancel_url', `${currentOrigin}/payment-cancelled`);
    
    // Add user email if available
    const emailToUse = user?.email || guestEmail;
    if (emailToUse) {
      url.searchParams.set('prefilled_email', emailToUse);
    }
    
    // Add metadata for webhook processing
    url.searchParams.set('client_reference_id', `credits_${defaultCredits}`);
    
    return url.toString();
  };

  const handleBuyCredits = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      toast({
        title: "🚀 Redirecting to Stripe",
        description: `Opening secure checkout for ${defaultCredits} credits...`,
      });

      // Create checkout URL and redirect
      const checkoutUrl = createCheckoutUrl();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;

      // Call success callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

    } catch (error: any) {
      console.error('💳 Payment redirect error:', error);
      
      toast({
        title: "Redirect Error",
        description: "Failed to redirect to checkout. Please try again.",
        variant: "destructive"
      });

      onPaymentCancel?.();
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleBuyCredits}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4 mr-1 sm:mr-2" />
      )}
      <span className="hidden sm:inline">Buy {defaultCredits} Credits</span>
      <span className="sm:hidden">{defaultCredits}</span>
    </Button>
  );

  return trigger ? (
    <div onClick={handleBuyCredits} className="cursor-pointer">
      {trigger}
    </div>
  ) : (
    defaultTrigger
  );
}
