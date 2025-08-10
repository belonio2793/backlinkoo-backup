import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { PremiumPlanModal } from '@/components/PremiumPlanModal';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';

interface PremiumUpgradeButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  triggerSource?: 'navigation' | 'settings' | 'manual' | 'upgrade_button';
  children?: React.ReactNode;
  style?: 'primary' | 'gradient' | 'minimal' | 'badge';
  disabled?: boolean;
}

export function PremiumUpgradeButton({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  showText = true,
  triggerSource = 'upgrade_button',
  children,
  style = 'primary',
  disabled = false
}: PremiumUpgradeButtonProps) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user } = useAuth();
  const { isPremium, loading } = usePremium();

  // Don't show upgrade button if user is already premium
  if (isPremium && !loading) {
    return null;
  }

  const getButtonContent = () => {
    if (children) {
      return children;
    }

    switch (style) {
      case 'gradient':
        return (
          <div className="flex items-center gap-2">
            {showIcon && <Crown className="h-4 w-4" />}
            {showText && <span>Upgrade to Premium</span>}
            <ArrowRight className="h-4 w-4" />
          </div>
        );
      
      case 'minimal':
        return (
          <div className="flex items-center gap-1">
            {showIcon && <Crown className="h-3 w-3" />}
            {showText && <span className="text-xs">Premium</span>}
          </div>
        );
      
      case 'badge':
        return (
          <div className="flex items-center gap-1">
            {showIcon && <Sparkles className="h-3 w-3" />}
            {showText && <span className="text-xs font-medium">Upgrade</span>}
          </div>
        );
      
      default:
        return (
          <div className="flex items-center gap-2">
            {showIcon && <Crown className="h-4 w-4" />}
            {showText && <span>Upgrade to Premium</span>}
          </div>
        );
    }
  };

  const getButtonClassName = () => {
    const baseClass = className;
    
    switch (style) {
      case 'gradient':
        return `bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 ${baseClass}`;
      
      case 'minimal':
        return `bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 ${baseClass}`;
      
      case 'badge':
        return `bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 hover:border-amber-300 ${baseClass}`;
      
      default:
        return baseClass;
    }
  };

  const handleUpgradeClick = () => {
    setShowPremiumModal(true);
  };

  const handleModalSuccess = () => {
    setShowPremiumModal(false);
    // The modal will handle navigation to dashboard
  };

  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={getButtonClassName()}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          {showText && <span>Loading...</span>}
        </div>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleUpgradeClick}
        disabled={disabled || loading}
        className={getButtonClassName()}
      >
        {getButtonContent()}
      </Button>

      <PremiumPlanModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={handleModalSuccess}
        triggerSource={triggerSource}
      />
    </>
  );
}

// Specialized variants for different use cases

export function HeaderUpgradeButton() {
  return (
    <PremiumUpgradeButton
      variant="outline"
      size="sm"
      style="gradient"
      triggerSource="navigation"
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-4 py-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
    />
  );
}

export function NavigationUpgradeButton() {
  return (
    <PremiumUpgradeButton
      variant="default"
      size="sm"
      style="primary"
      triggerSource="navigation"
      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 px-4 py-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
    />
  );
}

export function ToolsHeaderUpgradeButton() {
  return (
    <PremiumUpgradeButton
      variant="outline"
      size="sm"
      style="badge"
      triggerSource="navigation"
      showText={false}
      className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 px-3 py-1.5"
    >
      <div className="flex items-center gap-1">
        <Crown className="h-3 w-3" />
        <span className="text-xs font-medium">Pro</span>
      </div>
    </PremiumUpgradeButton>
  );
}

export function SettingsUpgradeButton() {
  return (
    <PremiumUpgradeButton
      variant="default"
      size="lg"
      style="gradient"
      triggerSource="settings"
      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-6 py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
    />
  );
}

export function CompactUpgradeButton() {
  return (
    <PremiumUpgradeButton
      variant="outline"
      size="sm"
      style="minimal"
      triggerSource="manual"
      className="bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 px-2 py-1"
    />
  );
}

export default PremiumUpgradeButton;
