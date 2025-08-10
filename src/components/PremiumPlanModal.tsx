import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AuthFormTabs } from '@/components/shared/AuthFormTabs';
import SubscriptionService from '@/services/subscriptionService';
import { logError, getErrorMessage } from '@/utils/errorLogger';
import {
  Crown, Shield, CheckCircle, X, Lock, Star, Infinity, BookOpen,
  TrendingUp, Users, Target, Sparkles, Zap, ArrowRight, CreditCard,
  Loader2, Gift, Calendar, Eye, EyeOff, UserPlus
} from 'lucide-react';

interface PremiumPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  triggerSource?: 'navigation' | 'settings' | 'manual' | 'upgrade_button';
}

type FlowStep = 'features' | 'plans' | 'auth' | 'checkout' | 'processing' | 'success';

export function PremiumPlanModal({
  isOpen,
  onClose,
  onSuccess,
  triggerSource = 'manual'
}: PremiumPlanModalProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<FlowStep>('features');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'account'>('account');

  // Premium plan configuration
  const plans = {
    monthly: {
      price: 29,
      originalPrice: 49,
      period: 'month',
      savings: null,
      discount: 41,
      priceId: 'price_monthly_premium'
    },
    yearly: {
      price: 290,
      originalPrice: 588,
      period: 'year',
      savings: 298,
      discount: 51,
      priceId: 'price_yearly_premium',
      monthlyEquivalent: 24
    }
  };

  // Core premium features
  const premiumFeatures = [
    {
      icon: <Infinity className="h-5 w-5" />,
      title: "Unlimited Backlinks",
      description: "Build unlimited high-quality backlinks with no monthly limits"
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Complete SEO Academy",
      description: "Access 50+ video lessons and expert SEO training courses"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Priority 24/7 Support",
      description: "Skip the line with priority support from SEO experts"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Advanced Analytics",
      description: "Detailed reporting, analytics, and campaign insights"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "White-Hat Guarantee",
      description: "100% safe, Google-approved link building methods"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Custom Strategies",
      description: "Personalized campaign strategies for your industry"
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Professional Certifications",
      description: "SEO certifications to boost your professional credibility"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "API Access & Integrations",
      description: "Connect with your favorite tools and automate workflows"
    }
  ];

  // Additional benefits
  const additionalBenefits = [
    "Bulk data export capabilities",
    "White-label and custom branding options",
    "Advanced keyword research tools",
    "Competitor analysis features",
    "Custom reporting dashboards",
    "Team collaboration tools"
  ];

  // Initialize step based on authentication state
  useEffect(() => {
    if (!authLoading && isOpen) {
      setCurrentStep('features');
    }
  }, [isOpen, authLoading]);

  // Handle plan selection and navigation
  const handlePlanContinue = () => {
    if (isAuthenticated && user) {
      setCurrentStep('checkout');
    } else {
      setCurrentStep('auth');
    }
  };

  // Handle authentication success
  const handleAuthSuccess = (authenticatedUser: any) => {
    setCurrentStep('checkout');
    toast({
      title: "Authentication Successful!",
      description: "Now let's complete your premium upgrade.",
    });
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

  // Handle subscription checkout
  const handleCheckout = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      // Store checkout intent for post-payment experience
      localStorage.setItem('premium_upgrade_intent', JSON.stringify({
        plan: selectedPlan,
        source: triggerSource,
        timestamp: Date.now()
      }));

      // Create subscription using the subscription service
      const result = await SubscriptionService.createSubscription(
        user,
        checkoutMode === 'guest',
        checkoutMode === 'guest' ? guestEmail : undefined,
        selectedPlan
      );

      if (result.success && result.url) {
        toast({
          title: "🚀 Redirecting to Secure Checkout",
          description: "You'll be redirected to complete your payment safely.",
        });

        // Small delay before redirect to show toast
        setTimeout(() => {
          window.location.href = result.url;
        }, 1500);
      } else if (result.success && result.usedFallback) {
        // Handle fallback activation
        setCurrentStep('success');
        toast({
          title: "🎉 Premium Activated!",
          description: "Your account has been upgraded to Premium successfully.",
        });

        // Auto-redirect after success
        setTimeout(() => {
          handleClose();
          navigate('/dashboard');
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to create subscription checkout');
      }
    } catch (error: any) {
      logError('Premium checkout error', error);

      setCurrentStep('checkout');
      toast({
        title: "Checkout Error",
        description: getErrorMessage(error) || "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset modal state when closed
  const handleClose = () => {
    setCurrentStep('features');
    setSelectedPlan('yearly');
    setIsProcessing(false);
    setGuestEmail('');
    setCheckoutMode('account');
    onClose();
  };

  // Render features overview step
  const renderFeaturesStep = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Crown className="h-10 w-10 text-purple-600" />
        </div>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Premium Plan
          </h2>
          <p className="text-xl text-gray-600 mt-2">
            Unlock unlimited SEO potential with our comprehensive premium features
          </p>
        </div>
      </div>


      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {premiumFeatures.map((feature, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                <div className="text-purple-600">{feature.icon}</div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Benefits */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-center">Plus Many More Benefits:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {additionalBenefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <Button
          onClick={() => setCurrentStep('plans')}
          size="lg"
          className="w-full md:w-auto px-12 h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Crown className="h-5 w-5 mr-3" />
          Choose Your Plan
          <ArrowRight className="h-5 w-5 ml-3" />
        </Button>
      </div>
    </div>
  );

  // Render plan selection step
  const renderPlansStep = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600">Select the perfect plan for your SEO needs</p>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Plan */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedPlan === 'monthly' ? 'ring-2 ring-purple-500 shadow-lg' : ''
          }`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Monthly Plan</CardTitle>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold">${plans.monthly.price}</span>
                <div className="text-left">
                  <div className="text-sm text-gray-500 line-through">${plans.monthly.originalPrice}</div>
                  <div className="text-sm text-gray-600">per month</div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {plans.monthly.discount}% Off
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center text-sm text-gray-600 mb-4">
              Billed monthly • Cancel anytime
            </div>
            {selectedPlan === 'monthly' && (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
            selectedPlan === 'yearly' ? 'ring-2 ring-purple-500 shadow-lg' : ''
          }`}
          onClick={() => setSelectedPlan('yearly')}
        >
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Best Value - Save 51%
          </Badge>
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl">Yearly Plan</CardTitle>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold">${plans.yearly.price}</span>
                <div className="text-left">
                  <div className="text-sm text-gray-500 line-through">${plans.yearly.originalPrice}</div>
                  <div className="text-sm text-gray-600">per year</div>
                </div>
              </div>
              <div className="space-y-1">
                <Badge className="bg-green-100 text-green-800">
                  Save ${plans.yearly.savings} (51% Off)
                </Badge>
                <div className="text-sm text-purple-600 font-medium">
                  Just ${plans.yearly.monthlyEquivalent}/month!
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center text-sm text-gray-600 mb-4">
              Billed annually • Best value for serious SEO
            </div>
            {selectedPlan === 'yearly' && (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Benefits Comparison */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-center">
          Both plans include all premium features:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumFeatures.slice(0, 4).map((feature, index) => (
            <div key={index} className="text-center">
              <div className="bg-white rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <div className="text-purple-600">{feature.icon}</div>
              </div>
              <div className="text-sm font-medium text-gray-900">{feature.title}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4 text-sm text-gray-600">
          ...and {premiumFeatures.length - 4} more premium features
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handlePlanContinue}
          size="lg"
          className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Lock className="h-5 w-5 mr-3" />
          Continue with {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan
          <ArrowRight className="h-5 w-5 ml-3" />
        </Button>
        <Button
          onClick={() => setCurrentStep('features')}
          variant="outline"
          size="lg"
          className="px-8"
        >
          Back to Features
        </Button>
      </div>
    </div>
  );

  // Render authentication step
  const renderAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">Almost There!</h2>
        <p className="text-gray-600">
          Sign in or create an account to complete your premium upgrade
        </p>
      </div>

      {/* Quick Guest Checkout Option */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Quick Guest Checkout</span>
          </div>
          <p className="text-sm text-blue-700">
            Enter your email to proceed directly to payment. We'll create your account automatically.
          </p>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleGuestCheckout}
              disabled={!guestEmail || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
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
          <span className="bg-white px-2 text-gray-500">Or use your account</span>
        </div>
      </div>

      {/* Full Authentication Form */}
      <AuthFormTabs
        onAuthSuccess={handleAuthSuccess}
        defaultTab="signup"
        isCompact={true}
      />

      <div className="text-center">
        <Button
          onClick={() => setCurrentStep('plans')}
          variant="ghost"
          className="text-gray-500 hover:text-gray-700"
        >
          Back to Plans
        </Button>
      </div>
    </div>
  );

  // Render checkout step
  const renderCheckoutStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">Secure Checkout</h2>
        <p className="text-gray-600">Review and complete your premium upgrade</p>
      </div>

      {/* Order Summary */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Premium Plan Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Premium Plan ({selectedPlan})</span>
            <span className="text-lg font-bold">${plans[selectedPlan].price}</span>
          </div>
          
          {selectedPlan === 'yearly' && (
            <div className="flex justify-between items-center text-green-600">
              <span>Annual Savings</span>
              <span className="font-medium">-${plans.yearly.savings}</span>
            </div>
          )}

          <Separator />
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>${plans[selectedPlan].price}</span>
          </div>

          {selectedPlan === 'yearly' && (
            <div className="text-center text-sm text-purple-600 font-medium">
              That's just ${plans.yearly.monthlyEquivalent}/month billed annually
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Info */}
      {isAuthenticated && user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              Signed in as {user.email}
            </span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Your subscription will be linked to this account
          </p>
        </div>
      )}

      {/* Secure Payment Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="font-semibold text-blue-900 mb-2">Secure Stripe Checkout</h3>
        <p className="text-sm text-blue-700 mb-4">
          You'll be redirected to Stripe's secure payment page to complete your purchase safely.
        </p>
        <div className="flex items-center justify-center gap-6 text-xs text-blue-600">
          <span className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Credit Cards
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            Apple Pay
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            Google Pay
          </span>
        </div>
      </div>

      {/* Checkout Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleCheckout}
          disabled={isProcessing}
          size="lg"
          className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Setting up secure checkout...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-3" />
              Complete Secure Checkout - ${plans[selectedPlan].price}
            </>
          )}
        </Button>

        <Button
          onClick={() => setCurrentStep(isAuthenticated ? 'plans' : 'auth')}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Back to {isAuthenticated ? 'Plans' : 'Authentication'}
        </Button>
      </div>

      {/* Security & Guarantee */}
      <div className="text-center space-y-2 text-sm text-gray-500">
        <div className="flex items-center justify-center gap-1">
          <Shield className="h-4 w-4" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
        <p>30-day money-back guarantee • Cancel anytime</p>
      </div>
    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="text-center py-12 space-y-6">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">Setting Up Your Checkout</h3>
        <p className="text-gray-600">Creating secure payment session...</p>
        <p className="text-sm text-gray-500 mt-2">This usually takes just a few seconds</p>
      </div>
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center py-12 space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto relative">
        <CheckCircle className="h-12 w-12 text-green-600" />
        <div className="absolute -top-2 -right-2">
          <Crown className="h-8 w-8 text-yellow-500" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-green-600 mb-2">🎉 Premium Activated!</h3>
        <p className="text-gray-600 text-lg">Welcome to the premium experience!</p>
        
        <div className="bg-green-50 rounded-lg p-6 mt-6">
          <h4 className="font-semibold text-green-900 mb-3">What's Next?</h4>
          <p className="text-sm text-green-700 mb-4">
            You now have access to unlimited backlinks, SEO Academy, priority support, and all premium features.
          </p>
          <Button
            onClick={() => {
              handleClose();
              navigate('/dashboard');
              onSuccess?.();
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Get step content
  const getStepContent = () => {
    switch (currentStep) {
      case 'features':
        return renderFeaturesStep();
      case 'plans':
        return renderPlansStep();
      case 'auth':
        return renderAuthStep();
      case 'checkout':
        return renderCheckoutStep();
      case 'processing':
        return renderProcessingStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderFeaturesStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="sr-only">Premium Plan Upgrade</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6 pt-2">
          {authLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            getStepContent()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PremiumPlanModal;
