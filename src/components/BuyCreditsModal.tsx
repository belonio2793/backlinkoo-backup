import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Loader2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (sessionId?: string) => void;
  onPaymentCancel?: () => void;
  userEmail?: string;
  isGuest?: boolean;
}

interface CreditPackage {
  credits: number;
  price: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 50, price: 70 },
  { credits: 100, price: 140 },
  { credits: 250, price: 350 },
  { credits: 500, price: 700 },
];

const FEATURES = [
  'High DA backlinks',
  'Detailed performance reports',
  'Automated content generation',
  'White-hat SEO practices',
  'Real-time campaign tracking',
  'Multi-platform distribution',
];

export function BuyCreditsModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  onPaymentCancel,
  userEmail = 'support@backlinkoo.com',
  isGuest = true
}: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(CREDIT_PACKAGES[1]); // Default to 100 credits
  const [customCredits, setCustomCredits] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate final credits and price
  const finalCredits = isCustom ? parseInt(customCredits) || 0 : selectedPackage?.credits || 0;
  const finalPrice = finalCredits * 1.40;

  useEffect(() => {
    if (isCustom && customCredits) {
      setSelectedPackage(null);
    }
  }, [isCustom, customCredits]);

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setIsCustom(false);
    setCustomCredits('');
  };

  const handleCustomCreditsChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setCustomCredits(numValue);
    if (numValue) {
      setIsCustom(true);
      setSelectedPackage(null);
    }
  };

  const createStripePayment = async () => {
    if (isLoading || finalCredits <= 0) return;

    setIsLoading(true);

    try {
      const amount = finalPrice;
      const productName = `${finalCredits} Backlink Credits`;

      const paymentData = {
        amount,
        credits: finalCredits,
        productName,
        paymentMethod: 'stripe',
        isGuest,
        guestEmail: isGuest ? userEmail : undefined
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

      // If all endpoints fail in development, show demo success
      if ((!response || !response.ok) && isDevelopment) {
        console.log('💡 Development mode: Simulating successful payment');
        setIsLoading(false);
        onClose();
        onPaymentSuccess?.('demo_session_' + Date.now());
        alert(`🚀 Demo Mode: Payment successful!\n\nYou would have purchased ${finalCredits} credits for $${finalPrice.toFixed(2)}`);
        return;
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All payment endpoints failed');
      }

      let result;
      try {
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
        // Try to open Stripe checkout in a new window
        try {
          const stripeWindow = window.open(
            result.url,
            'stripe-payment',
            'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
          );

          if (!stripeWindow) {
            // Popup blocked - redirect to Stripe directly
            console.log('Popup blocked, redirecting to Stripe');
            window.location.href = result.url;
            return;
          }

          // Monitor the window for closure
          const checkClosed = setInterval(() => {
            if (stripeWindow?.closed) {
              clearInterval(checkClosed);
              setIsLoading(false);
              onClose();

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

          // Fallback: stop loading after 30 seconds
          setTimeout(() => {
            clearInterval(checkClosed);
            setIsLoading(false);
          }, 30000);

        } catch (windowError) {
          console.error('Failed to open payment window:', windowError);
          // Fallback to direct redirect
          window.location.href = result.url;
        }

      } else {
        throw new Error('No payment URL received from server');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsLoading(false);

      const errorMessage = error.message?.includes('404')
        ? 'Payment system temporarily unavailable. Please try again in a moment.'
        : error.message?.includes('Network')
        ? 'Network error. Please check your connection and try again.'
        : `Payment failed: ${error.message}`;

      alert(errorMessage);
      onPaymentCancel?.();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-xl font-semibold">
            Buy Credits
          </DialogTitle>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-0 top-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Account Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Account</h3>
            <div className="text-sm text-gray-600">{userEmail}</div>
          </div>

          {/* Credit Packages Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Credit Package</h3>
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.credits}
                  onClick={() => handlePackageSelect(pkg)}
                  disabled={isLoading}
                  className={`p-4 border rounded-lg text-center transition-all ${
                    selectedPackage?.credits === pkg.credits && !isCustom
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{pkg.credits} Credits</div>
                  <div className="text-2xl font-bold text-blue-600">${pkg.price}</div>
                  <div className="text-xs text-gray-500">$1.40 per credit</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Amount</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Number of Credits</label>
                <Input
                  type="text"
                  value={customCredits}
                  onChange={(e) => handleCustomCreditsChange(e.target.value)}
                  placeholder="300"
                  disabled={isLoading}
                  className="text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Total Price</label>
                <div className="h-9 px-3 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
                  <span className="text-blue-600 font-semibold">
                    ${finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Rate</label>
                <div className="h-9 px-3 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
                  <span className="text-sm">$1.40</span>
                </div>
                <div className="text-xs text-gray-500 text-center mt-1">per credit</div>
              </div>
            </div>
          </div>

          {/* What's Included Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">What's Included</h3>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <div className="pt-4">
            <Button
              onClick={createStripePayment}
              disabled={isLoading || finalCredits <= 0}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy {finalCredits} Credits for ${finalPrice.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
