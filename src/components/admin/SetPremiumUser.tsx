import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, User, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export function SetPremiumUser() {
  const [email, setEmail] = useState('labindalawamaryrose@gmail.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const setPremiumUser = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log(`Setting ${email} as premium user...`);

      // Step 1: Find user by email using Supabase's built-in user lookup
      // We'll need to check if the user exists by looking at profiles or directly querying auth.users
      
      // First try to find user in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      let userId = profile?.user_id;

      if (!userId) {
        // If not found in profiles, try to get current user if it matches
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === email) {
          userId = user.id;
        }
      }

      if (!userId) {
        toast({
          title: "User Not Found",
          description: `No user found with email: ${email}`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      console.log(`Found user ID: ${userId}`);

      // Step 2: Check if premium subscription already exists
      const { data: existingSub, error: subCheckError } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subCheckError) {
        console.error('Error checking existing subscription:', subCheckError);
        toast({
          title: "Database Error",
          description: "Failed to check existing subscription",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Step 3: Create or update premium subscription
      const currentDate = new Date();
      const periodStart = currentDate.toISOString();
      const periodEnd = new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString(); // 1 year from now

      let result;
      if (existingSub) {
        // Update existing subscription
        const { data, error } = await supabase
          .from('premium_subscriptions')
          .update({
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: currentDate.toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error updating subscription:', error);
          toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        result = data;
        console.log('Updated existing subscription');
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from('premium_subscriptions')
          .insert({
            user_id: userId,
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
            title: "Creation Failed",
            description: error.message,
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        result = data;
        console.log('Created new premium subscription');
      }

      setLastResult({
        email,
        userId,
        subscription: result,
        action: existingSub ? 'updated' : 'created'
      });

      toast({
        title: "Success!",
        description: `${email} is now a premium user (subscription ${existingSub ? 'updated' : 'created'})`,
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
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
            Set Premium User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={setPremiumUser}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Set as Premium User
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {lastResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Premium Subscription {lastResult.action === 'created' ? 'Created' : 'Updated'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-green-700">User Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">{lastResult.email}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-700">User ID</Label>
                <div className="text-green-800 font-mono text-sm mt-1">
                  {lastResult.userId}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-700">Status</Label>
                <div className="mt-1">
                  <Badge className="bg-green-600 text-white">
                    {lastResult.subscription.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-700">Plan Type</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-green-800 capitalize">{lastResult.subscription.plan_type}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-700">Period Start</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 text-sm">
                    {new Date(lastResult.subscription.current_period_start).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-700">Period End</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 text-sm">
                    {new Date(lastResult.subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 font-medium">
                  Premium subscription active for 1 year from today
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
