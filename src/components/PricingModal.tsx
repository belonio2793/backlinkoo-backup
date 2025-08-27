import { ModernCreditPurchaseModal } from '@/components/ModernCreditPurchaseModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
  onAuthSuccess?: (user: any) => void;
}

// Unified "Buy Credits" modal: uses the same design and behavior as the header
export const PricingModal = ({ isOpen, onClose, initialCredits }: PricingModalProps) => {
  return (
    <ModernCreditPurchaseModal
      isOpen={isOpen}
      onClose={onClose}
      initialCredits={initialCredits}
      onSuccess={onClose}
    />
  );
};
