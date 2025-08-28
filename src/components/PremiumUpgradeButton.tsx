import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { stripeWrapper } from '@/services/stripeWrapper';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { Crown, Sparkles, Loader2 } from 'lucide-react';

interface PremiumUpgradeButtonProps {
  plan?: 'monthly' | 'yearly';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  guestEmail?: string;
  showModal?: boolean;
  onSuccess?: () => void;
}

export function PremiumUpgradeButton({ 
  plan = 'monthly',
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  guestEmail,
  showModal = false,
  onSuccess
}: PremiumUpgradeButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDirectUpgrade = async () => {
    setLoading(true);

    try {
      toast({
        title: "🚀 Opening Premium Checkout",
        description: `Processing ${plan} subscription...`,
      });

      // Use stripeWrapper directly for better control
      const result = await stripeWrapper.quickSubscribe(plan, guestEmail);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription checkout');
      }

      toast({
        title: "✅ Premium Checkout Opened",
        description: "Complete your subscription in the new window",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Premium upgrade error:', error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : 'Failed to open checkout',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (showModal) {
      setModalOpen(true);
    } else {
      handleDirectUpgrade();
    }
  };

  const buttonText = plan === 'monthly' ? 'Upgrade to Premium ($29/mo)' : 'Upgrade to Premium ($290/yr)';
  const IconComponent = plan === 'yearly' ? Sparkles : Crown;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className} ${plan === 'yearly' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        disabled={disabled || loading}
        onClick={handleClick}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <IconComponent className={`h-4 w-4 mr-2 ${plan === 'yearly' ? 'text-yellow-500' : ''}`} />
        )}
        {loading ? 'Processing...' : buttonText}
        {plan === 'yearly' && !loading && (
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
            Save $58
          </span>
        )}
      </Button>

      {showModal && (
        <ImprovedPaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTab="premium"
          initialPlan={plan}
          guestEmail={guestEmail}
          onSuccess={() => {
            setModalOpen(false);
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}
    </>
  );
}

/**
 * Quick Premium Buttons for both plans
 */
export function PremiumPlanButtons({ 
  guestEmail, 
  onSuccess, 
  className = '' 
}: {
  guestEmail?: string;
  onSuccess?: () => void;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <PremiumUpgradeButton
        plan="monthly"
        variant="outline"
        guestEmail={guestEmail}
        onSuccess={onSuccess}
        className="w-full"
      />
      <PremiumUpgradeButton
        plan="yearly"
        variant="default"
        guestEmail={guestEmail}
        onSuccess={onSuccess}
        className="w-full"
      />
      
      <div className="text-xs text-muted-foreground text-center">
        Powered by Stripe • Secure checkout
      </div>
    </div>
  );
}

export default PremiumUpgradeButton;
