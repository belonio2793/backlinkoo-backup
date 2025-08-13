/**
 * Mobile-Optimized Payment Button
 * Enhanced payment button with proper mobile touch handling and responsive design
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Loader2, Smartphone, Monitor, Zap } from 'lucide-react';
import { EnhancedPaymentService } from '@/services/enhancedPaymentService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MobileOptimizedPaymentButtonProps {
  type: 'premium' | 'credits';
  plan?: 'monthly' | 'yearly';
  credits?: number;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  email?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function MobileOptimizedPaymentButton({
  type,
  plan = 'monthly',
  credits = 50,
  variant = 'default',
  size = 'default',
  className,
  children,
  email,
  onSuccess,
  onError,
  disabled = false
}: MobileOptimizedPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { toast } = useToast();

  // Detect mobile device and update state
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setDeviceInfo(EnhancedPaymentService.getEnvironmentInfo());
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const getButtonText = () => {
    if (children) return children;

    if (type === 'premium') {
      const planText = plan === 'yearly' ? 'Annual' : 'Monthly';
      const price = plan === 'yearly' ? '$290' : '$29';
      return (
        <>
          <Crown className="h-4 w-4 mr-2" />
          {isMobile ? `Premium ${price}` : `Upgrade to Premium ${planText} (${price})`}
        </>
      );
    } else {
      const price = getCreditsPrice(credits);
      return (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          {isMobile ? `${credits} Credits $${price}` : `Buy ${credits} Credits ($${price})`}
        </>
      );
    }
  };

  const getCreditsPrice = (creditsAmount: number): number => {
    if (creditsAmount <= 50) return 19;
    if (creditsAmount <= 100) return 29;
    if (creditsAmount <= 250) return 49;
    if (creditsAmount <= 500) return 79;
    return 99;
  };

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      console.log('🎯 Mobile payment initiated:', { 
        type, 
        plan, 
        credits, 
        isMobile, 
        deviceInfo 
      });

      let result;
      
      if (type === 'premium') {
        result = await EnhancedPaymentService.upgradeToPremium(plan, email);
      } else {
        result = await EnhancedPaymentService.buyCredits(credits, email);
      }

      if (result.success) {
        console.log('✅ Payment initiated successfully');
        
        // Show success message
        toast({
          title: "Payment Initiated",
          description: isMobile 
            ? "Redirecting to secure checkout..." 
            : "Opening secure checkout window...",
          variant: "default"
        });

        // Call success callback
        onSuccess?.();

        // Note: The redirect is handled by the service
        
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      const errorMessage = error.message || 'Payment temporarily unavailable';
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      });

      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile-specific styling
  const mobileClasses = isMobile ? 'min-h-[44px] text-base font-medium' : '';
  const touchClasses = 'touch-manipulation select-none';
  
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'relative transition-all duration-200',
        mobileClasses,
        touchClasses,
        className
      )}
      onClick={handlePayment}
      disabled={disabled || isLoading}
      style={{
        // Ensure proper touch targets on mobile
        minHeight: isMobile ? '44px' : undefined,
        minWidth: isMobile ? '44px' : undefined,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isMobile ? 'Opening...' : 'Opening Checkout...'}
        </>
      ) : (
        getButtonText()
      )}
      
      {/* Device indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center">
          {isMobile ? (
            <Smartphone className="h-2 w-2 text-blue-500" />
          ) : (
            <Monitor className="h-2 w-2 text-green-500" />
          )}
        </div>
      )}
    </Button>
  );
}

/**
 * Quick Premium Button
 */
export function QuickPremiumButton({
  plan = 'monthly',
  className,
  onSuccess
}: {
  plan?: 'monthly' | 'yearly';
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <MobileOptimizedPaymentButton
      type="premium"
      plan={plan}
      variant="default"
      size="lg"
      className={cn('w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700', className)}
      onSuccess={onSuccess}
    />
  );
}

/**
 * Quick Credits Button
 */
export function QuickCreditsButton({
  credits = 50,
  className,
  onSuccess
}: {
  credits?: number;
  className?: string;
  onSuccess?: () => void;
}) {
  return (
    <MobileOptimizedPaymentButton
      type="credits"
      credits={credits}
      variant="outline"
      size="lg"
      className={cn('w-full', className)}
      onSuccess={onSuccess}
    />
  );
}

/**
 * Mobile Payment Grid - Responsive layout for multiple payment options
 */
export function MobilePaymentGrid({
  onSuccess,
  className
}: {
  onSuccess?: () => void;
  className?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={cn(
      'grid gap-4',
      isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {/* Premium Plans */}
      <div className={cn('space-y-2', isMobile ? 'order-1' : '')}>
        <h3 className="font-semibold text-sm text-center">Premium Plans</h3>
        <QuickPremiumButton plan="monthly" onSuccess={onSuccess} />
        <QuickPremiumButton 
          plan="yearly" 
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          onSuccess={onSuccess} 
        />
      </div>

      {/* Credits Options */}
      <div className={cn('space-y-2', isMobile ? 'order-2' : 'col-span-3')}>
        <h3 className="font-semibold text-sm text-center">Credits</h3>
        <div className={cn('grid gap-2', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
          <QuickCreditsButton credits={50} onSuccess={onSuccess} />
          <QuickCreditsButton credits={100} onSuccess={onSuccess} />
          <QuickCreditsButton credits={250} onSuccess={onSuccess} />
          <QuickCreditsButton credits={500} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}

export default MobileOptimizedPaymentButton;
