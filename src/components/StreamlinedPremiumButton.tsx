import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useStreamlinedPremium } from './StreamlinedPremiumProvider';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';

interface StreamlinedPremiumButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  context?: string; // For analytics/debugging
  redirectAfterSuccess?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

export function StreamlinedPremiumButton({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  context = 'button',
  redirectAfterSuccess,
  showIcon = true,
  fullWidth = false
}: StreamlinedPremiumButtonProps) {
  const { isAuthenticated, isPremium } = useAuth();
  const { openPremiumCheckout } = useStreamlinedPremium();

  const handleClick = () => {
    if (!isAuthenticated) {
      // Could redirect to login or show auth modal
      window.location.href = '/login';
      return;
    }

    if (isPremium) {
      // User is already premium - could redirect to dashboard or show message
      window.location.href = '/dashboard';
      return;
    }

    openPremiumCheckout(redirectAfterSuccess);
  };

  // Don't show button if user is already premium
  if (isPremium) {
    return null;
  }

  const buttonContent = children || (
    <>
      {showIcon && <Crown className="h-4 w-4 mr-2" />}
      Upgrade to Premium
    </>
  );

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {buttonContent}
    </Button>
  );
}

// Specialized variants for common use cases
export function PremiumUpgradeCard({
  title = "Upgrade to Premium",
  description = "Unlock unlimited features and advanced tools",
  buttonText = "Upgrade Now",
  context = "card",
  redirectAfterSuccess,
  className = ""
}: {
  title?: string;
  description?: string;
  buttonText?: string;
  context?: string;
  redirectAfterSuccess?: string;
  className?: string;
}) {
  const { isPremium } = useAuth();
  
  if (isPremium) {
    return null;
  }

  return (
    <div className={`p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Crown className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900 mb-1">{title}</h3>
          <p className="text-sm text-purple-700 mb-4">{description}</p>
          <StreamlinedPremiumButton
            variant="default"
            size="sm"
            context={context}
            redirectAfterSuccess={redirectAfterSuccess}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {buttonText}
            <ArrowRight className="h-4 w-4 ml-2" />
          </StreamlinedPremiumButton>
        </div>
      </div>
    </div>
  );
}

// Inline upgrade prompt
export function InlinePremiumPrompt({
  message = "This feature requires Premium access",
  buttonText = "Upgrade",
  context = "inline",
  redirectAfterSuccess,
  className = ""
}: {
  message?: string;
  buttonText?: string;
  context?: string;
  redirectAfterSuccess?: string;
  className?: string;
}) {
  const { isPremium } = useAuth();
  
  if (isPremium) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-800">{message}</span>
      </div>
      <StreamlinedPremiumButton
        variant="outline"
        size="sm"
        context={context}
        redirectAfterSuccess={redirectAfterSuccess}
        showIcon={false}
        className="border-amber-300 text-amber-700 hover:bg-amber-100"
      >
        {buttonText}
      </StreamlinedPremiumButton>
    </div>
  );
}

export default StreamlinedPremiumButton;
