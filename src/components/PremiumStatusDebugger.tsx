import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bug, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DebugData {
  profile: any;
  premiumSubscriptions: any[];
  currentTime: string;
}

export const PremiumStatusDebugger = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const { toast } = useToast();

  const runDebug = async () => {
    setIsDebugging(true);
    
    try {
      console.log('🐛 Running premium status debug...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      console.log('👤 Debug user:', user.email, user.id);

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
      }

      // Get premium subscriptions
      const { data: premiumSubs, error: subError } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (subError) {
        console.error('❌ Subscription error:', subError);
      }

      const debugResult = {
        profile: profile || { error: profileError?.message },
        premiumSubscriptions: premiumSubs || [],
        currentTime: new Date().toISOString()
      };

      console.log('🐛 Debug result:', debugResult);
      setDebugData(debugResult);

      toast({
        title: "Debug Complete",
        description: "Check the results below and console logs",
      });
      
    } catch (error: any) {
      console.error('❌ Debug error:', error);
      toast({
        title: "Debug Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Bug className="h-5 w-5" />
          Premium Status Debugger
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebug}
          disabled={isDebugging}
          className="w-full"
          variant="outline"
        >
          {isDebugging ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Debugging...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Check Database Status
            </>
          )}
        </Button>

        {debugData && (
          <div className="space-y-3">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Debug Results:</strong> Check console for full details
              </AlertDescription>
            </Alert>

            <div className="bg-white p-3 rounded-lg border text-sm">
              <h4 className="font-medium mb-2">Profile Data:</h4>
              <div className="space-y-1">
                <div><strong>Email:</strong> {debugData.profile.email || 'N/A'}</div>
                <div><strong>Subscription Tier:</strong> 
                  <Badge variant={debugData.profile.subscription_tier === 'premium' ? 'default' : 'secondary'} className="ml-2">
                    {debugData.profile.subscription_tier || 'None'}
                  </Badge>
                </div>
                <div><strong>Role:</strong> {debugData.profile.role || 'N/A'}</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border text-sm">
              <h4 className="font-medium mb-2">Premium Subscriptions ({debugData.premiumSubscriptions.length}):</h4>
              {debugData.premiumSubscriptions.length > 0 ? (
                debugData.premiumSubscriptions.map((sub, index) => (
                  <div key={index} className="space-y-1 border-l-2 border-blue-200 pl-2 mb-2">
                    <div><strong>Status:</strong> 
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                        {sub.status}
                      </Badge>
                    </div>
                    <div><strong>Plan:</strong> {sub.plan_type}</div>
                    <div><strong>Ends:</strong> {new Date(sub.current_period_end).toLocaleDateString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No premium subscriptions found</div>
              )}
            </div>

            <div className="bg-gray-100 p-2 rounded text-xs">
              <strong>Debug Time:</strong> {new Date(debugData.currentTime).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
