import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Loader2, Smartphone, Monitor, Zap } from 'lucide-react';
import { stripeWrapper } from '@/services/stripeWrapper';

interface MobileOptimizedPaymentButtonProps {
  type: 'credits' | 'premium';
  credits?: number;
  plan?: 'monthly' | 'yearly';
  className?: string;
  disabled?: boolean;
  guestEmail?: string;
  showGuestInput?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
}

export function MobileOptimizedPaymentButton({
  type,
  credits = 100,
  plan = 'monthly',
  className = '',
  disabled = false,
  guestEmail = '',
  showGuestInput = true,
  variant = 'default',
  size = 'default',
  onSuccess
}: MobileOptimizedPaymentButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(guestEmail);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>({});

  useEffect(() => {
    const checkDevice = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
      setIsMobile(mobile);
      setDeviceInfo({
        isMobile: mobile,
        isIOSSafari: /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                     /Safari/.test(navigator.userAgent) && 
                     !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        supportsPopups: !mobile || !/iPad|iPhone|iPod/.test(navigator.userAgent)
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handlePayment = async () => {
    if (showGuestInput && !email) {
      toast({
        title: "Email Required",
        description: "Please enter your email for checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let result;

      if (type === 'premium') {
        toast({
          title: "🚀 Opening Premium Checkout",
          description: `Processing ${plan} subscription...`,
        });

        result = await stripeWrapper.quickSubscribe(plan, showGuestInput ? email : undefined);
      } else {
        toast({
          title: "🚀 Opening Credits Checkout",
          description: `Processing ${credits} credits purchase...`,
        });

        // Check if it's a preset amount for quickBuyCredits
        const validCredits = [50, 100, 250, 500];
        if (validCredits.includes(credits)) {
          result = await stripeWrapper.quickBuyCredits(credits as 50 | 100 | 250 | 500, showGuestInput ? email : undefined);
        } else {
          // For custom amounts, use createPayment directly
          const amount = Math.ceil(credits * 1.40);
          result = await stripeWrapper.createPayment({
            amount,
            credits,
            productName: `${credits} Premium Backlink Credits`,
            isGuest: showGuestInput,
            guestEmail: email
          });

          if (result.success && result.url) {
            // Handle mobile-specific checkout behavior
            if (deviceInfo.isMobile && deviceInfo.isIOSSafari) {
              // iOS Safari - redirect in current window
              window.location.href = result.url;
              return;
            } else if (deviceInfo.isMobile) {
              // Other mobile - try popup with fallback to redirect
              const popup = window.open(result.url, '_blank');
              if (!popup) {
                window.location.href = result.url;
                return;
              }
            } else {
              // Desktop - open in new window
              stripeWrapper.openCheckoutWindow(result.url, result.sessionId);
            }
          }
        }
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      toast({
        title: "✅ Checkout Opened",
        description: isMobile 
          ? "Complete your purchase in the checkout page" 
          : "Complete your purchase in the new window",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to open checkout',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    
    if (type === 'premium') {
      return plan === 'monthly' ? 'Get Premium ($29/mo)' : 'Get Premium ($290/yr)';
    } else {
      const amount = credits <= 500 && [50, 100, 250, 500].includes(credits) 
        ? [70, 140, 350, 700][[50, 100, 250, 500].indexOf(credits)]
        : Math.ceil(credits * 1.40);
      return `Buy ${credits} Credits ($${amount})`;
    }
  };

  const getIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    return type === 'premium' ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          Mobile-Optimized Checkout
          <Badge variant="secondary" className="text-xs">
            {deviceInfo.isIOSSafari ? 'iOS Safari' : isMobile ? 'Mobile' : 'Desktop'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGuestInput && (
          <div className="space-y-2">
            <Label htmlFor="payment-email">Email Address</Label>
            <Input
              id="payment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for checkout"
              disabled={loading}
            />
          </div>
        )}

        <Button
          variant={variant}
          size={size}
          className="w-full"
          disabled={disabled || loading}
          onClick={handlePayment}
        >
          {getIcon()}
          <span className="ml-2">{getButtonText()}</span>
          {type === 'premium' && plan === 'yearly' && !loading && (
            <Badge variant="secondary" className="ml-2">Save $58</Badge>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="h-3 w-3" />
            Powered by Stripe • Secure checkout
          </div>
          {isMobile && (
            <div className="text-center">
              {deviceInfo.isIOSSafari 
                ? "Will redirect to secure checkout page"
                : "Optimized for mobile devices"
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileOptimizedPaymentButton;
