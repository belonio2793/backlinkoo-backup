import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Crown,
  Shield,
  CheckCircle,
  Infinity,
  BookOpen,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Star,
  Zap,
  ExternalLink
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

  const [formData, setFormData] = useState({
    email: user?.email || ''
  });

  // Stripe checkout URLs
  const STRIPE_CHECKOUT_URLS = {
    monthly: 'https://buy.stripe.com/6oUaEX3Buf6m0V1fO11ZS00',
    yearly: 'https://buy.stripe.com/14A4gzb3W8HY5bhatH1ZS01'
  };

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

  const createCheckoutUrl = (plan: 'monthly' | 'yearly'): string => {
    const baseUrl = STRIPE_CHECKOUT_URLS[plan];
    const url = new URL(baseUrl);
    const currentOrigin = window.location.origin;
    
    // Add return URLs
    url.searchParams.set('success_url', `${currentOrigin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`);
    url.searchParams.set('cancel_url', `${currentOrigin}/payment-cancelled`);
    
    // Add user email if available
    if (user?.email || formData.email) {
      url.searchParams.set('prefilled_email', user?.email || formData.email);
    }
    
    // Add metadata for webhook processing
    url.searchParams.set('client_reference_id', `premium_${plan}`);
    
    return url.toString();
  };

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // Validate email for guests
      if (!user && !formData.email) {
        toast({
          title: "Email Required",
          description: "Please enter your email address to continue.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "🚀 Redirecting to Stripe",
        description: `Opening secure checkout for ${selectedPlan} premium plan...`,
      });

      // Create checkout URL and redirect
      const checkoutUrl = createCheckoutUrl(selectedPlan);
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;

      // Close modal
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Checkout error:', error);

      toast({
        title: "Redirect Error",
        description: "Failed to redirect to checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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

          {/* Right Side - Checkout Form */}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  You'll be redirected to Stripe's secure payment page to safely complete your subscription.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    <span>Direct Link</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Secure</span>
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

              {/* Checkout Button */}
              <Button
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={handleCheckout}
                disabled={isProcessing || (!user && !formData.email)}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Redirecting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Subscribe for ${plans[selectedPlan].price}
                  </div>
                )}
              </Button>

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="h-4 w-4" />
                  <span>Secured by Stripe • Instant activation via webhooks</span>
                </div>
                <p>Your subscription will be activated automatically when payment completes.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
