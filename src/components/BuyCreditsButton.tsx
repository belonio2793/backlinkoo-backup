import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { ModernCreditPurchaseModal } from './ModernCreditPurchaseModal';

interface BuyCreditsButtonProps {
  trigger?: React.ReactNode;
  onPaymentSuccess?: (sessionId?: string) => void;
  onPaymentCancel?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  userEmail?: string;
  isGuest?: boolean;
  children?: React.ReactNode;
}

export function BuyCreditsButton({
  trigger,
  onPaymentSuccess,
  onPaymentCancel,
  variant = 'outline',
  size = 'sm',
  className,
  userEmail,
  isGuest = true,
  children
}: BuyCreditsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (sessionId?: string) => {
    onPaymentSuccess?.(sessionId);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    onPaymentCancel?.();
    setIsModalOpen(false);
  };

  const defaultTrigger = (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => setIsModalOpen(true)}
    >
      <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">Buy Credits</span>
      <span className="sm:hidden">Credits</span>
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : children ? (
        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer">
          {children}
        </div>
      ) : (
        defaultTrigger
      )}

      <ModernCreditPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
