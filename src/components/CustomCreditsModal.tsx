import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Shield, ExternalLink, Zap, Calculator, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CustomCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
  onSuccess?: () => void;
}

export const CustomCreditsModal = ({
  isOpen,
  onClose,
  initialCredits,
  onSuccess
}: CustomCreditsModalProps) => {
  const CREDIT_PRICE = 1.40;
  const CREDITS_CHECKOUT_URL = 'https://buy.stripe.com/9B63cv1tmcYe';
  const { toast } = useToast();
  const { user } = useAuth();

  const [credits, setCredits] = useState(() => initialCredits ? initialCredits.toString() : "");
  const [loading, setLoading] = useState(false);

  // Check if we're on the production domain
  const isProductionDomain = typeof window !== 'undefined' && window.location.hostname === 'backlinkoo.com';
  const showDomainWarning = !isProductionDomain;

  // Quick credit options
  const quickOptions = [
    { credits: 50, popular: false },
    { credits: 100, popular: true },
    { credits: 250, popular: false },
    { credits: 500, popular: false }
  ];

  // Calculate total amount based on credits
  const calculateAmount = (creditCount: string): number => {
    const numCredits = parseFloat(creditCount) || 0;
    return numCredits * CREDIT_PRICE;
  };

  const totalAmount = calculateAmount(credits);

  // Update state when modal opens
  useEffect(() => {
    if (isOpen && initialCredits && initialCredits > 0) {
      setCredits(initialCredits.toString());
    }
  }, [isOpen, initialCredits]);

  // Handle quick option selection
  const handleQuickSelect = (creditAmount: number) => {
    setCredits(creditAmount.toString());
  };

  // Create checkout URL with user data
  const createCheckoutUrl = (): string => {
    const url = new URL(CREDITS_CHECKOUT_URL);
    const currentOrigin = window.location.origin;
    
    // Add return URLs
    url.searchParams.set('success_url', `${currentOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
    url.searchParams.set('cancel_url', `${currentOrigin}/payment-cancelled`);
    
    // Add user email if available
    if (user?.email) {
      url.searchParams.set('prefilled_email', user.email);
    }
    
    // Add metadata for webhook processing
    const creditCount = parseInt(credits);
    url.searchParams.set('client_reference_id', `credits_${creditCount}`);
    
    return url.toString();
  };

  // Handle credit purchase with direct checkout
  const handleCreditPurchase = async () => {
    const creditCount = parseInt(credits);
    
    if (!credits || creditCount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of credits (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    if (creditCount > 10000) {
      toast({
        title: "Maximum Exceeded",
        description: "Maximum 10,000 credits per purchase. Please contact support for larger amounts.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "🚀 Redirecting to Stripe",
        description: `Opening secure checkout for ${creditCount} credits...`,
      });

      // Create checkout URL and redirect
      const checkoutUrl = createCheckoutUrl();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Credit purchase error:', error);
      
      toast({
        title: "Redirect Error",
        description: "Failed to redirect to checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidAmount = credits && parseInt(credits) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Buy Custom Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Domain Warning */}
          {showDomainWarning && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="space-y-2">
                  <div className="font-medium">Development Server Warning</div>
                  <div className="text-sm">
                    You're purchasing credits on a development server. For production use, please visit{' '}
                    <a
                      href="https://backlinkoo.com"
                      className="underline font-medium hover:text-amber-900"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      backlinkoo.com
                    </a>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Account Info */}
          {user && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Account</Label>
              <Badge variant="secondary" className="font-medium">{user.email}</Badge>
            </div>
          )}

          {/* Quick Credit Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Quick Options</Label>
            <div className="grid grid-cols-2 gap-3">
              {quickOptions.map((option) => (
                <Card 
                  key={option.credits}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    parseInt(credits) === option.credits ? 'ring-2 ring-primary' : ''
                  } ${option.popular ? 'border-primary' : ''}`}
                  onClick={() => handleQuickSelect(option.credits)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{option.credits} Credits</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ${CREDIT_PRICE.toFixed(2)} per credit
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">${(option.credits * CREDIT_PRICE).toFixed(2)}</div>
                        {option.popular && (
                          <Badge className="mt-1" variant="default">Popular</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Custom Amount</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credits" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Number of Credits
                </Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="Enter number of credits"
                  className="text-lg"
                />
              </div>
              
              {/* Live Calculation Display */}
              {isValidAmount && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{credits} credits</p>
                      <p className="text-sm font-medium">@${CREDIT_PRICE}/credit</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              💡 <strong>${CREDIT_PRICE} per credit</strong> • 1 credit = 1 premium backlink opportunity
            </p>
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handleCreditPurchase} 
            disabled={loading || !isValidAmount}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Redirecting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Buy {credits || 0} Credits for ${totalAmount.toFixed(2)}
              </div>
            )}
          </Button>

          {/* Security & Process Notice */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secured by Stripe • 256-bit SSL encryption</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>Direct checkout link • Instant activation via webhooks</span>
            </div>
            <p className="text-xs mt-2">
              Credits are added to your account immediately after successful payment
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
