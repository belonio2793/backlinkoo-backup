/**
 * Universal Payment Component
 * Provides consistent payment buttons and modals across the entire application
 * Uses the new window-based Stripe checkout service
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { 
  CreditCard, 
  Zap, 
  Crown, 
  ShoppingCart, 
  ExternalLink,
  Loader2,
  Check,
  Star,
  Shield
} from 'lucide-react';

interface UniversalPaymentComponentProps {
  trigger?: React.ReactNode;
  defaultType?: 'credits' | 'premium';
  defaultCredits?: number;
  showTrigger?: boolean;
  onPaymentSuccess?: (sessionId: string) => void;
  onPaymentCancel?: () => void;
}

export const UniversalPaymentComponent: React.FC<UniversalPaymentComponentProps> = ({
  trigger,
  defaultType = 'credits',
  defaultCredits = 100,
  showTrigger = true,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'credits' | 'premium'>(defaultType);
  const [selectedCredits, setSelectedCredits] = useState(defaultCredits);
  const [customCredits, setCustomCredits] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isGuest, setIsGuest] = useState(!user);
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    setIsGuest(!user);
  }, [user]);

  useEffect(() => {
    // Listen for payment success/cancel events
    const handlePaymentSuccess = (event: CustomEvent) => {
      onPaymentSuccess?.(event.detail.sessionId);
      setIsOpen(false);
      setLoading(false);
    };

    const handlePaymentCancel = () => {
      onPaymentCancel?.();
      setLoading(false);
    };

    window.addEventListener('stripe-payment-success', handlePaymentSuccess as EventListener);
    window.addEventListener('stripe-payment-cancelled', handlePaymentCancel);

    return () => {
      window.removeEventListener('stripe-payment-success', handlePaymentSuccess as EventListener);
      window.removeEventListener('stripe-payment-cancelled', handlePaymentCancel);
    };
  }, [onPaymentSuccess, onPaymentCancel]);

  const creditOptions = [
    { credits: 50, price: 70, popular: false },
    { credits: 100, price: 140, popular: true },
    { credits: 250, price: 350, popular: false },
    { credits: 500, price: 700, popular: false }
  ];

  const premiumPlans = [
    {
      id: 'monthly',
      name: 'Premium Monthly',
      price: 29,
      originalPrice: 49,
      interval: 'month',
      credits: 100,
      description: 'Perfect for getting started',
      features: ['100 premium backlinks/month', 'Advanced SEO tools', 'Priority support', 'Real-time analytics']
    },
    {
      id: 'yearly',
      name: 'Premium Yearly',
      price: 290,
      originalPrice: 588,
      interval: 'year',
      credits: 1200,
      description: 'Best value - 2 months free!',
      features: ['1200 premium backlinks/year', 'All premium features', 'Priority support', 'Advanced reporting']
    }
  ];

  const handleCreditPurchase = async () => {
    if (isGuest && (!guestEmail || !guestEmail.includes('@'))) {
      toast({
        title: 'Email Required',
        description: 'Please enter a valid email address for guest checkout.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      let credits = selectedCredits;
      let amount = creditOptions.find(opt => opt.credits === credits)?.price || 0;

      // Handle custom credits
      if (credits === 0 && customCredits) {
        credits = parseInt(customCredits);
        amount = credits * 1.4; // $1.40 per credit
      }

      if (credits <= 0 || amount <= 0) {
        toast({
          title: 'Invalid Selection',
          description: 'Please select a valid credit package.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const result = isGuest 
        ? await stripeCheckout.guestQuickBuy({ credits, amount, email: guestEmail })
        : await stripeCheckout.purchaseCredits({ credits, amount });

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      toast({
        title: 'Opening Payment Window',
        description: 'Redirecting to secure Stripe checkout...',
      });

    } catch (error) {
      console.error('Credit purchase error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handlePremiumUpgrade = async () => {
    if (isGuest && (!guestEmail || !guestEmail.includes('@'))) {
      toast({
        title: 'Email Required',
        description: 'Please enter a valid email address for guest checkout.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const result = isGuest 
        ? await stripeCheckout.guestPremiumUpgrade({ plan: selectedPlan, email: guestEmail })
        : await stripeCheckout.upgradeToPremium(selectedPlan);

      if (!result.success) {
        throw new Error(result.error || 'Subscription failed');
      }

      toast({
        title: 'Opening Payment Window',
        description: 'Redirecting to secure Stripe checkout...',
      });

    } catch (error) {
      console.error('Premium upgrade error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to process subscription',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const DefaultTrigger = () => (
    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
      <CreditCard className="mr-2 h-4 w-4" />
      Buy Credits & Premium
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          {trigger || <DefaultTrigger />}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Purchase Credits & Premium Access
          </DialogTitle>
          <DialogDescription>
            Choose between one-time credit purchases or premium subscriptions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as 'credits' | 'premium')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Buy Credits
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Premium Plans
            </TabsTrigger>
          </TabsList>

          {/* Guest Email Input */}
          {isGuest && (
            <Alert className="mt-4">
              <AlertDescription>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email Address (required for guest checkout)</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditOptions.map((option) => (
                <Card 
                  key={option.credits}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedCredits === option.credits 
                      ? 'ring-2 ring-primary border-primary' 
                      : ''
                  } ${option.popular ? 'relative' : ''}`}
                  onClick={() => setSelectedCredits(option.credits)}
                >
                  {option.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">
                      {option.credits} Credits
                    </CardTitle>
                    <CardDescription className="text-center">
                      ${(option.price / option.credits).toFixed(2)} per credit
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      ${option.price}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      One-time payment
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom Credits Option */}
            <Card className={selectedCredits === 0 ? 'ring-2 ring-primary border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Custom Credits
                </CardTitle>
                <CardDescription>
                  Choose any amount (minimum 10 credits)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="customCredits">Number of Credits</Label>
                    <Input
                      id="customCredits"
                      type="number"
                      min="10"
                      max="10000"
                      placeholder="Enter credits (min 10)"
                      value={customCredits}
                      onChange={(e) => {
                        setCustomCredits(e.target.value);
                        setSelectedCredits(0);
                      }}
                    />
                  </div>
                  <div className="text-right">
                    <Label>Total Price</Label>
                    <div className="text-2xl font-bold text-primary">
                      ${customCredits ? (parseInt(customCredits) * 1.4).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Custom pricing: $1.40 per credit
                </p>
              </CardContent>
            </Card>

            <Button 
              onClick={handleCreditPurchase}
              disabled={loading || (selectedCredits === 0 && !customCredits) || (isGuest && !guestEmail)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Payment Window...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Purchase Credits - ${
                    selectedCredits > 0 
                      ? creditOptions.find(opt => opt.credits === selectedCredits)?.price || 0
                      : customCredits 
                        ? (parseInt(customCredits) * 1.4).toFixed(2)
                        : '0.00'
                  }
                </>
              )}
            </Button>
          </TabsContent>

          {/* Premium Tab */}
          <TabsContent value="premium" className="space-y-4">
            <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'monthly' | 'yearly')}>
              <div className="space-y-4">
                {premiumPlans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPlan === plan.id ? 'ring-2 ring-primary border-primary' : ''
                    }`}
                    onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={plan.id} id={plan.id} />
                          <div>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground line-through">
                              ${plan.originalPrice}
                            </span>
                            <span className="text-2xl font-bold text-primary">
                              ${plan.price}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            per {plan.interval}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            <Button 
              onClick={handlePremiumUpgrade}
              disabled={loading || (isGuest && !guestEmail)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Payment Window...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Subscribe to {premiumPlans.find(p => p.id === selectedPlan)?.name} - $
                  {premiumPlans.find(p => p.id === selectedPlan)?.price}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Secured by 256-bit SSL encryption • Powered by Stripe</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Quick credit purchase buttons
export const QuickCreditButton: React.FC<{
  credits: 50 | 100 | 250 | 500;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}> = ({ credits, className, variant = "default" }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleQuickPurchase = async () => {
    setLoading(true);
    try {
      const result = await stripeCheckout.quickBuyCredits(credits);
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }
      toast({
        title: 'Opening Payment Window',
        description: 'Redirecting to secure Stripe checkout...',
      });
    } catch (error) {
      console.error('Quick purchase error:', error);
      toast({
        title: 'Purchase Error',
        description: error instanceof Error ? error.message : 'Failed to process purchase',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const pricing = {
    50: 70,
    100: 140,
    250: 350,
    500: 700
  };

  return (
    <Button 
      onClick={handleQuickPurchase}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {credits} Credits - ${pricing[credits]}
    </Button>
  );
};

// Premium upgrade button
export const PremiumUpgradeButton: React.FC<{
  plan?: 'monthly' | 'yearly';
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}> = ({ plan = 'monthly', className, variant = "default" }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const result = await stripeCheckout.upgradeToPremium(plan);
      if (!result.success) {
        throw new Error(result.error || 'Upgrade failed');
      }
      toast({
        title: 'Opening Payment Window',
        description: 'Redirecting to secure Stripe checkout...',
      });
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Upgrade Error',
        description: error instanceof Error ? error.message : 'Failed to process upgrade',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleUpgrade}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Crown className="mr-2 h-4 w-4" />
      )}
      Upgrade to Premium {plan === 'yearly' ? 'Yearly' : 'Monthly'}
    </Button>
  );
};

export default UniversalPaymentComponent;
