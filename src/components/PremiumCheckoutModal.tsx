import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [formData, setFormData] = useState({
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
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Successful!",
        description: `Welcome to Premium! Your ${selectedPlan} subscription is now active.`,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
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
              {/* Payment Methods */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    className="h-12 justify-start"
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                    className="h-12 justify-start"
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <div className="w-4 h-4 mr-2 bg-blue-600 rounded"></div>
                    PayPal
                  </Button>
                </div>
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Card Details */}
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div>
                    <Label htmlFor="name">Cardholder Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded"></div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">PayPal Checkout</h3>
                  <p className="text-gray-600 mb-4">
                    You'll be redirected to PayPal to complete your payment securely.
                  </p>
                </div>
              )}

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
                className="w-full h-12 text-lg"
                onClick={handleCheckout}
                disabled={isProcessing || (!formData.email && paymentMethod === 'card')}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Complete Secure Checkout
                  </div>
                )}
              </Button>

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
