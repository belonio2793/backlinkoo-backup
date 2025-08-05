import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthFormTabs } from '@/components/shared/AuthFormTabs';
import { paymentConfigService } from '@/services/paymentConfigService';
import {
  Crown,
  CreditCard,
  Shield,
  CheckCircle,
  X,
  Lock,
  Star,
  Infinity,
  BookOpen,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  Wallet,
  Calculator,
  DollarSign,
  Info,
  Calendar,
  Clock,
  Repeat
} from 'lucide-react';

interface EnhancedUnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: 'credits' | 'premium';
  initialCredits?: number;
  redirectAfterSuccess?: string;
}

type FlowStep = 'selection' | 'auth' | 'payment' | 'processing' | 'success';
type PaymentType = 'credits' | 'premium';
type PaymentMethod = 'stripe' | 'paypal';
type CheckoutType = 'user' | 'guest';

interface PremiumPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  savings?: number;
  discount?: number;
  popular?: boolean;
}

interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
  savings?: string;
}

export function EnhancedUnifiedPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultTab = 'premium',
  initialCredits,
  redirectAfterSuccess = '/dashboard'
}: EnhancedUnifiedPaymentModalProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Flow management
  const [currentStep, setCurrentStep] = useState<FlowStep>('selection');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Payment configuration
  const [paymentType, setPaymentType] = useState<PaymentType>(defaultTab);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [checkoutType, setCheckoutType] = useState<CheckoutType>('user');
  
  // Premium subscription state
  const [selectedPremiumPlan, setSelectedPremiumPlan] = useState<'monthly' | 'yearly'>('monthly');
  
  // Credits state
  const [selectedCreditPlan, setSelectedCreditPlan] = useState<string>('');
  const [customCredits, setCustomCredits] = useState(initialCredits || 200);
  const [showCustomCredits, setShowCustomCredits] = useState(false);
  
  // Guest checkout
  const [guestEmail, setGuestEmail] = useState('');

  // Payment method availability
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<('stripe' | 'paypal')[]>([]);

  const CREDIT_PRICE = 0.70;

  // Premium plans configuration
  const premiumPlans: Record<'monthly' | 'yearly', PremiumPlan> = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 29,
      originalPrice: 49,
      period: 'month',
      discount: 41,
      popular: true
    },
    yearly: {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 290,
      originalPrice: 588,
      period: 'year',
      savings: 298,
      discount: 51,
      popular: false
    }
  };

  // Credit plans configuration
  const creditPlans: CreditPlan[] = [
    {
      id: 'starter_100',
      name: 'Starter 100',
      credits: 100,
      price: 70,
      pricePerCredit: 0.70
    },
    {
      id: 'starter_200',
      name: 'Starter 200',
      credits: 200,
      price: 140,
      pricePerCredit: 0.70,
      popular: true,
      savings: 'Most Popular'
    },
    {
      id: 'starter_300',
      name: 'Starter 300',
      credits: 300,
      price: 210,
      pricePerCredit: 0.70,
      savings: 'Best Value'
    }
  ];

  const premiumFeatures = [
    { icon: <Infinity className="h-4 w-4" />, text: "Unlimited Backlinks" },
    { icon: <BookOpen className="h-4 w-4" />, text: "Complete SEO Academy (50+ Lessons)" },
    { icon: <TrendingUp className="h-4 w-4" />, text: "Advanced Analytics & Reports" },
    { icon: <Users className="h-4 w-4" />, text: "Priority 24/7 Support" },
    { icon: <Shield className="h-4 w-4" />, text: "White-Hat Guarantee" },
    { icon: <Target className="h-4 w-4" />, text: "Custom Campaign Strategies" },
    { icon: <Star className="h-4 w-4" />, text: "Professional Certifications" },
    { icon: <Zap className="h-4 w-4" />, text: "API Access & Integrations" }
  ];

  const creditFeatures = [
    'High DA backlinks',
    'Competitive analysis', 
    'Real-time reporting',
    'Campaign management',
    'Advanced targeting',
    'Quality assurance'
  ];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(isAuthenticated ? 'selection' : 'selection');
      setIsProcessing(false);
      setCheckoutType(isAuthenticated ? 'user' : 'user');
      if (initialCredits) {
        setCustomCredits(initialCredits);
        setShowCustomCredits(true);
        setPaymentType('credits');
      }
    }
  }, [isOpen, isAuthenticated, initialCredits]);

  // Helper functions
  const calculateCustomPrice = (credits: number) => (credits * CREDIT_PRICE).toFixed(2);

  const getFinalSelection = () => {
    if (paymentType === 'premium') {
      return {
        type: 'premium',
        plan: premiumPlans[selectedPremiumPlan],
        price: premiumPlans[selectedPremiumPlan].price
      };
    } else {
      if (showCustomCredits) {
        return {
          type: 'credits',
          credits: customCredits,
          price: parseFloat(calculateCustomPrice(customCredits))
        };
      } else {
        const plan = creditPlans.find(p => p.id === selectedCreditPlan);
        return plan ? {
          type: 'credits',
          credits: plan.credits,
          price: plan.price
        } : null;
      }
    }
  };

  // Payment processing
  const handlePayment = async () => {
    const selection = getFinalSelection();
    if (!selection) {
      toast({
        title: "Selection Required",
        description: "Please select a plan to continue.",
        variant: "destructive"
      });
      return;
    }

    if (checkoutType === 'guest' && !guestEmail) {
      toast({
        title: "Email Required",
        description: "Please provide an email address for guest checkout.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      const isGuest = checkoutType === 'guest';
      const email = isGuest ? guestEmail : user?.email;

      if (selection.type === 'premium') {
        // Handle premium subscription
        const { data, error } = await supabase.functions.invoke('create-subscription', {
          body: {
            priceId: `price_premium_${selection.plan.id}`, // This should match your Stripe price IDs
            tier: 'premium-seo-tools',
            isGuest,
            guestEmail: isGuest ? guestEmail : undefined
          }
        });

        if (error) throw error;
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } else {
        // Handle credit purchase
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: selection.price,
            productName: `${selection.credits} Backlink Credits`,
            isGuest,
            guestEmail: isGuest ? guestEmail : undefined,
            paymentMethod
          }
        });

        if (error) throw error;
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      setCurrentStep('success');
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Payment processing failed. Please try again.",
        variant: "destructive"
      });
      setCurrentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    const selection = getFinalSelection();
    if (!selection) {
      toast({
        title: "Selection Required",
        description: "Please select a plan to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!isAuthenticated && checkoutType === 'user') {
      setCurrentStep('auth');
    } else {
      setCurrentStep('payment');
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setCurrentStep('payment');
  };

  const handleClose = () => {
    setCurrentStep('selection');
    setIsProcessing(false);
    setSelectedCreditPlan('');
    setShowCustomCredits(false);
    setCustomCredits(initialCredits || 200);
    setGuestEmail('');
    onClose();
  };

  // Render functions
  const renderSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
        </div>
        <p className="text-muted-foreground">
          Select premium subscription or purchase credits for your campaigns
        </p>
        {user && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              ✅ Signed in as <strong>{user.email}</strong>
            </p>
          </div>
        )}
      </div>

      <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="premium" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Premium Subscription
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Credits Purchase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(premiumPlans).map(([key, plan]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPremiumPlan === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPremiumPlan(key as 'monthly' | 'yearly')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.popular && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        🔥 Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">per {plan.period}</span>
                    {plan.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${plan.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  {plan.savings && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ${plan.savings} per year ({plan.discount}% off)
                    </div>
                  )}
                  
                  {key === 'yearly' && (
                    <div className="text-sm text-blue-600">
                      That's just ${(plan.price / 12).toFixed(0)}/month!
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Premium Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          {/* Predefined Credit Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creditPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedCreditPlan === plan.id 
                    ? 'border-primary shadow-lg' 
                    : 'border-gray-200 hover:border-primary/50'
                } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => {
                  setSelectedCreditPlan(plan.id);
                  setShowCustomCredits(false);
                }}
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
                      ${plan.pricePerCredit} per credit
                    </div>
                    <div className="text-2xl font-semibold">
                      {plan.credits} Credits
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Custom Credits */}
          <Card 
            className={`cursor-pointer transition-all border-2 ${
              showCustomCredits 
                ? 'border-primary shadow-lg' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => {
              setShowCustomCredits(true);
              setSelectedCreditPlan('');
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <RadioGroup value={showCustomCredits ? "custom" : ""} onValueChange={() => {}}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="sr-only">Select custom credits</Label>
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
            
            {showCustomCredits && (
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
                        ${calculateCustomPrice(customCredits)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customCredits} × $0.70 = ${calculateCustomPrice(customCredits)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Credit Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {creditFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Checkout Type Selection */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-base font-medium">Checkout Type</Label>
          <RadioGroup value={checkoutType} onValueChange={(value) => setCheckoutType(value as CheckoutType)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user" />
              <Label htmlFor="user">Account Checkout {!isAuthenticated && "(Sign in required)"}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="guest" id="guest" />
              <Label htmlFor="guest">Guest Checkout</Label>
            </div>
          </RadioGroup>
          
          {checkoutType === 'guest' && (
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
        </div>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={handleContinue}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        size="lg"
        disabled={!getFinalSelection() || (checkoutType === 'guest' && !guestEmail)}
      >
        Continue to Payment
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderAuth = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Sign In Required</h3>
        <p className="text-muted-foreground">
          Sign in to your account or create a new one to continue with your purchase.
        </p>
      </div>
      
      <AuthFormTabs
        onAuthSuccess={handleAuthSuccess}
        defaultTab="signup"
      />
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('selection')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to Selection
        </Button>
      </div>
    </div>
  );

  const renderPayment = () => {
    const selection = getFinalSelection();
    if (!selection) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-bold">Complete Your Purchase</h3>
          <p className="text-muted-foreground">
            Review your selection and choose payment method
          </p>
        </div>

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
              {selection.type === 'premium' ? (
                <>
                  <div className="flex justify-between">
                    <span>Premium Plan ({selection.plan.name}):</span>
                    <span className="font-semibold">${selection.plan.price}</span>
                  </div>
                  {selection.plan.savings && (
                    <div className="flex justify-between text-green-600">
                      <span>Annual Savings:</span>
                      <span>-${selection.plan.savings}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="font-semibold">{selection.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per credit:</span>
                    <span>$0.70</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${selection.price.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => setPaymentMethod('stripe')}>
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer flex-1">
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Credit Card (Stripe)</div>
                    <div className="text-sm text-gray-500">Secure payment with cards, Apple Pay, Google Pay</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => setPaymentMethod('paypal')}>
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Wallet className="w-5 h-5" />
                  <div>
                    <div className="font-medium">PayPal</div>
                    <div className="text-sm text-gray-500">Pay with your PayPal account</div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">Secure Payment Processing</div>
              <div className="text-sm text-blue-700">
                Your payment is processed securely with 256-bit SSL encryption
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Complete Secure Payment - ${selection.price.toFixed(2)}
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => setCurrentStep('selection')}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
          >
            Back to Selection
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Processing Your Payment</h3>
        <p className="text-muted-foreground">
          Please wait while we process your payment...
        </p>
      </div>
      
      <div className="text-sm text-muted-foreground">
        This may take a few moments. Please don't close this window.
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <CheckCircle className="h-16 w-16 text-green-600" />
          <div className="absolute -top-2 -right-2">
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-green-600">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Your purchase has been completed successfully.
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-green-900">What's Next?</h4>
        <p className="text-sm text-green-700">
          Your account has been updated and you can now access your features.
        </p>
      </div>
      
      <Button
        onClick={() => {
          navigate(redirectAfterSuccess);
          handleClose();
          onSuccess?.();
        }}
        className="bg-green-600 hover:bg-green-700"
      >
        Go to Dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'selection':
        return renderSelection();
      case 'auth':
        return renderAuth();
      case 'payment':
        return renderPayment();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      default:
        return renderSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="sr-only">Enhanced Payment Modal</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="pt-2">
          {getStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedUnifiedPaymentModal;
