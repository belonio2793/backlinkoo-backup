import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Repeat, Wallet, Crown, Zap, Infinity, Shield, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { stripePaymentService } from "@/services/stripePaymentService";
import { useAuth } from "@/hooks/useAuth";

interface ImprovedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
  defaultTab?: 'credits' | 'premium';
}

export const ImprovedPaymentModal = ({ 
  isOpen, 
  onClose, 
  initialCredits, 
  defaultTab = 'credits' 
}: ImprovedPaymentModalProps) => {
  const CREDIT_PRICE = 1.40;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [paymentType, setPaymentType] = useState<"credits" | "premium">(defaultTab);
  const [isGuest, setIsGuest] = useState(!user);
  const [guestEmail, setGuestEmail] = useState("");
  const [amount, setAmount] = useState(() => initialCredits ? (initialCredits * CREDIT_PRICE).toFixed(2) : "");
  const [credits, setCredits] = useState(() => initialCredits ? initialCredits.toString() : "");
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  // Credit packages
  const creditPackages = [
    { credits: 50, price: 70, popular: false, savings: 0 },
    { credits: 100, price: 140, popular: true, savings: 0 },
    { credits: 250, price: 350, popular: false, savings: 0 },
    { credits: 500, price: 700, popular: false, savings: 0 }
  ];

  // Premium plans
  const premiumPlans = {
    monthly: {
      price: 29,
      originalPrice: 49,
      period: 'month',
      discount: 41,
      popular: false
    },
    yearly: {
      price: 290,
      originalPrice: 588,
      period: 'year',
      discount: 51,
      savings: 298,
      popular: true
    }
  };

  const premiumFeatures = [
    { icon: <Infinity className="h-4 w-4" />, text: "Unlimited Backlinks" },
    { icon: <Star className="h-4 w-4" />, text: "Complete SEO Academy" },
    { icon: <Zap className="h-4 w-4" />, text: "Advanced Analytics" },
    { icon: <Shield className="h-4 w-4" />, text: "Priority Support" },
  ];


  // Update state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsGuest(!user);
      if (initialCredits && initialCredits > 0) {
        setCredits(initialCredits.toString());
        setAmount((initialCredits * CREDIT_PRICE).toFixed(2));
        setPaymentType('credits');
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

    if (isGuest && !guestEmail) {
      toast({
        title: "Error", 
        description: "Email is required for guest checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "🚀 Opening Checkout",
        description: "Redirecting to secure Stripe checkout...",
      });

      const result = await stripePaymentService.createPayment({
        amount: parseFloat(amount),
        credits: parseInt(credits),
        productName: `${credits} Premium Backlink Credits`,
        type: 'credits',
        isGuest,
        guestEmail: isGuest ? guestEmail : undefined
      });

      if (result.success) {
        toast({
          title: "✅ Payment Processing",
          description: "Your payment is being processed. Credits will be added shortly.",
        });
        onClose();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'Failed to create payment session',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle premium subscription
  const handlePremiumPurchase = async () => {
    if (isGuest && !guestEmail) {
      toast({
        title: "Error",
        description: "Email is required for guest checkout", 
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "🚀 Opening Checkout",
        description: "Redirecting to secure Stripe subscription checkout...",
      });

      const result = await stripePaymentService.createSubscription({
        plan: selectedPlan,
        amount: premiumPlans[selectedPlan].price,
        type: 'subscription',
        isGuest,
        guestEmail: isGuest ? guestEmail : undefined
      });

      if (result.success) {
        toast({
          title: "✅ Subscription Processing",
          description: `Your premium ${selectedPlan} plan is being activated.`,
        });
        onClose();
      } else {
        throw new Error(result.error || 'Subscription failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : 'Failed to create subscription',
        variant: "destructive",
      });
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
            Choose Your Plan
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

        <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as "credits" | "premium")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Buy Credits
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Premium Subscription
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6 mt-6">
            {/* User/Guest Toggle */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Account Type</Label>
              <RadioGroup
                value={isGuest ? "guest" : "user"}
                onValueChange={(value) => setIsGuest(value === "guest")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user">Logged in account</Label>
                  {user && <Badge variant="secondary">{user.email}</Badge>}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="guest" id="guest" />
                  <Label htmlFor="guest">Guest checkout</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Guest Email */}
            {isGuest && (
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email Address</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            )}

            <TabsContent value="credits" className="space-y-6">
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
                    Processing...
                  </div>
                ) : (
                  `Buy ${credits || 0} Credits for $${amount || "0.00"}`
                )}
              </Button>
            </TabsContent>

            <TabsContent value="premium" className="space-y-6">
              {/* Plan Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Choose Your Plan</Label>
                <div className="space-y-3">
                  {Object.entries(premiumPlans).map(([key, plan]) => (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlan === key ? 'ring-2 ring-primary' : ''
                      } ${plan.popular ? 'border-primary' : ''}`}
                      onClick={() => setSelectedPlan(key as 'monthly' | 'yearly')}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg capitalize">{key} Plan</CardTitle>
                              {plan.popular && (
                                <Badge className="bg-primary">Most Popular</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Billed {plan.period}ly
                            </p>
                            {plan.savings && (
                              <p className="text-sm text-green-600 font-medium">
                                Save ${plan.savings} per year!
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">${plan.price}</div>
                            <div className="text-sm text-muted-foreground">
                              per {plan.period}
                            </div>
                            {key === 'yearly' && (
                              <div className="text-sm text-green-600">
                                (${Math.round(plan.price / 12)}/month)
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Premium Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="text-primary">{feature.icon}</div>
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handlePremiumPurchase} 
                disabled={loading}
                className="w-full h-12"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Get Premium {selectedPlan} - ${premiumPlans[selectedPlan].price}
                  </div>
                )}
              </Button>
            </TabsContent>
          </div>
        </Tabs>

        {/* Security Notice */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secured by Stripe • 256-bit SSL encryption</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
