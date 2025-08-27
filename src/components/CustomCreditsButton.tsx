import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, CreditCard, ExternalLink } from "lucide-react";
import { ModernCreditPurchaseModal } from "./ModernCreditPurchaseModal";

interface CustomCreditsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  initialCredits?: number;
  onSuccess?: () => void;
  showIcon?: boolean;
}

export const CustomCreditsButton = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  initialCredits,
  onSuccess,
  showIcon = true
}: CustomCreditsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    handleCloseModal();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenModal}
      >
        {children || (
          <div className="flex items-center gap-2">
            {showIcon && <Zap className="h-4 w-4" />}
            <span>Buy Custom Credits</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        )}
      </Button>

      <ModernCreditPurchaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialCredits={initialCredits}
        onSuccess={handleSuccess}
      />
    </>
  );
};

// Export convenience components for common use cases
export const BuyCreditsQuick = ({ credits = 100, variant = 'outline', className = '' }) => (
  <CustomCreditsButton
    variant={variant}
    className={className}
    initialCredits={credits}
  >
    <div className="flex items-center gap-2">
      <CreditCard className="h-4 w-4" />
      <span>Buy {credits} Credits - ${(credits * 1.4).toFixed(2)}</span>
      <ExternalLink className="h-3 w-3" />
    </div>
  </CustomCreditsButton>
);

export const BuyCreditsCustom = ({ variant = 'default', size = 'lg', className = '' }) => (
  <CustomCreditsButton
    variant={variant}
    size={size}
    className={className}
  >
    <div className="flex items-center gap-2">
      <Zap className="h-5 w-5" />
      <span>Buy Custom Credits</span>
      <ExternalLink className="h-4 w-4" />
    </div>
  </CustomCreditsButton>
);
