import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { CreditCard, Zap } from 'lucide-react';

interface BuyCreditsButtonProps {
  credits?: number;
  amount?: number;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  quickBuy?: boolean; // If true, bypass modal and buy directly
  showModal?: boolean; // If true, show modal instead of direct purchase
}

export function BuyCreditsButton({
  credits = 100,
  amount,
  variant = 'default',
  size = 'default',
  className,
  children,
  quickBuy = false,
  showModal = true
}: BuyCreditsButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate amount if not provided
  const finalAmount = amount || credits * 1.40;

  // Check if we're on production domain
  const isProductionDomain = typeof window !== 'undefined' && window.location.hostname === 'backlinkoo.com';

  // Handle direct purchase (quick buy)
  const handleQuickBuy = async () => {
    // Show warning if not on production domain
    if (!isProductionDomain) {
      const proceed = window.confirm(
        `Development Server Warning\n\nYou're purchasing credits on a development server. For production use, please visit backlinkoo.com\n\nDo you want to continue with the test purchase?`
      );

      if (!proceed) {
        return;
      }
    }

    setIsLoading(true);

    try {
      // If no user, prompt for email for guest checkout
      let guestEmail = user?.email;
      if (!user) {
        guestEmail = window.prompt('Please enter your email address for the purchase:');
        if (!guestEmail || !guestEmail.includes('@')) {
          toast({
            title: "Email Required",
            description: "A valid email address is required to purchase credits.",
            variant: "destructive",
          });
          return;
        }
      }

      const result = await CreditPaymentService.createCreditPayment(
        user, // Pass current user (can be null)
        false, // Let service determine guest status
        guestEmail, // Use collected email
        {
          amount: finalAmount,
          credits,
          productName: `${credits} Premium Backlink Credits`,
          isGuest: !user,
          guestEmail: guestEmail
        }
      );

      if (result.success) {
        if (result.url) {
          // Open checkout in new window
          CreditPaymentService.openCheckoutWindow(result.url, result.sessionId);

          toast({
            title: "✅ Checkout Opened",
            description: `Complete your payment for ${credits} credits in the new window.`,
          });
        } else if (result.usedFallback) {
          toast({
            title: "✅ Development Mode",
            description: `${credits} credit purchase simulated in development mode.`,
          });
        }
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      toast({
        title: "Purchase Error",
        description: error instanceof Error ? error.message : 'Failed to process purchase',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal or direct purchase
  const handleClick = () => {
    if (quickBuy && !showModal) {
      handleQuickBuy();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </div>
        ) : (
          children || (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Buy {credits} Credits - ${finalAmount}
            </div>
          )
        )}
      </Button>

      {/* Payment Modal */}
      <ImprovedPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCredits={credits}
      />
    </>
  );
}

// Preset quick buy buttons
export function QuickBuy50Button(props: Omit<BuyCreditsButtonProps, 'credits' | 'amount'>) {
  return (
    <BuyCreditsButton
      credits={50}
      amount={70}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        50 Credits - $70
      </div>
    </BuyCreditsButton>
  );
}

export function QuickBuy100Button(props: Omit<BuyCreditsButtonProps, 'credits' | 'amount'>) {
  return (
    <BuyCreditsButton
      credits={100}
      amount={140}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        100 Credits - $140
      </div>
    </BuyCreditsButton>
  );
}

export function QuickBuy250Button(props: Omit<BuyCreditsButtonProps, 'credits' | 'amount'>) {
  return (
    <BuyCreditsButton
      credits={250}
      amount={350}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        250 Credits - $350
      </div>
    </BuyCreditsButton>
  );
}

export function QuickBuy500Button(props: Omit<BuyCreditsButtonProps, 'credits' | 'amount'>) {
  return (
    <BuyCreditsButton
      credits={500}
      amount={700}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        500 Credits - $700
      </div>
    </BuyCreditsButton>
  );
}
