import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DirectStripeCheckout } from '@/services/directStripeCheckout';
import { ModernCreditPurchaseModal } from '@/components/ModernCreditPurchaseModal';
import { 
  CreditCard, 
  Crown, 
  Zap, 
  ShoppingCart, 
  Sparkles, 
  Star,
  ExternalLink 
} from 'lucide-react';

interface DirectPaymentButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  guestEmail?: string;
  showGuestInput?: boolean;
}

/**
 * Quick Credit Purchase Buttons - Opens Stripe directly in new window
 */
export function QuickCreditButtons({ guestEmail, showGuestInput = true }: DirectPaymentButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState(guestEmail || '');

  const handleQuickPurchase = async (credits: number, buttonId: string) => {
    if (showGuestInput && !email) {
      toast({
        title: "Email Required",
        description: "Please enter your email for checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(buttonId);

    try {
      toast({
        title: "🚀 Opening Stripe Checkout",
        description: `Processing ${credits} credits purchase...`,
      });

      await DirectStripeCheckout.buyCredits(credits, showGuestInput ? email : undefined);

      toast({
        title: "✅ Checkout Opened",
        description: "Complete your purchase in the new window",
      });
    } catch (error) {
      console.error('Quick purchase error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to open checkout',
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const creditOptions = [
    { credits: 50, price: 70, popular: false },
    { credits: 100, price: 140, popular: true },
    { credits: 250, price: 350, popular: false },
    { credits: 500, price: 700, popular: false }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Quick Credit Purchase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGuestInput && (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for checkout"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {creditOptions.map((option) => (
            <Button
              key={option.credits}
              variant={option.popular ? "default" : "outline"}
              onClick={() => handleQuickPurchase(option.credits, `credits-${option.credits}`)}
              disabled={loading === `credits-${option.credits}`}
              className={`h-auto py-3 ${option.popular ? 'ring-2 ring-primary/20' : ''}`}
            >
              {loading === `credits-${option.credits}` ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Opening...
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Zap className="h-3 w-3" />
                    {option.credits} Credits
                  </div>
                  <div className="text-lg font-bold">${option.price}</div>
                  {option.popular && (
                    <div className="text-xs text-green-600">Most Popular</div>
                  )}
                </div>
              )}
            </Button>
          ))}
        </div>

        <div className="text-center">
          <Button variant="link" className="text-sm text-muted-foreground">
            <ExternalLink className="h-3 w-3 mr-1" />
            Opens secure Stripe checkout in new window
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Premium Upgrade Buttons
 */
export function QuickPremiumButtons({ guestEmail, showGuestInput = true }: DirectPaymentButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState(guestEmail || '');

  const handleQuickUpgrade = async (plan: 'monthly' | 'yearly', buttonId: string) => {
    if (showGuestInput && !email) {
      toast({
        title: "Email Required",
        description: "Please enter your email for subscription checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(buttonId);

    try {
      toast({
        title: "🚀 Opening Stripe Subscription",
        description: `Processing ${plan} premium upgrade...`,
      });

      await DirectStripeCheckout.upgradeToPremium(plan, showGuestInput ? email : undefined);

      toast({
        title: "✅ Subscription Checkout Opened",
        description: "Complete your subscription in the new window",
      });
    } catch (error) {
      console.error('Quick upgrade error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to open subscription checkout',
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Premium Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGuestInput && (
          <div className="space-y-2">
            <Label htmlFor="premium-email">Email Address</Label>
            <Input
              id="premium-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for subscription"
            />
          </div>
        )}

        <div className="space-y-3">
          {/* Monthly Plan */}
          <Button
            onClick={() => handleQuickUpgrade('monthly', 'monthly')}
            disabled={loading === 'monthly'}
            variant="outline"
            className="w-full h-auto py-4"
          >
            {loading === 'monthly' ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Opening Checkout...
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Monthly Premium</div>
                    <div className="text-sm text-muted-foreground">Billed monthly</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">$29</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
            )}
          </Button>

          {/* Yearly Plan */}
          <Button
            onClick={() => handleQuickUpgrade('yearly', 'yearly')}
            disabled={loading === 'yearly'}
            className="w-full h-auto py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading === 'yearly' ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Opening Checkout...
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold flex items-center gap-2">
                      Yearly Premium
                      <Star className="h-3 w-3 text-yellow-300" />
                    </div>
                    <div className="text-sm opacity-90">Save $298 per year</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">$290</div>
                  <div className="text-sm opacity-90">$24/month</div>
                </div>
              </div>
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button variant="link" className="text-sm text-muted-foreground">
            <ExternalLink className="h-3 w-3 mr-1" />
            Opens secure Stripe subscription in new window
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Complete Payment Dashboard
 */
export function PaymentDashboard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Payment Method</h2>
        <p className="text-muted-foreground">
          Quick checkout opens Stripe directly, or use our modal for more options
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <QuickCreditButtons />
        <QuickPremiumButtons />
      </div>

      {/* Modal Option */}
      <div className="text-center">
        <Button
          onClick={() => setShowModal(true)}
          variant="outline"
          size="lg"
          className="h-12"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Or Use Our Payment Modal
        </Button>
      </div>

      {/* Payment Modal */}
      <ImprovedPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultTab="credits"
      />
    </div>
  );
}

export default PaymentDashboard;
