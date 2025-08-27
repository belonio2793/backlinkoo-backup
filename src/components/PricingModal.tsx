import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Wallet, 
  Calculator,
  Star,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutAuthForm } from "@/components/CheckoutAuthForm";
import MobilePaymentHandler from "@/utils/mobilePaymentHandler";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
  onAuthSuccess?: (user: any) => void;
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
  onAuthSuccess
}: PricingModalProps) => {
  const CREDIT_PRICE = 1.40;
  
  const [step, setStep] = useState<"pricing" | "payment" | "auth">("pricing");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [customCredits, setCustomCredits] = useState(initialCredits || 200);
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
        'Competitive analysis',
        'Real-time reporting',
        'Campaign management',
        'Priority support'
      ]
    },
    {
      id: 'starter_500',
      name: 'Starter 500',
      credits: 500,
      price: 700,
      pricePerLink: 1.40,
      description: 'Perfect for small agencies',
      features: [
        'High DA backlinks',
        'Competitive analysis',
        'Real-time reporting',
        'Campaign management',
        'Priority support',
        'White-label reporting'
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowCustomPlan(false);
  };

  const handleCustomPlanSelect = () => {
    setShowCustomPlan(true);
    setSelectedPlan("");
  };

  const getFinalCreditsAndPrice = () => {
    if (showCustomPlan) {
      return {
        credits: customCredits,
        price: customCredits * CREDIT_PRICE
      };
    }
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    return plan ? { credits: plan.credits, price: plan.price } : { credits: 0, price: 0 };
  };

  const handleContinueToCheckout = () => {
    if (!user) {
      setStep("auth");
    } else {
      setStep("payment");
    }
  };

  const handleAuthSuccess = (user: any) => {
    setStep("payment");
    if (onAuthSuccess) {
      onAuthSuccess(user);
    }
  };

  const handlePayment = async () => {
    const { credits, price } = getFinalCreditsAndPrice();
    
    if (!credits || credits <= 0) {
      toast({
        title: "Error",
        description: "Please select a valid plan",
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
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price,
          productName: `${credits} Backlink Credits`,
          credits: credits,
          isGuest,
          guestEmail: isGuest ? guestEmail : undefined,
          paymentMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.url) {
        await MobilePaymentHandler.handlePaymentRedirect({
          url: data.url,
          onSuccess: () => {
            console.log('✅ Payment redirect successful');
            onClose();
          },
          onError: (error) => {
            console.error('❌ Payment redirect failed:', error);
            toast({
              title: "Redirect Failed",
              description: "Trying alternative redirect method...",
              variant: "destructive",
            });
            window.location.href = data.url;
          }
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment",
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
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
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
                          ${`${plan.pricePerLink} per credit`}
                        </div>
                        <div className="text-2xl font-semibold">
                          {`${plan.credits} Credits`}
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
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Total Price</Label>
                        <div className="p-3 bg-primary/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-primary">
                            ${(customCredits * CREDIT_PRICE).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {`${customCredits} × $1.40 = $${(customCredits * CREDIT_PRICE).toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Continue Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleContinueToCheckout}
                size="lg"
                className="bg-primary hover:bg-primary/90"
                disabled={!selectedPlan && !showCustomPlan}
              >
                Continue to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "auth" && (
          <div className="space-y-6">
            <CheckoutAuthForm
              onAuthSuccess={handleAuthSuccess}
              defaultTab="signup"
              orderSummary={{
                credits: getFinalCreditsAndPrice().credits,
                price: getFinalCreditsAndPrice().price,
                planName: showCustomPlan ? `Custom ${getFinalCreditsAndPrice().credits} Credits` : pricingPlans.find(p => p.id === selectedPlan)?.name
              }}
            />

            <div className="flex justify-center pt-4 border-t">
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
            <div className="space-y-4">
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
                    placeholder="Enter your email for receipt"
                    required
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

              {/* Purchase Button */}
              <Button 
                onClick={handlePayment} 
                disabled={loading || (isGuest && !guestEmail)}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Buy {getFinalCreditsAndPrice().credits} Credits for ${getFinalCreditsAndPrice().price.toFixed(2)}
                  </div>
                )}
              </Button>

              {/* Back Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(user ? "pricing" : "auth")}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
