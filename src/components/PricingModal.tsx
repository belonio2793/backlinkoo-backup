import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Repeat, 
  Wallet, 
  Calculator,
  Star,
  CheckCircle,
  Zap,
  DollarSign,
  ArrowRight,
  Info,
  Sparkles,
  Shield,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthFormTabs } from "@/components/shared/AuthFormTabs";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
  onAuthSuccess?: (user: any) => void;
  defaultTab?: "payment" | "subscription";
}

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerLink: number;
  description: string;
  popular?: boolean;
  savings?: string;
  features: string[];
}

export const PricingModal = ({
  isOpen,
  onClose,
  initialCredits,
  onAuthSuccess,
  defaultTab = "payment"
}: PricingModalProps) => {
  const CREDIT_PRICE = 1.40;
  
  const [step, setStep] = useState<"pricing" | "payment" | "auth">("pricing");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [customCredits, setCustomCredits] = useState(initialCredits || 200);
  const [paymentType, setPaymentType] = useState<"payment" | "subscription">(defaultTab);
  const [paymentMethod, setPaymentMethod] = useState<"stripe">("stripe");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCustomPlan, setShowCustomPlan] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Predefined pricing plans
  const pricingPlans: PricingPlan[] = [
    {
      id: 'starter_100',
      name: 'Starter 100',
      credits: 100,
      price: 140,
      pricePerLink: 1.40,
      description: 'Perfect for testing our platform',
      features: [
        'High DA backlinks',
        'Competitive analysis',
        'Real-time reporting',
        'Campaign management'
      ]
    },
    {
      id: 'starter_200',
      name: 'Starter 200',
      credits: 200,
      price: 280,
      pricePerLink: 1.40,
      description: 'Most popular starting package',
      popular: true,
      savings: 'Best Value',
      features: [
        'High DA backlinks',
        'Advanced analytics',
        'Priority support',
        'Campaign optimization'
      ]
    },
    {
      id: 'starter_300',
      name: 'Starter 300',
      credits: 300,
      price: 420,
      pricePerLink: 1.40,
      description: 'Maximum starter value',
      savings: 'Most Credits',
      features: [
        'High DA backlinks',
        'Full feature access',
        'Dedicated support',
        'Custom reporting'
      ]
    }
  ];

  const subscriptionPlans = {
    "premium-seo-tools": {
      price: 29,
      priceId: "price_1QadKgGdMlAQKJXmqzVCyLLZ", // Real Stripe price ID - update with your actual ID
      name: "Premium SEO Tools",
      description: "Access to all SEO tools and features"
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(user ? "pricing" : "pricing");
      setSelectedPlan("");
      setShowCustomPlan(false);
      if (initialCredits) {
        setCustomCredits(initialCredits);
      }
    }
  }, [isOpen, user, initialCredits]);

  // Calculate total price for custom credits
  const calculateCustomPrice = (credits: number) => {
    return (credits * CREDIT_PRICE).toFixed(2);
  };

  // Get final credits and price based on selection
  const getFinalCreditsAndPrice = () => {
    if (showCustomPlan) {
      return {
        credits: customCredits,
        price: parseFloat(calculateCustomPrice(customCredits))
      };
    }
    
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    return plan ? { credits: plan.credits, price: plan.price } : { credits: 0, price: 0 };
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowCustomPlan(false);
  };

  const handleCustomPlanSelect = () => {
    setShowCustomPlan(true);
    setSelectedPlan("");
  };

  const handleContinueToPayment = () => {
    const { credits, price } = getFinalCreditsAndPrice();
    
    if (credits <= 0 || price <= 0) {
      toast({
        title: "Please select a plan",
        description: "Choose a plan or enter custom credits to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setStep("auth");
    } else {
      setStep("payment");
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    onAuthSuccess?.(authenticatedUser);
    setStep("payment");
  };

  const handlePayment = async () => {
    const { credits, price } = getFinalCreditsAndPrice();

    if (credits <= 0) {
      toast({
        title: "Error",
        description: "Please select a valid plan or enter credits",
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
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: price,
          productName: `${credits} Backlink Credits`,
          isGuest,
          guestEmail: isGuest ? guestEmail : undefined,
          paymentMethod
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async () => {
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
      const plan = subscriptionPlans["premium-seo-tools"];
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: plan.priceId,
          tier: "premium-seo-tools",
          isGuest,
          guestEmail: isGuest ? guestEmail : undefined
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep("pricing");
    setSelectedPlan("");
    setShowCustomPlan(false);
    setCustomCredits(initialCredits || 200);
    setPaymentType(defaultTab);
    setIsGuest(false);
    setGuestEmail("");
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {step === "pricing" && "Choose Your Plan"}
            {step === "auth" && "Sign In or Create Account"}
            {step === "payment" && "Complete Your Purchase"}
          </DialogTitle>
        </DialogHeader>

        {step === "pricing" && (
          <div className="space-y-6">
            {/* Predefined Plans */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Starter Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedPlan === plan.id 
                        ? 'border-primary shadow-lg' 
                        : 'border-gray-200 hover:border-primary/50'
                    } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.popular && (
                          <Badge className="bg-primary text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {plan.savings && !plan.popular && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            {plan.savings}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-primary">
                          ${plan.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${plan.pricePerLink} per credit
                        </div>
                        <div className="text-2xl font-semibold">
                          {plan.credits} Credits
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-4 flex items-center justify-center">
                        <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={plan.id} id={plan.id} />
                            <Label htmlFor={plan.id} className="sr-only">Select {plan.name}</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Plan */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Custom Package</h3>
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  showCustomPlan 
                    ? 'border-primary shadow-lg' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={handleCustomPlanSelect}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroup value={showCustomPlan ? "custom" : ""} onValueChange={() => {}}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom" id="custom" />
                          <Label htmlFor="custom" className="sr-only">Select custom package</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Custom Credits
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Choose your exact credit amount</p>
                    </div>
                  </div>
                </CardHeader>
                
                {showCustomPlan && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="customCredits">Number of Credits</Label>
                        <Input
                          id="customCredits"
                          type="number"
                          min="1"
                          max="10000"
                          value={customCredits}
                          onChange={(e) => setCustomCredits(parseInt(e.target.value) || 0)}
                          placeholder="Enter credits"
                          className="text-lg font-semibold text-center"
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum: 1 credit • Maximum: 10,000 credits
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Total Price</Label>
                        <div className="p-3 bg-primary/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-primary">
                            ${calculateCustomPrice(customCredits)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customCredits} × $1.40 = ${calculateCustomPrice(customCredits)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          <span>1 credit = 1 premium backlink</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure checkout • Money-back guarantee</span>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinueToPayment}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!selectedPlan && !showCustomPlan}
                >
                  Continue to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "auth" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Sign in to your account or create a new one to continue with your purchase.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Track your orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Manage campaigns</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Access dashboard</span>
                </div>
              </div>
            </div>
            
            <AuthFormTabs
              onAuthSuccess={handleAuthSuccess}
              defaultTab="signup"
            />
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setStep("pricing")}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Plans
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="font-semibold">{getFinalCreditsAndPrice().credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per credit:</span>
                    <span>$1.40</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${getFinalCreditsAndPrice().price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as "payment" | "subscription")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  One-time Payment
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Subscription
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4 mt-4">
                {/* Checkout Type */}
                <div className="space-y-2">
                  <Label>Checkout Type</Label>
                  <RadioGroup
                    value={isGuest ? "guest" : "user"}
                    onValueChange={(value) => setIsGuest(value === "guest")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="user" />
                      <Label htmlFor="user">Account Checkout</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="guest" id="guest" />
                      <Label htmlFor="guest">Guest Checkout</Label>
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
                    />
                  </div>
                )}

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "stripe")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Credit Card (Stripe)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <TabsContent value="payment" className="space-y-4">
                  <Button 
                    onClick={handlePayment} 
                    disabled={loading || (isGuest && !guestEmail)}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Complete Purchase - ${getFinalCreditsAndPrice().price.toFixed(2)}
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4">
                  <div className="space-y-4">
                    <Card className="p-4 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Premium SEO Tools</div>
                          <div className="text-sm text-muted-foreground">
                            Access to all SEO tools and features
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">$29/mo</div>
                      </div>
                    </Card>
                  </div>
                  <Button 
                    onClick={handleSubscription} 
                    disabled={loading || (isGuest && !guestEmail)}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Repeat className="h-4 w-4 mr-2" />
                        Subscribe for $29/month
                      </>
                    )}
                  </Button>
                </TabsContent>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(user ? "pricing" : "auth")}
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Back
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
