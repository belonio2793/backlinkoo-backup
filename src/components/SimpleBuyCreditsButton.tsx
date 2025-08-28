import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';
import { useToast } from '@/hooks/use-toast';

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

  const handleBuyCredits = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Calculate amount based on credits ($1.40 per credit)
      const amount = defaultCredits * 1.40;

      const result = await paymentIntegrationService.createPayment(
        amount,
        defaultCredits,
        'stripe',
        isGuest,
        isGuest ? (guestEmail || 'support@backlinkoo.com') : undefined
      );

      if (result.success && result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Payment creation failed');
      }

    } catch (error: any) {
      console.error('💳 Payment creation error:', error);
      
      toast({
        title: "Payment Error",
        description: error.message || "Unable to process payment. Please try again or contact support.",
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
        <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
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
