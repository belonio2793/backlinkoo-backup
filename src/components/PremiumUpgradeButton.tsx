import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { stripePaymentService } from '@/services/stripePaymentService';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { Crown, Star, Sparkles } from 'lucide-react';

interface PremiumUpgradeButtonProps {
  plan?: 'monthly' | 'yearly';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  quickUpgrade?: boolean; // If true, bypass modal and upgrade directly
  showModal?: boolean; // If true, show modal instead of direct upgrade
}

export function PremiumUpgradeButton({
  plan = 'monthly',
  variant = 'default',
  size = 'default',
  className,
  children,
  quickUpgrade = false,
  showModal = true
}: PremiumUpgradeButtonProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Plan pricing
  const planPricing = {
    monthly: { price: 29, period: 'month' },
    yearly: { price: 290, period: 'year', savings: 298 }
  };

  const currentPlan = planPricing[plan];

  // Handle direct upgrade (quick upgrade)
  const handleQuickUpgrade = async () => {
    setIsLoading(true);

    try {
      toast({
        title: "🚀 Processing Upgrade",
        description: "Opening secure checkout...",
      });

      const result = await stripePaymentService.createSubscription({
        plan,
        amount: currentPlan.price,
        type: 'subscription',
        isGuest: true,
        guestEmail: 'guest@backlinkoo.com' // This would normally come from user input
      });

      if (result.success) {
        toast({
          title: "✅ Upgrade Processing",
          description: `Premium ${plan} plan is being activated.`,
        });
      } else {
        throw new Error(result.error || 'Upgrade failed');
      }
    } catch (error) {
      toast({
        title: "Upgrade Error",
        description: error instanceof Error ? error.message : 'Failed to process upgrade',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal or direct upgrade
  const handleClick = () => {
    if (quickUpgrade && !showModal) {
      handleQuickUpgrade();
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
              <Crown className="h-4 w-4" />
              Upgrade to Premium - ${currentPlan.price}/{currentPlan.period}
            </div>
          )
        )}
      </Button>

      {/* Payment Modal */}
      <ImprovedPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab="premium"
      />
    </>
  );
}

// Preset upgrade buttons
export function MonthlyUpgradeButton(props: Omit<PremiumUpgradeButtonProps, 'plan'>) {
  return (
    <PremiumUpgradeButton
      plan="monthly"
      {...props}
    >
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4" />
        Premium Monthly - $29
      </div>
    </PremiumUpgradeButton>
  );
}

export function YearlyUpgradeButton(props: Omit<PremiumUpgradeButtonProps, 'plan'>) {
  return (
    <PremiumUpgradeButton
      plan="yearly"
      {...props}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Premium Yearly - $290
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          Save $298
        </span>
      </div>
    </PremiumUpgradeButton>
  );
}

export function PremiumCallToActionButton(props: Omit<PremiumUpgradeButtonProps, 'plan'>) {
  return (
    <PremiumUpgradeButton
      plan="yearly"
      variant="default"
      size="lg"
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      {...props}
    >
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5" />
        <div className="text-left">
          <div className="font-bold">Unlock Premium</div>
          <div className="text-xs opacity-90">Save $298 with yearly plan</div>
        </div>
      </div>
    </PremiumUpgradeButton>
  );
}
