import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SubscriptionService from '@/services/subscriptionService';
import { EnhancedSubscriptionService } from '@/services/enhancedSubscriptionService';
import { PremiumUpgradeService } from '@/services/premiumUpgradeService';
import { userService } from '@/services/userService';
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
  Wallet
} from 'lucide-react';

interface StreamlinedPremiumCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectAfterSuccess?: string;
}

type FlowStep = 'plan-selection' | 'payment-method' | 'checkout' | 'processing' | 'success';
type PaymentMethod = 'stripe' | 'paypal';

export function StreamlinedPremiumCheckout({ 
  isOpen, 
  onClose, 
  onSuccess,
  redirectAfterSuccess = '/dashboard'
}: StreamlinedPremiumCheckoutProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('plan-selection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  const plans = {
    monthly: {
      price: 29,
      originalPrice: 49,
      period: 'month',
      savings: null,
      popular: true,
      discount: 41
    },
    yearly: {
      price: 290,
      originalPrice: 588,
      period: 'year',
      savings: 298,
      popular: false,
      discount: 51
    }
  };

  const features = [
    { icon: <Infinity className="h-4 w-4" />, text: "Unlimited Backlinks" },
    { icon: <BookOpen className="h-4 w-4" />, text: "Complete SEO Academy (50+ Lessons)" },
    { icon: <TrendingUp className="h-4 w-4" />, text: "Advanced Analytics & Reports" },
    { icon: <Users className="h-4 w-4" />, text: "Priority 24/7 Support" },
    { icon: <Shield className="h-4 w-4" />, text: "White-Hat Guarantee" },
    { icon: <Target className="h-4 w-4" />, text: "Custom Campaign Strategies" },
    { icon: <Star className="h-4 w-4" />, text: "Professional Certifications" },
    { icon: <Zap className="h-4 w-4" />, text: "API Access & Integrations" }
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade to Premium.",
        variant: "destructive"
      });
      onClose();
      navigate('/login');
    }
  }, [isOpen, isAuthenticated, toast, onClose, navigate]);

  // Store upgrade intent
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      PremiumUpgradeService.storeUpgradeIntent({
        plan: selectedPlan,
        redirectUrl: redirectAfterSuccess
      });
    }
  }, [isOpen, isAuthenticated, selectedPlan, redirectAfterSuccess]);

  // Handle checkout process
  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your purchase.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      // Try enhanced subscription service first
      const result = await EnhancedSubscriptionService.createSubscription(user, {
        plan: selectedPlan,
        paymentMethod,
        isGuest: false
      });

      if (result.success && result.url) {
        // Redirect to payment provider
        toast({
          title: "Redirecting to Payment",
          description: `Opening secure ${paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'} checkout...`,
        });

        window.location.href = result.url;
        return;
      }

      // If enhanced service fails, try fallback
      if (!result.success) {
        console.warn('Enhanced service failed, trying fallback...', result.error);

        const fallbackResult = await SubscriptionService.createSubscription(user, false);

        if (fallbackResult.success) {
          if (fallbackResult.url && !fallbackResult.usedFallback) {
            window.location.href = fallbackResult.url;
            return;
          } else if (fallbackResult.usedFallback) {
            // Direct upgrade via fallback
            setCurrentStep('success');

            toast({
              title: "Premium Activated!",
              description: "Your account has been upgraded to Premium successfully.",
            });

            setTimeout(() => {
              navigate(redirectAfterSuccess);
              onClose();
              onSuccess?.();
            }, 2000);
            return;
          }
        }
      }

      // If all methods fail
      toast({
        title: "Payment Setup Failed",
        description: result.error || "Unable to process payment. Please contact support.",
        variant: "destructive"
      });
      setCurrentStep('checkout');

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred during payment.",
        variant: "destructive"
      });
      setCurrentStep('checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset modal state when closed
  const handleClose = () => {
    setCurrentStep('plan-selection');
    setIsProcessing(false);
    setSelectedPlan('monthly');
    setPaymentMethod('stripe');
    onClose();
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Premium Plan
          </h2>
        </div>
        <p className="text-muted-foreground">
          Choose your plan and upgrade instantly
        </p>
        {user && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              ✅ Signed in as <strong>{user.email}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Plan Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(plans).map(([key, plan]) => (
          <Card 
            key={key}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPlan === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedPlan(key as 'monthly' | 'yearly')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{key} Plan</CardTitle>
                {plan.popular && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    🔥 Most Popular
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

      {/* Features List */}
      <div className="space-y-3">
        <h3 className="font-semibold">What's Included:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <Button 
        onClick={() => setCurrentStep('payment-method')}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        size="lg"
      >
        Continue with {selectedPlan} Plan
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderPaymentMethod = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold">Choose Payment Method</h3>
        <p className="text-muted-foreground">
          Select your preferred payment method
        </p>
      </div>

      <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium capitalize">{selectedPlan} Plan</span>
            <Badge variant="secondary">
              {plans[selectedPlan].popular ? 'Most Popular' : 'Best Value'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">${plans[selectedPlan].price}</span>
            <span className="text-muted-foreground">per {plans[selectedPlan].period}</span>
          </div>
          
          {plans[selectedPlan].savings && (
            <div className="text-sm text-green-600">
              Save ${plans[selectedPlan].savings} per year
            </div>
          )}
        </div>
      </Card>

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
                  <div className="text-sm text-gray-500">Pay with your PayPal account or PayPal Credit</div>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={() => setCurrentStep('plan-selection')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep('checkout')}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderCheckout = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold">Secure Checkout</h3>
        <p className="text-muted-foreground">
          Review and confirm your purchase
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Premium Plan ({selectedPlan})</span>
            <span className="font-semibold">${plans[selectedPlan].price}</span>
          </div>
          {selectedPlan === 'yearly' && plans.yearly.savings && (
            <div className="flex justify-between text-green-600">
              <span>Annual Savings</span>
              <span>-${plans.yearly.savings}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${plans[selectedPlan].price}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {paymentMethod === 'stripe' ? (
              <>
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Stripe Checkout</div>
                  <div className="text-sm text-blue-700">Secure payment with 256-bit SSL encryption</div>
                </div>
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">PayPal Checkout</div>
                  <div className="text-sm text-blue-700">Pay with your PayPal account</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      {user && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Account: {user.email}</div>
                <div className="text-sm text-green-700">Premium features will be activated immediately</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Button 
          onClick={handleCheckout}
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
              Complete Secure Checkout
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => setCurrentStep('payment-method')}
          variant="outline"
          className="w-full"
          disabled={isProcessing}
        >
          Back to Payment Method
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          🔒 Secured by 256-bit SSL encryption<br />
          Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Processing Your Upgrade</h3>
        <p className="text-muted-foreground">
          Setting up your premium account...
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
        <h3 className="text-2xl font-bold text-green-600">Premium Activated!</h3>
        <p className="text-muted-foreground">
          Welcome to Premium! Your account has been upgraded.
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-green-900">What's Next?</h4>
        <p className="text-sm text-green-700">
          You now have access to all premium features. Redirecting to your dashboard...
        </p>
      </div>
      
      <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'plan-selection':
        return renderPlanSelection();
      case 'payment-method':
        return renderPaymentMethod();
      case 'checkout':
        return renderCheckout();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      default:
        return renderPlanSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="sr-only">Premium Plan Upgrade</DialogTitle>
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

export default StreamlinedPremiumCheckout;
