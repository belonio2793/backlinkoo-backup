import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOpenPremiumPopup } from './PremiumPopupProvider';
import { Crown, Sparkles, Zap, Lock } from 'lucide-react';

interface PremiumTriggerButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'cta' | 'feature-lock';
  size?: 'sm' | 'default' | 'lg';
  children?: React.ReactNode;
  className?: string;
  featureName?: string;
  email?: string;
  showBadge?: boolean;
  disabled?: boolean;
}

export function PremiumTriggerButton({
  variant = 'default',
  size = 'default',
  children,
  className = '',
  featureName,
  email,
  showBadge = false,
  disabled = false
}: PremiumTriggerButtonProps) {
  const { openPremiumPopup, isPremium, tryOpenPremiumPopup } = useOpenPremiumPopup();

  const handleClick = () => {
    if (disabled) return;
    
    const wasOpened = tryOpenPremiumPopup(email);
    
    if (!wasOpened && isPremium) {
      console.log('User is already premium, no popup needed');
    }
  };

  // Don't render the button if user is already premium (unless it's a feature-lock variant)
  if (isPremium && variant !== 'feature-lock') {
    return null;
  }

  const getButtonContent = () => {
    switch (variant) {
      case 'cta':
        return (
          <>
            <Crown className="mr-2 h-4 w-4" />
            {children || 'Upgrade to Premium'}
            <Sparkles className="ml-2 h-4 w-4" />
          </>
        );
      
      case 'feature-lock':
        return (
          <>
            <Lock className="mr-2 h-4 w-4" />
            {children || `Unlock ${featureName || 'This Feature'}`}
          </>
        );
      
      case 'outline':
        return (
          <>
            <Crown className="mr-2 h-4 w-4" />
            {children || 'Go Premium'}
          </>
        );
      
      default:
        return (
          <>
            {children || 'Upgrade to Premium'}
            {showBadge && (
              <Badge variant="secondary" className="ml-2">
                New
              </Badge>
            )}
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'cta':
        return 'default';
      case 'feature-lock':
        return 'outline';
      default:
        return variant;
    }
  };

  const getButtonClassName = () => {
    let baseClasses = className;
    
    switch (variant) {
      case 'cta':
        baseClasses += ' bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0';
        break;
      case 'feature-lock':
        baseClasses += ' border-dashed border-2 border-orange-300 hover:border-orange-400 text-orange-600 hover:text-orange-700';
        break;
    }
    
    return baseClasses;
  };

  return (
    <Button
      variant={getButtonVariant() as any}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={getButtonClassName()}
    >
      {getButtonContent()}
    </Button>
  );
}

// Specific pre-configured components for common use cases
export function UpgradeToPremiumButton({ className = '', ...props }: Partial<PremiumTriggerButtonProps>) {
  return (
    <PremiumTriggerButton
      variant="cta"
      size="lg"
      showBadge
      className={className}
      {...props}
    >
      Upgrade to Premium
    </PremiumTriggerButton>
  );
}

export function FeatureLockedButton({ 
  featureName, 
  className = '',
  ...props 
}: { featureName: string } & Partial<PremiumTriggerButtonProps>) {
  return (
    <PremiumTriggerButton
      variant="feature-lock"
      featureName={featureName}
      className={className}
      {...props}
    >
      Unlock {featureName}
    </PremiumTriggerButton>
  );
}

export function GetPremiumButton({ className = '', ...props }: Partial<PremiumTriggerButtonProps>) {
  return (
    <PremiumTriggerButton
      variant="outline"
      className={className}
      {...props}
    >
      Get Premium
    </PremiumTriggerButton>
  );
}

export default PremiumTriggerButton;
