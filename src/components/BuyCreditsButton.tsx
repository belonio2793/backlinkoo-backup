import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { stripePaymentService } from '@/services/stripePaymentService';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate amount if not provided
  const finalAmount = amount || credits * 1.40;

  // Handle direct purchase (quick buy)
  const handleQuickBuy = async () => {
    setIsLoading(true);

    try {
      toast({
        title: "🚀 Processing Purchase",
        description: "Opening secure checkout...",
      });

      const result = await stripePaymentService.createPayment({
        amount: finalAmount,
        credits,
        productName: `${credits} Premium Backlink Credits`,
        type: 'credits',
        isGuest: true,
        guestEmail: 'guest@backlinkoo.com' // This would normally come from user input
      });

      if (result.success) {
        toast({
          title: "✅ Purchase Processing",
          description: `${credits} credits will be added to your account.`,
        });
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
        defaultTab="credits"
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
