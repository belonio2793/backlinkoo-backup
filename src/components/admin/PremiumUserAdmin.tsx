import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, CheckCircle, User } from 'lucide-react';

export function PremiumUserAdmin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const setUserPremium = async () => {
    setIsProcessing(true);
    const email = 'labindalawamaryrose@gmail.com';
    
    try {
      // Get current user to check if this is the target user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "No authenticated user found",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (user.email !== email) {
        toast({
          title: "Error", 
          description: `Current user (${user.email}) is not the target user (${email})`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Create premium subscription for current user
      const currentDate = new Date();
      const periodStart = currentDate.toISOString();
      const periodEnd = new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString();

      // First, delete any existing subscription
      await supabase
        .from('premium_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Create new premium subscription
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'premium',
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        toast({
          title: "Failed to Create Subscription",
          description: error.message,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      setResult({
        email: user.email,
        userId: user.id,
        subscription: data
      });

      toast({
        title: "Success!",
        description: `${user.email} is now a premium user!`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Set labindalawamaryrose@gmail.com as Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will create a premium subscription for labindalawamaryrose@gmail.com (must be the currently logged in user).
            </p>
            
            <Button 
              onClick={setUserPremium}
              disabled={isProcessing}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Premium Subscription...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Make Premium User
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Premium Subscription Created!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="font-medium">Email:</span>
                <span>{result.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Status:</span>
                <Badge className="bg-green-600 text-white">
                  {result.subscription.status.toUpperCase()}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">User ID:</span>
                <div className="font-mono text-sm text-gray-600 mt-1 break-all">
                  {result.userId}
                </div>
              </div>
              
              <div>
                <span className="font-medium">Subscription Period:</span>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(result.subscription.current_period_start).toLocaleDateString()} - 
                  {new Date(result.subscription.current_period_end).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 font-medium">
                  Premium subscription active for 1 year!
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                The user now has access to all premium features including the SEO Academy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
