import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/services/authService';
import { createSubscriptionWithFallback } from '@/services/fallbackSubscriptionService';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  CreditCard,
  Shield,
  CheckCircle,
  CheckCircle2,
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
  Eye,
  EyeOff,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface PremiumPlanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
}

type FlowStep = 'plan-selection' | 'auth-form' | 'checkout' | 'processing' | 'success';
type AuthMode = 'signin' | 'signup';

export function PremiumPlanPopup({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultEmail = ''
}: PremiumPlanPopupProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Flow management
  const [currentStep, setCurrentStep] = useState<FlowStep>('plan-selection');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: defaultEmail,
    password: '',
    firstName: '',
    confirmPassword: ''
  });

  // Payment form data
  const [paymentData, setPaymentData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    country: ''
  });

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

  // Initialize flow based on authentication state
  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated && user) {
        setCurrentStep('checkout');
        setPaymentData(prev => ({ ...prev, email: user.email || '' }));
      } else {
        setCurrentStep('plan-selection');
      }
    }
  }, [isOpen, isAuthenticated, user]);

  // Handle input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  // Validate form data
  const validateAuthForm = () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    if (authMode === 'signup' && formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Handle authentication
  const handleAuth = async () => {
    if (!validateAuthForm()) return;

    setIsProcessing(true);

    try {
      let result;
      
      if (authMode === 'signin') {
        result = await AuthService.signIn({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await AuthService.signUp({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName
        });
      }

      if (result.success && result.user) {
        toast({
          title: authMode === 'signin' ? "Signed In Successfully" : "Account Created",
          description: `Welcome ${authMode === 'signin' ? 'back' : 'to Backlinkoo'}!`
        });

        // Set payment email and proceed to checkout
        setPaymentData(prev => ({ ...prev, email: result.user?.email || formData.email }));
        setCurrentStep('checkout');
      } else {
        toast({
          title: "Authentication Error",
          description: result.error || "Authentication failed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (!paymentData.email) {
      toast({
        title: "Email Required",
        description: "Please provide an email address for subscription management.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      const result = await createSubscriptionWithFallback(
        user,
        !user, // isGuest if no user
        !user ? paymentData.email : undefined // guestEmail if no user
      );

      if (result.success) {
        if (result.url && !result.usedFallback) {
          // Redirect to Stripe checkout
          window.location.href = result.url;
        } else {
          // Fallback activation or direct upgrade
          setCurrentStep('success');
          
          toast({
            title: "Premium Activated!",
            description: "Your account has been upgraded to Premium successfully.",
          });

          // Auto-redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
            onClose();
            onSuccess?.();
          }, 2000);
        }
      } else {
        toast({
          title: "Payment Error",
          description: result.error || "Payment processing failed. Please try again.",
          variant: "destructive"
        });
        setCurrentStep('checkout');
      }
    } catch (error: any) {
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

  // Handle plan selection continuation
  const handleContinueWithPlan = () => {
    if (isAuthenticated && user) {
      setCurrentStep('checkout');
      setPaymentData(prev => ({ ...prev, email: user.email || '' }));
    } else {
      setCurrentStep('auth-form');
    }
  };

  // Reset modal state when closed
  const handleClose = () => {
    setCurrentStep('plan-selection');
    setAuthMode('signin');
    setIsProcessing(false);
    setFormData({ email: defaultEmail, password: '', firstName: '', confirmPassword: '' });
    setPaymentData({ email: '', cardNumber: '', expiryDate: '', cvv: '', name: '', country: '' });
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
          Choose your plan and unlock unlimited SEO potential
        </p>
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
        onClick={handleContinueWithPlan}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        size="lg"
      >
        Continue with {selectedPlan} Plan
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderAuthForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">
          {authMode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-muted-foreground">
          {authMode === 'signin' 
            ? 'Sign in to continue with your premium upgrade'
            : 'Create an account to get started with Premium'
          }
        </p>
      </div>

      {/* Auth Tabs */}
      <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as AuthMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Create Account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
              required
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Auth Button */}
      <Button 
        onClick={handleAuth}
        disabled={isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
          </>
        ) : (
          <>
            {authMode === 'signin' ? 'Sign In & Continue' : 'Create Account & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );

  const renderCheckout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Plan Summary */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Premium Plan</h3>
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

        <div className="space-y-2">
          <h4 className="font-medium">Features Included:</h4>
          <div className="space-y-1">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {feature.icon}
                <span>{feature.text}</span>
              </div>
            ))}
            <div className="text-sm text-muted-foreground">
              ...and {features.length - 4} more features
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        {/* Authenticated User Indicator */}
        {isAuthenticated && user && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Signed in as {user.email}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Your account details will be used for this subscription
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="paymentEmail">Email Address</Label>
          <Input
            id="paymentEmail"
            type="email"
            placeholder="your@email.com"
            value={paymentData.email}
            onChange={(e) => handlePaymentChange('email', e.target.value)}
            readOnly={isAuthenticated && !!user}
            className={isAuthenticated && !!user ? "bg-gray-50 cursor-not-allowed" : ""}
            required
          />
          <p className="text-xs text-muted-foreground">
            {isAuthenticated && !!user
              ? "Using your account email address for this subscription"
              : "Required for subscription management and receipts"
            }
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Secure Stripe Checkout</span>
          </div>
          <p className="text-sm text-blue-700 text-center">
            You'll be redirected to Stripe's secure payment page to safely enter your payment details.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-blue-600">
            <span>💳 Cards</span>
            <span>🅿️ PayPal</span>
            <span>🍎 Apple Pay</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${plans[selectedPlan].price}</span>
          </div>
          
          <Button 
            onClick={handlePayment}
            disabled={isProcessing || !paymentData.email}
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
          
          <p className="text-xs text-center text-muted-foreground">
            🔒 Secured by 256-bit SSL encryption<br />
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );

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
          Please wait while we process your premium upgrade...
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
          Congratulations! Your account has been upgraded to Premium.
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-green-900">What's Next?</h4>
        <p className="text-sm text-green-700">
          You'll be redirected to your dashboard where you can start using all premium features.
        </p>
      </div>
      
      <Button
        onClick={() => {
          navigate('/dashboard');
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
      case 'plan-selection':
        return renderPlanSelection();
      case 'auth-form':
        return renderAuthForm();
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

export default PremiumPlanPopup;
