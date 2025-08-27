import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet, Shield, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreditPaymentService } from "@/services/creditPaymentService";
import { useAuth } from "@/hooks/useAuth";

interface ImprovedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

export const ImprovedPaymentModal = ({
  isOpen,
  onClose,
  initialCredits
}: ImprovedPaymentModalProps) => {
  const CREDIT_PRICE = 1.40;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [amount, setAmount] = useState(() => initialCredits ? (initialCredits * CREDIT_PRICE).toFixed(2) : "");
  const [credits, setCredits] = useState(() => initialCredits ? initialCredits.toString() : "");
  const [loading, setLoading] = useState(false);

  // Credit packages
  const creditPackages = [
    { credits: 50, price: 70, popular: false, savings: 0 },
    { credits: 100, price: 140, popular: true, savings: 0 },
    { credits: 250, price: 350, popular: false, savings: 0 },
    { credits: 500, price: 700, popular: false, savings: 0 }
  ];

  // Update state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCredits && initialCredits > 0) {
        setCredits(initialCredits.toString());
        setAmount((initialCredits * CREDIT_PRICE).toFixed(2));
      }
    }
  }, [isOpen, initialCredits, user]);

  // Calculate total amount based on credits
  const calculateAmount = (creditCount: string) => {
    const numCredits = parseFloat(creditCount) || 0;
    return (numCredits * CREDIT_PRICE).toFixed(2);
  };

  // Update amount when credits change
  const handleCreditsChange = (newCredits: string) => {
    setCredits(newCredits);
    setAmount(calculateAmount(newCredits));
  };

  // Handle credit package selection
  const handlePackageSelect = (pkg: typeof creditPackages[0]) => {
    setCredits(pkg.credits.toString());
    setAmount(pkg.price.toString());
  };

  // Handle credit purchase
  const handleCreditPurchase = async () => {
    if (!credits || parseFloat(credits) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of credits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "🚀 Opening Checkout",
        description: "Opening secure Stripe checkout in new window...",
      });

      const result = await CreditPaymentService.createCreditPayment(
        user,
        false, // not guest since we have user
        user?.email,
        {
          amount: parseFloat(amount),
          credits: parseInt(credits),
          productName: `${credits} Premium Backlink Credits`,
          isGuest: false,
          guestEmail: user?.email
        }
      );

      if (result.success) {
        if (result.url) {
          // Open checkout in new window
          CreditPaymentService.openCheckoutWindow(result.url, result.sessionId);

          toast({
            title: "✅ Checkout Opened",
            description: "Complete your payment in the new window. This modal will close automatically.",
          });
        } else if (result.usedFallback) {
          toast({
            title: "✅ Development Mode",
            description: "Credit purchase simulated in development mode.",
          });
        }

        // Close modal after successful checkout window opening
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Credit purchase error:', error);

      if (error instanceof Error && error.message.includes('popup')) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Error",
          description: error instanceof Error ? error.message : 'Failed to create payment session',
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>

        {/* Configuration Status */}
        {!stripePaymentService.getStatus().configured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Configuration Required</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Stripe keys need to be configured for live payments.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Account Info */}
          {user && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Account</Label>
              <Badge variant="secondary">{user.email}</Badge>
            </div>
          )}

          {/* Credits Purchase Section */}
          <div className="space-y-6">
            {/* Credit Packages */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Popular Packages</Label>
              <div className="grid grid-cols-2 gap-3">
                {creditPackages.map((pkg) => (
                  <Card 
                    key={pkg.credits}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      parseInt(credits) === pkg.credits ? 'ring-2 ring-primary' : ''
                    } ${pkg.popular ? 'border-primary' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{pkg.credits} Credits</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            ${(pkg.price / pkg.credits).toFixed(2)} per credit
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${pkg.price}</div>
                          {pkg.popular && (
                            <Badge className="mt-1">Most Popular</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Custom Amount</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Number of Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    step="1"
                    value={credits}
                    onChange={(e) => handleCreditsChange(e.target.value)}
                    placeholder="Enter credits"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Amount</Label>
                  <Input
                    id="total"
                    value={`$${amount}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                $1.40 per credit • 1 credit = 1 premium backlink opportunity
              </p>
            </div>

            <Button
              onClick={handleCreditPurchase}
              disabled={loading || !credits || parseFloat(credits) <= 0}
              className="w-full h-12"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Opening Checkout...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Buy {credits || 0} Credits for ${amount || "0.00"}
                </div>
              )}
            </Button>

            {/* New Window Notice */}
            <div className="text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Opens secure Stripe checkout in new window</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secured by Stripe • 256-bit SSL encryption</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Checkout opens in new window for security</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
