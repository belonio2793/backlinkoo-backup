import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckoutAuthForm } from '@/components/CheckoutAuthForm';
import { paymentConfigService } from '@/services/paymentConfigService';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';
import {
  CreditCard,
  Shield,
  CheckCircle,
  X,
  Lock,
  Star,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  Wallet,
  Calculator,
  DollarSign,
  Info
} from 'lucide-react';

interface EnhancedUnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialCredits?: number;
  redirectAfterSuccess?: string;
}

type FlowStep = 'selection' | 'auth' | 'payment' | 'processing' | 'success';
type PaymentMethod = 'stripe';
type CheckoutType = 'user';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [checkoutType, setCheckoutType] = useState<CheckoutType>('user');
  
  // Credits state
  const [selectedCreditPlan, setSelectedCreditPlan] = useState<string>('');
  const [customCredits, setCustomCredits] = useState(initialCredits || 200);
  const [showCustomCredits, setShowCustomCredits] = useState(false);
  

  // Payment method availability
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<'stripe'[]>(['stripe']);

  const CREDIT_PRICE = 1.40;

  // Credit plans configuration
  const creditPlans: CreditPlan[] = [
    {
      id: 'starter_100',
      name: 'Starter 100',
      credits: 100,
      price: 140,
      pricePerCredit: 1.40
    },
    {
      id: 'starter_200',
      name: 'Starter 200',
      credits: 200,
      price: 280,
      pricePerCredit: 1.40,
      popular: true,
      savings: 'Best Value'
    },
    {
      id: 'starter_500',
      name: 'Starter 500',
      credits: 500,
      price: 700,
      pricePerCredit: 1.40,
      savings: 'For Agencies'
    }
  ];

  const creditFeatures = [
    'High-quality backlinks from DA 50+ sites',
    'Automated content generation and placement',
    'Real-time campaign tracking',
    'Detailed performance reports',
    'White-hat SEO practices guaranteed',
    'Multi-platform content distribution'
  ];

  // Calculate custom credits price with auto-propagation
  const calculateCustomPrice = (credits: number) => {
    return (credits * CREDIT_PRICE).toFixed(2);
  };

  // Auto-update pricing when selection changes
  useEffect(() => {
    // Auto-propagate pricing when credits change
    const selection = getFinalSelection();
    if (selection) {
      // Pricing is automatically calculated and displayed
    }
  }, [selectedCreditPlan, customCredits, showCustomCredits]);

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('selection');
    setSelectedCreditPlan('');
    setShowCustomCredits(false);
    setCustomCredits(initialCredits || 200);
    setCheckoutType('user');
    setIsProcessing(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Handle continue from selection
  const handleContinue = () => {
    if (!getFinalSelection()) {
      toast({
        title: 'Selection Required',
        description: 'Please select a credit package or configure custom credits',
        variant: 'destructive'
      });
      return;
    }

    if (!isAuthenticated && checkoutType === 'user') {
      setCurrentStep('auth');
    } else {
      setCurrentStep('payment');
    }
  };

  // Handle auth success
  const handleAuthSuccess = (user: any) => {
    setCurrentStep('payment');
  };

  // Get final selection
  const getFinalSelection = () => {
    if (showCustomCredits && customCredits > 0) {
      return {
        type: 'credits' as const,
        credits: customCredits,
        price: customCredits * CREDIT_PRICE,
        plan: { name: `Custom ${customCredits} Credits`, id: 'custom' }
      };
    }

    const plan = creditPlans.find(p => p.id === selectedCreditPlan);
    if (plan) {
      return {
        type: 'credits' as const,
        credits: plan.credits,
        price: plan.price,
        plan: { name: plan.name, id: plan.id }
      };
    }

    return null;
  };

  // Handle payment
  const handlePayment = async () => {
    const selection = getFinalSelection();
    if (!selection) {
      toast({
        title: 'Error',
        description: 'Please select a valid credit package',
        variant: 'destructive'
      });
      return;
    }


    setCurrentStep('processing');
    setIsProcessing(true);

    try {
      const result = await paymentIntegrationService.createPayment({
        amount: selection.price,
        credits: selection.credits,
        productName: `${selection.credits} Premium Backlink Credits`,
        type: 'credits',
        isGuest: false
      });

      if (result.success) {
        setCurrentStep('success');
        if (onSuccess) {
          onSuccess();
        }
        
        // Redirect after success
        setTimeout(() => {
          handleClose();
          navigate(redirectAfterSuccess);
        }, 2000);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Payment processing failed',
        variant: 'destructive'
      });
      setCurrentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render selection step
  const renderSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold">Select Your Credit Package</h3>
        <p className="text-muted-foreground">
          Purchase credits for high-quality backlink campaigns
        </p>
      </div>

      {/* Account Info */}
      {user && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Account</Label>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{user.email}</Badge>
          </div>
        </div>
      )}

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
                  ${`${plan.pricePerCredit} per credit`}
                </div>
                <div className="text-2xl font-semibold">
                  {`${plan.credits} Credits`}
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
                    {`${customCredits} × $1.40 = $${calculateCustomPrice(customCredits)}`}
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

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        size="lg"
        disabled={!getFinalSelection()}
      >
        Purchase Credits
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  // Render auth step
  const renderAuth = () => {
    const selection = getFinalSelection();
    return (
      <div className="space-y-6">
        <CheckoutAuthForm
          onAuthSuccess={handleAuthSuccess}
          defaultTab="signup"
          orderSummary={selection ? {
            credits: selection.credits,
            price: selection.price,
            planName: showCustomCredits ? `Custom ${customCredits} Credits` :
                     creditPlans.find(p => p.id === selectedCreditPlan)?.name
          } : undefined}
        />

        <div className="flex justify-center pt-4 border-t">
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
  };

  // Render payment step
  const renderPayment = () => {
    const selection = getFinalSelection();
    if (!selection) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-bold">Complete Your Purchase</h3>
          <p className="text-muted-foreground">
            Review your selection and complete payment
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
              <div className="flex justify-between">
                <span>Credits:</span>
                <span className="font-semibold">{selection.credits}</span>
              </div>
              <div className="flex justify-between">
                <span>Price per credit:</span>
                <span>$1.40</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${selection.price.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          size="lg"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${selection.price.toFixed(2)}
            </>
          )}
        </Button>

        <div className="flex justify-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(isAuthenticated ? 'selection' : 'auth')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back
          </Button>
        </div>
      </div>
    );
  };

  // Render processing step
  const renderProcessing = () => (
    <div className="text-center space-y-6 py-12">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">Processing Your Payment</h3>
        <p className="text-muted-foreground">
          Please wait while we process your payment...
        </p>
      </div>
    </div>
  );

  // Render success step
  const renderSuccess = () => (
    <div className="text-center space-y-6 py-12">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Your credits have been added to your account.
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {currentStep === 'selection' && 'Buy Credits'}
            {currentStep === 'auth' && 'Sign In or Create Account'}
            {currentStep === 'payment' && 'Complete Purchase'}
            {currentStep === 'processing' && 'Processing Payment'}
            {currentStep === 'success' && 'Payment Complete'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'selection' && renderSelection()}
        {currentStep === 'auth' && renderAuth()}
        {currentStep === 'payment' && renderPayment()}
        {currentStep === 'processing' && renderProcessing()}
        {currentStep === 'success' && renderSuccess()}
      </DialogContent>
    </Dialog>
  );
}
