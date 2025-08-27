import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, CheckCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CreditPaymentService } from "@/services/creditPaymentService";

interface ModernCreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
  onSuccess?: () => void;
}

interface CreditPackage {
  credits: number;
  price: number;
  pricePerCredit: number;
}

export function ModernCreditPurchaseModal({
  isOpen,
  onClose,
  initialCredits,
  onSuccess
}: ModernCreditPurchaseModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customCredits, setCustomCredits] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [rate, setRate] = useState(1.40);
  const [isLoading, setIsLoading] = useState(false);

  const creditPackages: CreditPackage[] = [
    { credits: 50, price: 70, pricePerCredit: 1.40 },
    { credits: 100, price: 140, pricePerCredit: 1.40 },
    { credits: 250, price: 350, pricePerCredit: 1.40 },
    { credits: 500, price: 700, pricePerCredit: 1.40 }
  ];

  const featuresIncluded = [
    "High DA backlinks",
    "Automated content generation", 
    "Real-time campaign tracking",
    "Detailed performance reports",
    "White-hat SEO practices",
    "Multi-platform distribution"
  ];

  // Calculate total price for custom amount
  useEffect(() => {
    const credits = parseInt(customCredits) || 0;
    setTotalPrice(credits * rate);
  }, [customCredits, rate]);

  // Set initial credits if provided
  useEffect(() => {
    if (isOpen && initialCredits) {
      setCustomCredits(initialCredits.toString());
      setSelectedPackage(null);
    }
  }, [isOpen, initialCredits]);

  const handlePackageSelect = (packageIndex: number) => {
    setSelectedPackage(packageIndex);
    setCustomCredits("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomCredits(value);
    setSelectedPackage(null);
  };

  const getFinalSelection = () => {
    if (selectedPackage !== null) {
      const pkg = creditPackages[selectedPackage];
      return {
        credits: pkg.credits,
        price: pkg.price
      };
    }
    
    if (customCredits && parseInt(customCredits) > 0) {
      return {
        credits: parseInt(customCredits),
        price: totalPrice
      };
    }
    
    return null;
  };

  const handlePurchase = async () => {
    const selection = getFinalSelection();
    
    if (!selection) {
      toast({
        title: "Selection Required",
        description: "Please select a credit package or enter a custom amount",
        variant: "destructive"
      });
      return;
    }

    if (selection.credits <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of credits (minimum 1)",
        variant: "destructive"
      });
      return;
    }

    if (selection.credits > 10000) {
      toast({
        title: "Maximum Exceeded", 
        description: "Maximum 10,000 credits per purchase. Please contact support for larger amounts.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      toast({
        title: "🚀 Opening Stripe Checkout",
        description: "Secure payment window is opening...",
      });

      const result = await CreditPaymentService.createCreditPayment(
        user,
        !user,
        user?.email,
        {
          amount: selection.price,
          credits: selection.credits,
          productName: `${selection.credits} Premium Backlink Credits`,
          isGuest: !user,
          guestEmail: user?.email
        }
      );

      if (result.success) {
        if (result.url) {
          console.log('🚀 Opening checkout window:', result.url);
          CreditPaymentService.openCheckoutWindow(result.url, result.sessionId);

          toast({
            title: "✅ Checkout Opened Successfully",
            description: "Complete your payment in the new window.",
          });

          // Don't auto-close the modal immediately - let user complete payment first
          if (onSuccess) {
            onSuccess();
          }
        } else if (result.usedFallback) {
          toast({
            title: "🧪 Development Mode",
            description: "Test checkout opened in new window.",
          });

          if (onSuccess) {
            onSuccess();
          }
        }

        // Only close the modal after a delay to let the checkout window open
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Credit purchase error:', error);

      // Get user-friendly error message
      let errorMessage = 'Failed to create payment session';
      let errorTitle = 'Payment Error';

      if (error instanceof Error) {
        if (error.message.includes('popup') || error.message.includes('blocked')) {
          errorTitle = 'Popup Blocked';
          errorMessage = 'Please allow popups for this site and try again.';
        } else if (error.message.includes('configuration') || error.message.includes('not configured')) {
          errorTitle = 'Configuration Error';
          errorMessage = 'Payment system is not properly configured. Please contact support.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Please check your internet connection and try again.';
        } else if (error.message.includes('authentication') || error.message.includes('sign in')) {
          errorTitle = 'Authentication Required';
          errorMessage = 'Please sign in to your account and try again.';
        } else {
          errorMessage = error.message;
        }
      } else {
        // Handle non-Error objects
        errorMessage = String(error);
      }

      // Log detailed error for debugging
      console.error('Detailed error info:', {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selection = getFinalSelection();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Buy Credits</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Section */}
          {user && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Account</Label>
              <div className="text-sm text-gray-600">{user.email}</div>
            </div>
          )}

          {/* Select Credit Package */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Select Credit Package</Label>
            <div className="grid grid-cols-4 gap-4">
              {creditPackages.map((pkg, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedPackage === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePackageSelect(index)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="font-semibold text-gray-900">{pkg.credits} Credits</div>
                    <div className="text-2xl font-bold text-blue-600">${pkg.price}</div>
                    <div className="text-xs text-gray-500">${pkg.pricePerCredit.toFixed(2)} per credit</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Amount */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Custom Amount</Label>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customCredits" className="text-sm font-medium text-gray-700">
                  Number of Credits
                </Label>
                <Input
                  id="customCredits"
                  type="number"
                  min="1"
                  max="10000"
                  value={customCredits}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Enter custom amount"
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Total Price</Label>
                <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center text-lg font-semibold text-blue-600">
                  ${totalPrice.toFixed(2)}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Rate</Label>
                <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center text-lg font-semibold text-gray-700">
                  ${rate.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 text-center">per credit</div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">What's Included</Label>
            <div className="grid grid-cols-3 gap-3">
              {featuresIncluded.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={isLoading || !selection}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Opening Secure Checkout...
              </div>
            ) : selection ? (
              `Buy ${selection.credits} Credits for $${selection.price}`
            ) : (
              "Select Credits to Continue"
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Secured by Stripe • 256-bit SSL encryption</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
