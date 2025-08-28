import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, CheckCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { stripeWrapper } from "@/services/stripeWrapper";
import { useAuthModal } from "@/contexts/ModalContext";
import { setCheckoutIntent } from "@/utils/checkoutIntent";

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
  const { openLoginModal } = useAuthModal();

  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customCredits, setCustomCredits] = useState("300");
  const [totalPrice, setTotalPrice] = useState(420.00);
  const [rate] = useState(1.40);
  const [isLoading, setIsLoading] = useState(false);

  // Credit packages pricing - Uses live Stripe product prod_SoVoAb8dXp1cS0
  const creditPackages: CreditPackage[] = [
    { credits: 50, price: 70, pricePerCredit: 1.40 },
    { credits: 100, price: 140, pricePerCredit: 1.40 },
    { credits: 250, price: 350, pricePerCredit: 1.40 },
    { credits: 500, price: 700, pricePerCredit: 1.40 }
  ];

  // Initialize with passed credits or default
  useEffect(() => {
    if (initialCredits) {
      setCustomCredits(initialCredits.toString());
      setTotalPrice(initialCredits * rate);
      
      // Check if it matches a package
      const packageIndex = creditPackages.findIndex(pkg => pkg.credits === initialCredits);
      if (packageIndex !== -1) {
        setSelectedPackage(packageIndex);
      } else {
        setSelectedPackage(null);
      }
    }
  }, [initialCredits, rate]);

  // Update total price when custom credits change
  useEffect(() => {
    const credits = parseInt(customCredits) || 0;
    setTotalPrice(credits * rate);
  }, [customCredits, rate]);

  const handlePackageSelect = (index: number) => {
    const pkg = creditPackages[index];
    setSelectedPackage(index);
    setCustomCredits(pkg.credits.toString());
    setTotalPrice(pkg.price);
  };

  const handleCustomCreditsChange = (value: string) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomCredits(numericValue);
    setSelectedPackage(null); // Clear package selection for custom amount
  };

  const getCreditsAmount = (): number => {
    return parseInt(customCredits) || 0;
  };

  const getPriceAmount = (): number => {
    const credits = getCreditsAmount();
    
    // Check if it matches a preset package
    const preset = creditPackages.find(pkg => pkg.credits === credits);
    if (preset) {
      return preset.price;
    }
    
    // Use custom rate for non-preset amounts
    return Math.ceil(credits * rate);
  };

  const handlePurchase = async () => {
    // Require authentication for all purchases
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits",
        variant: "destructive",
      });
      return;
    }

    const credits = getCreditsAmount();

    if (credits <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of credits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      toast({
        title: "🚀 Opening Stripe Checkout",
        description: `Processing ${credits} credits purchase...`,
      });

      // Set checkout intent for return URL handling
      setCheckoutIntent({
        type: 'credits',
        amount: getPriceAmount(),
        credits,
        returnUrl: window.location.pathname
      });

      let result;

      // Use quickBuyCredits for preset amounts, createPayment for custom amounts
      const presetAmounts = [50, 100, 250, 500];
      if (presetAmounts.includes(credits)) {
        result = await stripeWrapper.quickBuyCredits(credits as 50 | 100 | 250 | 500, user.email);
      } else {
        const amount = getPriceAmount();
        result = await stripeWrapper.createPayment({
          amount,
          credits,
          productName: `${credits} Premium Backlink Credits`,
          isGuest: false,
          guestEmail: user.email
        });

        if (result.success && result.url) {
          stripeWrapper.openCheckoutWindow(result.url, result.sessionId);
        }
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      toast({
        title: "✅ Checkout Opened",
        description: "Complete your purchase in the new window",
      });

      // Close modal and call success callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to open checkout',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginThenPurchase = () => {
    openLoginModal(() => {
      // After login, automatically trigger purchase
      setTimeout(() => {
        handlePurchase();
      }, 1000);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Backlink Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preset Packages */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose a Package</Label>
            <div className="grid grid-cols-2 gap-3">
              {creditPackages.map((pkg, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedPackage === index 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handlePackageSelect(index)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-semibold">{pkg.credits} Credits</div>
                    <div className="text-2xl font-bold text-primary">${pkg.price}</div>
                    <div className="text-sm text-muted-foreground">${pkg.pricePerCredit.toFixed(2)} per credit</div>
                    {index === 1 && (
                      <div className="mt-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Amount */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Or Enter Custom Amount</Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  value={customCredits}
                  onChange={(e) => handleCustomCreditsChange(e.target.value)}
                  placeholder="Enter number of credits"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  Credits
                </span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">
                  ${getPriceAmount().toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  (${rate.toFixed(2)} per credit)
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Security & Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Secure payment processing via Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Credits never expire</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Instant credit activation</span>
            </div>
          </div>

          {/* Purchase Button */}
          <div className="space-y-3">
            {user ? (
              <Button
                onClick={handlePurchase}
                disabled={isLoading || getCreditsAmount() <= 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase {getCreditsAmount()} Credits - ${getPriceAmount().toFixed(2)}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleLoginThenPurchase}
                disabled={isLoading || getCreditsAmount() <= 0}
                className="w-full"
                size="lg"
              >
                Login & Purchase {getCreditsAmount()} Credits - ${getPriceAmount().toFixed(2)}
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Powered by Stripe • Secure checkout in new window
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
