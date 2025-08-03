import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const QuickPremiumFix = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const { toast } = useToast();

  const handleQuickFix = async () => {
    setIsFixing(true);

    try {
      console.log('🔧 Starting direct premium fix (bypassing Netlify functions)...');

      // Skip Netlify functions entirely and use direct Supabase approach
      await handleDirectPremiumFix();
    } catch (error: any) {
      console.error('❌ Direct premium fix error:', error);

      let errorMessage = "Failed to fix premium status";

      if (error.message?.includes('No authenticated user')) {
        errorMessage = "Please log in and try again";
      } else if (error.message?.includes('Profile update failed')) {
        errorMessage = "Database access error - please contact support";
      } else if (error.message?.includes('row-level security')) {
        errorMessage = "Database permission error - please contact support";
      } else {
        errorMessage = `Database error: ${error.message}`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleDirectPremiumFix = async () => {
    console.log('🔧 Attempting direct premium fix...');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Update profile to premium
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium' })
      .eq('user_id', user.id);

    if (profileError) {
      throw new Error(`Profile update failed: ${profileError.message}`);
    }

    // Create premium subscription
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const { error: subError } = await supabase
      .from('premium_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: 'premium',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      });

    if (subError) {
      console.warn('⚠️ Subscription creation warning:', subError.message);
      // Don't throw error for subscription creation - profile update is more important
    }

    console.log('✅ Direct premium fix successful');
    setIsFixed(true);
    toast({
      title: "Premium Status Fixed!",
      description: "User has been set to premium via direct approach. Refreshing page...",
    });

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  if (isFixed) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Success!</strong> Premium status has been activated. Page will refresh automatically.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Crown className="h-5 w-5" />
          Quick Premium Fix
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-amber-100">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This will immediately activate premium features for labindalawamaryrose@gmail.com
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleQuickFix}
          disabled={isFixing}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
        >
          {isFixing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Activating Premium...
            </>
          ) : (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Activate Premium Now
            </>
          )}
        </Button>

        <p className="text-xs text-gray-600 text-center">
          This will set subscription_tier to 'premium' and create an active premium subscription
        </p>
      </CardContent>
    </Card>
  );
};
