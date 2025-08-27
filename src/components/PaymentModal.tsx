import { ModernCreditPurchaseModal } from '@/components/ModernCreditPurchaseModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

// Wrapper to unify all "Buy Credits" modals with the header's modal design
export const PaymentModal = ({ isOpen, onClose, initialCredits }: PaymentModalProps) => {
  return (
    <ModernCreditPurchaseModal
      isOpen={isOpen}
      onClose={onClose}
      initialCredits={initialCredits}
      onSuccess={onClose}
    />
  );
};
