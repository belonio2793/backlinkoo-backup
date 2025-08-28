import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [stripeUrl, setStripeUrl] = useState('');

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

      // Try multiple endpoints for redundancy
      const endpoints = [
        '/.netlify/functions/create-payment',
        '/api/create-payment'
      ];

      let response = null;
      let lastError = null;

      // Check if we're in development mode
      const isDevelopment = import.meta.env.DEV;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying payment endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
          });

          if (response.ok) {
            console.log(`✅ Payment endpoint ${endpoint} responded successfully`);
            break;
          } else {
            console.log(`❌ Payment endpoint ${endpoint} failed with status: ${response.status}`);
            lastError = new Error(`Endpoint ${endpoint} returned ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Payment endpoint ${endpoint} failed with error:`, error);
          lastError = error;
        }
      }

      // If all endpoints fail in development, show demo modal
      if ((!response || !response.ok) && isDevelopment) {
        console.log('💡 Development mode: Showing demo payment modal');
        setStripeUrl('https://checkout.stripe.com/demo-url');
        setShowFallbackModal(true);
        setIsLoading(false);
        return;
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All payment endpoints failed');
      }

      let result;
      try {
        // Clone the response to avoid "body stream already read" error
        const responseClone = response.clone();
        const responseText = await responseClone.text();

        if (!responseText) {
          throw new Error('Empty response from payment server');
        }

        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse payment response:', parseError);
        throw new Error('Invalid response from payment server');
      }

      if (result.url) {
        setStripeUrl(result.url);

        // Try to open Stripe checkout in a new window
        try {
          const stripeWindow = window.open(
            result.url,
            'stripe-payment',
            'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
          );

          if (!stripeWindow) {
            // Popup blocked - show fallback modal
            console.log('Popup blocked, showing fallback modal');
            setShowFallbackModal(true);
            setIsLoading(false);
            return;
          }

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

        } catch (windowError) {
          console.error('Failed to open payment window:', windowError);
          setShowFallbackModal(true);
          setIsLoading(false);
        }

      } else {
        throw new Error('No payment URL received from server');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsLoading(false);

      // Show user-friendly error message
      const errorMessage = error.message?.includes('404')
        ? 'Payment system temporarily unavailable. Please try again in a moment.'
        : error.message?.includes('Network')
        ? 'Network error. Please check your connection and try again.'
        : `Payment failed: ${error.message}`;

      alert(errorMessage);
      onPaymentCancel?.();
    }
  };

  const handleFallbackPayment = () => {
    if (stripeUrl) {
      // Check if it's a demo URL
      if (stripeUrl.includes('demo-url')) {
        alert('🚀 Demo Mode: In production, this would redirect to Stripe checkout!\n\nThis demonstrates the payment flow when Netlify functions are properly deployed.');
        setShowFallbackModal(false);
        onPaymentSuccess?.('demo_session_id');
        return;
      }
      window.location.href = stripeUrl;
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

      {/* Fallback Modal for when popup is blocked */}
      <Dialog open={showFallbackModal} onOpenChange={setShowFallbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Your Purchase
            </DialogTitle>
            <DialogDescription>
              {stripeUrl?.includes('demo-url')
                ? `This is a demo of the payment flow. In production, you would be redirected to Stripe checkout to complete your payment for ${defaultCredits} credits.`
                : `Click the button below to proceed to Stripe checkout and complete your payment for ${defaultCredits} credits.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Details</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Credits: {defaultCredits}</div>
                <div>Amount: ${(defaultCredits * 1.40).toFixed(2)}</div>
                <div>Rate: $1.40 per credit</div>
              </div>
            </div>
            <Button
              onClick={handleFallbackPayment}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {stripeUrl?.includes('demo-url')
                ? 'Demo: Complete Payment'
                : 'Continue to Stripe Checkout'
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowFallbackModal(false);
                onPaymentCancel?.();
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
