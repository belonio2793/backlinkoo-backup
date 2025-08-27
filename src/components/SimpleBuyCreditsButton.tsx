import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { ModernCreditPurchaseModal } from '@/components/ModernCreditPurchaseModal';

interface SimpleBuyCreditsButtonProps {
  trigger?: React.ReactNode;
  defaultCredits?: number;
  onPaymentSuccess?: (sessionId?: string) => void;
  onPaymentCancel?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SimpleBuyCreditsButton({
  trigger,
  defaultCredits = 100,
  onPaymentSuccess,
  onPaymentCancel,
  variant = 'outline',
  size = 'sm',
  className
}: SimpleBuyCreditsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
    setIsModalOpen(false);
  };

  const handleClose = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    }
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
      ) : (
        defaultTrigger
      )}

      <ModernCreditPurchaseModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialCredits={defaultCredits}
        onSuccess={handleSuccess}
      />
    </>
  );
}
