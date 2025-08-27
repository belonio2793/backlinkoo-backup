/**
 * Universal Payment Component
 * Provides consistent payment buttons and modals across the entire application
 * Uses the new window-based Stripe checkout service - Credits Only
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { 
  CreditCard, 
  Zap, 
  ShoppingCart, 
  ExternalLink,
  Loader2,
  Check,
  Star,
  Shield
} from 'lucide-react';

interface UniversalPaymentComponentProps {
  trigger?: React.ReactNode;
  defaultCredits?: number;
  showTrigger?: boolean;
  onPaymentSuccess?: (sessionId: string) => void;
  onPaymentCancel?: () => void;
}

export const UniversalPaymentComponent: React.FC<UniversalPaymentComponentProps> = ({
  trigger,
  defaultCredits = 100,
  showTrigger = true,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState(defaultCredits);
  const [customCredits, setCustomCredits] = useState('');

  // Auto-update pricing when credits change
  useEffect(() => {
    const creditsToUse = customCredits ? parseInt(customCredits) : selectedCredits;
    if (creditsToUse > 0) {
      // Pricing automatically calculated and displayed
    }
  }, [selectedCredits, customCredits]);

  useEffect(() => {
    // Listen for payment success/cancel events
    const handlePaymentSuccess = (event: CustomEvent) => {
      onPaymentSuccess?.(event.detail.sessionId);
      setIsOpen(false);
      setLoading(false);
    };

    const handlePaymentCancel = () => {
      onPaymentCancel?.();
      setLoading(false);
    };

    window.addEventListener('stripe-payment-success', handlePaymentSuccess as EventListener);
    window.addEventListener('stripe-payment-cancelled', handlePaymentCancel);

    return () => {
      window.removeEventListener('stripe-payment-success', handlePaymentSuccess as EventListener);
      window.removeEventListener('stripe-payment-cancelled', handlePaymentCancel);
    };
  }, [onPaymentSuccess, onPaymentCancel]);

  const creditOptions = [
    { credits: 50, price: 70, popular: false },
    { credits: 100, price: 140, popular: true },
    { credits: 250, price: 350, popular: false },
    { credits: 500, price: 700, popular: false }
  ];

  const handleCreditPurchase = async () => {

    const creditsToUse = customCredits ? parseInt(customCredits) : selectedCredits;

    if (!creditsToUse || creditsToUse <= 0) {
      toast({
        title: "Invalid Credits",
        description: "Please select a valid number of credits",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate amount at $1.40 per credit
      const amount = creditsToUse * 1.40;

      const result = await stripeCheckout.purchaseCredits({
        credits: creditsToUse,
        amount: amount,
        productName: `${creditsToUse} Premium Backlink Credits`,
        isGuest: false,
        paymentMethod: 'stripe'
      });

      if (result.success) {
        toast({
          title: "✅ Checkout Opened",
          description: "Complete your purchase in the new window",
        });
      } else {
        throw new Error(result.error || 'Failed to open checkout');
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process purchase',
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="default" size="lg">
      <CreditCard className="h-4 w-4 mr-2" />
      Buy Credits
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            Purchase credits for high-quality backlink campaigns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Info */}
          {user && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Account</Label>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{user.email}</Badge>
              </div>
            </div>
          )}

          {/* Credit Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Credit Package</Label>
            
            {/* Predefined Options */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {creditOptions.map((option) => (
                <Card
                  key={option.credits}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCredits === option.credits && !customCredits ? 'ring-2 ring-primary' : ''
                  } ${option.popular ? 'border-primary' : ''}`}
                  onClick={() => {
                    setSelectedCredits(option.credits);
                    setCustomCredits('');
                  }}
                >
                  <CardHeader className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CardTitle className="text-base">{option.credits} Credits</CardTitle>
                      {option.popular && (
                        <Badge className="bg-primary text-white text-xs">
                          <Star className="h-2 w-2 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="text-xl font-bold text-primary">${option.price}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(option.price / option.credits).toFixed(2)} per credit
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Custom Amount */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Custom Amount</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customCredits">Number of Credits</Label>
                  <Input
                    id="customCredits"
                    type="number"
                    min="1"
                    max="10000"
                    value={customCredits}
                    onChange={(e) => {
                      setCustomCredits(e.target.value);
                      setSelectedCredits(0); // Clear predefined selection
                    }}
                    placeholder="Enter custom amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Price</Label>
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <div className="text-lg font-bold text-primary">
                      ${customCredits ? (parseInt(customCredits) * 1.40).toFixed(2) : '0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customCredits ? `${customCredits} × $1.40` : 'Enter credits above'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-gray-700">$1.40</div>
                    <div className="text-xs text-muted-foreground">per credit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-base font-medium">What's Included</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                'High DA backlinks',
                'Automated content generation',
                'Real-time campaign tracking',
                'Detailed performance reports',
                'White-hat SEO practices',
                'Multi-platform distribution'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handleCreditPurchase}
            disabled={loading || (!selectedCredits && !customCredits)}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Opening Checkout...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy {customCredits || selectedCredits} Credits for $
                {customCredits 
                  ? (parseInt(customCredits) * 1.40).toFixed(2)
                  : (creditOptions.find(o => o.credits === selectedCredits)?.price || '0.00')
                }
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secured by Stripe • 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
