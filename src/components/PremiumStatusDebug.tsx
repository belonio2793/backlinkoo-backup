import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PremiumService } from '@/services/premiumService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PremiumStatusDebug() {
  const { user } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      checkPremiumStatus();
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [isPremium, sub] = await Promise.all([
        PremiumService.checkPremiumStatus(user.id),
        PremiumService.getSubscription(user.id)
      ]);
      
      setPremiumStatus(isPremium);
      setSubscription(sub);
    } catch (error) {
      console.error('Premium status check failed:', error);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">Premium Status Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">User Email:</span>
          <Badge variant="outline">{user.email}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">User ID:</span>
          <Badge variant="outline" className="font-mono text-xs">{user.id}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Premium Status:</span>
          {loading ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : (
            <Badge className={premiumStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {premiumStatus ? "PREMIUM ACTIVE" : "NOT PREMIUM"}
            </Badge>
          )}
        </div>

        {subscription && (
          <div className="space-y-2 p-3 bg-white rounded border">
            <div className="font-medium text-green-800">Subscription Details:</div>
            <div className="text-sm space-y-1">
              <div>Status: <span className="font-mono">{subscription.status}</span></div>
              <div>Plan: <span className="font-mono">{subscription.plan_type}</span></div>
              <div>Period End: <span className="font-mono">{new Date(subscription.current_period_end).toLocaleString()}</span></div>
            </div>
          </div>
        )}

        <button 
          onClick={checkPremiumStatus}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Refresh Status
        </button>
      </CardContent>
    </Card>
  );
}
