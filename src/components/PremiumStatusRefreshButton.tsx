import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw, CheckCircle } from 'lucide-react';
import { PremiumService } from '@/services/premiumService';
import { useToast } from '@/hooks/use-toast';

interface PremiumStatusRefreshButtonProps {
  userId: string;
  userEmail: string;
  currentStatus: boolean;
  onStatusUpdated?: (newStatus: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const PremiumStatusRefreshButton = ({ 
  userId, 
  userEmail, 
  currentStatus, 
  onStatusUpdated,
  size = 'sm',
  variant = 'ghost'
}: PremiumStatusRefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // First check current status
      const newStatus = await PremiumService.checkPremiumStatus(userId);
      
      // If status is false but user should be premium, try sync
      if (!newStatus) {
        const syncResult = await PremiumService.syncPremiumStatus(userEmail);
        
        if (syncResult.success && syncResult.after?.isPremium) {
          onStatusUpdated?.(true);
          toast({
            title: "Premium Status Updated",
            description: "Your premium subscription is now active!",
          });
          
          // Refresh page to show updated UI
          setTimeout(() => window.location.reload(), 1000);
          return;
        }
      }

      if (newStatus !== currentStatus) {
        onStatusUpdated?.(newStatus);
        toast({
          title: "Status Refreshed",
          description: `Premium status: ${newStatus ? 'Active' : 'Inactive'}`,
        });
      } else {
        toast({
          title: "Status Confirmed",
          description: "Premium status is up to date",
        });
      }
      
    } catch (error: any) {
      console.error('Premium refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh premium status",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      size={size}
      variant={variant}
      className="flex items-center gap-1"
    >
      {isRefreshing ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : currentStatus ? (
        <CheckCircle className="h-3 w-3 text-green-600" />
      ) : (
        <Crown className="h-3 w-3" />
      )}
      {isRefreshing ? 'Syncing...' : 'Refresh Premium'}
    </Button>
  );
};
