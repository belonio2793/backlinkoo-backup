import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, Zap } from 'lucide-react';

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
 * This component provides a consistent way to trigger payments throughout the app.
 * It can be used for both credit purchases and premium subscriptions.
 */
export function UniversalPaymentTrigger({
  children,
  defaultTab = 'credits',
  initialCredits,
  triggerText,
  triggerVariant = 'default',
  triggerSize = 'default',
  triggerClassName = '',
  showIcon = true,
  onSuccess,
  redirectAfterSuccess = '/dashboard'
}: UniversalPaymentTriggerProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();

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

  const handleSuccess = () => {
    setIsPaymentModalOpen(false);
    toast({
      title: "Payment Successful!",
      description: defaultTab === 'premium' 
        ? "Welcome to Premium! All features are now available."
        : "Credits have been added to your account.",
    });
    onSuccess?.();
  };

  return (
    <>
      {children ? (
        <div 
          onClick={() => setIsPaymentModalOpen(true)}
          className="cursor-pointer"
        >
          {children}
        </div>
      ) : (
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          onClick={() => setIsPaymentModalOpen(true)}
        >
          {showIcon && getDefaultIcon()}
          {triggerText || getDefaultText()}
        </Button>
      )}

      <EnhancedUnifiedPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        defaultTab={defaultTab}
        initialCredits={initialCredits}
        redirectAfterSuccess={redirectAfterSuccess}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// Convenience components for common use cases

/**
 * Buy Credits Button
 */
export function BuyCreditsButton({
  credits,
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
  return (
    <UniversalPaymentTrigger
      defaultTab="credits"
      initialCredits={credits}
      triggerVariant={variant}
      triggerSize={size}
      triggerClassName={className}
      onSuccess={onSuccess}
    />
  );
}

/**
 * Upgrade to Premium Button
 */
export function UpgradeToPremiumButton({
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess
}: {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <UniversalPaymentTrigger
      defaultTab="premium"
      triggerVariant={variant}
      triggerSize={size}
      triggerClassName={className}
      onSuccess={onSuccess}
    />
  );
}

/**
 * Payment Card Component - for wrapping content that should trigger payments
 */
export function PaymentCard({
  children,
  defaultTab = 'credits',
  initialCredits,
  onSuccess
}: {
  children: React.ReactNode;
  defaultTab?: 'credits' | 'premium';
  initialCredits?: number;
  onSuccess?: () => void;
}) {
  return (
    <UniversalPaymentTrigger
      defaultTab={defaultTab}
      initialCredits={initialCredits}
      onSuccess={onSuccess}
    >
      {children}
    </UniversalPaymentTrigger>
  );
}

export default UniversalPaymentTrigger;
