import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PremiumService } from '@/services/premiumService';
import { useToast } from '@/hooks/use-toast';

interface PremiumStatusSyncProps {
  userEmail: string;
  currentPremiumStatus: boolean;
  onStatusUpdated?: (newStatus: boolean) => void;
}

export const PremiumStatusSync = ({ 
  userEmail, 
  currentPremiumStatus, 
  onStatusUpdated 
}: PremiumStatusSyncProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await PremiumService.syncPremiumStatus(userEmail);
      setSyncResult(result);

      if (result.success) {
        toast({
          title: "Premium Status Synced",
          description: "Your premium subscription status has been updated.",
        });

        // Notify parent component if status changed
        if (result.after?.isPremium !== currentPremiumStatus) {
          onStatusUpdated?.(result.after.isPremium);
        }

        // Refresh the page after a short delay to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync premium status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        error: error.message
      });
      toast({
        title: "Sync Error",
        description: "An error occurred while syncing premium status",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-600" />
          Premium Status Sync
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Current Status:</p>
            <Badge 
              variant={currentPremiumStatus ? "default" : "secondary"}
              className={currentPremiumStatus ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' : ''}
            >
              {currentPremiumStatus ? 'Premium Member' : 'Free Plan'}
            </Badge>
          </div>
          
          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            className="min-w-32"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Status
              </>
            )}
          </Button>
        </div>

        {!currentPremiumStatus && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You have a premium subscription, but your account is showing as Free Plan. 
              Click "Sync Status" to fix this issue.
            </AlertDescription>
          </Alert>
        )}

        {syncResult && (
          <div className="space-y-3">
            {syncResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> {syncResult.message}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sync Failed: </strong>{syncResult.error}
                </AlertDescription>
              </Alert>
            )}

            {syncResult.success && syncResult.after && (
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-2">Updated Status:</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Premium Status:</span> {
                      syncResult.after.isPremium ? '✅ Active' : '❌ Inactive'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Profile Tier:</span> {syncResult.after.profileTier || 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Active Subscriptions:</span> {syncResult.after.activeSubscriptions}
                  </div>
                </div>
              </div>
            )}

            {syncResult.success && syncResult.actions && syncResult.actions.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Actions Taken:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {syncResult.actions.map((action: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            This tool synchronizes your premium subscription status between different parts of the system. 
            If you have an active premium subscription but see "Free Plan", use this to fix the issue.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
