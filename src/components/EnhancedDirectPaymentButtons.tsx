import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { stripeWrapper } from '@/services/stripeWrapper';
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

      // Use stripeWrapper directly for better control and consistency
      const validCredits = [50, 100, 250, 500];
      if (validCredits.includes(credits)) {
        const result = await stripeWrapper.quickBuyCredits(credits as 50 | 100 | 250 | 500, showGuestInput ? email : undefined);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create checkout session');
        }
      } else {
        // For custom amounts, use payment link with quantity prefilled
        const result = await stripeWrapper.quickBuyCredits(credits, showGuestInput ? email : undefined);
        if (!result.success) {
          throw new Error(result.error || 'Failed to open checkout');
        }
      }

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
              className={`h-auto p-4 flex flex-col items-center gap-2 relative ${
                option.popular ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              disabled={loading !== null}
              onClick={() => handleQuickPurchase(option.credits, `credits-${option.credits}`)}
            >
              {option.popular && (
                <Star className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
              <Zap className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold">{option.credits} Credits</div>
                <div className="text-sm opacity-80">${option.price}</div>
                <div className="text-xs opacity-60">$1.40/credit</div>
              </div>
              {loading === `credits-${option.credits}` && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Powered by Stripe • Secure checkout in new window
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Premium Subscription Buttons - Direct to Stripe checkout
 */
export function QuickPremiumButtons({ guestEmail, showGuestInput = true }: DirectPaymentButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState(guestEmail || '');

  const handlePremiumPurchase = async (plan: 'monthly' | 'yearly', buttonId: string) => {
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
        title: "🚀 Opening Premium Checkout",
        description: `Processing ${plan} subscription...`,
      });

      // Use stripeWrapper directly for premium subscriptions
      const result = await stripeWrapper.quickSubscribe(plan, showGuestInput ? email : undefined);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription checkout');
      }

      toast({
        title: "✅ Premium Checkout Opened",
        description: "Complete your subscription in the new window",
      });
    } catch (error) {
      console.error('Premium purchase error:', error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : 'Failed to open checkout',
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
          <Crown className="h-5 w-5 text-yellow-500" />
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
              placeholder="Enter your email for checkout"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            disabled={loading !== null}
            onClick={() => handlePremiumPurchase('monthly', 'premium-monthly')}
          >
            <Crown className="h-5 w-5 text-yellow-500" />
            <div className="text-center">
              <div className="font-semibold">Monthly Premium</div>
              <div className="text-sm opacity-80">$29/month</div>
              <div className="text-xs opacity-60">Unlimited backlinks</div>
            </div>
            {loading === 'premium-monthly' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </Button>

          <Button
            variant="default"
            className="h-auto p-4 flex flex-col items-center gap-2 relative ring-2 ring-primary ring-offset-2"
            disabled={loading !== null}
            onClick={() => handlePremiumPurchase('yearly', 'premium-yearly')}
          >
            <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
            <Crown className="h-5 w-5" />
            <div className="text-center">
              <div className="font-semibold">Yearly Premium</div>
              <div className="text-sm opacity-80">$290/year</div>
              <div className="text-xs opacity-60">Save $58 annually!</div>
            </div>
            {loading === 'premium-yearly' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Powered by Stripe • Secure checkout in new window
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Combined Direct Payment Buttons Component
 */
export function EnhancedDirectPaymentButtons(props: DirectPaymentButtonProps) {
  const [showCreditModal, setShowCreditModal] = useState(false);

  return (
    <div className="space-y-6">
      <QuickCreditButtons {...props} />
      <QuickPremiumButtons {...props} />
      
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreditModal(true)}
          className="text-muted-foreground"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Need custom credits? Open full purchase modal
        </Button>
      </div>

      <ModernCreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onSuccess={() => setShowCreditModal(false)}
      />
    </div>
  );
}

export default EnhancedDirectPaymentButtons;
