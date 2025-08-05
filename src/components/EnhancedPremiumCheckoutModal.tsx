import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AuthFormTabs } from '@/components/shared/AuthFormTabs';
import SubscriptionService from '@/services/subscriptionService';
import { createSubscriptionWithFallback } from '@/services/fallbackSubscriptionService';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
  Calendar,
  Zap,
  UserPlus,
  LogIn,
  ArrowRight,
  Check
} from 'lucide-react';

interface EnhancedPremiumCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectAfterSuccess?: string;
}

type FlowStep = 'auth' | 'plan-selection' | 'checkout' | 'processing' | 'success';

export function EnhancedPremiumCheckoutModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  redirectAfterSuccess = '/dashboard'
}: EnhancedPremiumCheckoutModalProps) {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('auth');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'account'>('account');

  const plans = {
    monthly: {
      price: 29,
      period: 'month',
      savings: null,
      popular: false
    },
    yearly: {
      price: 290,
      period: 'year',
      savings: 58,
      popular: true
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

  // Determine initial step based on auth state
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setCurrentStep('plan-selection');
      } else {
        setCurrentStep('auth');
      }
    }
  }, [user, authLoading]);

  // Handle successful authentication
  const handleAuthSuccess = (authenticatedUser: any) => {
    setCurrentStep('plan-selection');
    toast({
      title: "Authentication successful!",
      description: "Now let's complete your premium upgrade.",
    });
  };

  // Handle checkout process
  const handleCheckout = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      // Store checkout intent for seamless experience
      localStorage.setItem('premium_checkout_intent', JSON.stringify({
        plan: selectedPlan,
        timestamp: Date.now(),
        redirectUrl: redirectAfterSuccess
      }));

      // Use subscription service with fallback support
      const result = await createSubscriptionWithFallback(
        user,
        checkoutMode === 'guest', // isGuest
        checkoutMode === 'guest' ? guestEmail : undefined
      );

      if (result.success && result.url) {
        if (result.usedFallback) {
          // Fallback was used - upgrade successful
          setCurrentStep('success');
          toast({
            title: "Premium Activated!",
            description: "Your account has been upgraded to Premium.",
          });

          // Trigger success callback and redirect after delay
          setTimeout(() => {
            onClose();
            if (onSuccess) {
              onSuccess();
            }
            navigate(redirectAfterSuccess);
          }, 2000);
        } else {
          // Real Stripe checkout - redirect
          toast({
            title: "Redirecting to Payment",
            description: "You'll be redirected to complete your payment securely.",
          });
          
          // Open Stripe checkout
          window.location.href = result.url;
        }
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      setCurrentStep('checkout');

      // Provide detailed error message for debugging
      let errorMessage = error.message || "There was an issue setting up your payment. Please try again.";

      // Add more context for common errors
      if (errorMessage.includes('Fallback failed')) {
        errorMessage += '. The subscription system is experiencing issues. Please try again later or contact support.';
      }

      toast({
        title: "Payment Setup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle guest checkout
  const handleGuestCheckout = async () => {
    if (!guestEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to continue.",
        variant: "destructive"
      });
      return;
    }

    setCheckoutMode('guest');
    await handleCheckout();
  };

  const renderAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Crown className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Upgrade to Premium</h3>
          <p className="text-gray-600">Sign in or create an account to continue</p>
        </div>
      </div>

      {/* Quick Guest Option */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-600" />
            <span className="font-medium">Quick Checkout</span>
          </div>
          <p className="text-sm text-gray-600">
            Enter your email to proceed directly to payment (account created automatically)
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGuestCheckout} disabled={!guestEmail}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      {/* Full Auth Form */}
      <AuthFormTabs
        onAuthSuccess={handleAuthSuccess}
        defaultTab="signup"
        isCompact={true}
      />
    </div>
  );

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Choose Your Plan</h3>
        <p className="text-gray-600">Select the perfect plan for your needs</p>
      </div>

      <div className="space-y-4">
        <div 
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedPlan === 'monthly' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === 'monthly' 
                  ? 'border-purple-500 bg-purple-500' 
                  : 'border-gray-300'
              }`}>
                {selectedPlan === 'monthly' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div>
                <div className="font-semibold">Monthly Plan</div>
                <div className="text-sm text-gray-600">Billed monthly</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${plans.monthly.price}</div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          </div>
        </div>

        <div 
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
            selectedPlan === 'yearly' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedPlan('yearly')}
        >
          {plans.yearly.popular && (
            <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === 'yearly' 
                  ? 'border-purple-500 bg-purple-500' 
                  : 'border-gray-300'
              }`}>
                {selectedPlan === 'yearly' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div>
                <div className="font-semibold">Yearly Plan</div>
                <div className="text-sm text-gray-600">Billed annually</div>
                {plans.yearly.savings && (
                  <div className="text-sm text-green-600 font-medium">
                    Save ${plans.yearly.savings} per year!
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${plans.yearly.price}</div>
              <div className="text-sm text-gray-600">per year</div>
              <div className="text-sm text-purple-600">
                (${Math.round(plans.yearly.price / 12)}/month)
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => setCurrentStep('checkout')} 
        className="w-full h-12 text-lg"
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        Continue to Payment
      </Button>
    </div>
  );

  const renderCheckout = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Secure Checkout</h3>
        <p className="text-gray-600">Review your order and complete payment</p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Summary</CardTitle>
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

      {/* Secure Payment Notice */}
      <div className="text-center py-6 px-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h4 className="font-semibold mb-2">Secure Stripe Checkout</h4>
        <p className="text-sm text-gray-600 mb-3">
          You'll be redirected to Stripe's secure payment page to complete your purchase.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            <span>Cards</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>PayPal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Apple Pay</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleCheckout}
          className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={isProcessing}
        >
          <Lock className="h-4 w-4 mr-2" />
          Complete Secure Checkout
        </Button>

        <Button
          onClick={() => setCurrentStep('plan-selection')}
          variant="outline"
          className="w-full"
        >
          Back to Plan Selection
        </Button>
      </div>

      {/* Security Notice */}
      <div className="text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Shield className="h-4 w-4" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
        <p>Your payment information is secure and encrypted.</p>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12 space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">Processing Your Upgrade</h3>
        <p className="text-gray-600">Please wait while we set up your premium account...</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12 space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2 text-green-600">Welcome to Premium!</h3>
        <p className="text-gray-600">Your account has been successfully upgraded.</p>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            You now have access to all premium features including unlimited backlinks, 
            SEO academy, and priority support.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'auth':
        return renderAuthStep();
      case 'plan-selection':
        return renderPlanSelection();
      case 'checkout':
        return renderCheckout();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      default:
        return renderAuthStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Features Summary */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="h-8 w-8 text-yellow-300" />
                <DialogTitle className="text-3xl font-bold text-white">Premium Plan</DialogTitle>
              </div>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Step {currentStep === 'auth' ? '1' : currentStep === 'plan-selection' ? '2' : currentStep === 'checkout' ? '3' : '4'} of 4</span>
                <span className="capitalize">{currentStep.replace('-', ' ')}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: currentStep === 'auth' ? '25%' : 
                           currentStep === 'plan-selection' ? '50%' : 
                           currentStep === 'checkout' ? '75%' : '100%' 
                  }}
                ></div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <Label className="text-white font-medium">What's Included</Label>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-yellow-300">{feature.icon}</div>
                    <span className="text-white/90">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee */}
            <div className="mt-8 p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="font-semibold">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-white/80 text-sm">
                Not satisfied? Get a full refund within 30 days, no questions asked.
              </p>
            </div>
          </div>

          {/* Right Side - Step Content */}
          <div className="p-8">
            {authLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              getStepContent()
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
