import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Zap } from 'lucide-react';
import { DirectCheckoutService } from '@/services/directCheckoutService';

interface UniversalPaymentTriggerProps {
  children?: React.ReactNode;
  defaultTab?: 'credits' | 'premium';
  initialCredits?: number;
  triggerText?: string;
  triggerVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
  triggerClassName?: string;
  showIcon?: boolean;
  onSuccess?: () => void;
  redirectAfterSuccess?: string;
}

/**
 * Universal Payment Trigger Component
 *
 * Simplified version that opens Stripe checkout directly in a new window
 * No modals, loading states, or notifications - just direct checkout
 */
export function UniversalPaymentTrigger({
  children,
  defaultTab = 'credits',
  initialCredits = 50,
  triggerText,
  triggerVariant = 'default',
  triggerSize = 'default',
  triggerClassName = '',
  showIcon = true,
  onSuccess
}: UniversalPaymentTriggerProps) {

  const getDefaultText = () => {
    if (defaultTab === 'premium') {
      return 'Upgrade to Premium';
    }
    return 'Buy Credits';
  };

  const getDefaultIcon = () => {
    if (defaultTab === 'premium') {
      return <Crown className="h-4 w-4 mr-2" />;
    }
    return <CreditCard className="h-4 w-4 mr-2" />;
  };

  const handleClick = async () => {
    try {
      if (defaultTab === 'premium') {
        await DirectCheckoutService.upgradeToPremium('monthly');
      } else {
        const credits = initialCredits && [50, 100, 250, 500].includes(initialCredits)
          ? initialCredits as 50 | 100 | 250 | 500
          : 50;
        await DirectCheckoutService.buyCredits(credits);
      }

      // Call success callback if provided (but no toast/notification)
      onSuccess?.();

    } catch (error) {
      console.error('Direct checkout failed:', error);
    }
  };

  return (
    <>
      {children ? (
        <div
          onClick={handleClick}
          className="cursor-pointer"
        >
          {children}
        </div>
      ) : (
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          onClick={handleClick}
        >
          {showIcon && getDefaultIcon()}
          {triggerText || getDefaultText()}
        </Button>
      )}
    </>
  );
}

// Convenience components for common use cases

/**
 * Buy Credits Button - Direct checkout
 */
export function BuyCreditsButton({
  credits = 50,
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess
}: {
  credits?: number;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {

  const handleClick = async () => {
    try {
      const validCredits = [50, 100, 250, 500].includes(credits)
        ? credits as 50 | 100 | 250 | 500
        : 50;
      await DirectCheckoutService.buyCredits(validCredits);
      onSuccess?.();
    } catch (error) {
      console.error('Credits checkout failed:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      Buy {`${credits} Credits`}
    </Button>
  );
}

/**
 * Upgrade to Premium Button - Direct checkout
 */
export function UpgradeToPremiumButton({
  plan = 'monthly',
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess
}: {
  plan?: 'monthly' | 'annual';
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {

  const handleClick = async () => {
    try {
      await DirectCheckoutService.upgradeToPremium(plan);
      onSuccess?.();
    } catch (error) {
      console.error('Premium checkout failed:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <Crown className="h-4 w-4 mr-2" />
      Upgrade to Premium
    </Button>
  );
}

/**
 * Payment Card Component - for wrapping content that should trigger payments
 */
export function PaymentCard({
  children,
  defaultTab = 'credits',
  initialCredits = 50,
  onSuccess
}: {
  children: React.ReactNode;
  defaultTab?: 'credits' | 'premium';
  initialCredits?: number;
  onSuccess?: () => void;
}) {

  const handleClick = async () => {
    try {
      if (defaultTab === 'premium') {
        await DirectCheckoutService.upgradeToPremium('monthly');
      } else {
        const credits = initialCredits && [50, 100, 250, 500].includes(initialCredits)
          ? initialCredits as 50 | 100 | 250 | 500
          : 50;
        await DirectCheckoutService.buyCredits(credits);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Payment card checkout failed:', error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer"
    >
      {children}
    </div>
  );
}

export default UniversalPaymentTrigger;
