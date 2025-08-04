import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import SubscriptionService from '@/services/subscriptionService';
import { createSubscriptionWithFallback } from '@/services/fallbackSubscriptionService';
import { useAuth } from '@/hooks/useAuth';
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
  Zap
} from 'lucide-react';

interface PremiumCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PremiumCheckoutModal({ isOpen, onClose, onSuccess }: PremiumCheckoutModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  // Debug user state
  console.log('PremiumCheckoutModal - User state:', { user, hasUser: !!user, email: user?.email });
  const [formData, setFormData] = useState({
    email: user?.email || '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    country: ''
  });

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // Use subscription service with fallback support
      const result = await createSubscriptionWithFallback(
        user,
        !user, // isGuest if no user
        !user ? formData.email : undefined // guestEmail if no user
      );

      if (result.success && result.url) {
        if (result.usedFallback) {
          // Fallback was used - redirect directly and close modal
          toast({
            title: "Premium Activated!",
            description: "Your account has been upgraded to Premium (development mode).",
          });

          // Close modal and trigger success callback
          onClose();
          if (onSuccess) {
            onSuccess();
          }

          // Small delay then redirect
          setTimeout(() => {
            window.location.href = result.url!;
          }, 1000);
        } else {
          // Real Stripe checkout - open in new tab
          window.open(result.url, '_blank');

          toast({
            title: "Redirecting to Payment",
            description: "You'll be redirected to complete your payment securely.",
          });
        }
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "There was an issue setting up your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Update email when user state changes
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user, formData.email]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Plan Summary */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="h-8 w-8 text-yellow-300" />
                <DialogTitle className="text-3xl font-bold text-white">Premium Plan</DialogTitle>
              </div>
            </DialogHeader>

            {/* Plan Selection */}
            <div className="space-y-4 mb-8">
              <Label className="text-white font-medium">Choose Your Plan</Label>
              <div className="space-y-3">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlan === 'monthly' 
                      ? 'border-yellow-300 bg-white/10' 
                      : 'border-white/30 hover:border-white/50'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Monthly Plan</div>
                      <div className="text-white/80 text-sm">Billed monthly</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${plans.monthly.price}</div>
                      <div className="text-white/80 text-sm">per month</div>
                    </div>
                  </div>
                </div>
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                    selectedPlan === 'yearly' 
                      ? 'border-yellow-300 bg-white/10' 
                      : 'border-white/30 hover:border-white/50'
                  }`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  {plans.yearly.popular && (
                    <Badge className="absolute -top-2 left-4 bg-yellow-400 text-purple-900">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Yearly Plan</div>
                      <div className="text-white/80 text-sm">Billed annually</div>
                      {plans.yearly.savings && (
                        <div className="text-yellow-300 text-sm font-medium">
                          Save ${plans.yearly.savings} per year!
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${plans.yearly.price}</div>
                      <div className="text-white/80 text-sm">per year</div>
                      <div className="text-yellow-300 text-sm">
                        (${Math.round(plans.yearly.price / 12)}/month)
                      </div>
                    </div>
                  </div>
                </div>
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

          {/* Right Side - Payment Form */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Show user account info or email input */}
              {user ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Account: {user.email || 'Logged in user'}</span>
                  </div>
                  <div className="text-sm text-green-700">Premium features will be activated immediately</div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="email" className="text-lg font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-2"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for subscription management and receipts
                  </p>
                </div>
              )}

              {/* Secure Payment Notice */}
              <div className="text-center py-6 px-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Secure Stripe Checkout</h3>
                <p className="text-gray-600 text-sm mb-3">
                  You'll be redirected to Stripe's secure payment page to safely enter your payment details.
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

              <Separator />

              {/* Order Summary */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Premium Plan ({selectedPlan})</span>
                  <span>${plans[selectedPlan].price}</span>
                </div>
                {selectedPlan === 'yearly' && plans.yearly.savings && (
                  <div className="flex justify-between text-green-600">
                    <span>Annual Savings</span>
                    <span>-${plans.yearly.savings}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${plans[selectedPlan].price}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Choose Payment Method</Label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Stripe Button */}
                  <Button
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleCheckout('stripe')}
                    disabled={isProcessing || (!user && !formData.email)}
                  >
                    {isProcessing && paymentMethod === 'stripe' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pay with Stripe
                      </div>
                    )}
                  </Button>

                  {/* PayPal Button */}
                  <Button
                    className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => handleCheckout('paypal')}
                    disabled={isProcessing || (!user && !formData.email)}
                  >
                    {isProcessing && paymentMethod === 'paypal' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        Pay with PayPal
                      </div>
                    )}
                  </Button>
                </div>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
