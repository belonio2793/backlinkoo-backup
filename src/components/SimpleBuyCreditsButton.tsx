import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

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

  const handleBuyCredits = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Calculate amount based on credits ($1.40 per credit)
      const amount = defaultCredits * 1.40;
      const productName = `${defaultCredits} Backlink Credits`;

      const paymentData = {
        amount,
        credits: defaultCredits,
        productName,
        paymentMethod: 'stripe',
        isGuest,
        guestEmail: isGuest ? (guestEmail || 'support@backlinkoo.com') : undefined
      };

      // Call the Stripe payment creation function
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const result = await response.json();

      if (result.url) {
        // Open Stripe checkout in a new window
        const stripeWindow = window.open(
          result.url,
          'stripe-payment',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Monitor the window for closure to detect completion/cancellation
        const checkClosed = setInterval(() => {
          if (stripeWindow?.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);

            // Check URL parameters for success/cancel
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');

            if (sessionId) {
              onPaymentSuccess?.(sessionId);
            } else {
              onPaymentCancel?.();
            }
          }
        }, 1000);

        // Fallback: stop loading after 30 seconds if window doesn't close
        setTimeout(() => {
          clearInterval(checkClosed);
          setIsLoading(false);
        }, 30000);

      } else {
        throw new Error('No payment URL received from server');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsLoading(false);
      alert(`Payment failed: ${error.message}`);
      onPaymentCancel?.();
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
      <span className="hidden sm:inline">
        {isLoading ? 'Opening Stripe...' : 'Buy Credits'}
      </span>
      <span className="sm:hidden">
        {isLoading ? 'Loading...' : 'Credits'}
      </span>
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={handleBuyCredits} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
    </>
  );
}
